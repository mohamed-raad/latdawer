CREATE TABLE `ai_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text,
	`user_id` text NOT NULL,
	`title` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_knowledge_base` (
	`id` text PRIMARY KEY NOT NULL,
	`term` text NOT NULL,
	`translation` text NOT NULL,
	`category` text,
	`dialect` text DEFAULT 'iq',
	`verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_models` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`model_id` text NOT NULL,
	`name` text NOT NULL,
	`max_tokens` integer DEFAULT 4096 NOT NULL,
	`cost_per_1k_tokens` real DEFAULT 0,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `ai_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_photo_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`image_url` text NOT NULL,
	`source` text,
	`search_term` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `ai_messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`api_endpoint` text NOT NULL,
	`api_key` text,
	`enabled` integer DEFAULT true NOT NULL,
	`config` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_providers_slug_unique` ON `ai_providers` (`slug`);--> statement-breakpoint
CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`model_id` text NOT NULL,
	`tokens_used` integer DEFAULT 0 NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`period` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `amount` real;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `discount` real DEFAULT 0;