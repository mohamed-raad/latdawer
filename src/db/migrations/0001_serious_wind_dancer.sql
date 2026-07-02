CREATE TABLE `part_alternatives` (
	`id` text PRIMARY KEY NOT NULL,
	`part_id` text NOT NULL,
	`alt_part_id` text NOT NULL,
	`type` text DEFAULT 'equivalent' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`alt_part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`store_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`part_id` text NOT NULL,
	`max_price` real,
	`notified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`part_id` text NOT NULL,
	`store_id` text NOT NULL,
	`price` real NOT NULL,
	`currency` text DEFAULT 'IQD' NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`condition` text DEFAULT 'new' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`notes_ar` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_inventory`("id", "part_id", "store_id", "price", "currency", "quantity", "condition", "status", "notes", "notes_ar", "created_at", "updated_at") SELECT "id", "part_id", "store_id", "price", "currency", "quantity", "condition", "status", "notes", "notes_ar", "created_at", "updated_at" FROM `inventory`;--> statement-breakpoint
DROP TABLE `inventory`;--> statement-breakpoint
ALTER TABLE `__new_inventory` RENAME TO `inventory`;--> statement-breakpoint
PRAGMA foreign_keys=ON;