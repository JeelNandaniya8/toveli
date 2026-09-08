CREATE TABLE `community_blocks` (
	`actor` text NOT NULL,
	`target` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`actor`, `target`),
	FOREIGN KEY (`actor`) REFERENCES `community_profiles`(`owner`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target`) REFERENCES `community_profiles`(`owner`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`receiver` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`sender`) REFERENCES `community_profiles`(`owner`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`receiver`) REFERENCES `community_profiles`(`owner`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`display_name` text NOT NULL,
	`hub` text NOT NULL,
	`cohort` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`interests` text NOT NULL,
	`intent` text NOT NULL,
	`introvert` integer DEFAULT false NOT NULL,
	`discoverable` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_profiles_public_id_unique` ON `community_profiles` (`public_id`);--> statement-breakpoint
CREATE TABLE `connection_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`receiver` text NOT NULL,
	`state` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`sender`) REFERENCES `community_profiles`(`owner`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`receiver`) REFERENCES `community_profiles`(`owner`) ON UPDATE no action ON DELETE cascade
);
