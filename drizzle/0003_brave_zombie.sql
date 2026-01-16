CREATE TABLE `ai_coach_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`message_count` int NOT NULL DEFAULT 0,
	`has_unlimited_access` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_coach_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_coach_users_email_unique` UNIQUE(`email`)
);
