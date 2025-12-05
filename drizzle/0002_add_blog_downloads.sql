-- Add download fields to blog_posts table
ALTER TABLE `blog_posts` ADD COLUMN `file_url` varchar(512);
--> statement-breakpoint
ALTER TABLE `blog_posts` ADD COLUMN `file_key` varchar(512);
--> statement-breakpoint
ALTER TABLE `blog_posts` ADD COLUMN `download_count` int NOT NULL DEFAULT 0;
--> statement-breakpoint
-- Create blog_post_downloads tracking table
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
ALTER TABLE `blog_post_downloads` ADD CONSTRAINT `blog_post_downloads_blog_post_id_blog_posts_id_fk` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blog_post_downloads` ADD CONSTRAINT `blog_post_downloads_subscriber_id_email_subscribers_id_fk` FOREIGN KEY (`subscriber_id`) REFERENCES `email_subscribers`(`id`) ON DELETE no action ON UPDATE no action;
