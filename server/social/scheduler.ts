import cron, { type ScheduledTask } from "node-cron";
import { getDb } from "../db";
import { postTweet, postThread, getTweetMetrics } from "./twitter";
import { postToFacebookPage, postLinkToFacebookPage, postToInstagram, postTextToInstagram, getFacebookPostMetrics } from "./meta";
import { postToLinkedIn, isLinkedInConfigured, getLinkedInPostMetrics } from "./linkedin";
import { isYouTubeConfigured, getVideoMetrics as getYouTubeVideoMetrics, uploadVideo as uploadYouTubeVideo } from "./youtube";
import { isHeyGenConfigured, scriptToVideo } from "./heygen";
import { generateContentForPlatform } from "./content-generator";

/** Add time jitter to avoid exact posting times (+-5 minutes) */
function getJitterMs(): number {
  // Random jitter between -5 and +5 minutes
  return (Math.random() - 0.5) * 2 * 5 * 60 * 1000;
}

/** Check if a scheduled time is due (within a 2-minute window) */
function isDue(scheduledFor: Date): boolean {
  const now = Date.now();
  const scheduled = scheduledFor.getTime();
  const windowMs = 2 * 60 * 1000; // 2-minute window
  return now >= scheduled - windowMs && now <= scheduled + windowMs;
}

/** Process pending content generation */
async function processContentGeneration() {
  const db = await getDb();
  if (!db) return;

  const { contentQueue, blogPosts, ctaOffers } = await import("../../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  // Find items that need content generation
  const pendingItems = await db
    .select()
    .from(contentQueue)
    .where(eq(contentQueue.status, "pending"))
    .limit(5);

  for (const item of pendingItems) {
    try {
      // Mark as generating
      await db.update(contentQueue)
        .set({ status: "generating" })
        .where(eq(contentQueue.id, item.id));

      // Get source blog post if linked
      let blogTitle: string | undefined;
      let blogContent: string | undefined;
      if (item.sourceBlogPostId) {
        const posts = await db.select().from(blogPosts)
          .where(eq(blogPosts.id, item.sourceBlogPostId)).limit(1);
        if (posts.length > 0) {
          blogTitle = posts[0].title;
          blogContent = posts[0].content;
        }
      }

      // Get CTA offer - use linked one or auto-select via weighted rotation
      let ctaText: string | undefined;
      let ctaUrl: string | undefined;
      if (item.ctaOfferId) {
        const offers = await db.select().from(ctaOffers)
          .where(eq(ctaOffers.id, item.ctaOfferId)).limit(1);
        if (offers.length > 0) {
          ctaText = offers[0].ctaText;
          ctaUrl = offers[0].ctaUrl;
        }
      } else {
        // Auto-select a CTA offer via weighted rotation
        const activeOffers = await db.select().from(ctaOffers)
          .where(eq(ctaOffers.status, "active"));
        if (activeOffers.length > 0) {
          const platformOffers = activeOffers.filter(o => {
            try {
              const platforms = o.platforms ? JSON.parse(o.platforms) : [];
              return platforms.includes(item.platform) || platforms.includes("all");
            } catch { return false; }
          });
          const pool = platformOffers.length > 0 ? platformOffers : activeOffers;
          const totalWeight = pool.reduce((sum, o) => sum + o.weight, 0);
          let random = Math.random() * totalWeight;
          for (const offer of pool) {
            random -= offer.weight;
            if (random <= 0) {
              ctaText = offer.ctaText;
              ctaUrl = offer.ctaUrl;
              // Link the CTA to the queue item
              await db.update(contentQueue).set({ ctaOfferId: offer.id }).where(eq(contentQueue.id, item.id));
              break;
            }
          }
        }
      }

      // Generate content
      const generated = await generateContentForPlatform({
        platform: item.platform,
        sourceBlogTitle: blogTitle,
        sourceBlogContent: blogContent,
        ctaText,
        ctaUrl,
      });

      // Auto-generate image with DALL-E 3 if configured
      let generatedImageUrl: string | undefined;
      if (generated.suggestedMediaType !== "none" && generated.suggestedMediaPrompt) {
        try {
          const { generatePostImage } = await import("./image-generator");
          const imgResult = await generatePostImage({
            content: generated.content,
            platform: item.platform,
            suggestedMediaPrompt: generated.suggestedMediaPrompt,
          });
          if (imgResult.success && imgResult.imageUrl) {
            generatedImageUrl = imgResult.imageUrl;
          }
        } catch (err) {
          console.warn(`[Scheduler] Image generation failed for queue item #${item.id}:`, err);
        }
      }

      // Update the queue item with generated content + image
      await db.update(contentQueue).set({
        content: generated.content,
        status: "ready",
        mediaUrls: JSON.stringify({
          suggestedMediaType: generated.suggestedMediaType,
          suggestedMediaPrompt: generated.suggestedMediaPrompt,
          suggestedTools: generated.suggestedTools,
          hashtags: generated.hashtags,
          generatedImageUrl,
        }),
      }).where(eq(contentQueue.id, item.id));

      console.log(`[Scheduler] Generated content for ${item.platform} (queue item #${item.id})`);
    } catch (err: any) {
      console.error(`[Scheduler] Failed to generate content for queue item #${item.id}:`, err.message);
      await db.update(contentQueue).set({
        status: "failed",
        errorMessage: err.message,
      }).where(eq(contentQueue.id, item.id));
    }
  }
}

/** Process ready items that are scheduled to post */
async function processScheduledPosts() {
  const db = await getDb();
  if (!db) return;

  const { contentQueue } = await import("../../drizzle/schema");
  const { eq, and, lte, isNotNull } = await import("drizzle-orm");

  // Find items that are ready and have a scheduled time that has passed
  const now = new Date();
  const readyItems = await db
    .select()
    .from(contentQueue)
    .where(
      and(
        eq(contentQueue.status, "ready"),
        isNotNull(contentQueue.scheduledFor),
        lte(contentQueue.scheduledFor, now),
      )
    )
    .limit(3);

  for (const item of readyItems) {
    if (!item.content) continue;

    await postContentItem(item);
  }
}

/** Post a single content queue item to its platform */
async function postContentItem(item: {
  id: number;
  platform: string;
  contentType: string;
  content: string | null;
  mediaUrls: string | null;
}) {
  if (!item.content) return;

  const db = await getDb();
  if (!db) return;

  const { contentQueue } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  // Mark as posting
  await db.update(contentQueue)
    .set({ status: "posting" })
    .where(eq(contentQueue.id, item.id));

  try {
    let result: { success: boolean; tweetId?: string; tweetUrl?: string; error?: string } = {
      success: false,
      error: "Platform not yet supported",
    };

    switch (item.platform) {
      case "x": {
        if (item.contentType === "thread" && item.content.includes("|||TWEET_BREAK|||")) {
          const tweets = item.content.split("|||TWEET_BREAK|||").map(t => t.trim()).filter(Boolean);
          result = await postThread(tweets);
        } else {
          // For single tweet, truncate to 280 chars if needed
          const tweetText = item.content.length > 280
            ? item.content.substring(0, 277) + "..."
            : item.content;
          result = await postTweet(tweetText);
        }
        break;
      }
      case "facebook": {
        // Check for generated image to post as a link/photo post
        let fbImageUrl = "";
        if (item.mediaUrls) {
          try {
            const media = JSON.parse(item.mediaUrls);
            fbImageUrl = media.generatedImageUrl || media.imageUrl || "";
          } catch {}
        }
        const fbResult = fbImageUrl
          ? await postLinkToFacebookPage(item.content, fbImageUrl)
          : await postToFacebookPage(item.content);
        result = {
          success: fbResult.success,
          tweetId: fbResult.postId,
          tweetUrl: fbResult.postUrl,
          error: fbResult.error,
        };
        break;
      }
      case "instagram": {
        // Instagram requires an image URL — check mediaUrls for generated or provided image
        let imageUrl = "";
        if (item.mediaUrls) {
          try {
            const media = JSON.parse(item.mediaUrls);
            imageUrl = media.generatedImageUrl || media.imageUrl || media.image_url || "";
          } catch {}
        }
        if (imageUrl) {
          const igResult = await postToInstagram(item.content, imageUrl);
          result = {
            success: igResult.success,
            tweetId: igResult.postId,
            tweetUrl: igResult.postUrl,
            error: igResult.error,
          };
        } else {
          const igResult = await postTextToInstagram(item.content);
          result = {
            success: igResult.success,
            tweetId: igResult.postId,
            tweetUrl: igResult.postUrl,
            error: igResult.error,
          };
        }
        break;
      }
      case "linkedin": {
        if (!isLinkedInConfigured()) {
          result = { success: false, error: "LinkedIn credentials not configured" };
          await db.update(contentQueue)
            .set({ status: "ready", errorMessage: result.error })
            .where(eq(contentQueue.id, item.id));
          return;
        }
        const linkedInContent = item.content || "";
        const liResult = await postToLinkedIn(linkedInContent);
        result = {
          success: liResult.success,
          tweetId: liResult.postId,
          tweetUrl: liResult.postUrl,
          error: liResult.error,
        };
        break;
      }
      case "youtube": {
        if (!isYouTubeConfigured()) {
          result = { success: false, error: "YouTube credentials not configured - visit /api/youtube/connect to authorize" };
          await db.update(contentQueue)
            .set({ status: "ready", errorMessage: result.error })
            .where(eq(contentQueue.id, item.id));
          return;
        }

        // Parse media metadata for hashtags/title
        let mediaData: any = {};
        try { mediaData = item.mediaUrls ? JSON.parse(item.mediaUrls) : {}; } catch {}
        const hashtags = mediaData.hashtags || "";
        const tags = hashtags.split(/[#,\s]+/).filter((t: string) => t.length > 0);

        // Try HeyGen → YouTube pipeline if HeyGen is configured
        if (isHeyGenConfigured()) {
          try {
            const scriptContent = item.content || "";
            const videoTitle = scriptContent.substring(0, 80).split("\n")[0] || "Recovery Journey";
            const pipelineResult = await scriptToVideo({
              script: scriptContent.substring(0, 3000),
              title: videoTitle,
              description: scriptContent + "\n\n" + hashtags,
              uploadToYouTube: true,
              youTubeTags: tags.slice(0, 15),
            });

            if (pipelineResult.youtubeVideoId) {
              result = {
                success: true,
                tweetId: pipelineResult.youtubeVideoId,
                tweetUrl: pipelineResult.youtubeVideoUrl,
              };
              break;
            } else {
              result = { success: false, error: pipelineResult.error || "HeyGen video generation failed" };
            }
          } catch (err: any) {
            console.error(`[Scheduler] HeyGen→YouTube pipeline failed:`, err.message);
            result = { success: false, error: `HeyGen pipeline error: ${err.message}` };
          }
        } else {
          result = { success: false, error: "YouTube content ready — video upload required. Configure HeyGen for auto video generation, or use admin panel to upload manually." };
          await db.update(contentQueue)
            .set({ status: "ready", errorMessage: result.error })
            .where(eq(contentQueue.id, item.id));
          return;
        }
        break;
      }
      // Future platforms
      case "tiktok":
      case "podcast": {
        result = { success: false, error: `${item.platform} posting not yet implemented - content is ready for manual posting` };
        // Don't mark as failed - keep as ready so user can manually post
        await db.update(contentQueue)
          .set({ status: "ready", errorMessage: result.error })
          .where(eq(contentQueue.id, item.id));
        return;
      }
    }

    if (result.success) {
      await db.update(contentQueue).set({
        status: "posted",
        platformPostId: result.tweetId,
        platformPostUrl: result.tweetUrl,
        postedAt: new Date(),
        errorMessage: null,
      }).where(eq(contentQueue.id, item.id));
      console.log(`[Scheduler] Posted to ${item.platform}: ${result.tweetUrl}`);
    } else {
      await db.update(contentQueue).set({
        status: "failed",
        errorMessage: result.error,
      }).where(eq(contentQueue.id, item.id));
      console.error(`[Scheduler] Failed to post to ${item.platform}: ${result.error}`);
    }
  } catch (err: any) {
    await db.update(contentQueue).set({
      status: "failed",
      errorMessage: err.message,
    }).where(eq(contentQueue.id, item.id));
    console.error(`[Scheduler] Error posting to ${item.platform}:`, err.message);
  }
}

/** Update engagement metrics for recently posted items */
async function updateEngagementMetrics() {
  const db = await getDb();
  if (!db) return;

  const { contentQueue } = await import("../../drizzle/schema");
  const { eq, and, isNotNull } = await import("drizzle-orm");

  // Get posted items with a platformPostId (X and Facebook)
  const { or } = await import("drizzle-orm");
  const postedItems = await db
    .select()
    .from(contentQueue)
    .where(
      and(
        eq(contentQueue.status, "posted"),
        or(eq(contentQueue.platform, "x"), eq(contentQueue.platform, "facebook"), eq(contentQueue.platform, "youtube")),
        isNotNull(contentQueue.platformPostId),
      )
    )
    .limit(10);

  for (const item of postedItems) {
    if (!item.platformPostId) continue;

    if (item.platform === "x") {
      const metrics = await getTweetMetrics(item.platformPostId);
      if (metrics) {
        await db.update(contentQueue).set({
          metrics: JSON.stringify({
            likes: metrics.like_count,
            retweets: metrics.retweet_count,
            replies: metrics.reply_count,
            views: metrics.impression_count,
            quotes: metrics.quote_count,
          }),
        }).where(eq(contentQueue.id, item.id));
      }
    } else if (item.platform === "facebook") {
      const fbMetrics = await getFacebookPostMetrics(item.platformPostId);
      if (fbMetrics) {
        await db.update(contentQueue).set({
          metrics: JSON.stringify({
            likes: fbMetrics.likes,
            comments: fbMetrics.comments,
            shares: fbMetrics.shares,
            reach: fbMetrics.reach,
          }),
        }).where(eq(contentQueue.id, item.id));
      }
    } else if (item.platform === "youtube") {
      const ytMetrics = await getYouTubeVideoMetrics(item.platformPostId);
      if (ytMetrics) {
        await db.update(contentQueue).set({
          metrics: JSON.stringify({
            views: ytMetrics.views,
            likes: ytMetrics.likes,
            comments: ytMetrics.comments,
            favorites: ytMetrics.favorites,
          }),
        }).where(eq(contentQueue.id, item.id));
      }
    }
  }
}

/** Manually trigger posting for a specific queue item */
export async function postNow(itemId: number): Promise<{ success: boolean; error?: string; url?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  const { contentQueue } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const items = await db.select().from(contentQueue).where(eq(contentQueue.id, itemId)).limit(1);
  if (items.length === 0) return { success: false, error: "Queue item not found" };

  const item = items[0];
  if (!item.content) return { success: false, error: "No content to post" };
  if (item.status === "posted") return { success: false, error: "Already posted" };

  await postContentItem(item);

  // Re-fetch to get the updated status
  const updated = await db.select().from(contentQueue).where(eq(contentQueue.id, itemId)).limit(1);
  if (updated.length > 0 && updated[0].status === "posted") {
    return { success: true, url: updated[0].platformPostUrl || undefined };
  }

  return { success: false, error: updated[0]?.errorMessage || "Unknown error" };
}

/** Smart scheduling: pick optimal times with jitter */
export function getOptimalPostingTimes(platform: string, postsPerDay: number = 1): Date[] {
  // Optimal posting times by platform (EST)
  const optimalHours: Record<string, number[]> = {
    x: [7, 12, 17],          // 7am, 12pm, 5pm
    instagram: [8, 13, 19],   // 8am, 1pm, 7pm
    linkedin: [7, 10, 17],    // 7am, 10am, 5pm
    facebook: [9, 13, 16],    // 9am, 1pm, 4pm
    youtube: [14, 17],        // 2pm, 5pm (for uploads)
    tiktok: [10, 19, 22],     // 10am, 7pm, 10pm
    podcast: [5, 7],          // 5am, 7am (morning commute)
  };

  const hours = optimalHours[platform] || [9, 17];
  const selectedHours = hours.slice(0, postsPerDay);

  const dates: Date[] = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const hour of selectedHours) {
    const date = new Date(tomorrow);
    date.setHours(hour, 0, 0, 0);
    // Add jitter: +-5 minutes
    date.setTime(date.getTime() + getJitterMs());
    dates.push(date);
  }

  return dates;
}

// Track scheduler state
let schedulerRunning = false;
let contentGenTask: ScheduledTask | null = null;
let postingTask: ScheduledTask | null = null;
let metricsTask: ScheduledTask | null = null;

/** Start the content scheduler */
export function startScheduler() {
  if (schedulerRunning) {
    console.log("[Scheduler] Already running");
    return;
  }

  console.log("[Scheduler] Starting content pipeline scheduler...");

  // Process content generation every 5 minutes
  contentGenTask = cron.schedule("*/5 * * * *", async () => {
    try {
      await processContentGeneration();
    } catch (err: any) {
      console.error("[Scheduler] Content generation error:", err.message);
    }
  });

  // Check for scheduled posts every 2 minutes
  postingTask = cron.schedule("*/2 * * * *", async () => {
    try {
      await processScheduledPosts();
    } catch (err: any) {
      console.error("[Scheduler] Posting error:", err.message);
    }
  });

  // Update engagement metrics every 30 minutes
  metricsTask = cron.schedule("*/30 * * * *", async () => {
    try {
      await updateEngagementMetrics();
    } catch (err: any) {
      console.error("[Scheduler] Metrics update error:", err.message);
    }
  });

  schedulerRunning = true;
  console.log("[Scheduler] Content pipeline scheduler started");
  console.log("[Scheduler]   - Content generation: every 5 minutes");
  console.log("[Scheduler]   - Post scheduling: every 2 minutes");
  console.log("[Scheduler]   - Metrics update: every 30 minutes");
}

/** Stop the scheduler */
export function stopScheduler() {
  contentGenTask?.stop();
  postingTask?.stop();
  metricsTask?.stop();
  schedulerRunning = false;
  console.log("[Scheduler] Stopped");
}

/** Get scheduler status */
export function getSchedulerStatus() {
  return {
    running: schedulerRunning,
    tasks: {
      contentGeneration: contentGenTask ? "active" : "stopped",
      posting: postingTask ? "active" : "stopped",
      metricsUpdate: metricsTask ? "active" : "stopped",
    },
  };
}
