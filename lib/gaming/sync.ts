import { tensorDockClient } from './tensordock';
import { getAllNodes, createNode, deleteNode, deleteSessionsByNodeId } from './queries';
import { GamingNodeStatus, type GamingNode } from '@/lib/db/schema';

export interface SyncResult {
  added: number;
  removed: number;
  errors: SyncError[];
  addedNodes: string[];
  removedNodes: string[];
}

export interface SyncError {
  operation: 'add' | 'remove';
  instanceId: string;
  message: string;
}

const WOLF_API_PORT = 47990;

export async function syncTensorDockNodes(): Promise<SyncResult> {
  const result: SyncResult = {
    added: 0,
    removed: 0,
    errors: [],
    addedNodes: [],
    removedNodes: [],
  };

  // Fetch current state from both sources
  const [tensorDockInstances, dbNodes] = await Promise.all([
    tensorDockClient.listInstances(),
    getAllNodes(),
  ]);

  // Create lookup maps for efficient comparison
  const tensorDockMap = new Map<string, TensorDockInstance>(
    tensorDockInstances.map((instance) => [instance.id, instance])
  );
  const dbNodeMap = new Map<string, GamingNode>(
    dbNodes.map((node) => [node.tensorDockInstanceId, node])
  );

  // Find instances to ADD (exist in TensorDock but not in DB)
  for (const instance of tensorDockInstances) {
    if (!dbNodeMap.has(instance.id)) {
      try {
        await addNodeFromInstance(instance);
        result.added++;
        result.addedNodes.push(instance.name || instance.id);
      } catch (error) {
        result.errors.push({
          operation: 'add',
          instanceId: instance.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // Find nodes to REMOVE (exist in DB but not in TensorDock)
  for (const node of dbNodes) {
    if (!tensorDockMap.has(node.tensorDockInstanceId)) {
      try {
        await deleteSessionsByNodeId(node.id);
        await deleteNode(node.id);
        result.removed++;
        result.removedNodes.push(node.name);
      } catch (error) {
        result.errors.push({
          operation: 'remove',
          instanceId: node.tensorDockInstanceId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return result;
}

async function addNodeFromInstance(instanceSummary: { id: string; name: string }): Promise<void> {
  // Fetch full instance details to get IP address
  const instance = await tensorDockClient.getInstance(instanceSummary.id);

  // Derive Wolf API URL from instance IP
  const serverIp = instance.ipAddress || instance.ip_address || null;
  const wolfApiUrl = serverIp
    ? `http://${serverIp}:${WOLF_API_PORT}`
    : `http://pending:${WOLF_API_PORT}`;

  // Get shared Wolf credentials from environment
  const wolfApiKey = process.env.WOLF_API_KEY;
  const wolfPairSecret = process.env.WOLF_PAIR_SECRET;

  if (!wolfApiKey || !wolfPairSecret) {
    throw new Error('WOLF_API_KEY and WOLF_PAIR_SECRET must be set');
  }

  await createNode({
    name: instance.name || `node-${instance.id}`,
    tensorDockInstanceId: instance.id,
    wolfApiUrl,
    wolfApiKey,
    wolfPairSecret,
    serverIp,
    status: GamingNodeStatus.AVAILABLE,
  });
}
