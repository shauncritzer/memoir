/**
 * MISSION CONTROL - Autonomous Agent System
 *
 * Runs on a scheduled loop, monitoring all businesses, tracking KPIs,
 * making automated decisions, and alerting Shaun when human input is needed.
 *
 * Architecture:
 *   Agent Loop (cron) → Check each business context → Run monitors →
 *   Take automated actions → Generate reports → Send alerts
 *
 * Businesses managed:
 *   - Memoir/Recovery (shauncritzer.com) - content, courses, social
 *   - Cabinetry (family business) - leads, scheduling, marketing
 *   - PassiveAffiliate.ai (SaaS) - platform development, users
 */

import cron from "node-cron";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Types ─────────────────────────────────────────────────────────────────

export type BusinessContext = {
  id: string;
  name: string;
  domain?: string;
  active: boolean;
};

export type AgentAlert = {
  severity: "info" | "warning" | "critical";
  business: string;
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedAction?: string;
  timestamp: Date;
};

export type KPISnapshot = {
  business: string;
  period: string;
  metrics: Record<string, number | string>;
  trends: Record<string, "up" | "down" | "stable">;
  generatedAt: Date;
};

export type AgentState = {
  lastRun: Date | null;
  lastReport: Date | null;
  alerts: AgentAlert[];
  kpis: KPISnapshot[];
  isRunning: boolean;
};

// ─── State ─────────────────────────────────────────────────────────────────

const state: AgentState = {
  lastRun: null,
  lastReport: null,
  alerts: [],
  kpis: [],
  isRunning: false,
};

// ─── Business Contexts ─────────────────────────────────────────────────────

const BUSINESSES: BusinessContext[] = [
  {
    id: "memoir",
    name: "Shaun Critzer - Recovery & Coaching",
    domain: "shauncritzer.com",
    active: true,
  },
  {
    id: "cabinetry",
    name: "Family Cabinetry Business",
    active: false, // Enable when ready
  },
  {
    id: "passiveaffiliate",
    name: "PassiveAffiliate.ai SaaS",
    domain: "passiveaffiliate.ai",
    active: false, // Enable when ready
  },
];

// ─── Monitor Functions ─────────────────────────────────────────────────────

async function monitorContentPipeline(): Promise<AgentAlert[]> {
  const alerts: AgentAlert[] = [];
  const db = await getDb();
  if (!db) return alerts;

  try {
    const { sql } = await import("drizzle-orm");

    const [failedRows] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM content_queue WHERE status = 'failed' AND updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    ) as any;
    const failedCount = failedRows?.[0]?.cnt || 0;

    if (failedCount > 0) {
      alerts.push({
        severity: "warning",
        business: "memoir",
        title: "Content posting failures",
        message: `${failedCount} posts failed in the last 24 hours`,
        actionRequired: failedCount > 5,
        suggestedAction: "Check the Content Pipeline page for error details",
        timestamp: new Date(),
      });
    }

    const [recentPosts] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM content_queue WHERE status = 'posted' AND posted_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)`
    ) as any;
    const recentCount = recentPosts?.[0]?.cnt || 0;

    if (recentCount === 0) {
      alerts.push({
        severity: "warning",
        business: "memoir",
        title: "No content posted recently",
        message: "No social media content has been posted in the last 48 hours",
        actionRequired: true,
        suggestedAction: "Check scheduler status and generate new content",
        timestamp: new Date(),
      });
    }

    const [readyRows] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM content_queue WHERE status = 'ready'`
    ) as any;
    const readyCount = readyRows?.[0]?.cnt || 0;

    if (readyCount < 5) {
      alerts.push({
        severity: "info",
        business: "memoir",
        title: "Content queue running low",
        message: `Only ${readyCount} posts queued and ready. Consider generating more content.`,
        actionRequired: false,
        suggestedAction: "Generate content from recent blog posts or AI topics",
        timestamp: new Date(),
      });
    }
  } catch (err: any) {
    console.error("[MissionControl] Content pipeline monitor error:", err.message);
  }

  return alerts;
}

async function monitorEngagement(): Promise<{ alerts: AgentAlert[]; kpi: KPISnapshot | null }> {
  const alerts: AgentAlert[] = [];
  const db = await getDb();
  if (!db) return { alerts, kpi: null };

  try {
    const { sql } = await import("drizzle-orm");

    const [platformStats] = await db.execute(
      sql`SELECT platform, COUNT(*) as total_posts,
          SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
          FROM content_queue
          WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY platform`
    ) as any;

    const metrics: Record<string, number | string> = {};
    const trends: Record<string, "up" | "down" | "stable"> = {};

    for (const row of (platformStats as any[]) || []) {
      metrics[`${row.platform}_posts`] = row.successful || 0;
      metrics[`${row.platform}_failed`] = row.failed || 0;
      trends[`${row.platform}_posts`] = "stable";
    }

    const [userStats] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM users WHERE createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)`
    ) as any;
    metrics.new_users_7d = userStats?.[0]?.cnt || 0;

    const [blogStats] = await db.execute(
      sql`SELECT SUM(views) as total_views FROM blog_posts WHERE updated_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`
    ) as any;
    metrics.blog_views_7d = blogStats?.[0]?.total_views || 0;

    const kpi: KPISnapshot = {
      business: "memoir",
      period: "7d",
      metrics,
      trends,
      generatedAt: new Date(),
    };

    return { alerts, kpi };
  } catch (err: any) {
    console.error("[MissionControl] Engagement monitor error:", err.message);
    return { alerts, kpi: null };
  }
}

async function monitorSystemHealth(): Promise<AgentAlert[]> {
  const alerts: AgentAlert[] = [];

  const db = await getDb();
  if (!db) {
    alerts.push({
      severity: "critical",
      business: "memoir",
      title: "Database unreachable",
      message: "Cannot connect to the database. All services are affected.",
      actionRequired: true,
      suggestedAction: "Check Railway MySQL service status",
      timestamp: new Date(),
    });
    return alerts;
  }

  const socialChecks = [
    { name: "Twitter/X", keys: ["TWITTER_CONSUMER_KEY", "TWITTER_ACCESS_TOKEN"] },
    { name: "Facebook", keys: ["META_PAGE_ACCESS_TOKEN", "META_PAGE_ID"] },
    { name: "LinkedIn", keys: ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_PERSON_URN"] },
    { name: "OpenAI (DALL-E)", keys: ["OPENAI_API_KEY"] },
  ];

  for (const check of socialChecks) {
    const missing = check.keys.filter(k => !process.env[k]);
    if (missing.length > 0) {
      alerts.push({
        severity: "info",
        business: "memoir",
        title: `${check.name} not configured`,
        message: `Missing env vars: ${missing.join(", ")}`,
        actionRequired: false,
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

// ─── AI Analysis ───────────────────────────────────────────────────────────

async function generateWeeklyBriefing(kpis: KPISnapshot[], alerts: AgentAlert[]): Promise<string> {
  const promptText = `You are the AI operations manager for Shaun Critzer's businesses.
Generate a brief, actionable weekly report based on this data.

KPIs:
${JSON.stringify(kpis, null, 2)}

Recent Alerts:
${JSON.stringify(alerts.slice(0, 20), null, 2)}

Format as:
## Weekly Briefing - [date]
### What's Working
- bullet points
### Needs Attention
- bullet points with specific actions
### Recommendations
- 2-3 specific, actionable suggestions

Keep it concise and direct. Shaun is a busy founder - give him the 60-second version.`;

  try {
    const result = await invokeLLM({
      messages: [{ role: "user", content: promptText }],
      maxTokens: 1000,
    });
    return result.choices?.[0]?.message?.content as string || "No briefing generated";
  } catch (err: any) {
    return `## Weekly Briefing - ${new Date().toLocaleDateString()}\n\n*AI analysis unavailable: ${err.message}*\n\nRaw metrics: ${JSON.stringify(kpis)}`;
  }
}

// ─── Main Agent Loop ───────────────────────────────────────────────────────

export async function runAgentCycle(): Promise<AgentState> {
  if (state.isRunning) {
    console.log("[MissionControl] Agent cycle already running, skipping");
    return state;
  }

  state.isRunning = true;
  console.log("[MissionControl] Starting agent cycle...");

  try {
    const allAlerts: AgentAlert[] = [];

    const [contentAlerts, engagementResult, healthAlerts] = await Promise.all([
      monitorContentPipeline(),
      monitorEngagement(),
      monitorSystemHealth(),
    ]);

    allAlerts.push(...contentAlerts, ...engagementResult.alerts, ...healthAlerts);

    state.alerts = allAlerts;
    if (engagementResult.kpi) {
      state.kpis = [engagementResult.kpi];
    }
    state.lastRun = new Date();

    const criticalCount = allAlerts.filter(a => a.severity === "critical").length;
    const warningCount = allAlerts.filter(a => a.severity === "warning").length;
    console.log(`[MissionControl] Cycle complete: ${criticalCount} critical, ${warningCount} warnings, ${allAlerts.length} total alerts`);

    if (!state.lastReport || (Date.now() - state.lastReport.getTime()) > 7 * 24 * 60 * 60 * 1000) {
      console.log("[MissionControl] Generating weekly briefing...");
      try {
        await generateWeeklyBriefing(state.kpis, state.alerts);
        console.log("[MissionControl] Weekly briefing generated");
        state.lastReport = new Date();
      } catch (err: any) {
        console.error("[MissionControl] Briefing generation failed:", err.message);
      }
    }
  } catch (err: any) {
    console.error("[MissionControl] Agent cycle error:", err);
  } finally {
    state.isRunning = false;
  }

  return state;
}

export function getAgentState(): AgentState {
  return { ...state };
}

export function getBusinesses(): BusinessContext[] {
  return BUSINESSES;
}

export function startMissionControl(): void {
  console.log("[MissionControl] Starting autonomous agent...");

  cron.schedule("*/30 * * * *", async () => {
    try {
      await runAgentCycle();
    } catch (err: any) {
      console.error("[MissionControl] Scheduled cycle failed:", err.message);
    }
  });

  setTimeout(async () => {
    try {
      await runAgentCycle();
    } catch (err: any) {
      console.error("[MissionControl] Initial cycle failed:", err.message);
    }
  }, 60_000);

  console.log("[MissionControl] Agent started - monitoring every 30 minutes");
}
