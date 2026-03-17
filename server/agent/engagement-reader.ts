/**
 * ENGAGEMENT READER — Browserbase Feedback Loop ("Ears")
 *
 * Uses Browserbase + Playwright to read REAL engagement data from social platforms.
 * This goes beyond API metrics — it reads actual comments, saves, shares, profile visits
 * that platform APIs don't always expose.
 *
 * Flow:
 *   1. Get recently posted content URLs from DB
 *   2. Open each URL in a cloud browser via Browserbase
 *   3. Extract engagement metrics (likes, comments, shares, saves, views)
 *   4. Parse comment text and sentiment
 *   5. Store results in content_queue.metrics + vector memory
 *   6. Feed back to Brain for content strategy optimization
 *
 * Called by: orchestrator.ts optimize loop (every 24 hours)
 * Risk: Tier 1 (read-only browser sessions)
 *
 * Platforms supported:
 *   - Instagram (public post pages)
 *   - Facebook (public post pages)
 *   - LinkedIn (public post pages)
 */

import cron from "node-cron";
import { ENV } from "../_core/env";

// ─── Types ──────────────────────────────────────────────────────────────────

export type EngagementSnapshot = {
  postId: number;
  platform: string;
  url: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    views: number;
  };
  topComments: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  extractedAt: Date;
  error?: string;
};

// ─── Main Function ──────────────────────────────────────────────────────────

/**
 * Read engagement data from recently posted content using Browserbase.
 * Returns snapshots for each post checked.
 */
export async function readEngagement(): Promise<{
  snapshots: EngagementSnapshot[];
  errors: string[];
}> {
  if (!ENV.browserbaseApiKey || !ENV.browserbaseProjectId) {
    return { snapshots: [], errors: ["Browserbase not configured"] };
  }

  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return { snapshots: [], errors: ["Database not available"] };

  const { sql } = await import("drizzle-orm");

  // Get posted content from the last 48 hours that has platform URLs
  const [rows] = await db.execute(
    sql`SELECT id, platform, platform_post_url, content, metrics
        FROM content_queue
        WHERE status = 'posted'
        AND posted_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)
        AND platform_post_url IS NOT NULL
        AND platform_post_url != ''
        ORDER BY posted_at DESC
        LIMIT 6`
  ) as any;

  if (!rows || (rows as any[]).length === 0) {
    return { snapshots: [], errors: [] };
  }

  const snapshots: EngagementSnapshot[] = [];
  const errors: string[] = [];

  for (const post of rows as any[]) {
    try {
      let snapshot = await readPostEngagement(post.id, post.platform, post.platform_post_url);

      // If Browserbase scraping failed but we have API metrics in DB, build snapshot from those
      if (snapshot.error && post.metrics) {
        try {
          const apiMetrics = JSON.parse(post.metrics);
          const hasData = (apiMetrics.likes || 0) + (apiMetrics.comments || 0) + (apiMetrics.shares || 0) > 0;
          if (hasData) {
            snapshot = {
              ...snapshot,
              metrics: {
                likes: apiMetrics.likes || 0,
                comments: apiMetrics.comments || 0,
                shares: apiMetrics.shares || apiMetrics.retweets || 0,
                saves: apiMetrics.saves || 0,
                views: apiMetrics.views || apiMetrics.reach || apiMetrics.impression_count || 0,
              },
              error: undefined, // Clear error — we have usable API data
            };
            console.log(`[EngagementReader] Browserbase failed for post #${post.id}, using API metrics`);
          }
        } catch { /* metrics parse failed, keep original error snapshot */ }
      }

      snapshots.push(snapshot);

      // Update the content_queue metrics with fresh engagement data
      if (!snapshot.error) {
        const existingMetrics = post.metrics ? JSON.parse(post.metrics) : {};
        const updatedMetrics = {
          ...existingMetrics,
          ...snapshot.metrics,
          browserbaseRead: true,
          lastRead: snapshot.extractedAt.toISOString(),
          sentiment: snapshot.sentiment,
          topComments: snapshot.topComments,
        };

        await db.execute(
          sql`UPDATE content_queue SET metrics = ${JSON.stringify(updatedMetrics)} WHERE id = ${post.id}`
        );
      }
    } catch (err: any) {
      errors.push(`Post #${post.id} (${post.platform}): ${err.message}`);
    }
  }

  // Store in vector memory if available
  if (snapshots.length > 0) {
    try {
      const { storePerformanceSnapshot } = await import("./vector-memory-hooks");
      await storePerformanceSnapshot();
    } catch {
      // Vector memory not configured — skip silently
    }
  }

  // Log summary
  const totalEngagement = snapshots.reduce(
    (sum, s) => sum + s.metrics.likes + s.metrics.comments + s.metrics.shares,
    0
  );
  console.log(
    `[EngagementReader] Read ${snapshots.length} posts, total engagement: ${totalEngagement}, errors: ${errors.length}`
  );

  return { snapshots, errors };
}

// ─── Platform-Specific Readers ──────────────────────────────────────────────

/**
 * Scrape a social media post page using Browserbase with platform-aware strategies.
 * Instagram and Facebook serve different content to headless browsers (login walls),
 * so we use mobile user agents, dismiss cookie banners, and wait for dynamic content.
 */
async function readPostEngagement(
  postId: number,
  platform: string,
  url: string
): Promise<EngagementSnapshot> {
  const content = await scrapePostPage(platform, url);

  if (!content) {
    return {
      postId,
      platform,
      url,
      metrics: { likes: 0, comments: 0, shares: 0, saves: 0, views: 0 },
      topComments: [],
      sentiment: "neutral",
      extractedAt: new Date(),
      error: "Browserbase scrape returned no usable content",
    };
  }

  switch (platform) {
    case "instagram":
      return parseInstagramEngagement(postId, url, content);
    case "facebook":
      return parseFacebookEngagement(postId, url, content);
    case "linkedin":
      return parseLinkedInEngagement(postId, url, content);
    default:
      return parseGenericEngagement(postId, platform, url, content);
  }
}

/**
 * Open a post URL in a Browserbase cloud browser with platform-appropriate settings.
 * Uses mobile user agent (less likely to hit login walls), dismisses cookie dialogs,
 * and waits for engagement numbers to render before extracting.
 */
async function scrapePostPage(platform: string, url: string): Promise<string | null> {
  const startTime = Date.now();

  try {
    const { chromium } = await import("playwright-core");

    // Create Browserbase session
    const apiKey = ENV.browserbaseApiKey;
    const projectId = ENV.browserbaseProjectId;
    if (!apiKey || !projectId) return null;

    const sessionResp = await fetch("https://api.browserbase.com/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bb-api-key": apiKey },
      body: JSON.stringify({ projectId }),
    });
    if (!sessionResp.ok) {
      console.error(`[EngagementReader] Browserbase session failed: ${sessionResp.status}`);
      return null;
    }
    const sessionData = await sessionResp.json();
    const connectUrl = `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionData.id}`;

    const browser = await chromium.connectOverCDP(connectUrl);
    const context = browser.contexts()[0] || await browser.newContext({
      // Mobile user agent — IG/FB serve public post pages to mobile without login walls
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    const page = await context.newPage();

    // Navigate with domcontentloaded (networkidle hangs on social media pages)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });

    // Wait for dynamic content to render (engagement counts load via JS)
    await page.waitForTimeout(3000);

    // Dismiss cookie/login banners that block content
    for (const selector of [
      'button:has-text("Accept")', 'button:has-text("Allow")',
      'button:has-text("Not Now")', 'button:has-text("Decline")',
      '[aria-label="Close"]', '[aria-label="Dismiss"]',
    ]) {
      try { await page.click(selector, { timeout: 1000 }); } catch { /* no banner */ }
    }

    // Extra wait after dismissal for content to appear
    await page.waitForTimeout(1500);

    // Platform-specific extraction for richer data
    let content: string;
    if (platform === "instagram") {
      // IG mobile pages have engagement in meta tags and aria labels
      content = await page.evaluate(() => {
        const parts: string[] = [];
        // Meta description often has "X likes, Y comments"
        const meta = document.querySelector('meta[name="description"]');
        if (meta) parts.push(meta.getAttribute("content") || "");
        // aria-labels contain counts like "1,234 likes"
        document.querySelectorAll('[aria-label]').forEach(el => {
          const label = el.getAttribute("aria-label") || "";
          if (/\d/.test(label) && /(like|comment|view|play|share|save)/i.test(label)) {
            parts.push(label);
          }
        });
        // Visible text as fallback
        parts.push(document.body.innerText);
        return parts.join("\n");
      });
    } else if (platform === "facebook") {
      // FB mobile pages show engagement in various data attributes and text
      content = await page.evaluate(() => {
        const parts: string[] = [];
        const meta = document.querySelector('meta[name="description"]');
        if (meta) parts.push(meta.getAttribute("content") || "");
        // FB uses aria-label on reaction/comment/share buttons
        document.querySelectorAll('[aria-label]').forEach(el => {
          const label = el.getAttribute("aria-label") || "";
          if (/\d/.test(label) && /(like|reaction|comment|share|view)/i.test(label)) {
            parts.push(label);
          }
        });
        parts.push(document.body.innerText);
        return parts.join("\n");
      });
    } else {
      content = await page.evaluate(() => document.body.innerText);
    }

    await browser.close();

    const duration = Date.now() - startTime;
    console.log(`[EngagementReader] Scraped ${platform} post (${content.length} chars, ${duration}ms)`);

    // Detect login wall — if content is too short or contains login keywords, it's a wall
    if (content.length < 50 || /log\s?in|sign\s?up|create.*account/i.test(content.substring(0, 200))) {
      console.warn(`[EngagementReader] Possible login wall detected for ${platform} — ${url}`);
      return null;
    }

    return content;
  } catch (err: any) {
    console.error(`[EngagementReader] Browserbase scrape failed for ${platform}:`, err.message);
    return null;
  }
}

function parseInstagramEngagement(postId: number, url: string, content: string): EngagementSnapshot {
  // Instagram public post pages typically show:
  // "X likes", "X comments", comment text
  const likes = extractNumber(content, /(\d[\d,]*)\s*(?:likes?|like)/i) || 0;
  const comments = extractNumber(content, /(\d[\d,]*)\s*comments?/i) || 0;
  const views = extractNumber(content, /(\d[\d,]*)\s*(?:views?|plays?)/i) || 0;

  // Extract visible comments (usually top 3-5)
  const commentLines = content
    .split("\n")
    .filter(line => line.trim().length > 10 && line.trim().length < 300)
    .filter(line => !line.match(/^\d|like|comment|share|follow|reply|view/i))
    .slice(0, 5);

  return {
    postId,
    platform: "instagram",
    url,
    metrics: { likes, comments, shares: 0, saves: 0, views },
    topComments: commentLines,
    sentiment: analyzeSentiment(commentLines.join(" ")),
    extractedAt: new Date(),
  };
}

function parseFacebookEngagement(postId: number, url: string, content: string): EngagementSnapshot {
  const likes = extractNumber(content, /(\d[\d,]*)\s*(?:likes?|reactions?)/i) || 0;
  const comments = extractNumber(content, /(\d[\d,]*)\s*comments?/i) || 0;
  const shares = extractNumber(content, /(\d[\d,]*)\s*shares?/i) || 0;

  const commentLines = content
    .split("\n")
    .filter(line => line.trim().length > 10 && line.trim().length < 300)
    .filter(line => !line.match(/^\d|like|comment|share|follow|reply/i))
    .slice(0, 5);

  return {
    postId,
    platform: "facebook",
    url,
    metrics: { likes, comments, shares, saves: 0, views: 0 },
    topComments: commentLines,
    sentiment: analyzeSentiment(commentLines.join(" ")),
    extractedAt: new Date(),
  };
}

function parseLinkedInEngagement(postId: number, url: string, content: string): EngagementSnapshot {
  const likes = extractNumber(content, /(\d[\d,]*)\s*(?:likes?|reactions?)/i) || 0;
  const comments = extractNumber(content, /(\d[\d,]*)\s*comments?/i) || 0;
  const shares = extractNumber(content, /(\d[\d,]*)\s*(?:reposts?|shares?)/i) || 0;
  const views = extractNumber(content, /(\d[\d,]*)\s*(?:impressions?|views?)/i) || 0;

  const commentLines = content
    .split("\n")
    .filter(line => line.trim().length > 10 && line.trim().length < 300)
    .filter(line => !line.match(/^\d|like|comment|share|repost|follow|reply/i))
    .slice(0, 5);

  return {
    postId,
    platform: "linkedin",
    url,
    metrics: { likes, comments, shares, saves: 0, views },
    topComments: commentLines,
    sentiment: analyzeSentiment(commentLines.join(" ")),
    extractedAt: new Date(),
  };
}

function parseGenericEngagement(postId: number, platform: string, url: string, content: string): EngagementSnapshot {
  const likes = extractNumber(content, /(\d[\d,]*)\s*(?:likes?|hearts?|reactions?)/i) || 0;
  const comments = extractNumber(content, /(\d[\d,]*)\s*comments?/i) || 0;
  const shares = extractNumber(content, /(\d[\d,]*)\s*(?:shares?|reposts?|retweets?)/i) || 0;
  const views = extractNumber(content, /(\d[\d,]*)\s*(?:views?|plays?|impressions?)/i) || 0;

  return {
    postId,
    platform,
    url,
    metrics: { likes, comments, shares, saves: 0, views },
    topComments: [],
    sentiment: "neutral",
    extractedAt: new Date(),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  return parseInt(match[1].replace(/,/g, ""), 10);
}

function analyzeSentiment(text: string): "positive" | "neutral" | "negative" | "mixed" {
  if (!text || text.length < 5) return "neutral";

  const lower = text.toLowerCase();
  const positiveWords = [
    "love", "amazing", "great", "thank", "beautiful", "inspiring", "powerful",
    "blessed", "strong", "proud", "yes", "awesome", "incredible", "wonderful",
    "recovery", "sober", "freedom", "hope", "heal", "brave", "courageous",
  ];
  const negativeWords = [
    "hate", "terrible", "awful", "worst", "disgusting", "fake", "scam",
    "spam", "stupid", "bad", "ugly", "wrong", "horrible", "pathetic",
  ];

  let posCount = 0;
  let negCount = 0;

  for (const word of positiveWords) {
    if (lower.includes(word)) posCount++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) negCount++;
  }

  if (posCount > 0 && negCount > 0) return "mixed";
  if (posCount > negCount) return "positive";
  if (negCount > posCount) return "negative";
  return "neutral";
}

// ─── Cron-based Engagement Reader ──────────────────────────────────────────

/**
 * Start the engagement reader on a 12-hour cron schedule.
 * Reads real engagement data from social platforms via Browserbase.
 * Called once on server boot alongside Mission Control and Self-Monitor.
 */
export function startEngagementReader(): void {
  console.log("[EngagementReader] Starting 12-hour engagement read cron...");

  // Run once on startup (delayed 90s to let other services initialize)
  setTimeout(async () => {
    try {
      console.log("[EngagementReader] Running initial engagement read...");
      const result = await readEngagement();
      console.log(`[EngagementReader] Initial read: ${result.snapshots.length} posts, ${result.errors.length} errors`);
    } catch (err: any) {
      console.error("[EngagementReader] Initial read failed:", err.message);
    }
  }, 90_000);

  // Every 12 hours: 0 */12 * * *
  cron.schedule("0 */12 * * *", async () => {
    try {
      console.log("[EngagementReader] Running scheduled engagement read...");
      const result = await readEngagement();
      console.log(`[EngagementReader] Read: ${result.snapshots.length} posts, ${result.errors.length} errors`);
    } catch (err: any) {
      console.error("[EngagementReader] Scheduled read failed:", err.message);
    }
  });
}
