import { inngest } from '../client';
import { tensorDockClient } from '@/lib/gaming/tensordock';
import { updateNodeStatus, updateSession, endSession } from '@/lib/gaming/queries';
import { GamingNodeStatus, GamingSessionStatus } from '@/lib/db/schema';
import { createWolfClient } from '@/lib/gaming/wolf';

export const startVmJob = inngest.createFunction(
  {
    id: 'start-gaming-vm',
    retries: 2,
    onFailure: async ({ event, error }) => {
      // Mark session as FAILED on permanent failure
      // In onFailure, event.data contains the original event's data
      const eventData = event.data.event?.data as { sessionId: number; nodeId: number } | undefined;
      if (!eventData) {
        console.error('[start-vm] No event data in failure handler');
        return;
      }
      const { sessionId, nodeId } = eventData;
      console.error(`[start-vm] Failed to start VM for session ${sessionId}:`, error);

      try {
        await endSession(sessionId, `VM startup failed: ${error.message}`);
        await updateNodeStatus(nodeId, GamingNodeStatus.AVAILABLE, null);
      } catch (cleanupError) {
        console.error('[start-vm] Failed to cleanup after error:', cleanupError);
      }
    },
  },
  { event: 'gaming/vm.start.requested' },
  async ({ event, step }) => {
    const { sessionId, nodeId, tensorDockInstanceId } = event.data;

    console.log(`[start-vm] Starting job for session ${sessionId}, node ${nodeId}`);

    // Step 1: Wait for VM to be ready (with built-in timeout)
    const instance = await step.run('wait-for-vm', async () => {
      console.log(`[start-vm] Waiting for TensorDock instance ${tensorDockInstanceId}`);
      return tensorDockClient.waitForInstanceReady(
        tensorDockInstanceId,
        180000, // 3 minute timeout
        5000    // poll every 5 seconds
      );
    });

    const serverIp = instance.ipAddress || instance.ip_address || null;
    console.log(`[start-vm] Instance ready with IP: ${serverIp}`);

    // Step 2: Update node with server IP and Wolf API URL
    await step.run('update-node-ip', async () => {
      await updateNodeStatus(nodeId, GamingNodeStatus.STARTING, serverIp);
    });

    // Step 3: Clear any lingering Wolf clients (ensures clean slate for new user)
    await step.run('clear-wolf-clients', async () => {
      const wolfApiUrl = `http://${serverIp}:47990`;
      const wolfClient = createWolfClient(wolfApiUrl, process.env.WOLF_API_KEY!);

      // Retry as Wolf may still be starting up
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await wolfClient.unpairAllClients();
          console.log(`[start-vm] Cleared ${result.unpairedCount} Wolf clients`);
          return result;
        } catch (error) {
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          console.warn('[start-vm] Could not clear Wolf clients:', error);
          return { unpairedCount: 0, errors: [String(error)] };
        }
      }
    });

    // Step 4: Update session to AWAITING_PAIRING
    await step.run('update-session-status', async () => {
      await updateSession(sessionId, {
        status: GamingSessionStatus.AWAITING_PAIRING,
      });
    });

    console.log(`[start-vm] Session ${sessionId} ready for pairing`);

    return { success: true, serverIp };
  }
);
