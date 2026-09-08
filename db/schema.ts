import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => [uniqueIndex('users_email_unique').on(table.email)]);

export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (table) => [index('sessions_user_id_idx').on(table.userId), index('sessions_expires_at_idx').on(table.expiresAt)]);

export const records = sqliteTable('records', {
  owner: text('owner').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  created: integer('created').notNull(),
}, (table) => [primaryKey({ columns: [table.owner, table.key] })]);

export const budgets = sqliteTable('budgets', {
  owner: text('owner').notNull(),
  day: text('day').notNull(),
  used: integer('used').notNull().default(0),
  leaseUntil: integer('lease_until').notNull().default(0),
}, (table) => [primaryKey({ columns: [table.owner, table.day] })]);

export const communityProfiles = sqliteTable('community_profiles', {
  owner: text('owner').primaryKey(),
  publicId: text('public_id').notNull(),
  displayName: text('display_name').notNull(),
  hub: text('hub').notNull(),
  cohort: text('cohort', { enum: ['teen', 'adult'] }).notNull(),
  bio: text('bio').notNull().default(''),
  interests: text('interests').notNull(),
  intent: text('intent').notNull(),
  introvert: integer('introvert', { mode: 'boolean' }).notNull().default(false),
  discoverable: integer('discoverable', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [uniqueIndex('community_profiles_public_id_unique').on(table.publicId)]);

export const connectionRequests = sqliteTable('connection_requests', {
  id: text('id').primaryKey(),
  sender: text('sender').notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  receiver: text('receiver').notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  state: text('state', { enum: ['pending', 'accepted', 'declined', 'cancelled'] }).notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const communityBlocks = sqliteTable('community_blocks', {
  actor: text('actor').notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  target: text('target').notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  createdAt: integer('created_at').notNull(),
}, (table) => [primaryKey({ columns: [table.actor, table.target] })]);

export const communityMessages = sqliteTable('community_messages', {
  id: text('id').primaryKey(),
  sender: text('sender').notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  receiver: text('receiver').notNull().references(() => communityProfiles.owner, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: integer('created_at').notNull(),
});
