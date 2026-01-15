import { getUser } from '@/lib/db/queries';
import { getAvailableNodes, getUserActiveSession } from '@/lib/gaming/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [nodes, activeSession] = await Promise.all([
    getAvailableNodes(),
    getUserActiveSession(user.id),
  ]);

  return Response.json({
    nodes,
    activeSession,
  });
}
