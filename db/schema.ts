import { bigint, boolean, index, integer, jsonb, pgTable, primaryKey, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 254 }).notNull(),
  displayName: varchar('display_name', { length: 40 }).notNull(),
  passwordHash: varchar('password_hash', { length: 64 }).notNull(),
  passwordSalt: varchar('password_salt', { length: 32 }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, (table) => [uniqueIndex('users_email_unique').on(table.email)]);

export const sessions = pgTable('sessions', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
}, (table) => [index('sessions_user_id_idx').on(table.userId), index('sessions_expires_at_idx').on(table.expiresAt)]);

export const records = pgTable('records', {
  owner: varchar('owner', { length: 254 }).notNull(),
  key: varchar('key', { length: 128 }).notNull(),
  value: text('value').notNull(),
  created: bigint('created', { mode: 'number' }).notNull(),
}, (table) => [primaryKey({ columns: [table.owner, table.key] })]);

export const budgets = pgTable('budgets', {
  owner: varchar('owner', { length: 254 }).notNull(),
  day: varchar('day', { length: 10 }).notNull(),
  used: integer('used').notNull().default(0),
  leaseUntil: bigint('lease_until', { mode: 'number' }).notNull().default(0),
}, (table) => [primaryKey({ columns: [table.owner, table.day] })]);

export const communityProfiles = pgTable('community_profiles', {
  owner: varchar('owner', { length: 254 }).primaryKey(),
  publicId: varchar('public_id', { length: 24 }).notNull(),
  displayName: varchar('display_name', { length: 40 }).notNull(),
  hub: varchar('hub', { length: 120 }).notNull(),
  cohort: varchar('cohort', { length: 10, enum: ['teen', 'adult'] }).notNull(),
  bio: text('bio').notNull().default(''),
  interests: text('interests').notNull(),
  intent: varchar('intent', { length: 120 }).notNull(),
  introvert: boolean('introvert').notNull().default(false),
  discoverable: boolean('discoverable').notNull().default(false),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
}, (table) => [uniqueIndex('community_profiles_public_id_unique').on(table.publicId)]);

export const connectionRequests = pgTable('connection_requests', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sender: varchar('sender', { length: 254 }).notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  receiver: varchar('receiver', { length: 254 }).notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  state: varchar('state', { length: 16, enum: ['pending', 'accepted', 'declined', 'cancelled'] }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const communityBlocks = pgTable('community_blocks', {
  actor: varchar('actor', { length: 254 }).notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  target: varchar('target', { length: 254 }).notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, (table) => [primaryKey({ columns: [table.actor, table.target] })]);

export const communityMessages = pgTable('community_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sender: varchar('sender', { length: 254 }).notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  receiver: varchar('receiver', { length: 254 }).notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

// V4 social objects are additive. Existing users and private drafts are preserved.
export const socialItems = pgTable('social_items', {
  id: uuid('id').primaryKey(), owner: varchar('owner', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 12, enum: ['post', 'circle', 'plan'] }).notNull(),
  hub: varchar('hub', { length: 120 }).notNull(), cohort: varchar('cohort', { length: 10 }).notNull(),
  data: jsonb('data').notNull(), createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, t => [index('social_items_scope_created_idx').on(t.hub, t.cohort, t.createdAt)]);
export const socialReactions = pgTable('social_reactions', {
  itemId: uuid('item_id').notNull().references(() => socialItems.id, { onDelete: 'cascade' }),
  actor: varchar('actor', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 10 }).notNull(), createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, t => [primaryKey({ columns: [t.itemId, t.actor, t.kind] }), index('social_reactions_actor_idx').on(t.actor)]);
export const socialComments = pgTable('social_comments', {
  id: uuid('id').primaryKey(), itemId: uuid('item_id').notNull().references(() => socialItems.id, { onDelete: 'cascade' }),
  actor: varchar('actor', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: varchar('body', { length: 500 }).notNull(), createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, t => [index('social_comments_item_idx').on(t.itemId, t.createdAt)]);
export const socialNotifications = pgTable('social_notifications', {
  id: uuid('id').primaryKey(), recipient: varchar('recipient', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  actor: varchar('actor', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: varchar('text', { length: 240 }).notNull(), target: varchar('target', { length: 100 }).notNull(),
  read: boolean('read').notNull().default(false), createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, t => [index('social_notifications_recipient_idx').on(t.recipient, t.createdAt)]);
export const socialReports = pgTable('social_reports', {
  id: uuid('id').primaryKey(), itemId: uuid('item_id').notNull(),
  actor: varchar('actor', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 500 }).notNull(), createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
