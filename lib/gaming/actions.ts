'use server';

import { z } from 'zod';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { tensorDockClient } from './tensordock';
import { createWolfClient } from './wolf';
import {
  getAvailableNodes,
  getNodeById,
  getUserActiveSession,
  getSessionById,
  updateNodeStatus,
  createSession,
  updateSession,
  endSession,
} from './queries';
import {
  GamingNodeStatus,
  GamingSessionStatus,
} from '@/lib/db/schema';
import { inngest } from '@/lib/inngest/client';

// Session duration in hours (configurable via env)
const SESSION_DURATION_HOURS = parseInt(
  process.env.GAMING_SESSION_DURATION_HOURS || '3',
  10
);

// Schema definitions
const claimNodeSchema = z.object({
  nodeId: z.coerce.number(),
});

const submitPinSchema = z.object({
  sessionId: z.coerce.number(),
  pin: z.string().min(4).max(8),
});

const releaseSessionSchema = z.object({
  sessionId: z.coerce.number(),
});

// Claim a node - starts VM, creates session
// Now uses background job for VM startup to avoid blocking
export const claimNode = validatedActionWithUser(
  claimNodeSchema,
  async (data, _, user) => {
    const { nodeId } = data;

    // 1. Check user doesn't have an active session
    const existingSession = await getUserActiveSession(user.id);
    if (existingSession) {
      return { error: 'You already have an active gaming session' };
    }

    // 2. Check node is available
    const node = await getNodeById(nodeId);
    if (!node) {
      return { error: 'Node not found' };
    }

    if (node.status !== GamingNodeStatus.AVAILABLE) {
      return { error: 'Node is not available' };
    }

    try {
      // 3. Check if instance is already running
      const instance = await tensorDockClient.getInstance(node.tensorDockInstanceId);
      const instanceStatus = instance.status?.toLowerCase();
      const isRunning = instanceStatus === 'running' || instanceStatus === 'active' || instanceStatus === 'online';

      // 4. Mark node as starting
      await updateNodeStatus(nodeId, GamingNodeStatus.STARTING);

      // 5. Start TensorDock VM only if not already running
      if (!isRunning) {
        await tensorDockClient.startInstance(node.tensorDockInstanceId);
      }

      // 6. Create session with expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

      const session = await createSession({
        userId: user.id,
        nodeId: nodeId,
        status: GamingSessionStatus.STARTING,
        expiresAt,
      });

      // 7. Trigger background job to wait for VM and update status
      // This returns immediately - the job handles polling TensorDock
      await inngest.send({
        name: 'gaming/vm.start.requested',
        data: {
          sessionId: session.id,
          nodeId: nodeId,
          tensorDockInstanceId: node.tensorDockInstanceId,
        },
      });

      // Return immediately - client will poll for status updates
      return {
        success: 'Session starting',
        sessionId: session.id,
      };
    } catch (error) {
      // Rollback on error
      await updateNodeStatus(nodeId, GamingNodeStatus.AVAILABLE, null);
      console.error('Failed to claim node:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to start gaming session',
      };
    }
  }
);

// Submit PIN for pairing
export const submitPin = validatedActionWithUser(
  submitPinSchema,
  async (data, _, user) => {
    const { sessionId, pin } = data;

    // 1. Get session and verify ownership
    const session = await getSessionById(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }

    if (session.userId !== user.id) {
      return { error: 'Unauthorized' };
    }

    if (session.status !== GamingSessionStatus.AWAITING_PAIRING) {
      return { error: 'Session is not awaiting pairing' };
    }

    // 2. Get node details
    const node = session.node;
    if (!node) {
      return { error: 'Node not found' };
    }

    try {
      // 3. Create Wolf client (use API key from env, shared across all nodes)
      const wolfClient = createWolfClient(node.wolfApiUrl, process.env.WOLF_API_KEY!);

      // 4. Get the pending pair secret from Wolf
      const pairSecret = await wolfClient.getPendingPairSecret();
      if (!pairSecret) {
        return { error: 'No pending pairing found. Make sure you added the server in Moonlight first.' };
      }

      // 5. Complete the pairing with the PIN
      const pairResult = await wolfClient.pairClient(pairSecret, pin);

      if (!pairResult.success) {
        return { error: pairResult.error || 'Pairing failed' };
      }

      // 6. Store client_id and update session status
      await updateSession(sessionId, {
        status: GamingSessionStatus.ACTIVE,
        wolfClientId: pairResult.client_id || null,
        pairedAt: new Date(),
      });

      // 7. Mark node as occupied
      await updateNodeStatus(node.id, GamingNodeStatus.OCCUPIED);

      return { success: 'Pairing completed successfully' };
    } catch (error) {
      console.error('Pairing failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to pair with server',
      };
    }
  }
);

// Release session manually
export const releaseSession = validatedActionWithUser(
  releaseSessionSchema,
  async (data, _, user) => {
    const { sessionId } = data;

    // 1. Get session and verify ownership
    const session = await getSessionById(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }

    if (session.userId !== user.id) {
      return { error: 'Unauthorized' };
    }

    if (session.endedAt) {
      return { error: 'Session has already ended' };
    }

    const node = session.node;
    if (!node) {
      return { error: 'Node not found' };
    }

    try {
      // 2. Update session to ending
      await updateSession(sessionId, {
        status: GamingSessionStatus.ENDING,
      });

      // 3. Unpair from Wolf if we have a client ID
      if (session.wolfClientId) {
        try {
          const wolfClient = createWolfClient(node.wolfApiUrl, process.env.WOLF_API_KEY!);
          await wolfClient.unpairClient(session.wolfClientId);
        } catch (unpairError) {
          console.error('Failed to unpair from Wolf:', unpairError);
          // Continue with cleanup even if unpair fails
        }
      }

      // 4. Stop TensorDock VM
      await tensorDockClient.stopInstance(node.tensorDockInstanceId);

      // 5. Mark node as available and clear IP
      await updateNodeStatus(node.id, GamingNodeStatus.AVAILABLE, null);

      // 6. End session
      await endSession(sessionId, 'manual');

      return { success: 'Session ended successfully' };
    } catch (error) {
      console.error('Failed to release session:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to end session',
      };
    }
  }
);

// Get current user's session (for API route)
export async function getCurrentUserSession(userId: number) {
  return getUserActiveSession(userId);
}

// Get available nodes (for API route)
export async function getNodes() {
  return getAvailableNodes();
}
