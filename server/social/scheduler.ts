import cron, { type ScheduledTask } from "node-cron";
import { getDb } from "../db";
import { postTweet, postThread, getTweetMetrics } from "./twitter";
import { postToFacebookPage, postLinkToFacebookPage, postPhotoToFacebookPage, postToInstagram, postTextToInstagram, getFacebookPostMetrics } from "./meta";
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
export async function processContentGeneration() {
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

      // Generate content (business-aware: defaults to sober-strong for now)
      const generated = await generateContentForPlatform({
        platform: item.platform,
        sourceBlogTitle: blogTitle,
        sourceBlogContent: blogContent,
        ctaText,
        ctaUrl,
        businessSlug: "sober-strong",
      });

      // Auto-generate image with DALL-E 3 if configured
      // Force image generation for Facebook and Instagram (they need images for engagement/posting)
      let generatedImageUrl: string | undefined;
      const platformNeedsImage = ["facebook", "instagram", "linkedin"].includes(item.platform);
      const shouldGenerateImage = platformNeedsImage || (generated.suggestedMediaType !== "none" && generated.suggestedMediaPrompt);
      if (shouldGenerateImage) {
        try {
          const { generatePostImage } = await import("./image-generator");
          const imgResult = await generatePostImage({
            content: generated.content,
            platform: item.platform,
            suggestedMediaPrompt: generated.suggestedMediaPrompt || `Warm, hopeful, recovery-themed image for ${item.platform}: ${generated.content.substring(0, 200)}`,
          });
          if (imgResult.success && imgResult.imageUrl) {
            generatedImageUrl = imgResult.imageUrl;
            console.log(`[Scheduler] Generated ${imgResult.styleName || "default"} style image for ${item.platform}`);
          } else {
            console.warn(`[Scheduler] Image generation returned no URL for ${item.platform}:`, imgResult.error);
          }
        } catch (err) {
          console.warn(`[Scheduler] Image generation failed for queue item #${item.id}:`, err);
        }
      }

      // Update the queue item with generated content + image
      // If no scheduledFor is set, default to now so the posting cron picks it up automatically (Tier 1 auto-post)
      const updateData: Record<string, any> = {
        content: generated.content,
        status: "ready",
        mediaUrls: JSON.stringify({
          suggestedMediaType: generated.suggestedMediaType,
          suggestedMediaPrompt: generated.suggestedMediaPrompt,
          suggestedTools: generated.suggestedTools,
          hashtags: generated.hashtags,
          generatedImageUrl,
        }),
      };
      if (!item.scheduledFor) {
        updateData.scheduledFor = new Date();
      }
      await db.update(contentQueue).set(updateData).where(eq(contentQueue.id, item.id));

      console.log(`[Scheduler] Generated content for ${item.platform} (queue item #${item.id})`);
    } catch (err: any) {
      const errMsg = typeof err === "string" ? err : (err?.message || JSON.stringify(err));
      console.error(`[Scheduler] Failed to generate content for queue item #${item.id}:`, errMsg);
      await db.update(contentQueue).set({
        status: "failed",
        errorMessage: errMsg,
      }).where(eq(contentQueue.id, item.id));
    }
  }
}

/** Process ready items that are scheduled to post */
/** Per-platform daily posting limits to protect algorithm reach */
const PLATFORM_DAILY_LIMITS: Record<string, number> = {
  instagram: 1,  // Reduced from 3: one Instagram post per day
  facebook: 1,   // Reduced from 3: one Facebook post per day
  x: 5,
  linkedin: 2,
  youtube: 1,
  tiktok: 2,
  podcast: 1,
};

/** Check how many posts a platform has already made today */
async function getPlatformPostCountToday(platform: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM content_queue
          WHERE platform = ${platform}
          AND status IN ('posted', 'posting')
          AND posted_at >= CURDATE()`
    ) as any;
    return rows?.[0]?.cnt || 0;
  } catch {
    return 0;
  }
}

export async function processScheduledPosts() {
  const db = await getDb();
  if (!db) {
    console.error("[Scheduler] Database not available");
    return;
  }

  const { contentQueue } = await import("../../drizzle/schema");
  const { eq, and, lte, isNull, or } = await import("drizzle-orm");

  // Find items that are ready and either:
  // 1. Have a scheduled time that has passed, OR
  // 2. Have no scheduled time (NULL) — treat as "post immediately"
  // Bug fix: several code paths (e.g. admin generateContent) set status='ready'
  // without setting scheduledFor, causing posts to never be picked up.
  // Hotfix: Exclude X/Twitter posts (free tier is read-only API, cannot post).
  // CRITICAL: Reduced back to 3 posts/cycle to avoid Instagram rate limiting.
  // Processing 10+ posts simultaneously triggered Instagram API rejections.
  // Slow and steady: 3 posts × 10 min cycles = ~18 posts/hour = sustainable.
  const now = new Date();
  const { ne } = await import("drizzle-orm");
  
  console.log(`[Scheduler] Querying for ready posts (status='ready', platform!='x' and platform!='linkedin', scheduled_for <= now)`);
  
  const readyItems = await db
    .select()
    .from(contentQueue)
    .where(
      and(
        eq(contentQueue.status, "ready"),
        ne(contentQueue.platform, "x"),  // Skip X/Twitter (read-only API)
        ne(contentQueue.platform, "linkedin"),  // Skip LinkedIn (account not ready, needs more followers for API approval)
        or(
          isNull(contentQueue.scheduledFor),
          lte(contentQueue.scheduledFor, now),
        ),
      )
    )
    .limit(3);

  console.log(`[Scheduler] Query returned ${readyItems.length} items (before filtering)`);
  
  if (readyItems.length === 0) {
    console.log(`[Scheduler] ⚠️  No ready posts found matching criteria. Cycle complete with 0 posts.`);
    return;
  }

  let postedCount = 0;
  let skippedCount = 0;

  for (const item of readyItems) {
    if (!item.content) {
      console.warn(`[Scheduler] Post #${item.id} has no content, skipping`);
      skippedCount++;
      continue;
    }

    // NOTE: Instagram posts without mediaUrls will attempt auto-image generation in postContentItem()
    // No early skip - let the posting function handle it
    
    console.log(`[Scheduler] Processing post #${item.id} (${item.platform})`);

    // Check if platform is throttled by self-healing (rate limit recovery)
    try {
      const { isPlatformThrottled } = await import("../agent/self-heal");
      if (isPlatformThrottled(item.platform)) {
        console.log(`[Scheduler] ${item.platform} is throttled by self-heal (rate limit recovery), skipping post #${item.id}`);
        skippedCount++;
        continue;
      }
    } catch { /* self-heal module not available, proceed normally */ }

    // Enforce per-platform daily limits
    const dailyLimit = PLATFORM_DAILY_LIMITS[item.platform] ?? 2;
    const postedToday = await getPlatformPostCountToday(item.platform);
    if (postedToday >= dailyLimit) {
      // Reschedule for tomorrow instead of posting
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
      await db.update(contentQueue)
        .set({ scheduledFor: tomorrow })
        .where(eq(contentQueue.id, item.id));
      console.log(`[Scheduler] ${item.platform} hit daily limit (${dailyLimit}), rescheduled post #${item.id} to tomorrow`);
      skippedCount++;
      continue;
    }

    await postContentItem(item);
    postedCount++;
  }

  console.log(`[Scheduler] Cycle complete: ${postedCount} posted, ${skippedCount} skipped, ${readyItems.length} total processed`);
}

/** Post a single content queue item to its platform */
async function postContentItem(item: {
  id: number;
  platform: string;
  contentType: string;
  content: string | null;
  mediaUrls: string | null;
  ctaOfferId: number | null;
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
        // X/Twitter free tier is READ-ONLY — cannot post via API.
        // Keep content as "ready" for manual copy/paste posting.
        result = { success: false, error: "X/Twitter content ready for manual posting — copy from Content Pipeline and paste into X." };
        await db.update(contentQueue)
          .set({ status: "ready", errorMessage: result.error })
          .where(eq(contentQueue.id, item.id));
        return;
      }
      case "facebook": {
        // Check for generated image to upload as a photo post
        let fbImageUrl = "";
        if (item.mediaUrls) {
          try {
            const media = JSON.parse(item.mediaUrls);
            fbImageUrl = media.generatedImageUrl || media.imageUrl || "";
          } catch {}
        }

        // Auto-generate image if none exists
        if (!fbImageUrl) {
          try {
            const { generatePostImage } = await import("./image-generator");
            const imgResult = await generatePostImage({
              content: item.content || "",
              platform: "facebook",
              suggestedMediaPrompt: `Warm, hopeful, recovery-themed image for Facebook: ${(item.content || "").substring(0, 200)}`,
            });
            if (imgResult.success && imgResult.imageUrl) {
              fbImageUrl = imgResult.imageUrl;
              console.log(`[Scheduler] Facebook: auto-generated image for post`);
            }
          } catch (err: any) {
            console.warn(`[Scheduler] Facebook auto-image generation failed:`, err.message);
          }
        }

        // Retrieve CTA URL from the linked ctaOffer
        let ctaUrl = "";
        if (item.ctaOfferId) {
          try {
            const { ctaOffers } = await import("../../drizzle/schema");
            const offers = await db.select().from(ctaOffers)
              .where(eq(ctaOffers.id, item.ctaOfferId)).limit(1);
            if (offers.length > 0 && offers[0].ctaUrl) {
              ctaUrl = offers[0].ctaUrl;
            }
          } catch {}
        }

        // Append CTA URL to content if it contains CTA text but no actual link
        let fbContent = item.content;
        if (ctaUrl && fbContent && !fbContent.includes("http")) {
          fbContent = fbContent + "\n\n" + ctaUrl;
        }

        // Use postPhotoToFacebookPage to download + upload the image permanently
        // (DALL-E URLs expire in ~1 hour, so we can't just pass the URL as a link)
        let fbResult;
        if (fbImageUrl) {
          fbResult = await postPhotoToFacebookPage(fbContent, fbImageUrl);
        } else if (ctaUrl) {
          // Post with link preview when we have a CTA URL but no image
          fbResult = await postLinkToFacebookPage(fbContent, ctaUrl);
        } else {
          fbResult = await postToFacebookPage(fbContent);
        }
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
            const rawUrl = media.generatedImageUrl || media.imageUrl || media.image_url || "";
            if (rawUrl) {
              // Cache the image on our server to avoid DALL-E URL expiration
              // Instagram fetches the URL server-side, so it must be publicly accessible
              try {
                const { cacheImageForInstagram } = await import("./image-proxy");
                const cachedUrl = await cacheImageForInstagram(rawUrl);
                imageUrl = cachedUrl || rawUrl; // Fall back to raw URL if caching fails
                if (cachedUrl) {
                  console.log(`[Scheduler] Instagram: cached image → ${cachedUrl}`);
                }
              } catch {
                imageUrl = rawUrl; // Fall back if image-proxy not available
              }
            }
          } catch {}
        }
        // If no image URL, try to auto-generate one via DALL-E
        if (!imageUrl) {
          try {
            const { generatePostImage } = await import("./image-generator");
            const imgResult = await generatePostImage({
              content: item.content || "",
              platform: "instagram",
              suggestedMediaPrompt: `Warm, hopeful, recovery-themed image for Instagram: ${(item.content || "").substring(0, 200)}`,
            });
            if (imgResult.success && imgResult.imageUrl) {
              // Cache for Instagram (IG fetches server-side, needs public URL)
              try {
                const { cacheImageForInstagram } = await import("./image-proxy");
                imageUrl = await cacheImageForInstagram(imgResult.imageUrl) || imgResult.imageUrl;
                console.log(`[Scheduler] Instagram: auto-generated image for text-only post`);
              } catch {
                imageUrl = imgResult.imageUrl;
              }
            }
          } catch (err: any) {
            console.warn(`[Scheduler] Instagram auto-image generation failed:`, err.message);
          }
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
          result = { success: false, error: "YouTube not configured. Visit /api/youtube/connect to authorize your channel, then add YOUTUBE_REFRESH_TOKEN to Railway env vars." };
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
              // If HeyGen generated the video but YouTube upload failed, keep as ready to retry
              const errDetail = pipelineResult.error || "HeyGen→YouTube pipeline failed";
              if (pipelineResult.heygenVideoUrl) {
                result = { success: false, error: `Video generated (${pipelineResult.heygenVideoUrl}) but YouTube upload failed: ${errDetail}` };
              } else {
                result = { success: false, error: `HeyGen video generation failed: ${errDetail}` };
              }
            }
          } catch (err: any) {
            console.error(`[Scheduler] HeyGen→YouTube pipeline failed:`, err.message);
            result = { success: false, error: `HeyGen→YouTube pipeline error: ${err.message}` };
          }
        } else {
          result = { success: false, error: "YouTube script ready but HeyGen not configured for auto video generation. Add HEYGEN_API_KEY to Railway, or upload video manually from admin." };
          await db.update(contentQueue)
            .set({ status: "ready", errorMessage: result.error })
            .where(eq(contentQueue.id, item.id));
          return;
        }
        break;
      }
      case "podcast": {
        // Generate audio via ElevenLabs from the script
        const { isElevenLabsConfigured, blogToPodcast } = await import("./elevenlabs");
        if (!isElevenLabsConfigured()) {
          result = { success: false, error: "ElevenLabs not configured. Add ELEVENLABS_API_KEY to generate podcast audio." };
          await db.update(contentQueue)
            .set({ status: "ready", errorMessage: result.error })
            .where(eq(contentQueue.id, item.id));
          return;
        }
        try {
          const podcastResult = await blogToPodcast({
            title: "Rewired Podcast Episode",
            content: item.content || "",
          });
          if (podcastResult.success && podcastResult.audioBuffer) {
            // Save audio URL in media_urls and mark as posted
            result = { success: true };
            await db.update(contentQueue).set({
              status: "posted",
              mediaUrls: JSON.stringify({ audioGenerated: true, audioSize: podcastResult.audioBuffer.length }),
              postedAt: new Date(),
              errorMessage: null,
            }).where(eq(contentQueue.id, item.id));
            console.log(`[Scheduler] Generated podcast audio (${podcastResult.audioBuffer.length} bytes)`);
            return;
          } else {
            result = { success: false, error: podcastResult.error || "Podcast generation failed" };
          }
        } catch (err: any) {
          result = { success: false, error: `Podcast generation error: ${err.message}` };
        }
        break;
      }
      // Future platforms
      case "tiktok": {
        result = { success: false, error: "TikTok posting not yet implemented - content is ready for manual posting" };
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
      const errMsg = typeof result.error === "string" ? result.error : JSON.stringify(result.error);
      await db.update(contentQueue).set({
        status: "failed",
        errorMessage: errMsg,
      }).where(eq(contentQueue.id, item.id));
      console.error(`[Scheduler] Failed to post to ${item.platform}: ${errMsg}`);
    }
  } catch (err: any) {
    const errMsg = typeof err === "string" ? err : (err?.message || JSON.stringify(err));
    await db.update(contentQueue).set({
      status: "failed",
      errorMessage: errMsg,
    }).where(eq(contentQueue.id, item.id));
    console.error(`[Scheduler] Error posting to ${item.platform}:`, errMsg);
  }
}

/** Update engagement metrics for recently posted items */
export async function updateEngagementMetrics() {
  const db = await getDb();
  if (!db) return;

  const { contentQueue } = await import("../../drizzle/schema");
  const { eq, and, isNotNull } = await import("drizzle-orm");

  // Get posted items with a platformPostId (all platforms with metrics APIs)
  const { or } = await import("drizzle-orm");
  const postedItems = await db
    .select()
    .from(contentQueue)
    .where(
      and(
        eq(contentQueue.status, "posted"),
        or(
          eq(contentQueue.platform, "x"),
          eq(contentQueue.platform, "facebook"),
          eq(contentQueue.platform, "instagram"),
          eq(contentQueue.platform, "linkedin"),
          eq(contentQueue.platform, "youtube"),
        ),
        isNotNull(contentQueue.platformPostId),
      )
    )
    .limit(10);

  for (const item of postedItems) {
    if (!item.platformPostId) continue;

    try {
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
      } else if (item.platform === "instagram") {
        // Instagram metrics via Graph API (uses same token as FB)
        const { pageAccessToken } = { pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN };
        if (pageAccessToken) {
          const igResp = await fetch(
            `https://graph.facebook.com/v21.0/${item.platformPostId}?fields=like_count,comments_count,timestamp&access_token=${pageAccessToken}`
          );
          if (igResp.ok) {
            const igData = await igResp.json();
            await db.update(contentQueue).set({
              metrics: JSON.stringify({
                likes: igData.like_count || 0,
                comments: igData.comments_count || 0,
              }),
            }).where(eq(contentQueue.id, item.id));
          }
        }
      } else if (item.platform === "linkedin") {
        const liMetrics = await getLinkedInPostMetrics(item.platformPostId);
        if (liMetrics) {
          await db.update(contentQueue).set({
            metrics: JSON.stringify({
              likes: liMetrics.likes,
              comments: liMetrics.comments,
              shares: liMetrics.shares,
              impressions: liMetrics.impressions,
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
    } catch (err: any) {
      console.warn(`[Scheduler] Metrics fetch failed for ${item.platform} post ${item.platformPostId}:`, err.message);
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
    console.log(`[Scheduler] [${new Date().toISOString()}] Already running`);
    return;
  }

  console.log(`[Scheduler] [${new Date().toISOString()}] Starting content pipeline scheduler...`);

  // Process content generation every 60 minutes
  contentGenTask = cron.schedule("0 * * * *", async () => {
    try {
      await processContentGeneration();
    } catch (err: any) {
      console.error("[Scheduler] Content generation error:", err.message);
    }
  });

  // Check for scheduled posts every 10 minutes
  postingTask = cron.schedule("*/10 * * * *", async () => {
    try {
      const startTime = Date.now();
      console.log(`[Scheduler] [${new Date().toISOString()}] Running posting cycle...`);
      await processScheduledPosts();
      const duration = Date.now() - startTime;
      console.log(`[Scheduler] [${new Date().toISOString()}] Posting cycle complete (${duration}ms)`);
    } catch (err: any) {
      console.error(`[Scheduler] [${new Date().toISOString()}] Posting error:`, err.message);
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

  // Heartbeat log every minute to verify cron is alive
  cron.schedule("* * * * *", () => {
    // Silent heartbeat - only log every 60 minutes to reduce noise
    const minute = new Date().getMinutes();
    if (minute === 0) {
      console.log(`[Scheduler] ❤️ Heartbeat OK (${new Date().toISOString()})`);
    }
  });

  schedulerRunning = true;
  console.log(`[Scheduler] [${new Date().toISOString()}] ✅ Content pipeline scheduler STARTED`);
  console.log("[Scheduler]   - Content generation: every 60 minutes");
  console.log("[Scheduler]   - Post scheduling: every 10 minutes (ACTIVE)");
  console.log("[Scheduler]   - Metrics update: every 30 minutes");
}

/** Stop the scheduler */
export function stopScheduler() {
  contentGenTask?.stop();
  postingTask?.stop();
  metricsTask?.stop();
  schedulerRunning = false;
}

/** Get scheduler status */
export function getSchedulerStatus(): { running: boolean; tasks: Record<string, string> } {
  return {
    running: schedulerRunning,
    tasks: {
      contentGeneration: contentGenTask ? "initialized" : "not initialized",
      posting: postingTask ? "initialized" : "not initialized",
      metrics: metricsTask ? "initialized" : "not initialized",
    },
  };
}

/**
 * Run a single scheduler cycle on demand (for external triggers like n8n).
 * Executes content generation → posting → metrics in sequence.
 * Returns a summary of what happened.
 */
export async function runSchedulerCycle(): Promise<{
  success: boolean;
  contentGeneration: string;
  posting: string;
  metrics: string;
}> {
  const results = { success: true, contentGeneration: "", posting: "", metrics: "" };

  try {
    await processContentGeneration();
    results.contentGeneration = "ok";
  } catch (err: any) {
    results.contentGeneration = `error: ${err.message}`;
    results.success = false;
  }

  try {
    await processScheduledPosts();
    results.posting = "ok";
  } catch (err: any) {
    results.posting = `error: ${err.message}`;
    results.success = false;
  }

  try {
    await updateEngagementMetrics();
    results.metrics = "ok";
  } catch (err: any) {
    results.metrics = `error: ${err.message}`;
    results.success = false;
  }

  return results;
}
