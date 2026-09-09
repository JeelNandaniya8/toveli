CREATE TABLE "social_comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"item_id" uuid NOT NULL,
	"actor" varchar(36) NOT NULL,
	"body" varchar(500) NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner" varchar(36) NOT NULL,
	"kind" varchar(12) NOT NULL,
	"hub" varchar(120) NOT NULL,
	"cohort" varchar(10) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recipient" varchar(36) NOT NULL,
	"actor" varchar(36) NOT NULL,
	"text" varchar(240) NOT NULL,
	"target" varchar(100) NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_reactions" (
	"item_id" uuid NOT NULL,
	"actor" varchar(36) NOT NULL,
	"kind" varchar(10) NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "social_reactions_item_id_actor_kind_pk" PRIMARY KEY("item_id","actor","kind")
);
--> statement-breakpoint
CREATE TABLE "social_reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"item_id" uuid NOT NULL,
	"actor" varchar(36) NOT NULL,
	"reason" varchar(500) NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_item_id_social_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."social_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_actor_users_id_fk" FOREIGN KEY ("actor") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_items" ADD CONSTRAINT "social_items_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_recipient_users_id_fk" FOREIGN KEY ("recipient") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_actor_users_id_fk" FOREIGN KEY ("actor") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reactions" ADD CONSTRAINT "social_reactions_item_id_social_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."social_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reactions" ADD CONSTRAINT "social_reactions_actor_users_id_fk" FOREIGN KEY ("actor") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_actor_users_id_fk" FOREIGN KEY ("actor") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_comments_item_idx" ON "social_comments" USING btree ("item_id","created_at");--> statement-breakpoint
CREATE INDEX "social_items_scope_created_idx" ON "social_items" USING btree ("hub","cohort","created_at");--> statement-breakpoint
CREATE INDEX "social_notifications_recipient_idx" ON "social_notifications" USING btree ("recipient","created_at");--> statement-breakpoint
CREATE INDEX "social_reactions_actor_idx" ON "social_reactions" USING btree ("actor");