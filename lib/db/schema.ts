import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  approvalStatus: varchar('approval_status', { length: 20 }).notNull().default('pending'),
  approvedAt: timestamp('approved_at'),
  approvedBy: integer('approved_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  gamingSessions: many(gamingSessions),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  APPROVE_USER = 'APPROVE_USER',
  REJECT_USER = 'REJECT_USER',
}

// Gaming node status enum
export enum GamingNodeStatus {
  AVAILABLE = 'available',
  STARTING = 'starting',
  OCCUPIED = 'occupied',
  STOPPING = 'stopping',
}

// Gaming session status enum
export enum GamingSessionStatus {
  STARTING = 'starting',
  AWAITING_PAIRING = 'awaiting_pairing',
  ACTIVE = 'active',
  ENDING = 'ending',
  ENDED = 'ended',
  FAILED = 'failed',
}

// Gaming nodes - TensorDock instances with Wolf
export const gamingNodes = pgTable('gaming_nodes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  tensorDockInstanceId: varchar('tensordock_instance_id', { length: 100 }).notNull().unique(),
  wolfApiUrl: varchar('wolf_api_url', { length: 255 }).notNull(),
  wolfApiKey: text('wolf_api_key').notNull(),
  wolfPairSecret: text('wolf_pair_secret').notNull(),
  serverIp: varchar('server_ip', { length: 45 }),
  status: varchar('status', { length: 20 }).notNull().default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Gaming sessions - tracks user sessions on nodes
export const gamingSessions = pgTable('gaming_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  nodeId: integer('node_id')
    .notNull()
    .references(() => gamingNodes.id),
  status: varchar('status', { length: 20 }).notNull().default('starting'),
  wolfClientId: varchar('wolf_client_id', { length: 100 }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  pairedAt: timestamp('paired_at'),
  expiresAt: timestamp('expires_at').notNull(),
  endedAt: timestamp('ended_at'),
  endReason: varchar('end_reason', { length: 50 }),
});

// Relations for gaming tables
export const gamingNodesRelations = relations(gamingNodes, ({ many }) => ({
  sessions: many(gamingSessions),
}));

export const gamingSessionsRelations = relations(gamingSessions, ({ one }) => ({
  user: one(users, {
    fields: [gamingSessions.userId],
    references: [users.id],
  }),
  node: one(gamingNodes, {
    fields: [gamingSessions.nodeId],
    references: [gamingNodes.id],
  }),
}));

// Gaming type exports
export type GamingNode = typeof gamingNodes.$inferSelect;
export type NewGamingNode = typeof gamingNodes.$inferInsert;
export type GamingSession = typeof gamingSessions.$inferSelect;
export type NewGamingSession = typeof gamingSessions.$inferInsert;
