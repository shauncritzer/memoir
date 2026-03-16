CREATE TABLE `affiliate_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliate_id` int NOT NULL,
	`visitor_ip` varchar(45),
	`landing_page` varchar(512),
	`converted` int NOT NULL DEFAULT 0,
	`purchase_id` int,
	`commission_amount` int DEFAULT 0,
	`status` enum('clicked','converted','paid') NOT NULL DEFAULT 'clicked',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`referral_code` varchar(100) NOT NULL,
	`commission_rate` int NOT NULL DEFAULT 30,
	`payout_email` varchar(320),
	`payout_method` enum('paypal','stripe','bank_transfer') DEFAULT 'paypal',
	`total_referrals` int NOT NULL DEFAULT 0,
	`total_earnings` int NOT NULL DEFAULT 0,
	`pending_payout` int NOT NULL DEFAULT 0,
	`status` enum('active','paused','banned') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_referral_code_unique` UNIQUE(`referral_code`)
);
--> statement-breakpoint
CREATE TABLE `agent_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`business_id` int,
	`category` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`risk_tier` int NOT NULL DEFAULT 1,
	`status` enum('proposed','approved','executing','executed','denied','failed') NOT NULL DEFAULT 'proposed',
	`cost_estimate` int NOT NULL DEFAULT 0,
	`actual_cost` int DEFAULT 0,
	`result` text,
	`error_message` text,
	`metadata` text,
	`approved_at` timestamp,
	`executed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_type` varchar(50) NOT NULL,
	`business_id` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`metrics` text,
	`suggested_actions` text,
	`is_read` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255),
	`business_type` varchar(50) NOT NULL,
	`brand_voice` text,
	`target_audience` text,
	`products` text,
	`social_config` text,
	`stripe_account_id` varchar(255),
	`daily_budget` int NOT NULL DEFAULT 0,
	`monthly_budget` int NOT NULL DEFAULT 0,
	`spent_today` int NOT NULL DEFAULT 0,
	`spent_month` int NOT NULL DEFAULT 0,
	`status` enum('active','paused','setup') NOT NULL DEFAULT 'setup',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `content_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_blog_post_id` int,
	`platform` varchar(50) NOT NULL,
	`content_type` varchar(50) NOT NULL,
	`content` text,
	`media_urls` text,
	`scheduled_for` timestamp,
	`status` enum('pending','generating','ready','posting','posted','failed') NOT NULL DEFAULT 'pending',
	`error_message` text,
	`platform_post_id` varchar(255),
	`platform_post_url` varchar(512),
	`metrics` text,
	`cta_offer_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`posted_at` timestamp,
	CONSTRAINT `content_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`platform` varchar(50) NOT NULL,
	`content_type` varchar(50) NOT NULL,
	`template` text NOT NULL,
	`example_output` text,
	`is_default` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cta_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`cta_text` varchar(500) NOT NULL,
	`cta_url` varchar(512) NOT NULL,
	`offer_type` enum('product','affiliate','lead_magnet','course') NOT NULL,
	`stripe_price_id` varchar(255),
	`affiliate_url` varchar(512),
	`weight` int NOT NULL DEFAULT 50,
	`platforms` text,
	`image_url` varchar(512),
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`revenue` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cta_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`day_number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`video_url` varchar(500),
	`slideshow_url` varchar(500),
	`workbook_url` varchar(500),
	`duration_minutes` int,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`platform` varchar(50) NOT NULL,
	`account_name` varchar(255),
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` timestamp,
	`platform_account_id` varchar(255),
	`status` enum('connected','disconnected','expired') NOT NULL DEFAULT 'connected',
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `content` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `video_script` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `heygen_job_id` varchar(255);--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `workbook_content` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `slide_pdf_url` varchar(512);--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `estimated_minutes` int;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(256);--> statement-breakpoint
ALTER TABLE `affiliate_referrals` ADD CONSTRAINT `affiliate_referrals_affiliate_id_affiliates_id_fk` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_referrals` ADD CONSTRAINT `affiliate_referrals_purchase_id_purchases_id_fk` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliates` ADD CONSTRAINT `affiliates_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_actions` ADD CONSTRAINT `agent_actions_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_reports` ADD CONSTRAINT `agent_reports_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_queue` ADD CONSTRAINT `content_queue_source_blog_post_id_blog_posts_id_fk` FOREIGN KEY (`source_blog_post_id`) REFERENCES `blog_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_queue` ADD CONSTRAINT `content_queue_cta_offer_id_cta_offers_id_fk` FOREIGN KEY (`cta_offer_id`) REFERENCES `cta_offers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_accounts` ADD CONSTRAINT `social_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;