import { getUser } from '@/lib/db/queries';
import { getUserActiveSession } from '@/lib/gaming/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getUserActiveSession(user.id);
  return Response.json(session);
}
