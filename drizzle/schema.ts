import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
