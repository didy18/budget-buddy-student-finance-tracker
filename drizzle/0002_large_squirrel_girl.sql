CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
