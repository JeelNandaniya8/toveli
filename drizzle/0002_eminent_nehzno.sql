CREATE TABLE "social_follows" (
	"actor" varchar(254) NOT NULL,
	"target" varchar(254) NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "social_follows_actor_target_pk" PRIMARY KEY("actor","target")
);
--> statement-breakpoint
ALTER TABLE "community_profiles" ADD COLUMN "places" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "social_follows" ADD CONSTRAINT "social_follows_actor_community_profiles_owner_fk" FOREIGN KEY ("actor") REFERENCES "public"."community_profiles"("owner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_follows" ADD CONSTRAINT "social_follows_target_community_profiles_owner_fk" FOREIGN KEY ("target") REFERENCES "public"."community_profiles"("owner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_follows_target_idx" ON "social_follows" USING btree ("target");