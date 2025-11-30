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
  fileUrl: varchar("file_url", { length: 512 }), // S3 URL for downloadable PDF version
  fileKey: varchar("file_key", { length: 512 }), // S3 key
  category: varchar("category", { length: 100 }),
  tags: text("tags"), // JSON array of tags
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  authorId: int("author_id").notNull().references(() => users.id),
  viewCount: int("view_count").default(0).notNull(),
  downloadCount: int("download_count").default(0).notNull(),
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
 * Blog post downloads tracking
 */
export const blogPostDownloads = mysqlTable("blog_post_downloads", {
  id: int("id").autoincrement().primaryKey(),
  blogPostId: int("blog_post_id").notNull().references(() => blogPosts.id),
  subscriberId: int("subscriber_id").references(() => emailSubscribers.id),
  email: varchar("email", { length: 320 }).notNull(),
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

export type BlogPostDownload = typeof blogPostDownloads.$inferSelect;
export type InsertBlogPostDownload = typeof blogPostDownloads.$inferInsert;