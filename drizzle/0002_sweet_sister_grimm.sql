CREATE TABLE `course_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module_id` int NOT NULL,
	`lesson_number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`video_url` varchar(512),
	`video_provider` enum('vimeo','youtube','other') DEFAULT 'vimeo',
	`video_duration` int,
	`workbook_pdf_url` varchar(512),
	`sort_order` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` varchar(100) NOT NULL,
	`module_number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`unlock_day` int NOT NULL,
	`workbook_pdf_url` varchar(512),
	`sort_order` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`product_id` varchar(100) NOT NULL,
	`module_id` int,
	`lesson_id` int,
	`completed` int NOT NULL DEFAULT 0,
	`completed_at` timestamp,
	`watched_seconds` int DEFAULT 0,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`product_id` varchar(100) NOT NULL,
	`stripe_payment_id` varchar(255),
	`stripe_customer_id` varchar(255),
	`amount` int NOT NULL,
	`status` enum('pending','completed','refunded','cancelled') NOT NULL DEFAULT 'pending',
	`purchased_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`metadata` text,
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `course_lessons` ADD CONSTRAINT `course_lessons_module_id_course_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `course_modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_progress` ADD CONSTRAINT `course_progress_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_progress` ADD CONSTRAINT `course_progress_module_id_course_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `course_modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_progress` ADD CONSTRAINT `course_progress_lesson_id_course_lessons_id_fk` FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;