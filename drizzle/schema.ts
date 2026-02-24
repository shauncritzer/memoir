import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  /** Scrypt password hash (salt:hash). Null for OAuth-only or Stripe-created users until they set a password. */
  passwordHash: varchar("passwordHash", { length: 256 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Blog posts table
 */
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: varchar("cover_image", { length: 512 }),
  category: varchar("category", { length: 100 }),
  tags: text("tags"), // JSON array of tags
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  authorId: int("author_id").notNull().references(() => users.id),
  viewCount: int("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Email subscribers table
 */
export const emailSubscribers = mysqlTable("email_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  source: varchar("source", { length: 100 }), // Where they signed up from
  status: mysqlEnum("status", ["active", "unsubscribed", "bounced"]).default("active").notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  tags: text("tags"), // JSON array of tags for segmentation
  metadata: text("metadata"), // JSON for additional data
});

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = typeof emailSubscribers.$inferInsert;

/**
 * Lead magnets / digital products table
 */
export const leadMagnets = mysqlTable("lead_magnets", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  fileUrl: varchar("file_url", { length: 512 }), // S3 URL
  fileKey: varchar("file_key", { length: 512 }), // S3 key
  coverImage: varchar("cover_image", { length: 512 }),
  type: mysqlEnum("type", ["pdf", "video", "audio", "course", "other"]).notNull(),
  isPaid: int("is_paid").default(0).notNull(), // 0 = free, 1 = paid
  price: int("price").default(0).notNull(), // Price in cents
  downloadCount: int("download_count").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LeadMagnet = typeof leadMagnets.$inferSelect;
export type InsertLeadMagnet = typeof leadMagnets.$inferInsert;

/**
 * Lead magnet downloads tracking
 */
export const leadMagnetDownloads = mysqlTable("lead_magnet_downloads", {
  id: int("id").autoincrement().primaryKey(),
  leadMagnetId: int("lead_magnet_id").notNull().references(() => leadMagnets.id),
  subscriberId: int("subscriber_id").references(() => emailSubscribers.id),
  email: varchar("email", { length: 320 }).notNull(),
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

export type LeadMagnetDownload = typeof leadMagnetDownloads.$inferSelect;
export type InsertLeadMagnetDownload = typeof leadMagnetDownloads.$inferInsert;

/**
 * Purchases table - tracks product purchases
 */
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  productId: varchar("product_id", { length: 100 }).notNull(), // "7-day-reset", "from-broken-to-whole", "bent-not-broken-circle"
  stripePaymentId: varchar("stripe_payment_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  amount: int("amount").notNull(), // Price in cents
  status: mysqlEnum("status", ["pending", "completed", "refunded", "cancelled"]).default("pending").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // For subscriptions
  metadata: text("metadata"), // JSON for additional data
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Course modules table - stores module information
 */
export const courseModules = mysqlTable("course_modules", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("product_id", { length: 100 }).notNull(), // "7-day-reset" or "from-broken-to-whole"
  moduleNumber: int("module_number").notNull(), // 1-8
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  unlockDay: int("unlock_day").notNull(), // Day 1, Day 2, etc. for drip content
  workbookPdfUrl: varchar("workbook_pdf_url", { length: 512 }), // S3 URL for downloadable PDF
  sortOrder: int("sort_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = typeof courseModules.$inferInsert;

/**
 * Course lessons table - stores individual lesson details
 */
export const courseLessons = mysqlTable("course_lessons", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("module_id").notNull().references(() => courseModules.id),
  lessonNumber: int("lesson_number").notNull(), // 1, 2, 3, etc. within module
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("video_url", { length: 512 }), // Vimeo or YouTube URL
  videoProvider: mysqlEnum("video_provider", ["vimeo", "youtube", "other"]).default("vimeo"),
  videoDuration: int("video_duration"), // Duration in seconds
  workbookPdfUrl: varchar("workbook_pdf_url", { length: 512 }), // Optional lesson-specific PDF
  slidePdfUrl: varchar("slide_pdf_url", { length: 512 }), // Optional slideshow PDF
  sortOrder: int("sort_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = typeof courseLessons.$inferInsert;

/**
 * Course progress table - tracks user completion
 */
export const courseProgress = mysqlTable("course_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  productId: varchar("product_id", { length: 100 }).notNull(),
  moduleId: int("module_id").references(() => courseModules.id),
  lessonId: int("lesson_id").references(() => courseLessons.id),
  completed: int("completed").default(0).notNull(), // 0 = not completed, 1 = completed
  completedAt: timestamp("completed_at"),
  watchedSeconds: int("watched_seconds").default(0), // Track video progress
  notes: text("notes"), // User's personal notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CourseProgress = typeof courseProgress.$inferSelect;
export type InsertCourseProgress = typeof courseProgress.$inferInsert;

/**
 * AI Coach users table - tracks message counts and access levels
 */
export const aiCoachUsers = mysqlTable("ai_coach_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  messageCount: int("message_count").default(0).notNull(),
  hasUnlimitedAccess: int("has_unlimited_access").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AiCoachUser = typeof aiCoachUsers.$inferSelect;
export type InsertAiCoachUser = typeof aiCoachUsers.$inferInsert;

/**
 * Lessons table - simplified flat structure for 7-Day REWIRED Reset
 */
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  dayNumber: int("day_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("video_url", { length: 500 }),
  slideshowUrl: varchar("slideshow_url", { length: 500 }),
  workbookUrl: varchar("workbook_url", { length: 500 }),
  durationMinutes: int("duration_minutes"),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

// ============================================================
// CONTENT PIPELINE - Agentic Content Creation & Distribution
// ============================================================

/**
 * Content queue - items waiting to be generated/posted
 * A blog post generates multiple queue items (X thread, IG post, etc.)
 */
export const contentQueue = mysqlTable("content_queue", {
  id: int("id").autoincrement().primaryKey(),
  /** Link to source blog post (optional - content can be standalone) */
  sourceBlogPostId: int("source_blog_post_id").references(() => blogPosts.id),
  /** Platform: x, instagram, linkedin, facebook, youtube, tiktok, podcast */
  platform: varchar("platform", { length: 50 }).notNull(),
  /** Type of content for this platform */
  contentType: varchar("content_type", { length: 50 }).notNull(), // thread, reel, post, article, video, audio
  /** The actual content/copy to post */
  content: text("content"),
  /** Generated media URLs (images, video, audio) - JSON array */
  mediaUrls: text("media_urls"), // JSON: ["https://..."]
  /** Scheduling */
  scheduledFor: timestamp("scheduled_for"),
  /** Processing status */
  status: mysqlEnum("status", ["pending", "generating", "ready", "posting", "posted", "failed"]).default("pending").notNull(),
  /** Error message if failed */
  errorMessage: text("error_message"),
  /** Platform post ID after successful posting */
  platformPostId: varchar("platform_post_id", { length: 255 }),
  /** Platform post URL */
  platformPostUrl: varchar("platform_post_url", { length: 512 }),
  /** Engagement metrics (updated periodically) - JSON */
  metrics: text("metrics"), // JSON: { likes, shares, comments, views, clicks }
  /** Which CTA offer was attached to this post */
  ctaOfferId: int("cta_offer_id").references(() => ctaOffers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  postedAt: timestamp("posted_at"),
});

export type ContentQueueItem = typeof contentQueue.$inferSelect;
export type InsertContentQueueItem = typeof contentQueue.$inferInsert;

/**
 * CTA Offers - Rotating calls-to-action for monetization
 */
export const ctaOffers = mysqlTable("cta_offers", {
  id: int("id").autoincrement().primaryKey(),
  /** Display name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Short description */
  description: text("description"),
  /** The actual CTA text shown to users */
  ctaText: varchar("cta_text", { length: 500 }).notNull(),
  /** Where the CTA links to */
  ctaUrl: varchar("cta_url", { length: 512 }).notNull(),
  /** Type: product, affiliate, lead_magnet, course */
  offerType: mysqlEnum("offer_type", ["product", "affiliate", "lead_magnet", "course"]).notNull(),
  /** Stripe price ID if applicable */
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  /** Affiliate program link if applicable */
  affiliateUrl: varchar("affiliate_url", { length: 512 }),
  /** Rotation weight (higher = shown more often) */
  weight: int("weight").default(50).notNull(),
  /** Which platforms to show this on - JSON array */
  platforms: text("platforms"), // JSON: ["x", "instagram", "blog"]
  /** Image URL for the offer */
  imageUrl: varchar("image_url", { length: 512 }),
  /** Active or paused */
  status: mysqlEnum("status", ["active", "paused"]).default("active").notNull(),
  /** Tracking: impressions and clicks */
  impressions: int("impressions").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  revenue: int("revenue").default(0).notNull(), // cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CtaOffer = typeof ctaOffers.$inferSelect;
export type InsertCtaOffer = typeof ctaOffers.$inferInsert;

/**
 * Social accounts - Connected social media accounts
 */
export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner user */
  userId: int("user_id").notNull().references(() => users.id),
  /** Platform name */
  platform: varchar("platform", { length: 50 }).notNull(),
  /** Account username/handle on the platform */
  accountName: varchar("account_name", { length: 255 }),
  /** OAuth access token (encrypted in production) */
  accessToken: text("access_token"),
  /** OAuth refresh token */
  refreshToken: text("refresh_token"),
  /** Token expiry */
  tokenExpiresAt: timestamp("token_expires_at"),
  /** Platform-specific account/page ID */
  platformAccountId: varchar("platform_account_id", { length: 255 }),
  /** Status */
  status: mysqlEnum("status", ["connected", "disconnected", "expired"]).default("connected").notNull(),
  /** Account metadata - JSON */
  metadata: text("metadata"), // JSON: { followers, bio, etc. }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;

// ============================================================
// AFFILIATE SYSTEM
// ============================================================

/**
 * Affiliates - People who promote your products for commission
 */
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  /** Link to user account */
  userId: int("user_id").notNull().references(() => users.id),
  /** Unique referral code (e.g., "shaun", "coach-mike") */
  referralCode: varchar("referral_code", { length: 100 }).notNull().unique(),
  /** Commission rate as percentage (e.g., 30 = 30%) */
  commissionRate: int("commission_rate").default(30).notNull(),
  /** Payment method/details */
  payoutEmail: varchar("payout_email", { length: 320 }),
  payoutMethod: mysqlEnum("payout_method", ["paypal", "stripe", "bank_transfer"]).default("paypal"),
  /** Stats */
  totalReferrals: int("total_referrals").default(0).notNull(),
  totalEarnings: int("total_earnings").default(0).notNull(), // cents
  pendingPayout: int("pending_payout").default(0).notNull(), // cents
  /** Status */
  status: mysqlEnum("status", ["active", "paused", "banned"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

/**
 * Affiliate referrals - Tracks each click/visit from affiliate links
 */
export const affiliateReferrals = mysqlTable("affiliate_referrals", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliate_id").notNull().references(() => affiliates.id),
  /** Visitor fingerprint for attribution */
  visitorIp: varchar("visitor_ip", { length: 45 }),
  /** Which page they landed on */
  landingPage: varchar("landing_page", { length: 512 }),
  /** Did they convert? */
  converted: int("converted").default(0).notNull(),
  /** Link to purchase if converted */
  purchaseId: int("purchase_id").references(() => purchases.id),
  /** Commission earned on this referral (cents) */
  commissionAmount: int("commission_amount").default(0),
  /** Status */
  status: mysqlEnum("status", ["clicked", "converted", "paid"]).default("clicked").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type InsertAffiliateReferral = typeof affiliateReferrals.$inferInsert;

/**
 * Content templates - Reusable templates for generating platform-specific content
 */
export const contentTemplates = mysqlTable("content_templates", {
  id: int("id").autoincrement().primaryKey(),
  /** Template name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Which platform this template is for */
  platform: varchar("platform", { length: 50 }).notNull(),
  /** Content type */
  contentType: varchar("content_type", { length: 50 }).notNull(),
  /** The prompt/template with {{variables}} */
  template: text("template").notNull(),
  /** Example output */
  exampleOutput: text("example_output"),
  /** Is this the default template for this platform+type combo */
  isDefault: int("is_default").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;

// ============================================================
// MULTI-BUSINESS AGENT SYSTEM (DataDisco Core)
// ============================================================

/**
 * Businesses - Each business the agent manages
 * shauncritzer.com, critzerscabinets.com, DataDisco SaaS, etc.
 */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique slug: "sober-strong", "critzer-cabinets", "datadisco" */
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  /** Display name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Primary domain */
  domain: varchar("domain", { length: 255 }),
  /** Business type: coaching, services, saas, ecommerce, personal_brand */
  businessType: varchar("business_type", { length: 50 }).notNull(),
  /** Brand voice description for AI content generation */
  brandVoice: text("brand_voice"),
  /** Target audience description */
  targetAudience: text("target_audience"),
  /** Products/services JSON: [{ name, price, url, description }] */
  products: text("products"),
  /** Connected social platform configs - JSON */
  socialConfig: text("social_config"),
  /** Stripe account ID (for invoicing/payments) */
  stripeAccountId: varchar("stripe_account_id", { length: 255 }),
  /** Daily spending budget in cents */
  dailyBudget: int("daily_budget").default(0).notNull(),
  /** Monthly spending budget in cents */
  monthlyBudget: int("monthly_budget").default(0).notNull(),
  /** Amount spent today in cents */
  spentToday: int("spent_today").default(0).notNull(),
  /** Amount spent this month in cents */
  spentMonth: int("spent_month").default(0).notNull(),
  /** Active or paused */
  status: mysqlEnum("status", ["active", "paused", "setup"]).default("setup").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Agent Actions - Every action the agent takes or proposes
 * Risk tiers: 1 = auto-execute, 2 = execute + notify, 3 = ask first, 4 = must approve
 */
export const agentActions = mysqlTable("agent_actions", {
  id: int("id").autoincrement().primaryKey(),
  /** Which business this action is for */
  businessId: int("business_id").references(() => businesses.id),
  /** Action category: content, social, email, invoice, ad_spend, system, strategy */
  category: varchar("category", { length: 50 }).notNull(),
  /** Human-readable action description */
  title: varchar("title", { length: 255 }).notNull(),
  /** Detailed description of what the agent wants to do */
  description: text("description"),
  /** Risk tier 1-4 */
  riskTier: int("risk_tier").default(1).notNull(),
  /** Status: proposed, approved, executing, executed, denied, failed */
  status: mysqlEnum("status", ["proposed", "approved", "executing", "executed", "denied", "failed"]).default("proposed").notNull(),
  /** Estimated cost in cents (0 for free actions) */
  costEstimate: int("cost_estimate").default(0).notNull(),
  /** Actual cost after execution */
  actualCost: int("actual_cost").default(0),
  /** Result/output after execution - JSON or text */
  result: text("result"),
  /** Error message if failed */
  errorMessage: text("error_message"),
  /** JSON metadata for action-specific data */
  metadata: text("metadata"),
  /** When it was approved (if applicable) */
  approvedAt: timestamp("approved_at"),
  /** When it was executed */
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AgentAction = typeof agentActions.$inferSelect;
export type InsertAgentAction = typeof agentActions.$inferInsert;

/**
 * Agent Reports - Daily/weekly briefings generated by the agent
 */
export const agentReports = mysqlTable("agent_reports", {
  id: int("id").autoincrement().primaryKey(),
  /** Report type: daily_briefing, weekly_summary, alert, idea */
  reportType: varchar("report_type", { length: 50 }).notNull(),
  /** Which business (null = cross-business report) */
  businessId: int("business_id").references(() => businesses.id),
  /** Report title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Full report content (markdown) */
  content: text("content").notNull(),
  /** Key metrics snapshot - JSON */
  metrics: text("metrics"),
  /** Suggested actions - JSON array */
  suggestedActions: text("suggested_actions"),
  /** Has the user read this? */
  isRead: int("is_read").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgentReport = typeof agentReports.$inferSelect;
export type InsertAgentReport = typeof agentReports.$inferInsert;
