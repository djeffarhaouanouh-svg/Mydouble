import { pgTable, text, timestamp, integer, serial, varchar, boolean } from 'drizzle-orm/pg-core';

// ============================================
// USERS - Comptes utilisateurs
// ============================================

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
// SUBSCRIPTIONS - Abonnements
// ============================================

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  plan: varchar('plan', { length: 50 }).notNull(), // 'free', 'premium', 'pro'
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'cancelled', 'expired'
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  paypalSubscriptionId: varchar('paypal_subscription_id', { length: 255 }),
  paypalPayerId: varchar('paypal_payer_id', { length: 255 }),
  monthlyCredits: integer('monthly_credits').default(0).notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// VOICES - Voix clonées
// ============================================

export const voices = pgTable('voices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  elevenlabsVoiceId: varchar('elevenlabs_voice_id', { length: 255 }),
  sampleUrl: text('sample_url'), // URL de l'audio uploadé
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'cloning', 'ready', 'failed'
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// CHARACTERS - Personnages
// ============================================

export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(), // Créateur
  name: varchar('name', { length: 255 }).notNull(),
  photoUrl: text('photo_url').notNull(),
  description: text('description'),
  voiceId: integer('voice_id').references(() => voices.id), // Lien vers la voix
  isPublic: boolean('is_public').default(true),
  messagesCount: integer('messages_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// STORIES - Histoires/Scénarios
// ============================================

export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  characterId: integer('character_id').references(() => characters.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// MESSAGES - Messages de chat
// ============================================

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  characterId: integer('character_id').references(() => characters.id),
  storyId: integer('story_id').references(() => stories.id),
  role: varchar('role', { length: 50 }).notNull(), // 'user' ou 'assistant'
  content: text('content').notNull(),
  audioUrl: text('audio_url'),
  videoUrl: text('video_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// VIDEO MESSAGES - Messages vidéo
// ============================================

export const videoMessages = pgTable('video_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(), // Destinataire
  characterId: integer('character_id').references(() => characters.id),
  storyId: integer('story_id').references(() => stories.id),
  messageText: text('message_text'),
  videoUrl: text('video_url'),
  audioUrl: text('audio_url'),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'processing', 'ready', 'failed'
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// CREDITS - Solde de crédits utilisateur
// ============================================

export const credits = pgTable('credits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  balance: integer('balance').default(0).notNull(),
  totalEarned: integer('total_earned').default(0).notNull(),
  totalUsed: integer('total_used').default(0).notNull(),
  lastRefillAt: timestamp('last_refill_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// CREDIT_TRANSACTIONS - Historique des transactions
// ============================================

export const creditTransactions = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(), // Positif = ajout, négatif = déduction
  type: varchar('type', { length: 50 }).notNull(), // 'signup_bonus', 'subscription_refill', 'video_generation', 'purchase'
  description: text('description'),
  relatedVideoMessageId: integer('related_video_message_id').references(() => videoMessages.id),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
