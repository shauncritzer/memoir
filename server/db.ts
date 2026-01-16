import { eq, and, or, desc, sql } from "drizzle-orm";
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
  aiCoachUsers,
  AiCoachUser,
  InsertAiCoachUser
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


// Members & Purchases
export async function getUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { purchases, courseProgress } = await import("../drizzle/schema");
  
  // Get all purchases for user
  const userPurchases = await db
    .select()
    .from(purchases)
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.purchasedAt));
  
  // Calculate progress for each purchase
  const purchasesWithProgress = await Promise.all(
    userPurchases.map(async (purchase) => {
      // Get total lessons for this product
      const { courseModules, courseLessons } = await import("../drizzle/schema");
      
      const modules = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.productId, purchase.productId));
      
      if (modules.length === 0) {
        return { ...purchase, progress: 0 };
      }
      
      const moduleIds = modules.map(m => m.id);
      const lessons = await db
        .select()
        .from(courseLessons)
        .where(sql`${courseLessons.moduleId} IN (${moduleIds.join(",")})`);
      
      const totalLessons = lessons.length;
      
      if (totalLessons === 0) {
        return { ...purchase, progress: 0 };
      }
      
      // Get completed lessons
      const completed = await db
        .select()
        .from(courseProgress)
        .where(and(
          eq(courseProgress.userId, userId),
          eq(courseProgress.productId, purchase.productId),
          eq(courseProgress.completed, 1)
        ));
      
      const progress = Math.round((completed.length / totalLessons) * 100);
      
      return { ...purchase, progress };
    })
  );
  
  return purchasesWithProgress;
}

export async function checkCourseAccess(userId: number, productId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const { purchases } = await import("../drizzle/schema");
  
  const purchase = await db
    .select()
    .from(purchases)
    .where(and(
      eq(purchases.userId, userId),
      eq(purchases.productId, productId),
      eq(purchases.status, "completed")
    ))
    .limit(1);
  
  return purchase.length > 0;
}

export async function getCourseProgress(userId: number, productId: string) {
  const db = await getDb();
  if (!db) return { modules: [], progress: 0 };
  
  const { courseModules, courseLessons, courseProgress } = await import("../drizzle/schema");
  
  // Get all modules for this product
  const modules = await db
    .select()
    .from(courseModules)
    .where(eq(courseModules.productId, productId))
    .orderBy(courseModules.sortOrder);
  
  // Get all lessons for these modules
  const modulesWithLessons = await Promise.all(
    modules.map(async (module) => {
      const lessons = await db
        .select()
        .from(courseLessons)
        .where(eq(courseLessons.moduleId, module.id))
        .orderBy(courseLessons.sortOrder);
      
      // Get progress for each lesson
      const lessonsWithProgress = await Promise.all(
        lessons.map(async (lesson) => {
          const progress = await db
            .select()
            .from(courseProgress)
            .where(and(
              eq(courseProgress.userId, userId),
              eq(courseProgress.lessonId, lesson.id)
            ))
            .limit(1);
          
          return {
            ...lesson,
            completed: progress[0]?.completed === 1,
            completedAt: progress[0]?.completedAt,
            watchedSeconds: progress[0]?.watchedSeconds || 0,
          };
        })
      );
      
      return {
        ...module,
        lessons: lessonsWithProgress,
      };
    })
  );
  
  // Calculate overall progress
  const totalLessons = modulesWithLessons.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = modulesWithLessons.reduce(
    (sum, m) => sum + m.lessons.filter(l => l.completed).length,
    0
  );
  
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  return {
    modules: modulesWithLessons,
    progress,
    totalLessons,
    completedLessons,
  };
}

export async function markLessonComplete(userId: number, productId: string, lessonId: number) {
  const db = await getDb();
  if (!db) return { success: false };
  
  const { courseProgress } = await import("../drizzle/schema");
  
  // Check if progress record exists
  const existing = await db
    .select()
    .from(courseProgress)
    .where(and(
      eq(courseProgress.userId, userId),
      eq(courseProgress.lessonId, lessonId)
    ))
    .limit(1);
  
  if (existing[0]) {
    // Update existing record
    await db
      .update(courseProgress)
      .set({
        completed: 1,
        completedAt: new Date(),
      })
      .where(eq(courseProgress.id, existing[0].id));
  } else {
    // Create new progress record
    await db.insert(courseProgress).values({
      userId,
      productId,
      lessonId,
      completed: 1,
      completedAt: new Date(),
    });
  }
  
  return { success: true };
}


/**
 * Admin: Get all course lessons with module and product info
 */
export async function getAllCourseLessons() {
  const db = await getDb();
  if (!db) return [];
  
  const { courseLessons, courseModules } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const lessons = await db
    .select()
    .from(courseLessons)
    .leftJoin(courseModules, eq(courseLessons.moduleId, courseModules.id))
    .orderBy(courseLessons.sortOrder);
  
  // Map product IDs to names
  const productNames: Record<string, string> = {
    "7-day-reset": "7-Day Reset Course",
    "from-broken-to-whole": "From Broken to Whole Course",
    "memoir": "Crooked Lines: Bent, Not Broken",
    "bent-not-broken-circle": "Bent Not Broken Circle",
  };
  
  return lessons.map(row => ({
    ...row.course_lessons,
    module: {
      ...row.course_modules,
      product: {
        id: row.course_modules?.productId || "",
        name: productNames[row.course_modules?.productId || ""] || row.course_modules?.productId || "",
      },
    },
  }));
}

/**
 * Admin: Update lesson video URL and duration
 */
export async function updateLessonVideo(
  lessonId: number,
  videoUrl: string | null,
  videoDuration: number | null
) {
  const db = await getDb();
  if (!db) return { success: false };

  const { courseLessons } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  await db
    .update(courseLessons)
    .set({
      videoUrl,
      videoDuration,
    })
    .where(eq(courseLessons.id, lessonId));

  return { success: true };
}

/**
 * Get or create AI Coach user by email
 */
export async function getOrCreateAiCoachUser(email: string, initialMessageCount: number = 0): Promise<AiCoachUser | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check if user exists
    const existingUsers = await db
      .select()
      .from(aiCoachUsers)
      .where(eq(aiCoachUsers.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      return existingUsers[0];
    }

    // Create new user
    const [newUser] = await db
      .insert(aiCoachUsers)
      .values({
        email,
        messageCount: initialMessageCount,
        hasUnlimitedAccess: 0,
      });

    // Fetch the created user
    const createdUsers = await db
      .select()
      .from(aiCoachUsers)
      .where(eq(aiCoachUsers.email, email))
      .limit(1);

    return createdUsers[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get or create AI Coach user:", error);
    return null;
  }
}

/**
 * Get AI Coach user by email
 */
export async function getAiCoachUserByEmail(email: string): Promise<AiCoachUser | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const users = await db
      .select()
      .from(aiCoachUsers)
      .where(eq(aiCoachUsers.email, email))
      .limit(1);

    return users[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get AI Coach user:", error);
    return null;
  }
}

/**
 * Increment AI Coach message count for a user
 */
export async function incrementAiCoachMessageCount(email: string): Promise<AiCoachUser | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const user = await getAiCoachUserByEmail(email);
    if (!user) return null;

    // Don't increment if user has unlimited access
    if (user.hasUnlimitedAccess === 1) {
      return user;
    }

    await db
      .update(aiCoachUsers)
      .set({
        messageCount: user.messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(aiCoachUsers.email, email));

    return await getAiCoachUserByEmail(email);
  } catch (error) {
    console.error("[Database] Failed to increment message count:", error);
    return null;
  }
}

/**
 * Grant unlimited access to AI Coach user
 */
export async function grantAiCoachUnlimitedAccess(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(aiCoachUsers)
      .set({
        hasUnlimitedAccess: 1,
        updatedAt: new Date(),
      })
      .where(eq(aiCoachUsers.email, email));

    return true;
  } catch (error) {
    console.error("[Database] Failed to grant unlimited access:", error);
    return false;
  }
}

/**
 * Get course content (modules and lessons) for a product
 */
export async function getCourseContent(productId: string) {
  const db = await getDb();
  if (!db) return { modules: [], lessons: [] };

  const { courseModules, courseLessons } = await import("../drizzle/schema");

  // Get all modules for this product
  const modules = await db
    .select()
    .from(courseModules)
    .where(eq(courseModules.productId, productId))
    .orderBy(courseModules.sortOrder);

  // Get all lessons for these modules
  const moduleIds = modules.map(m => m.id);
  
  if (moduleIds.length === 0) {
    return { modules: [], lessons: [] };
  }

  const lessons = await db
    .select()
    .from(courseLessons)
    .where(
      moduleIds.length === 1
        ? eq(courseLessons.moduleId, moduleIds[0])
        : or(...moduleIds.map(id => eq(courseLessons.moduleId, id)))
    )
    .orderBy(courseLessons.sortOrder);

  return { modules, lessons };
}
