-- Migration: Système de crédits
-- Date: 2026-01-27

-- ============================================
-- TABLE: credits - Solde de crédits utilisateur
-- ============================================

CREATE TABLE IF NOT EXISTS "credits" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "balance" integer DEFAULT 0 NOT NULL,
  "total_earned" integer DEFAULT 0 NOT NULL,
  "total_used" integer DEFAULT 0 NOT NULL,
  "last_refill_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "credits_user_id_unique" UNIQUE("user_id")
);

-- ============================================
-- TABLE: credit_transactions - Historique des transactions
-- ============================================

CREATE TABLE IF NOT EXISTS "credit_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "amount" integer NOT NULL,
  "type" varchar(50) NOT NULL,
  "description" text,
  "related_video_message_id" integer,
  "balance_before" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- ============================================
-- Nouvelles colonnes pour subscriptions (PayPal)
-- ============================================

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "paypal_subscription_id" varchar(255);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "paypal_payer_id" varchar(255);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "monthly_credits" integer DEFAULT 0 NOT NULL;

-- ============================================
-- Foreign Keys
-- ============================================

ALTER TABLE "credits" ADD CONSTRAINT "credits_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_video_message_id_fk"
  FOREIGN KEY ("related_video_message_id") REFERENCES "public"."video_messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- ============================================
-- Index pour performance
-- ============================================

CREATE INDEX IF NOT EXISTS "credits_user_id_idx" ON "credits" ("user_id");
CREATE INDEX IF NOT EXISTS "credit_transactions_user_id_idx" ON "credit_transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "credit_transactions_created_at_idx" ON "credit_transactions" ("created_at" DESC);
