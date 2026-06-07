CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feedback_id` text NOT NULL,
	`message` text NOT NULL,
	`ua` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`meta` text DEFAULT '{}' NOT NULL,
	CONSTRAINT "feedback_message_length_check" CHECK(length("feedback"."message") BETWEEN 1 AND 1000)
);
--> statement-breakpoint
CREATE INDEX `feedback_created_at_idx` ON `feedback` (`created_at`);--> statement-breakpoint
CREATE INDEX `feedback_feedback_id_created_idx` ON `feedback` (`feedback_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `stats` (
	`pathname` text NOT NULL,
	`type` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`pathname`, `type`)
);
