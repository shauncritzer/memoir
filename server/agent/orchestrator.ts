/**
 * ORCHESTRATOR — The actual brain that connects all agent arms
 *
 * This module is called by Mission Control on each cycle to actually
 * USE the tools (Tavily, BrowserBase, content generator, research agent)
 * instead of just monitoring and proposing.
 *
 * Autonomous loops:
 *   1. Research Loop:  Tavily → trending topics → content generation → queue
 *   2. Replenish Loop: Low queue → auto-generate per-platform content (respecting daily limits)
 *   3. Quality Loop:   Posted content → BrowserBase verify → log issues
 *   4. Optimize Loop:  Metrics → analyze top performers → adjust strategy
 */

import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Platform Daily Limits ──────────────────────────────────────────────────
// These are algorithm-safe maximums per platform per day

export const PLATFORM_DAILY_LIMITS: Record<string, number> = {
  instagram: 2,
  facebook: 2,
  x: 5,
  linkedin: 1,
  youtube: 1,     // 1 video per day max
  tiktok: 3,
  podcast: 1,
};

// ─── Rate limiting state ─────────────────────────────────────────────────────

const lastRun: Record<string, Date> = {};

function canRun(task: string, intervalMinutes: number): boolean {
  const last = lastRun[task];
  if (!last) return true;
  return (Date.now() - last.getTime()) > intervalMinutes * 60 * 1000;
}

function markRun(task: string): void {
  lastRun[task] = new Date();
}

// ─── 1. Research Loop ────────────────────────────────────────────────────────
// Runs every 6 hours: uses Tavily to find trending recovery/wellness topics,
// then feeds them into the content generator

export async function runResearchLoop(businessSlug: string = "sober-strong"): Promise<string | null> {
  if (!canRun("research", 360)) return null; // every 6 hours

  const db = await getDb();
  if (!db) return null;

  try {
    const { tavilySearch } = await import("./web-research");

    // Search for trending recovery/wellness content
    const queries = [
      "addiction recovery tips trending 2026",
      "sobriety wellness social media viral content",
      "trauma recovery neuroscience new research",
    ];

    const query = queries[Math.floor(Math.random() * queries.length)];
    const searchResult = await tavilySearch({
      query,
      depth: "basic",
      maxResults: 5,
    });

    if (!searchResult.success || searchResult.results.length === 0) {
      console.log("[Orchestrator] Research loop: no results from Tavily");
      markRun("research");
      return null;
    }

    // Use LLM to extract content ideas from research
    const researchSummary = searchResult.results
      .map((r, i) => `${i + 1}. ${r.title}: ${r.content.substring(0, 200)}`)
      .join("\n");

    const ideaResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content strategist for a recovery coaching brand. Extract 3 specific, actionable social media post ideas from research findings. Each idea should be 1 sentence. Return JSON array of strings.`,
        },
        {
          role: "user",
          content: `Research findings:\n${researchSummary}\n\nGenerate 3 post topic ideas as JSON array of strings.`,
        },
      ],
      maxTokens: 500,
    });

    const responseText = (ideaResult.choices?.[0]?.message?.content as string) || "[]";
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let topics: string[];
    try {
      topics = JSON.parse(cleanJson);
    } catch {
      topics = [];
    }

    if (topics.length === 0) {
      markRun("research");
      return null;
    }

    // Queue content generation for each topic across platforms
    const { sql } = await import("drizzle-orm");
    const platforms = ["instagram", "facebook", "linkedin"];
    let queued = 0;

    for (const topic of topics.slice(0, 2)) { // max 2 topics per cycle
      // Pick a platform that hasn't hit its daily limit
      for (const platform of platforms) {
        const atLimit = await isPlatformAtDailyLimit(platform);
        if (atLimit) continue;

        await db.execute(sql`INSERT INTO content_queue
          (platform, content_type, content, status, scheduled_for)
          VALUES (
            ${platform},
            'post',
            ${null},
            'pending',
            ${getNextScheduledTime(platform)}
          )`);
        queued++;
        break; // one platform per topic to spread it out
      }
    }

    // Log the research action
    await db.execute(sql`INSERT INTO agent_actions
      (category, title, description, risk_tier, status, result, executed_at)
      VALUES (
        'research',
        'Auto-research trending topics',
        ${`Searched: "${query}" → Found ${searchResult.results.length} results → Generated ${topics.length} topic ideas → Queued ${queued} posts`},
        1,
        'executed',
        ${JSON.stringify({ query, topics, queued })},
        NOW()
      )`);

    markRun("research");
    console.log(`[Orchestrator] Research loop: ${topics.length} topics found, ${queued} posts queued`);
    return `Researched "${query}" → ${queued} posts queued`;
  } catch (err: any) {
    console.error("[Orchestrator] Research loop error:", err.message);
    markRun("research");
    return null;
  }
}

// ─── 2. Replenish Loop ──────────────────────────────────────────────────────
// Checks queue depth per platform and auto-generates content where needed

export async function runReplenishLoop(): Promise<string | null> {
  if (!canRun("replenish", 60)) return null; // every hour

  const db = await getDb();
  if (!db) return null;

  try {
    const { sql } = await import("drizzle-orm");
    const { generateContentForPlatform } = await import("../social/content-generator");

    const platforms = ["instagram", "facebook", "linkedin", "x"];
    const generated: string[] = [];

    for (const platform of platforms) {
      // Check if we have enough queued content for this platform
      const [rows] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM content_queue
            WHERE platform = ${platform}
            AND status IN ('pending', 'ready')
            AND (scheduled_for IS NULL OR scheduled_for > NOW())`
      ) as any;
      const queuedCount = rows?.[0]?.cnt || 0;

      // Also check daily limit
      const atLimit = await isPlatformAtDailyLimit(platform);

      if (queuedCount < 2 && !atLimit) {
        try {
          const content = await generateContentForPlatform({
            platform,
            businessSlug: "sober-strong",
          });

          const scheduledFor = getNextScheduledTime(platform);

          await db.execute(sql`INSERT INTO content_queue
            (platform, content_type, content, status, scheduled_for, media_urls)
            VALUES (
              ${platform},
              ${content.contentType},
              ${content.content},
              'ready',
              ${scheduledFor},
              ${JSON.stringify({
                hashtags: content.hashtags,
                suggestedMediaType: content.suggestedMediaType,
                suggestedMediaPrompt: content.suggestedMediaPrompt,
                autoGenerated: true,
                orchestratorGenerated: true,
              })}
            )`);

          generated.push(platform);
        } catch (err: any) {
          console.warn(`[Orchestrator] Failed to generate ${platform} content:`, err.message);
        }
      }
    }

    if (generated.length > 0) {
      await db.execute(sql`INSERT INTO agent_actions
        (category, title, description, risk_tier, status, result, executed_at)
        VALUES (
          'content',
          'Auto-replenish content queue',
          ${`Queue was low. Generated content for: ${generated.join(", ")}`},
          1,
          'executed',
          ${JSON.stringify({ platforms: generated })},
          NOW()
        )`);
    }

    markRun("replenish");
    console.log(`[Orchestrator] Replenish loop: generated for ${generated.length} platforms: ${generated.join(", ") || "none needed"}`);
    return generated.length > 0 ? `Replenished: ${generated.join(", ")}` : null;
  } catch (err: any) {
    console.error("[Orchestrator] Replenish loop error:", err.message);
    markRun("replenish");
    return null;
  }
}

// ─── 3. Quality Verification Loop ───────────────────────────────────────────
// Uses BrowserBase to spot-check that posted content actually appeared

export async function runQualityLoop(): Promise<string | null> {
  if (!canRun("quality", 720)) return null; // every 12 hours

  const db = await getDb();
  if (!db) return null;

  try {
    const { sql } = await import("drizzle-orm");

    // Get recent posted items with platform URLs
    const [rows] = await db.execute(
      sql`SELECT id, platform, platform_post_id, platform_post_url, content
          FROM content_queue
          WHERE status = 'posted'
          AND posted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
          AND platform_post_url IS NOT NULL
          ORDER BY posted_at DESC
          LIMIT 3`
    ) as any;

    if (!rows || (rows as any[]).length === 0) {
      markRun("quality");
      return null;
    }

    let verified = 0;
    let issues = 0;

    // Try BrowserBase verification
    try {
      const { extractPageContent } = await import("./browser-arm");

      for (const post of (rows as any[]).slice(0, 2)) {
        if (!post.platform_post_url) continue;

        try {
          const result = await extractPageContent(post.platform_post_url);
          if (result.success) {
            verified++;
          } else {
            issues++;
            // Log the issue
            await db.execute(sql`INSERT INTO agent_actions
              (category, title, description, risk_tier, status, result, executed_at)
              VALUES (
                'quality',
                ${`Post verification issue: ${post.platform}`},
                ${`Could not verify post at ${post.platform_post_url}: ${result.error || "extraction failed"}`},
                2,
                'executed',
                ${JSON.stringify({ postId: post.id, platform: post.platform, url: post.platform_post_url })},
                NOW()
              )`);
          }
        } catch {
          // BrowserBase not configured or quota exceeded — skip
        }
      }
    } catch {
      // BrowserBase module not available — skip verification
      console.log("[Orchestrator] Quality loop: BrowserBase not available, skipping verification");
    }

    markRun("quality");
    const summary = `Checked ${(rows as any[]).length} posts: ${verified} verified, ${issues} issues`;
    console.log(`[Orchestrator] Quality loop: ${summary}`);
    return verified > 0 || issues > 0 ? summary : null;
  } catch (err: any) {
    console.error("[Orchestrator] Quality loop error:", err.message);
    markRun("quality");
    return null;
  }
}

// ─── 3.5 Engagement Reading Loop ─────────────────────────────────────────────
// Uses Browserbase to read real engagement data from social platforms (the "Ears")

export async function runEngagementLoop(): Promise<string | null> {
  if (!canRun("engagement_read", 720)) return null; // every 12 hours

  try {
    const { readEngagement } = await import("./engagement-reader");
    const result = await readEngagement();

    if (result.snapshots.length === 0 && result.errors.length === 0) {
      markRun("engagement_read");
      return null;
    }

    const totalEngagement = result.snapshots.reduce(
      (sum, s) => sum + s.metrics.likes + s.metrics.comments + s.metrics.shares,
      0
    );

    markRun("engagement_read");

    if (result.snapshots.length > 0) {
      // Send summary to Telegram if significant engagement found
      if (totalEngagement > 0) {
        try {
          const { isTelegramConfigured, sendActionSummary } = await import("./telegram");
          if (isTelegramConfigured()) {
            const actions = result.snapshots.map(
              s => `${s.platform}: ${s.metrics.likes} likes, ${s.metrics.comments} comments (${s.sentiment})`
            );
            await sendActionSummary(actions, result.errors);
          }
        } catch {
          // Non-critical
        }
      }

      return `Read ${result.snapshots.length} posts: ${totalEngagement} total engagement`;
    }

    return null;
  } catch (err: any) {
    console.error("[Orchestrator] Engagement read loop error:", err.message);
    markRun("engagement_read");
    return null;
  }
}

// ─── 4. Optimization Loop ───────────────────────────────────────────────────
// Analyzes metrics from posted content and adjusts content strategy

export async function runOptimizeLoop(): Promise<string | null> {
  if (!canRun("optimize", 1440)) return null; // once per day

  const db = await getDb();
  if (!db) return null;

  try {
    const { sql } = await import("drizzle-orm");

    // Get metrics from last 7 days of posted content
    const [rows] = await db.execute(
      sql`SELECT platform, content_type, content, metrics,
          SUBSTRING(content, 1, 200) as content_preview
          FROM content_queue
          WHERE status = 'posted'
          AND posted_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND metrics IS NOT NULL
          ORDER BY posted_at DESC
          LIMIT 30`
    ) as any;

    if (!rows || (rows as any[]).length < 5) {
      markRun("optimize");
      return null; // not enough data to analyze
    }

    // Parse metrics and find top/bottom performers
    const posts = (rows as any[]).map((r: any) => {
      let parsedMetrics: any = {};
      try { parsedMetrics = JSON.parse(r.metrics); } catch { /* ignore */ }
      return {
        platform: r.platform,
        contentType: r.content_type,
        preview: r.content_preview,
        engagement: (parsedMetrics.likes || 0) + (parsedMetrics.comments || 0) + (parsedMetrics.shares || 0) + (parsedMetrics.retweets || 0),
      };
    });

    // Sort by engagement
    posts.sort((a, b) => b.engagement - a.engagement);

    const topPosts = posts.slice(0, 3);
    const bottomPosts = posts.filter(p => p.engagement === 0).slice(0, 3);

    // Ask LLM to analyze patterns
    const analysisResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a social media strategist. Analyze post performance and give 2-3 specific, actionable recommendations. Be brief.",
        },
        {
          role: "user",
          content: `TOP PERFORMERS (highest engagement):\n${topPosts.map(p => `- [${p.platform}] ${p.preview}... (${p.engagement} engagements)`).join("\n")}\n\nLOW PERFORMERS (zero engagement):\n${bottomPosts.map(p => `- [${p.platform}] ${p.preview}...`).join("\n")}\n\nTotal posts analyzed: ${posts.length}\n\nWhat patterns do you see? Give 2-3 specific recommendations.`,
        },
      ],
      maxTokens: 500,
    });

    const analysis = (analysisResult.choices?.[0]?.message?.content as string) || "";

    if (analysis) {
      // Store the optimization report
      await db.execute(sql`INSERT INTO agent_reports
        (report_type, title, content, metrics)
        VALUES (
          'optimization',
          'Weekly Content Performance Analysis',
          ${analysis},
          ${JSON.stringify({
            totalPosts: posts.length,
            topPerformers: topPosts,
            zeroEngagement: bottomPosts.length,
            avgEngagement: posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length,
          })}
        )`);

      console.log("[Orchestrator] Optimize loop: analysis stored");
    }

    markRun("optimize");
    return analysis ? "Performance analysis generated" : null;
  } catch (err: any) {
    console.error("[Orchestrator] Optimize loop error:", err.message);
    markRun("optimize");
    return null;
  }
}

// ─── Helper: Check Platform Daily Limit ──────────────────────────────────────

export async function isPlatformAtDailyLimit(platform: string): Promise<boolean> {
  const limit = PLATFORM_DAILY_LIMITS[platform];
  if (!limit) return false;

  const db = await getDb();
  if (!db) return false;

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM content_queue
          WHERE platform = ${platform}
          AND status IN ('posted', 'posting', 'ready')
          AND (posted_at > CURDATE() OR (scheduled_for >= CURDATE() AND scheduled_for < CURDATE() + INTERVAL 1 DAY))`
    ) as any;
    const count = rows?.[0]?.cnt || 0;
    return count >= limit;
  } catch {
    return false;
  }
}

// ─── Helper: Get Next Scheduled Time ─────────────────────────────────────────
// Spreads posts throughout the day at optimal times

function getNextScheduledTime(platform: string): Date {
  const now = new Date();
  const hour = now.getHours();

  // Optimal posting windows per platform (in UTC, adjust for your timezone)
  const optimalHours: Record<string, number[]> = {
    instagram: [9, 12, 17],     // morning, lunch, evening
    facebook: [9, 13, 16],
    x: [8, 12, 15, 18, 21],    // more frequent for X
    linkedin: [8, 10, 17],      // business hours
    youtube: [14, 17],           // afternoon
    tiktok: [10, 14, 19],
  };

  const hours = optimalHours[platform] || [10, 14, 18];

  // Find next optimal hour
  let targetHour = hours.find(h => h > hour);
  const targetDate = new Date(now);

  if (!targetHour) {
    // All optimal hours passed today, schedule for tomorrow
    targetHour = hours[0];
    targetDate.setDate(targetDate.getDate() + 1);
  }

  targetDate.setHours(targetHour, Math.floor(Math.random() * 30), 0, 0); // random minute within first 30 min
  return targetDate;
}

// ─── 5. Revenue Optimization Loop ────────────────────────────────────────────
// Runs daily: analyzes revenue data, optimizes CTAs, adjusts strategy

async function runRevenueLoop(): Promise<string | null> {
  if (!canRun("revenue", 1440)) return null; // once per day

  try {
    const { optimizeRevenue } = await import("./revenue-engine");
    const result = await optimizeRevenue();
    markRun("revenue");

    if (result) {
      return `Revenue optimized: ${result.ctaAdjustments.length} CTA adjustments, strategy: ${result.strategyNote.substring(0, 100)}`;
    }
    return null;
  } catch (err: any) {
    console.error("[Orchestrator] Revenue loop error:", err.message);
    markRun("revenue");
    return null;
  }
}

// ─── 6. Strategy Brain Loop ─────────────────────────────────────────────────
// Runs every 12 hours: self-improving feedback loop

async function runStrategyLoop(): Promise<string | null> {
  if (!canRun("strategy", 720)) return null; // every 12 hours

  try {
    const { runStrategyUpdate } = await import("./strategy-brain");
    const result = await runStrategyUpdate();
    markRun("strategy");

    if (result.updated) {
      return `Strategy updated: ${result.changes.join("; ")}`;
    }
    return null;
  } catch (err: any) {
    console.error("[Orchestrator] Strategy loop error:", err.message);
    markRun("strategy");
    return null;
  }
}

// ─── 7. Niche Discovery Loop ────────────────────────────────────────────────
// Runs weekly: discovers and validates new niches

async function runNicheLoop(): Promise<string | null> {
  if (!canRun("niche", 10080)) return null; // once per week (7 * 24 * 60)

  try {
    const { runNicheDiscoveryLoop } = await import("./niche-expander");
    const result = await runNicheDiscoveryLoop();
    markRun("niche");
    return result;
  } catch (err: any) {
    console.error("[Orchestrator] Niche loop error:", err.message);
    markRun("niche");
    return null;
  }
}

// ─── Main Orchestrator Entry Point ───────────────────────────────────────────
// Called by Mission Control on each 30-minute cycle

export async function runOrchestration(): Promise<{
  actions: string[];
  errors: string[];
}> {
  const actions: string[] = [];
  const errors: string[] = [];

  console.log("[Orchestrator] Running orchestration cycle...");

  // Run all loops (each has its own rate limiting)
  const loops: { name: string; fn: () => Promise<string | null> }[] = [
    { name: "research", fn: runResearchLoop },
    { name: "replenish", fn: runReplenishLoop },
    { name: "quality", fn: runQualityLoop },
    { name: "engagement", fn: runEngagementLoop },
    { name: "optimize", fn: runOptimizeLoop },
    { name: "revenue", fn: runRevenueLoop },
    { name: "strategy", fn: runStrategyLoop },
    { name: "niche", fn: runNicheLoop },
  ];

  for (const loop of loops) {
    try {
      const result = await loop.fn();
      if (result) {
        actions.push(`[${loop.name}] ${result}`);
      }
    } catch (err: any) {
      errors.push(`[${loop.name}] ${err.message}`);
      console.error(`[Orchestrator] ${loop.name} error:`, err.message);
    }
  }

  if (actions.length > 0) {
    console.log(`[Orchestrator] Cycle complete: ${actions.length} actions taken`);
  } else {
    console.log("[Orchestrator] Cycle complete: no actions needed");
  }

  return { actions, errors };
}
