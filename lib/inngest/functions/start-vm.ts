import { inngest } from '../client';
import { tensorDockClient } from '@/lib/gaming/tensordock';
import { updateNodeStatus, updateSession, endSession } from '@/lib/gaming/queries';
import { GamingNodeStatus, GamingSessionStatus } from '@/lib/db/schema';

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

    console.log(`[start-vm] Instance ready with IP: ${instance.ip_address}`);

    // Step 2: Update node with server IP
    await step.run('update-node-ip', async () => {
      await updateNodeStatus(nodeId, GamingNodeStatus.STARTING, instance.ip_address || null);
    });

    // Step 3: Update session to AWAITING_PAIRING
    await step.run('update-session-status', async () => {
      await updateSession(sessionId, {
        status: GamingSessionStatus.AWAITING_PAIRING,
      });
    });

    console.log(`[start-vm] Session ${sessionId} ready for pairing`);

    return { success: true, serverIp: instance.ip_address };
  }
);
