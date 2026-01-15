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
      // 3. Mark node as starting
      await updateNodeStatus(nodeId, GamingNodeStatus.STARTING);

      // 4. Start TensorDock VM
      await tensorDockClient.startInstance(node.tensorDockInstanceId);

      // 5. Create session with expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

      const session = await createSession({
        userId: user.id,
        nodeId: nodeId,
        status: GamingSessionStatus.STARTING,
        expiresAt,
      });

      // 6. Wait for VM to be ready and get IP
      const instance = await tensorDockClient.waitForInstanceReady(
        node.tensorDockInstanceId,
        120000, // 2 minute timeout
        5000    // poll every 5 seconds
      );

      // 7. Update node with server IP
      await updateNodeStatus(
        nodeId,
        GamingNodeStatus.STARTING,
        instance.ip_address || null
      );

      // 8. Update session to awaiting_pairing
      await updateSession(session.id, {
        status: GamingSessionStatus.AWAITING_PAIRING,
      });

      return {
        success: 'Session started successfully',
        sessionId: session.id,
        serverIp: instance.ip_address,
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
      // 3. Create Wolf client
      const wolfClient = createWolfClient(node.wolfApiUrl, node.wolfApiKey);

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
          const wolfClient = createWolfClient(node.wolfApiUrl, node.wolfApiKey);
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
