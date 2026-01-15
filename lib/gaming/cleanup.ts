import { db } from '@/lib/db/drizzle';
import {
  gamingNodes,
  gamingSessions,
  GamingNodeStatus,
  GamingSessionStatus,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { tensorDockClient } from './tensordock';
import { createWolfClient } from './wolf';
import { getExpiredSessions, getNodeById } from './queries';

interface CleanupResult {
  sessionId: number;
  status: 'cleaned' | 'error';
  error?: string;
}

export async function cleanupExpiredSessions(): Promise<{
  processed: number;
  results: CleanupResult[];
}> {
  const expiredSessions = await getExpiredSessions();
  const results: CleanupResult[] = [];

  for (const session of expiredSessions) {
    try {
      // 1. Mark session as ending
      await db
        .update(gamingSessions)
        .set({ status: GamingSessionStatus.ENDING })
        .where(eq(gamingSessions.id, session.id));

      // 2. Get node details
      const node = await getNodeById(session.nodeId);

      if (node) {
        // 3. Unpair from Wolf if we have a client ID
        if (session.wolfClientId) {
          try {
            const wolfClient = createWolfClient(node.wolfApiUrl, node.wolfApiKey);
            await wolfClient.unpairClient(session.wolfClientId);
          } catch (unpairError) {
            console.error(
              `Failed to unpair session ${session.id} from Wolf:`,
              unpairError
            );
            // Continue with cleanup even if unpair fails
          }
        }

        // 4. Stop TensorDock VM
        try {
          await tensorDockClient.stopInstance(node.tensorDockInstanceId);
        } catch (stopError) {
          console.error(
            `Failed to stop TensorDock instance for session ${session.id}:`,
            stopError
          );
          // Continue with cleanup even if stop fails
        }

        // 5. Update node status to available
        await db
          .update(gamingNodes)
          .set({
            status: GamingNodeStatus.AVAILABLE,
            serverIp: null,
            updatedAt: new Date(),
          })
          .where(eq(gamingNodes.id, node.id));
      }

      // 6. Mark session as ended
      await db
        .update(gamingSessions)
        .set({
          status: GamingSessionStatus.ENDED,
          endedAt: new Date(),
          endReason: 'expired',
        })
        .where(eq(gamingSessions.id, session.id));

      results.push({ sessionId: session.id, status: 'cleaned' });
    } catch (error) {
      console.error(`Failed to cleanup session ${session.id}:`, error);
      results.push({
        sessionId: session.id,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    processed: expiredSessions.length,
    results,
  };
}
