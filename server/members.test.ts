import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getUserPurchases,
  checkCourseAccess,
  getCourseProgress,
  markLessonComplete,
} from "./db";
import { getDb } from "./db";
import { users, purchases, courseModules, courseLessons, courseProgress } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Members Portal & Course Delivery", () => {
  let testUserId: number;
  let testModuleId: number;
  let testLessonId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test_member_${Date.now()}`,
      email: `test_member_${Date.now()}@example.com`,
      name: "Test Member",
      loginMethod: "email",
      role: "user",
      lastSignedIn: new Date(),
    });
    testUserId = Number(userResult[0].insertId);

    // Create test purchase
    await db.insert(purchases).values({
      userId: testUserId,
      productId: "7-day-reset",
      stripePaymentId: `test_payment_${Date.now()}`,
      stripeCustomerId: `test_customer_${Date.now()}`,
      amount: 2700,
      status: "completed",
      purchasedAt: new Date(),
    });

    // Create test module
    const moduleResult = await db.insert(courseModules).values({
      productId: "7-day-reset",
      moduleNumber: 1,
      title: "Day 1: Honesty",
      description: "Test module",
      sortOrder: 1,
      unlockDay: 1,
    });
    testModuleId = Number(moduleResult[0].insertId);

    // Create test lesson
    const lessonResult = await db.insert(courseLessons).values({
      moduleId: testModuleId,
      lessonNumber: 1,
      title: "Welcome Video",
      description: "Test lesson",
      videoUrl: "https://vimeo.com/test",
      sortOrder: 1,
      durationSeconds: 300,
    });
    testLessonId = Number(lessonResult[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(courseProgress).where(eq(courseProgress.userId, testUserId));
    await db.delete(courseLessons).where(eq(courseLessons.id, testLessonId));
    await db.delete(courseModules).where(eq(courseModules.id, testModuleId));
    await db.delete(purchases).where(eq(purchases.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should get user purchases", async () => {
    const result = await getUserPurchases(testUserId);
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].productId).toBe("7-day-reset");
    expect(result[0].status).toBe("completed");
  });

  it("should check course access for purchased product", async () => {
    const hasAccess = await checkCourseAccess(testUserId, "7-day-reset");
    
    expect(hasAccess).toBe(true);
  });

  it("should deny course access for non-purchased product", async () => {
    const hasAccess = await checkCourseAccess(testUserId, "from-broken-to-whole");
    
    expect(hasAccess).toBe(false);
  });

  it("should get course progress", async () => {
    const result = await getCourseProgress(testUserId, "7-day-reset");
    
    expect(result).toBeDefined();
    expect(result.modules).toBeDefined();
    expect(result.modules.length).toBeGreaterThan(0);
    expect(result.progress).toBe(0); // No lessons completed yet
  });

  it("should mark lesson as complete", async () => {
    const result = await markLessonComplete(testUserId, "7-day-reset", testLessonId);
    
    expect(result.success).toBe(true);

    // Verify progress was updated
    const progress = await getCourseProgress(testUserId, "7-day-reset");
    expect(progress.completedLessons).toBe(1);
    expect(progress.progress).toBeGreaterThan(0);
  });

  it("should handle marking same lesson complete twice", async () => {
    // Mark complete first time
    await markLessonComplete(testUserId, "7-day-reset", testLessonId);
    
    // Mark complete second time (should update, not create duplicate)
    const result = await markLessonComplete(testUserId, "7-day-reset", testLessonId);
    
    expect(result.success).toBe(true);

    // Verify only one progress record exists
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const records = await db
      .select()
      .from(courseProgress)
      .where(and(
        eq(courseProgress.userId, testUserId),
        eq(courseProgress.lessonId, testLessonId)
      ));

    expect(records.length).toBe(1);
  });
});
