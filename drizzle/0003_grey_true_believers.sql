ALTER TABLE `budgets` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `reminders` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `savings_goals` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `user_id` text REFERENCES user(id);