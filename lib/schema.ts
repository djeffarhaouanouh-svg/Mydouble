import { pgTable, text, timestamp, integer, serial, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  password: varchar('password', { length: 255 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// AVATAR VISIO IA - Tables
// ============================================

export const avatarVisioAssets = pgTable('avatar_visio_assets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  // HeyGen avatar data
  heygenAvatarId: varchar('heygen_avatar_id', { length: 255 }),
  heygenAvatarStatus: varchar('heygen_avatar_status', { length: 50 }), // 'pending', 'processing', 'ready', 'failed'
  // Source photo
  photoUrl: text('photo_url').notNull(),
  photoOriginalName: varchar('photo_original_name', { length: 255 }),
  // Voice configuration
  voiceSource: varchar('voice_source', { length: 50 }).notNull(), // 'elevenlabs_clone', 'elevenlabs_preset', 'heygen'
  voiceId: varchar('voice_id', { length: 255 }),
  voiceSampleUrl: text('voice_sample_url'),
  // Personality prompt
  personalityPrompt: text('personality_prompt'),
  // Idle loop video
  idleLoopVideoUrl: text('idle_loop_video_url'),
  idleLoopVideoStatus: varchar('idle_loop_video_status', { length: 50 }), // 'pending', 'generating', 'ready', 'failed'
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const visioUsage = pgTable('visio_usage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  // Monthly quota tracking
  monthYear: varchar('month_year', { length: 7 }).notNull(), // Format: '2026-01'
  usedSeconds: integer('used_seconds').default(0),
  quotaSeconds: integer('quota_seconds').default(600), // Default 10 min (600s) per month
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const visioSessions = pgTable('visio_sessions', {
  id: serial('id').primaryKey(),
  visioSessionId: varchar('visio_session_id', { length: 255 }).notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  // Session data
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds').default(0),
  // Conversation metrics
  messagesCount: integer('messages_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
