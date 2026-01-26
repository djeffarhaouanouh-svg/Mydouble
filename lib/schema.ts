import { pgTable, text, timestamp, integer, serial, varchar, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  password: varchar('password', { length: 255 }),
  avatarUrl: text('avatar_url'),
  birthMonth: integer('birth_month'),
  birthDay: integer('birth_day'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// AI DOUBLES - Tables
// ============================================

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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// AVATAR VISIO IA - Tables
// ============================================

export const avatarVisioAssets = pgTable('avatar_visio_assets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  // Source photo
  photoUrl: text('photo_url').notNull(),
  photoOriginalName: varchar('photo_original_name', { length: 255 }),
  // Voice configuration
  voiceSource: varchar('voice_source', { length: 50 }).notNull(), // 'elevenlabs_clone', 'elevenlabs_preset'
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

// ============================================
// CHAT VIDEO JOBS - Async processing
// ============================================

export const chatVideoJobs = pgTable('chat_video_jobs', {
  id: serial('id').primaryKey(),
  jobId: varchar('job_id', { length: 64 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, processing, completed, failed
  // Input
  userMessage: text('user_message'),
  // Output
  aiResponse: text('ai_response'),
  audioUrl: text('audio_url'),
  videoUrl: text('video_url'),
  // Error tracking
  error: text('error'),
  // External job IDs
  lipsyncJobId: varchar('lipsync_job_id', { length: 255 }),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});
