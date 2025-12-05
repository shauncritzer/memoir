CREATE TABLE `blog_post_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blog_post_id` int NOT NULL,
	`subscriber_id` int,
	`email` varchar(320) NOT NULL,
	`downloaded_at` timestamp NOT NULL DEFAULT (now()),
	`ip_address` varchar(45),
	`user_agent` text,
	CONSTRAINT `blog_post_downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`stripe_price_id` varchar(255) NOT NULL,
	`type` enum('one_time','subscription') NOT NULL,
	`features` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `file_url` varchar(512);--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `file_key` varchar(512);--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `download_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `blog_post_downloads` ADD CONSTRAINT `blog_post_downloads_blog_post_id_blog_posts_id_fk` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_post_downloads` ADD CONSTRAINT `blog_post_downloads_subscriber_id_email_subscribers_id_fk` FOREIGN KEY (`subscriber_id`) REFERENCES `email_subscribers`(`id`) ON DELETE no action ON UPDATE no action;