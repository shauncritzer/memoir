CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`cover_image` varchar(512),
	`category` varchar(100),
	`tags` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`published_at` timestamp,
	`author_id` int NOT NULL,
	`view_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `email_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`source` varchar(100),
	`status` enum('active','unsubscribed','bounced') NOT NULL DEFAULT 'active',
	`subscribed_at` timestamp NOT NULL DEFAULT (now()),
	`unsubscribed_at` timestamp,
	`tags` text,
	`metadata` text,
	CONSTRAINT `email_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `lead_magnet_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_magnet_id` int NOT NULL,
	`subscriber_id` int,
	`email` varchar(320) NOT NULL,
	`downloaded_at` timestamp NOT NULL DEFAULT (now()),
	`ip_address` varchar(45),
	`user_agent` text,
	CONSTRAINT `lead_magnet_downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_magnets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`file_url` varchar(512),
	`file_key` varchar(512),
	`cover_image` varchar(512),
	`type` enum('pdf','video','audio','course','other') NOT NULL,
	`is_paid` int NOT NULL DEFAULT 0,
	`price` int NOT NULL DEFAULT 0,
	`download_count` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_magnets_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_magnets_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_magnet_downloads` ADD CONSTRAINT `lead_magnet_downloads_lead_magnet_id_lead_magnets_id_fk` FOREIGN KEY (`lead_magnet_id`) REFERENCES `lead_magnets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_magnet_downloads` ADD CONSTRAINT `lead_magnet_downloads_subscriber_id_email_subscribers_id_fk` FOREIGN KEY (`subscriber_id`) REFERENCES `email_subscribers`(`id`) ON DELETE no action ON UPDATE no action;