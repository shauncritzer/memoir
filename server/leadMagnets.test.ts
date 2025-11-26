import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { leadMagnets, emailSubscribers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("leadMagnets", () => {
  let testMagnetSlug: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get first lead magnet for testing
    const magnets = await db.select().from(leadMagnets).limit(1);
    if (magnets.length === 0) {
      throw new Error("No lead magnets found in database. Run seed script first.");
    }
    testMagnetSlug = magnets[0]!.slug;
  });

  it("lists all active lead magnets", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leadMagnets.list();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("slug");
    expect(result[0]).toHaveProperty("fileUrl");
    expect(result[0]?.status).toBe("active");
  });

  it("gets lead magnet by slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leadMagnets.getBySlug({ slug: testMagnetSlug });

    expect(result).toBeDefined();
    expect(result?.slug).toBe(testMagnetSlug);
    expect(result?.fileUrl).toBeDefined();
  });

  it("tracks download and creates subscriber", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const testEmail = `test-${Date.now()}@example.com`;

    const result = await caller.leadMagnets.download({
      slug: testMagnetSlug,
      email: testEmail,
    });

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toBeDefined();
    expect(result.leadMagnet).toBeDefined();

    // Verify subscriber was created
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subscriber = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.email, testEmail))
      .limit(1);

    expect(subscriber.length).toBe(1);
    expect(subscriber[0]?.email).toBe(testEmail);
    expect(subscriber[0]?.status).toBe("active");
  });
});

describe("email", () => {
  it("subscribes a new email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const testEmail = `subscriber-${Date.now()}@example.com`;

    const result = await caller.email.subscribe({
      email: testEmail,
      firstName: "Test",
      lastName: "User",
      source: "test",
    });

    expect(result.success).toBe(true);
    expect(result.subscriber).toBeDefined();
    expect(result.subscriber.email).toBe(testEmail);
    expect(result.subscriber.firstName).toBe("Test");
    expect(result.subscriber.status).toBe("active");
  });

  it("checks subscription status", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const testEmail = `check-${Date.now()}@example.com`;

    // First subscribe
    await caller.email.subscribe({
      email: testEmail,
      source: "test",
    });

    // Then check
    const result = await caller.email.checkSubscription({
      email: testEmail,
    });

    expect(result.isSubscribed).toBe(true);
    expect(result.subscriber).toBeDefined();
    expect(result.subscriber?.email).toBe(testEmail);
  });

  it("returns false for non-existent email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.email.checkSubscription({
      email: "nonexistent@example.com",
    });

    expect(result.isSubscribed).toBe(false);
    expect(result.subscriber).toBeUndefined();
  });
});
