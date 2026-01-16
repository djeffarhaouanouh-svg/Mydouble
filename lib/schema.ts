import { pgTable, text, timestamp, integer, jsonb, serial, varchar, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  password: varchar('password', { length: 255 }),
  avatarUrl: text('avatar_url'),
  birthMonth: integer('birth_month'),
  birthDay: integer('birth_day'),
  hasPremiumAccess: boolean('has_premium_access').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiDoubles = pgTable('ai_doubles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  personality: jsonb('personality').notNull(),
  styleRules: jsonb('style_rules'),
  voiceId: varchar('voice_id', { length: 255 }),
  vapiAssistantId: varchar('vapi_assistant_id', { length: 255 }),
  diagnostic: jsonb('diagnostic'),
  messagesCount: integer('messages_count').default(0),
  improvementLevel: integer('improvement_level').default(0),
  // Nouveaux champs pour le système de profil psychologique
  quizInProgress: jsonb('quiz_in_progress'), // { type: 'mbti', startedAt: timestamp }
  quizCompleted: jsonb('quiz_completed').default([]), // ['mbti', 'bigfive', 'anps', 'enneagram']
  enneagramType: varchar('enneagram_type', { length: 10 }), // "2w3", "7w8", etc.
  mbtiType: varchar('mbti_type', { length: 4 }), // "ENFP", "INTJ", etc.
  bigFiveScores: jsonb('big_five_scores'), // { ouverture: 85, conscienciosite: 72, ... }
  anpsScores: jsonb('anps_scores'), // { seeking: 82, fear: 45, care: 85, ... }
  traitsDominants: jsonb('traits_dominants'), // [{ trait: "Altruiste", score: 92 }, ...]
  lastRefreshAt: timestamp('last_refresh_at'),
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
