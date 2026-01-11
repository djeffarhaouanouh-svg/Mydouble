import { pgTable, text, timestamp, integer, jsonb, serial, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiDoubles = pgTable('ai_doubles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  personality: jsonb('personality').notNull(),
  styleRules: jsonb('style_rules'),
  voiceId: varchar('voice_id', { length: 255 }),
  messagesCount: integer('messages_count').default(0),
  improvementLevel: integer('improvement_level').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'user' ou 'ai'
  content: text('content').notNull(),
  audioUrl: text('audio_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const voiceSamples = pgTable('voice_samples', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const screenshots = pgTable('screenshots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
