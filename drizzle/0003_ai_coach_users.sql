-- AI Coach Users Table Migration
-- Created: 2025-12-10
-- Purpose: Track AI Coach message counts and access levels for email-based counter system

CREATE TABLE `ai_coach_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(320) NOT NULL UNIQUE,
  `message_count` INT NOT NULL DEFAULT 0,
  `has_unlimited_access` INT NOT NULL DEFAULT 0 COMMENT '0 = false, 1 = true',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
