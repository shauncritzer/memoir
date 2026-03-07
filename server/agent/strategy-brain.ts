/**
 * STRATEGY BRAIN — Self-Improving Feedback Loop
 *
 * This is what makes the system actually get SMARTER over time.
 * It reads all the data, finds patterns, and adjusts the entire system.
 *
 * Loop:
 *   1. Collect all data (content performance, revenue, engagement, growth)
 *   2. Identify patterns (what works, what doesn't, what's changing)
 *   3. Generate strategy adjustments (content themes, posting times, platforms, CTAs)
 *   4. Apply adjustments to the content generator's behavior
 *   5. Track if adjustments worked → feed back into next cycle
 *
 * The "strategy state" is persisted in agent_reports so it survives restarts.
 * Each cycle builds on previous learnings.
 *
 * Risk Tiers:
 *   Tier 1: Analysis and reporting
 *   Tier 2: Content strategy adjustments, posting schedule changes
 *   Tier 3: Platform priority changes, budget recommendations
 */

import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Types ──────────────────────────────────────────────────────────────────

export type StrategyState = {
  /** Last updated */
  lastUpdated: string;
  /** Content themes that are working */
  winningThemes: string[];
  /** Content themes to avoid */
  losingThemes: string[];
  /** Best posting times per platform */
  bestPostingTimes: Record<string, string[]>;
  /** Platform priority order (highest ROI first) */
  platformPriority: string[];
  /** Content mix ratios (e.g., 40% educational, 30% personal story, 20% promotional, 10% engagement) */
  contentMix: Record<string, number>;
  /** Hashtag strategy per platform */
  hashtagStrategy: Record<string, string[]>;
  /** Tone adjustments */
  toneNotes: string;
  /** Current focus areas */
  focusAreas: string[];
  /** Experiments currently running */
  activeExperiments: { name: string; hypothesis: string; startDate: string; metric: string }[];
  /** Completed experiments with results */
  completedExperiments: { name: string; result: string; learning: string }[];
  /** Cumulative learnings (grows over time) */
  cumulativeLearnings: string[];
};

const DEFAULT_STRATEGY: StrategyState = {
  lastUpdated: new Date().toISOString(),
  winningThemes: ["personal recovery stories", "neuroscience-backed tips", "daily motivation"],
  losingThemes: [],
  bestPostingTimes: {
    instagram: ["9:00", "12:00", "17:00"],
    facebook: ["9:00", "13:00", "16:00"],
    x: ["8:00", "12:00", "15:00", "18:00"],
    linkedin: ["8:00", "10:00", "17:00"],
  },
  platformPriority: ["instagram", "facebook", "linkedin", "x", "youtube", "tiktok"],
  contentMix: {
    educational: 35,
    personal_story: 25,
    motivational: 20,
    promotional: 15,
    engagement: 5,
  },
  hashtagStrategy: {
    instagram: ["#soberlife", "#recoveryispossible", "#addictionrecovery", "#sobriety", "#mentalhealth"],
    facebook: ["#recovery", "#sobriety", "#wellness"],
    linkedin: ["#mentalhealth", "#wellness", "#leadership", "#recovery"],
  },
  toneNotes: "Authentic, direct, encouraging. First-person where possible. Science-backed but accessible.",
  focusAreas: ["grow email list", "increase 7-Day Reset sales", "build YouTube presence"],
  activeExperiments: [],
  completedExperiments: [],
  cumulativeLearnings: [],
};

// ─── Strategy Persistence ───────────────────────────────────────────────────

async function loadStrategy(): Promise<StrategyState> {
  const db = await getDb();
  if (!db) return { ...DEFAULT_STRATEGY };

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT content, metrics FROM agent_reports
          WHERE report_type = 'strategy_state'
          ORDER BY created_at DESC LIMIT 1`
    ) as any;

    const row = (rows as any[])?.[0];
    if (!row?.metrics) return { ...DEFAULT_STRATEGY };

    try {
      return JSON.parse(row.metrics) as StrategyState;
    } catch {
      return { ...DEFAULT_STRATEGY };
    }
  } catch {
    return { ...DEFAULT_STRATEGY };
  }
}

async function saveStrategy(strategy: StrategyState): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`INSERT INTO agent_reports
      (report_type, title, content, metrics)
      VALUES (
        'strategy_state',
        ${`Strategy State — ${new Date().toISOString().slice(0, 10)}`},
        ${`## Current Strategy\n\n**Winning Themes:** ${strategy.winningThemes.join(", ")}\n**Losing Themes:** ${strategy.losingThemes.join(", ")}\n**Platform Priority:** ${strategy.platformPriority.join(" → ")}\n**Content Mix:** ${Object.entries(strategy.contentMix).map(([k, v]) => `${k}: ${v}%`).join(", ")}\n**Focus Areas:** ${strategy.focusAreas.join(", ")}\n**Tone:** ${strategy.toneNotes}\n\n### Active Experiments\n${strategy.activeExperiments.map(e => `- ${e.name}: ${e.hypothesis}`).join("\n") || "None"}\n\n### Cumulative Learnings\n${strategy.cumulativeLearnings.map((l, i) => `${i + 1}. ${l}`).join("\n") || "None yet"}`},
        ${JSON.stringify(strategy)}
      )`);
  } catch (err: any) {
    console.error("[StrategyBrain] Failed to save strategy:", err.message);
  }
}

// ─── Data Collection ────────────────────────────────────────────────────────

async function collectPerformanceData(): Promise<{
  topPosts: any[];
  bottomPosts: any[];
  platformStats: any[];
  recentActions: any[];
  emailGrowth: number;
  totalSubscribers: number;
}> {
  const db = await getDb();
  if (!db) return { topPosts: [], bottomPosts: [], platformStats: [], recentActions: [], emailGrowth: 0, totalSubscribers: 0 };

  const { sql } = await import("drizzle-orm");

  // Top performing posts (last 14 days)
  const [topRows] = await db.execute(
    sql`SELECT id, platform, content_type, SUBSTRING(content, 1, 200) as preview, metrics
        FROM content_queue
        WHERE status = 'posted'
        AND posted_at > DATE_SUB(NOW(), INTERVAL 14 DAY)
        AND metrics IS NOT NULL
        ORDER BY JSON_EXTRACT(metrics, '$.likes') + JSON_EXTRACT(metrics, '$.comments') + COALESCE(JSON_EXTRACT(metrics, '$.shares'), 0) DESC
        LIMIT 10`
  ) as any;

  // Bottom performing posts
  const [bottomRows] = await db.execute(
    sql`SELECT id, platform, content_type, SUBSTRING(content, 1, 200) as preview, metrics
        FROM content_queue
        WHERE status = 'posted'
        AND posted_at > DATE_SUB(NOW(), INTERVAL 14 DAY)
        AND metrics IS NOT NULL
        ORDER BY JSON_EXTRACT(metrics, '$.likes') + JSON_EXTRACT(metrics, '$.comments') ASC
        LIMIT 5`
  ) as any;

  // Posts per platform
  const [platformRows] = await db.execute(
    sql`SELECT platform, COUNT(*) as total,
        SUM(CASE WHEN metrics IS NOT NULL THEN JSON_EXTRACT(metrics, '$.likes') ELSE 0 END) as total_likes,
        SUM(CASE WHEN metrics IS NOT NULL THEN JSON_EXTRACT(metrics, '$.comments') ELSE 0 END) as total_comments
        FROM content_queue
        WHERE status = 'posted'
        AND posted_at > DATE_SUB(NOW(), INTERVAL 14 DAY)
        GROUP BY platform`
  ) as any;

  // Recent agent actions
  const [actionRows] = await db.execute(
    sql`SELECT category, title, description, risk_tier, status
        FROM agent_actions
        WHERE executed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY executed_at DESC LIMIT 20`
  ) as any;

  // Email subscriber growth
  const [subRows] = await db.execute(
    sql`SELECT COUNT(*) as total,
        SUM(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent
        FROM email_subscribers`
  ) as any;

  return {
    topPosts: (topRows as any[]) || [],
    bottomPosts: (bottomRows as any[]) || [],
    platformStats: (platformRows as any[]) || [],
    recentActions: (actionRows as any[]) || [],
    emailGrowth: Number((subRows as any[])?.[0]?.recent || 0),
    totalSubscribers: Number((subRows as any[])?.[0]?.total || 0),
  };
}

// ─── Core Strategy Update ───────────────────────────────────────────────────

export async function runStrategyUpdate(): Promise<{ updated: boolean; changes: string[] }> {
  console.log("[StrategyBrain] Running strategy update cycle...");

  const strategy = await loadStrategy();
  const data = await collectPerformanceData();
  const changes: string[] = [];

  // Build context for LLM analysis
  const topPostsSummary = data.topPosts.map((p: any) => {
    let metrics: any = {};
    try { metrics = JSON.parse(p.metrics); } catch { /* ignore */ }
    return `[${p.platform}] ${p.preview} → ${metrics.likes || 0} likes, ${metrics.comments || 0} comments`;
  }).join("\n");

  const bottomPostsSummary = data.bottomPosts.map((p: any) => {
    let metrics: any = {};
    try { metrics = JSON.parse(p.metrics); } catch { /* ignore */ }
    return `[${p.platform}] ${p.preview} → ${metrics.likes || 0} likes, ${metrics.comments || 0} comments`;
  }).join("\n");

  const platformSummary = data.platformStats.map((p: any) =>
    `${p.platform}: ${p.total} posts, ${p.total_likes || 0} likes, ${p.total_comments || 0} comments`
  ).join("\n");

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a data-driven content strategist. Analyze performance data and update the content strategy. Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `CURRENT STRATEGY:\n${JSON.stringify(strategy, null, 2)}\n\nPERFORMANCE DATA (last 14 days):\n\nTOP PERFORMERS:\n${topPostsSummary || "No data yet"}\n\nBOTTOM PERFORMERS:\n${bottomPostsSummary || "No data yet"}\n\nPLATFORM STATS:\n${platformSummary || "No data yet"}\n\nEMAIL LIST: ${data.totalSubscribers} total (+${data.emailGrowth} this week)\n\nRECENT AGENT ACTIONS: ${data.recentActions.length}\n\nBased on this data, update the strategy. Return JSON with ONLY the fields that should change:\n{\n  "winningThemes": ["updated list if patterns emerged"],\n  "losingThemes": ["themes that consistently underperform"],\n  "platformPriority": ["reordered by ROI if data suggests"],\n  "contentMix": {"educational": 35, "personal_story": 25, "motivational": 20, "promotional": 15, "engagement": 5},\n  "focusAreas": ["top 3 priorities based on data"],\n  "toneNotes": "any tone adjustments",\n  "newLearnings": ["1-3 new learnings from this cycle's data"],\n  "newExperiment": {"name": "experiment name", "hypothesis": "what we're testing", "metric": "how to measure"}\n}`,
      },
    ],
    maxTokens: 2000,
  });

  const responseText = (result.choices?.[0]?.message?.content as string) || "{}";
  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const updates = JSON.parse(cleanJson);

    // Apply updates to strategy
    if (updates.winningThemes?.length) {
      strategy.winningThemes = updates.winningThemes;
      changes.push(`Winning themes updated: ${updates.winningThemes.join(", ")}`);
    }
    if (updates.losingThemes?.length) {
      strategy.losingThemes = updates.losingThemes;
      changes.push(`Losing themes identified: ${updates.losingThemes.join(", ")}`);
    }
    if (updates.platformPriority?.length) {
      strategy.platformPriority = updates.platformPriority;
      changes.push(`Platform priority reordered: ${updates.platformPriority.join(" → ")}`);
    }
    if (updates.contentMix) {
      strategy.contentMix = updates.contentMix;
      changes.push(`Content mix adjusted`);
    }
    if (updates.focusAreas?.length) {
      strategy.focusAreas = updates.focusAreas;
      changes.push(`Focus areas: ${updates.focusAreas.join(", ")}`);
    }
    if (updates.toneNotes) {
      strategy.toneNotes = updates.toneNotes;
      changes.push("Tone notes updated");
    }
    if (updates.newLearnings?.length) {
      strategy.cumulativeLearnings.push(...updates.newLearnings);
      // Keep only last 50 learnings
      if (strategy.cumulativeLearnings.length > 50) {
        strategy.cumulativeLearnings = strategy.cumulativeLearnings.slice(-50);
      }
      changes.push(`New learnings: ${updates.newLearnings.join("; ")}`);
    }
    if (updates.newExperiment) {
      strategy.activeExperiments.push({
        ...updates.newExperiment,
        startDate: new Date().toISOString(),
      });
      changes.push(`New experiment: ${updates.newExperiment.name}`);
    }
  } catch {
    console.warn("[StrategyBrain] Failed to parse LLM strategy updates");
  }

  strategy.lastUpdated = new Date().toISOString();

  // Save updated strategy
  await saveStrategy(strategy);

  // Log the action
  const db = await getDb();
  if (db) {
    try {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`INSERT INTO agent_actions
        (category, title, description, risk_tier, status, result, executed_at)
        VALUES (
          'strategy',
          'Strategy brain update',
          ${changes.length > 0 ? `Applied ${changes.length} strategy changes: ${changes.join("; ")}` : "No changes needed — strategy is performing well"},
          ${changes.length > 0 ? 2 : 1},
          'executed',
          ${JSON.stringify({ changes, totalLearnings: strategy.cumulativeLearnings.length })},
          NOW()
        )`);
    } catch { /* skip */ }
  }

  console.log(`[StrategyBrain] Update complete: ${changes.length} changes applied`);
  return { updated: changes.length > 0, changes };
}

// ─── Get Current Strategy (for content generator) ───────────────────────────

/**
 * Returns the current strategy state so the content generator
 * can use it to create better content.
 */
export async function getCurrentStrategy(): Promise<StrategyState> {
  return loadStrategy();
}

/**
 * Get strategy guidance for a specific platform.
 * Used by content-generator.ts to adapt content.
 */
export async function getContentGuidance(platform: string): Promise<{
  themes: string[];
  avoidThemes: string[];
  contentMix: Record<string, number>;
  tone: string;
  hashtags: string[];
  bestTimes: string[];
}> {
  const strategy = await loadStrategy();

  return {
    themes: strategy.winningThemes,
    avoidThemes: strategy.losingThemes,
    contentMix: strategy.contentMix,
    tone: strategy.toneNotes,
    hashtags: strategy.hashtagStrategy[platform] || [],
    bestTimes: strategy.bestPostingTimes[platform] || [],
  };
}
