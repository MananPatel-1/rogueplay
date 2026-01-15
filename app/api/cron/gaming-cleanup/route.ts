import { NextRequest } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/gaming/cleanup';

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');

  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredSessions();
    return Response.json(result);
  } catch (error) {
    console.error('Gaming cleanup failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}
