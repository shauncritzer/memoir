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
      const snapshot = await readPostEngagement(post.id, post.platform, post.platform_post_url);
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

async function readPostEngagement(
  postId: number,
  platform: string,
  url: string
): Promise<EngagementSnapshot> {
  const { extractPageContent } = await import("./browser-arm");

  const result = await extractPageContent(url);

  if (!result.success || !result.extractedContent) {
    return {
      postId,
      platform,
      url,
      metrics: { likes: 0, comments: 0, shares: 0, saves: 0, views: 0 },
      topComments: [],
      sentiment: "neutral",
      extractedAt: new Date(),
      error: result.error || "Could not extract content",
    };
  }

  const content = result.extractedContent;

  // Parse engagement based on platform
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
