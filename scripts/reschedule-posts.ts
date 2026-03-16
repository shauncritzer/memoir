/**
 * Reschedule stuck posts from "failed" back to "ready" with proper future dates
 * Strategy: 1 Instagram + 1 Facebook per day, posted between 9-11 AM Eastern
 * 
 * Run: npx tsx scripts/reschedule-posts.ts
 */

import { getDb } from "../server/db";

async function rescheduleStuckPosts() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  const { contentQueue } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  // Get all "failed" posts (these are actually posts that hit daily limits and were rescheduled)
  const failedPosts = await db
    .select()
    .from(contentQueue)
    .where(eq(contentQueue.status, "failed"));

  console.log(`Found ${failedPosts.length} posts to reschedule`);

  let igCount = 0;
  let fbCount = 0;
  let otherCount = 0;

  for (const post of failedPosts) {
    let daysOffset = 0;
    let scheduledTime = new Date();

    if (post.platform === "instagram") {
      daysOffset = 1 + Math.floor(igCount / 1); // 1 Instagram per day starting tomorrow
      igCount++;
    } else if (post.platform === "facebook") {
      daysOffset = 1 + Math.floor(fbCount / 1); // 1 Facebook per day starting tomorrow
      fbCount++;
    } else {
      // Other platforms get generic rescheduling
      daysOffset = 1 + otherCount;
      otherCount++;
    }

    // Schedule between 9-11 AM Eastern (pick 10 AM + jitter)
    scheduledTime.setDate(scheduledTime.getDate() + daysOffset);
    scheduledTime.setHours(
      10 + Math.floor(Math.random() * 2), // 10 or 11 AM
      Math.floor(Math.random() * 60),     // random minute
      0,
      0
    );

    // Update post status to "ready" with new scheduled_for date
    await db
      .update(contentQueue)
      .set({
        status: "ready",
        scheduledFor: scheduledTime,
        errorMessage: null, // Clear the error message
      })
      .where(eq(contentQueue.id, post.id));

    console.log(
      `✓ Post #${post.id} (${post.platform}) → ready, scheduled for ${scheduledTime.toISOString()}`
    );
  }

  console.log(`\n✅ Rescheduled ${failedPosts.length} posts`);
  console.log(`   - Instagram: ${igCount} posts (1/day starting tomorrow)`);
  console.log(`   - Facebook: ${fbCount} posts (1/day starting tomorrow)`);
  console.log(`   - Other: ${otherCount} posts`);

  process.exit(0);
}

rescheduleStuckPosts().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
