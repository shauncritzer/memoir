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
 * Products table for Stripe integrations
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: int("price").notNull(), // Price in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  stripeProductId: varchar("stripe_product_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  type: mysqlEnum("type", ["one_time", "recurring"]).default("one_time").notNull(),
  billingInterval: mysqlEnum("billing_interval", ["month", "year"]),
  coverImage: varchar("cover_image", { length: 512 }),
  features: text("features"), // JSON array of feature strings
  convertKitTagId: varchar("convertkit_tag_id", { length: 100 }), // Tag to apply on purchase
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Orders table
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  productId: int("product_id").notNull().references(() => products.id),
  email: varchar("email", { length: 320 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  amount: int("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  metadata: text("metadata"), // JSON for additional data
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Payment events table (for webhook tracking)
 */
export const paymentEvents = mysqlTable("payment_events", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").references(() => orders.id),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  stripeEventId: varchar("stripe_event_id", { length: 255 }).notNull().unique(),
  payload: text("payload").notNull(), // JSON payload from Stripe
  processed: int("processed").default(0).notNull(), // 0 = not processed, 1 = processed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PaymentEvent = typeof paymentEvents.$inferSelect;
export type InsertPaymentEvent = typeof paymentEvents.$inferInsert;