'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, ActivityType } from '@/lib/db/schema';
import { validatedActionWithAdmin } from '@/lib/auth/middleware';
import { revalidatePath } from 'next/cache';
import { getUserWithTeam } from '@/lib/db/queries';

const approveUserSchema = z.object({
  userId: z.coerce.number()
});

export const approveUser = validatedActionWithAdmin(
  approveUserSchema,
  async (data, _, admin) => {
    const { userId } = data;

    // Get admin's team for logging
    const adminWithTeam = await getUserWithTeam(admin.id);

    await db
      .update(users)
      .set({
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: admin.id,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Log activity
    if (adminWithTeam?.teamId) {
      await db.insert(activityLogs).values({
        teamId: adminWithTeam.teamId,
        userId: admin.id,
        action: ActivityType.APPROVE_USER
      });
    }

    revalidatePath('/admin/pending-users');
    return { success: 'User approved successfully.' };
  }
);

const rejectUserSchema = z.object({
  userId: z.coerce.number()
});

export const rejectUser = validatedActionWithAdmin(
  rejectUserSchema,
  async (data, _, admin) => {
    const { userId } = data;

    // Get admin's team for logging
    const adminWithTeam = await getUserWithTeam(admin.id);

    await db
      .update(users)
      .set({
        approvalStatus: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Log activity
    if (adminWithTeam?.teamId) {
      await db.insert(activityLogs).values({
        teamId: adminWithTeam.teamId,
        userId: admin.id,
        action: ActivityType.REJECT_USER
      });
    }

    revalidatePath('/admin/pending-users');
    return { success: 'User rejected.' };
  }
);
