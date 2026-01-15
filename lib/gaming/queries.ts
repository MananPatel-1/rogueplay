import { eq, and, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  gamingNodes,
  gamingSessions,
  GamingNodeStatus,
  GamingSessionStatus,
  type GamingNode,
  type GamingSession,
  type NewGamingSession,
} from '@/lib/db/schema';

export async function getAvailableNodes(): Promise<GamingNode[]> {
  return db
    .select()
    .from(gamingNodes)
    .where(eq(gamingNodes.status, GamingNodeStatus.AVAILABLE));
}

export async function getNodeById(nodeId: number): Promise<GamingNode | null> {
  const result = await db
    .select()
    .from(gamingNodes)
    .where(eq(gamingNodes.id, nodeId))
    .limit(1);

  return result[0] || null;
}

export async function getUserActiveSession(userId: number) {
  return db.query.gamingSessions.findFirst({
    where: and(
      eq(gamingSessions.userId, userId),
      isNull(gamingSessions.endedAt)
    ),
    with: {
      node: true,
    },
  });
}

export async function getSessionById(sessionId: number) {
  return db.query.gamingSessions.findFirst({
    where: eq(gamingSessions.id, sessionId),
    with: {
      node: true,
      user: true,
    },
  });
}

export async function getExpiredSessions() {
  const now = new Date();

  return db
    .select()
    .from(gamingSessions)
    .where(
      and(
        lt(gamingSessions.expiresAt, now),
        isNull(gamingSessions.endedAt)
      )
    );
}

export async function updateNodeStatus(
  nodeId: number,
  status: GamingNodeStatus,
  serverIp?: string | null
) {
  const updateData: Partial<GamingNode> = {
    status,
    updatedAt: new Date(),
  };

  if (serverIp !== undefined) {
    updateData.serverIp = serverIp;
  }

  await db
    .update(gamingNodes)
    .set(updateData)
    .where(eq(gamingNodes.id, nodeId));
}

export async function createSession(data: NewGamingSession) {
  const [session] = await db
    .insert(gamingSessions)
    .values(data)
    .returning();

  return session;
}

export async function updateSession(
  sessionId: number,
  data: Partial<GamingSession>
) {
  await db
    .update(gamingSessions)
    .set(data)
    .where(eq(gamingSessions.id, sessionId));
}

export async function endSession(
  sessionId: number,
  endReason: string
) {
  await db
    .update(gamingSessions)
    .set({
      status: GamingSessionStatus.ENDED,
      endedAt: new Date(),
      endReason,
    })
    .where(eq(gamingSessions.id, sessionId));
}
