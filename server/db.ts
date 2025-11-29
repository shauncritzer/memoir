import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  blogPosts,
  BlogPost,
  InsertBlogPost,
  emailSubscribers,
  EmailSubscriber,
  InsertEmailSubscriber,
  leadMagnets,
  LeadMagnet,
  InsertLeadMagnet,
  leadMagnetDownloads,
  InsertLeadMagnetDownload,
  products,
  Product,
  InsertProduct,
  orders,
  Order,
  InsertOrder,
  paymentEvents,
  PaymentEvent,
  InsertPaymentEvent
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Blog Posts
export async function getPublishedBlogPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  
  return result[0];
}

export async function createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(blogPosts).values(post);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, insertedId))
    .limit(1);
  
  return inserted[0]!;
}

export async function incrementBlogPostViews(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(blogPosts)
    .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
    .where(eq(blogPosts.id, id));
}

export async function updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(blogPosts)
    .set(updates)
    .where(eq(blogPosts.id, id));
  
  const updated = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  
  return updated[0]!;
}

export async function deleteBlogPost(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(blogPosts)
    .where(eq(blogPosts.id, id));
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));
}

// Email Subscribers
export async function createEmailSubscriber(subscriber: InsertEmailSubscriber): Promise<EmailSubscriber> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(emailSubscribers).values(subscriber);
    const insertedId = Number(result[0].insertId);
    
    const inserted = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.id, insertedId))
      .limit(1);
    
    return inserted[0]!;
  } catch (error) {
    // If duplicate email, return existing subscriber
    const existing = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.email, subscriber.email))
      .limit(1);
    
    if (existing[0]) {
      return existing[0];
    }
    
    throw error;
  }
}

export async function getEmailSubscriberByEmail(email: string): Promise<EmailSubscriber | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.email, email))
    .limit(1);
  
  return result[0];
}

// Lead Magnets
export async function getActiveleadMagnets(): Promise<LeadMagnet[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(leadMagnets)
    .where(eq(leadMagnets.status, "active"))
    .orderBy(desc(leadMagnets.createdAt));
}

export async function getLeadMagnetBySlug(slug: string): Promise<LeadMagnet | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(leadMagnets)
    .where(and(
      eq(leadMagnets.slug, slug),
      eq(leadMagnets.status, "active")
    ))
    .limit(1);
  
  return result[0];
}

export async function trackLeadMagnetDownload(download: InsertLeadMagnetDownload): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(leadMagnetDownloads).values(download);

  // Increment download count
  await db
    .update(leadMagnets)
    .set({ downloadCount: sql`${leadMagnets.downloadCount} + 1` })
    .where(eq(leadMagnets.id, download.leadMagnetId));
}

// Products
export async function getActiveProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(products)
    .where(eq(products.status, "active"))
    .orderBy(products.createdAt);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(and(
      eq(products.slug, slug),
      eq(products.status, "active")
    ))
    .limit(1);

  return result[0];
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return result[0];
}

export async function createProduct(product: InsertProduct): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(product);
  const insertedId = Number(result[0].insertId);

  const inserted = await db
    .select()
    .from(products)
    .where(eq(products.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

// Orders
export async function createOrder(order: InsertOrder): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(order);
  const insertedId = Number(result[0].insertId);

  const inserted = await db
    .select()
    .from(orders)
    .where(eq(orders.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getOrderBySessionId(sessionId: string): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, sessionId))
    .limit(1);

  return result[0];
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  return result[0];
}

export async function updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set(updates)
    .where(eq(orders.id, id));

  const updated = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  return updated[0]!;
}

// Payment Events
export async function createPaymentEvent(event: InsertPaymentEvent): Promise<PaymentEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(paymentEvents).values(event);
    const insertedId = Number(result[0].insertId);

    const inserted = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.id, insertedId))
      .limit(1);

    return inserted[0]!;
  } catch (error) {
    // If duplicate event, return existing
    const existing = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.stripeEventId, event.stripeEventId))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    throw error;
  }
}

export async function markPaymentEventProcessed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(paymentEvents)
    .set({
      processed: 1,
      processedAt: new Date()
    })
    .where(eq(paymentEvents.id, id));
}
