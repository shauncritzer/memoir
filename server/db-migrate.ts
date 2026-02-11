import { sql } from "drizzle-orm";
import { getDb } from "./db";

/**
 * Auto-migration: creates missing tables on server startup.
 * Uses CREATE TABLE IF NOT EXISTS so it's safe to run every time.
 */
export async function runAutoMigrations() {
  const db = await getDb();
  if (!db) {
    console.warn("[Migration] Database not available, skipping auto-migration");
    return;
  }

  console.log("[Migration] Checking for missing tables...");

  try {
    // 1. lessons table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id VARCHAR(255) NOT NULL,
        day_number INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500),
        slideshow_url VARCHAR(500),
        workbook_url VARCHAR(500),
        duration_minutes INT
      )
    `);

    // 2. cta_offers table (must be before content_queue due to FK reference)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cta_offers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cta_text VARCHAR(500) NOT NULL,
        cta_url VARCHAR(512) NOT NULL,
        offer_type ENUM('product', 'affiliate', 'lead_magnet', 'course') NOT NULL,
        stripe_price_id VARCHAR(255),
        affiliate_url VARCHAR(512),
        weight INT NOT NULL DEFAULT 50,
        platforms TEXT,
        image_url VARCHAR(512),
        status ENUM('active', 'paused') NOT NULL DEFAULT 'active',
        impressions INT NOT NULL DEFAULT 0,
        clicks INT NOT NULL DEFAULT 0,
        conversions INT NOT NULL DEFAULT 0,
        revenue INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 3. content_queue table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_queue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_blog_post_id INT,
        platform VARCHAR(50) NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        content TEXT,
        media_urls TEXT,
        scheduled_for TIMESTAMP NULL,
        status ENUM('pending', 'generating', 'ready', 'posting', 'posted', 'failed') NOT NULL DEFAULT 'pending',
        error_message TEXT,
        platform_post_id VARCHAR(255),
        platform_post_url VARCHAR(512),
        metrics TEXT,
        cta_offer_id INT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        posted_at TIMESTAMP NULL
      )
    `);

    // 4. social_accounts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        account_name VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP NULL,
        platform_account_id VARCHAR(255),
        status ENUM('connected', 'disconnected', 'expired') NOT NULL DEFAULT 'connected',
        metadata TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 5. affiliates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS affiliates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        referral_code VARCHAR(100) NOT NULL UNIQUE,
        commission_rate INT NOT NULL DEFAULT 30,
        payout_email VARCHAR(320),
        payout_method ENUM('paypal', 'stripe', 'bank_transfer') DEFAULT 'paypal',
        total_referrals INT NOT NULL DEFAULT 0,
        total_earnings INT NOT NULL DEFAULT 0,
        pending_payout INT NOT NULL DEFAULT 0,
        status ENUM('active', 'paused', 'banned') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 6. affiliate_referrals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS affiliate_referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        affiliate_id INT NOT NULL,
        visitor_ip VARCHAR(45),
        landing_page VARCHAR(512),
        converted INT NOT NULL DEFAULT 0,
        purchase_id INT,
        commission_amount INT DEFAULT 0,
        status ENUM('clicked', 'converted', 'paid') NOT NULL DEFAULT 'clicked',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. content_templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        template TEXT NOT NULL,
        example_output TEXT,
        is_default INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("[Migration] All tables verified/created successfully");
  } catch (error) {
    console.error("[Migration] Error during auto-migration:", error);
  }
}
