CREATE TABLE IF NOT EXISTS "avatar_visio_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"heygen_avatar_id" varchar(255),
	"heygen_avatar_status" varchar(50),
	"photo_url" text NOT NULL,
	"photo_original_name" varchar(255),
	"voice_source" varchar(50) NOT NULL,
	"voice_id" varchar(255),
	"voice_sample_url" text,
	"personality_prompt" text,
	"idle_loop_video_url" text,
	"idle_loop_video_status" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visio_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"visio_session_id" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer DEFAULT 0,
	"messages_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "visio_sessions_visio_session_id_unique" UNIQUE("visio_session_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visio_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"month_year" varchar(7) NOT NULL,
	"used_seconds" integer DEFAULT 0,
	"quota_seconds" integer DEFAULT 600,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "personality_type" varchar(50) DEFAULT 'double';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_premium_access" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "avatar_visio_assets" ADD CONSTRAINT "avatar_visio_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visio_sessions" ADD CONSTRAINT "visio_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visio_usage" ADD CONSTRAINT "visio_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
