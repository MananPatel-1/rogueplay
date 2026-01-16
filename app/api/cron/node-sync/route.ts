import { NextRequest } from 'next/server';
import { syncTensorDockNodes } from '@/lib/gaming/sync';

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');

  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncTensorDockNodes();

    console.log(
      `[Node Sync] Added: ${result.added}, Removed: ${result.removed}, Errors: ${result.errors.length}`
    );

    return Response.json({
      success: true,
      added: result.added,
      removed: result.removed,
      addedNodes: result.addedNodes,
      removedNodes: result.removedNodes,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Node sync failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
