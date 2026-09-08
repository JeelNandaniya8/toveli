CREATE TABLE "budgets" (
	"owner" varchar(254) NOT NULL,
	"day" varchar(10) NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"lease_until" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "budgets_owner_day_pk" PRIMARY KEY("owner","day")
);
--> statement-breakpoint
CREATE TABLE "community_blocks" (
	"actor" varchar(254) NOT NULL,
	"target" varchar(254) NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "community_blocks_actor_target_pk" PRIMARY KEY("actor","target")
);
--> statement-breakpoint
CREATE TABLE "community_messages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sender" varchar(254) NOT NULL,
	"receiver" varchar(254) NOT NULL,
	"body" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_profiles" (
	"owner" varchar(254) PRIMARY KEY NOT NULL,
	"public_id" varchar(24) NOT NULL,
	"display_name" varchar(40) NOT NULL,
	"hub" varchar(120) NOT NULL,
	"cohort" varchar(10) NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"interests" text NOT NULL,
	"intent" varchar(120) NOT NULL,
	"introvert" boolean DEFAULT false NOT NULL,
	"discoverable" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connection_requests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sender" varchar(254) NOT NULL,
	"receiver" varchar(254) NOT NULL,
	"state" varchar(16) NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"owner" varchar(254) NOT NULL,
	"key" varchar(128) NOT NULL,
	"value" text NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "records_owner_key_pk" PRIMARY KEY("owner","key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" bigint NOT NULL,
	"expires_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"display_name" varchar(40) NOT NULL,
	"password_hash" varchar(64) NOT NULL,
	"password_salt" varchar(32) NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_blocks" ADD CONSTRAINT "community_blocks_actor_community_profiles_owner_fk" FOREIGN KEY ("actor") REFERENCES "public"."community_profiles"("owner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_blocks" ADD CONSTRAINT "community_blocks_target_community_profiles_owner_fk" FOREIGN KEY ("target") REFERENCES "public"."community_profiles"("owner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_sender_community_profiles_owner_fk" FOREIGN KEY ("sender") REFERENCES "public"."community_profiles"("owner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_receiver_community_profiles_owner_fk" FOREIGN KEY ("receiver") REFERENCES "public"."community_profiles"("owner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_sender_community_profiles_owner_fk" FOREIGN KEY ("sender") REFERENCES "public"."community_profiles"("owner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_receiver_community_profiles_owner_fk" FOREIGN KEY ("receiver") REFERENCES "public"."community_profiles"("owner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "community_profiles_public_id_unique" ON "community_profiles" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");