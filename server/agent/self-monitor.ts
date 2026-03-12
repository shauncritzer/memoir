/**
 * SELF-MONITORING SYSTEM — Engine Health & Diagnostics
 *
 * The engine watches itself. Checks all integrations, pipeline health,
 * database connectivity, scheduler status, and platform connections.
 *
 * This is the foundation of self-healing:
 *   1. Detect: something is broken (this module)
 *   2. Diagnose: why it broke (LLM analysis of error patterns)
 *   3. Alert: Telegram notification with diagnosis (Tier 1-2 auto, Tier 3-4 ask)
 *   4. Fix: (future) Claude Code auto-repair via GitHub API
 *
 * Endpoints:
 *   GET  /api/engine/health    — quick health check (suitable for uptime monitors)
 *   POST /api/engine/diagnose  — full diagnostic run (all integrations)
 *
 * Called by: Mission Control on each cycle (monitorSystemHealth)
 *            n8n hourly health check workflow
 */

import cron from "node-cron";
import { ENV } from "../_core/env";

// ─── Types ──────────────────────────────────────────────────────────────────

export type HealthStatus = "healthy" | "degraded" | "critical";

export type ComponentHealth = {
  name: string;
  status: HealthStatus;
  message: string;
  lastChecked: string;
  details?: Record<string, any>;
};

export type EngineHealth = {
  overall: HealthStatus;
  uptime: number;
  timestamp: string;
  components: ComponentHealth[];
  warnings: string[];
  criticals: string[];
};

export type DiagnosticReport = {
  timestamp: string;
  overall: HealthStatus;
  components: ComponentHealth[];
  pipelineStats: {
    pendingPosts: number;
    readyPosts: number;
    postedLast24h: number;
    failedLast24h: number;
    errorRate: number;
  };
  integrations: {
    name: string;
    configured: boolean;
    working: boolean;
    error?: string;
  }[];
  recommendations: string[];
};

// ─── Server Start Timestamp ─────────────────────────────────────────────────

const SERVER_START = Date.now();

// ─── Alert Deduplication ────────────────────────────────────────────────────
// Track last alert sent by type to avoid spamming Telegram with the same alert.
// Key: alert type string, Value: timestamp (ms) when last sent.
const lastAlertSent = new Map<string, number>();
const ALERT_DEDUP_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

function shouldSendAlert(alertType: string): boolean {
  const lastSent = lastAlertSent.get(alertType);
  if (lastSent && Date.now() - lastSent < ALERT_DEDUP_WINDOW_MS) {
    return false;
  }
  lastAlertSent.set(alertType, Date.now());
  return true;
}

// ─── Quick Health Check ─────────────────────────────────────────────────────

/**
 * Fast health check — suitable for uptime monitors and load balancers.
 * Checks: database, scheduler running, no critical pipeline failures.
 */
export async function getEngineHealth(): Promise<EngineHealth> {
  const components: ComponentHealth[] = [];
  const warnings: string[] = [];
  const criticals: string[] = [];

  // 1. Database
  const dbHealth = await checkDatabase();
  components.push(dbHealth);
  if (dbHealth.status === "critical") criticals.push("Database connection failed");
  else if (dbHealth.status === "degraded") warnings.push("Database responding slowly");

  // 2. Content Pipeline
  const pipelineHealth = await checkPipeline();
  components.push(pipelineHealth);
  if (pipelineHealth.status === "critical") criticals.push("Content pipeline has high failure rate");
  else if (pipelineHealth.status === "degraded") warnings.push("Content pipeline has some failures");

  // 3. LLM Provider
  const llmHealth = await checkLLM();
  components.push(llmHealth);
  if (llmHealth.status === "critical") criticals.push("No LLM provider available");

  // 4. Integrations (quick config check, no API calls)
  const integrationHealth = checkIntegrationConfigs();
  components.push(integrationHealth);

  // Determine overall status
  let overall: HealthStatus = "healthy";
  if (criticals.length > 0) overall = "critical";
  else if (warnings.length > 0) overall = "degraded";

  return {
    overall,
    uptime: Math.floor((Date.now() - SERVER_START) / 1000),
    timestamp: new Date().toISOString(),
    components,
    warnings,
    criticals,
  };
}

// ─── Full Diagnostic Run ────────────────────────────────────────────────────

/**
 * Comprehensive diagnostic — tests every integration, analyzes pipeline stats,
 * generates recommendations. Takes 10-30 seconds.
 */
export async function runFullDiagnostic(): Promise<DiagnosticReport> {
  const components: ComponentHealth[] = [];
  const integrations: DiagnosticReport["integrations"] = [];
  const recommendations: string[] = [];

  // 1. Database
  const dbHealth = await checkDatabase();
  components.push(dbHealth);

  // 2. Content Pipeline stats
  const pipelineStats = await getPipelineStats();
  const pipelineHealth = await checkPipeline();
  components.push(pipelineHealth);

  // 3. LLM
  const llmHealth = await checkLLM();
  components.push(llmHealth);

  // 4. Test each integration
  const integrationChecks = [
    { name: "Telegram", check: checkTelegram },
    { name: "Tavily (Web Research)", check: checkTavily },
    { name: "Browserbase", check: checkBrowserbase },
    { name: "Supabase (Vector Memory)", check: checkSupabase },
    { name: "Stripe", check: checkStripe },
    { name: "Meta (Instagram/Facebook)", check: checkMeta },
    { name: "Replicate (Flux Images)", check: checkReplicate },
    { name: "HeyGen (Video)", check: checkHeyGen },
    { name: "LangSmith", check: checkLangSmith },
  ];

  for (const integration of integrationChecks) {
    try {
      const result = await integration.check();
      integrations.push({ name: integration.name, ...result });
    } catch (err: any) {
      integrations.push({
        name: integration.name,
        configured: false,
        working: false,
        error: err.message,
      });
    }
  }

  // Generate recommendations
  if (pipelineStats.errorRate > 0.5) {
    recommendations.push(
      `High pipeline error rate (${(pipelineStats.errorRate * 100).toFixed(1)}%). Check platform API tokens and rate limits.`
    );
  }
  if (pipelineStats.pendingPosts > 20) {
    recommendations.push(
      `${pipelineStats.pendingPosts} posts stuck in pending. Content generation may be failing — check LLM provider.`
    );
  }
  if (pipelineStats.postedLast24h === 0 && pipelineStats.readyPosts > 0) {
    recommendations.push(
      "Posts are ready but none posted in 24h. Check scheduler cron and platform API connections."
    );
  }

  const notConfigured = integrations.filter(i => !i.configured);
  if (notConfigured.length > 0) {
    recommendations.push(
      `${notConfigured.length} integration(s) not configured: ${notConfigured.map(i => i.name).join(", ")}. Add env vars in Railway.`
    );
  }

  const configuredButBroken = integrations.filter(i => i.configured && !i.working);
  if (configuredButBroken.length > 0) {
    recommendations.push(
      `${configuredButBroken.length} integration(s) configured but failing: ${configuredButBroken.map(i => `${i.name} (${i.error})`).join("; ")}`
    );
  }

  // Determine overall
  let overall: HealthStatus = "healthy";
  if (components.some(c => c.status === "critical")) overall = "critical";
  else if (components.some(c => c.status === "degraded") || configuredButBroken.length > 0) overall = "degraded";

  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    overall,
    components,
    pipelineStats,
    integrations,
    recommendations,
  };

  // Send critical alerts to Telegram (deduplicated — same alert type skipped within 2h)
  if (overall === "critical") {
    const alertType = `critical:${components.filter(c => c.status === "critical").map(c => c.name).sort().join(",")}`;
    if (shouldSendAlert(alertType)) {
      try {
        const { isTelegramConfigured, sendCriticalAlert } = await import("./telegram");
        if (isTelegramConfigured()) {
          await sendCriticalAlert(
            "Engine Health Critical",
            `${components.filter(c => c.status === "critical").map(c => c.message).join(". ")}`,
            recommendations.join("\n")
          );
        }
      } catch {
        // Can't send Telegram — probably part of the problem
      }
    } else {
      console.log(`[SelfMonitor] Skipping duplicate alert: ${alertType} (sent within last 2h)`);
    }
  }

  // Store diagnostic report in DB
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (db) {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`INSERT INTO agent_reports
        (report_type, title, content, metrics)
        VALUES (
          'diagnostic',
          ${`Engine Diagnostic — ${overall}`},
          ${JSON.stringify(report, null, 2)},
          ${JSON.stringify({ overall, integrations: integrations.length, recommendations: recommendations.length })}
        )`);
    }
  } catch {
    // Non-critical
  }

  return report;
}

// ─── Component Checks ───────────────────────────────────────────────────────

async function checkDatabase(): Promise<ComponentHealth> {
  const now = new Date().toISOString();
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) {
      return { name: "Database", status: "critical", message: "Cannot connect to database", lastChecked: now };
    }

    const { sql } = await import("drizzle-orm");
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;

    if (latency > 5000) {
      return { name: "Database", status: "degraded", message: `Database slow (${latency}ms)`, lastChecked: now, details: { latency } };
    }

    return { name: "Database", status: "healthy", message: `Connected (${latency}ms)`, lastChecked: now, details: { latency } };
  } catch (err: any) {
    return { name: "Database", status: "critical", message: `Database error: ${err.message}`, lastChecked: now };
  }
}

async function checkPipeline(): Promise<ComponentHealth> {
  const now = new Date().toISOString();
  try {
    const stats = await getPipelineStats();

    if (stats.errorRate > 0.5) {
      // High failure rate — attempt self-healing before alerting
      try {
        const { attemptSelfHeal } = await import("./self-heal");
        const healResults = await attemptSelfHeal();

        const anySuccess = healResults.some(r => r.success);
        const allAttempted = healResults.filter(r => r.attempted);
        const healSummary = healResults
          .map(r => `${r.platform}/${r.category}: ${r.success ? "FIXED" : "FAILED"} — ${r.message.slice(0, 100)}`)
          .join("; ");

        if (anySuccess) {
          // At least one fix worked — send success notification, downgrade severity
          const alertType = "self_heal_success";
          if (shouldSendAlert(alertType)) {
            try {
              const { isTelegramConfigured, sendMessage } = await import("./telegram");
              if (isTelegramConfigured()) {
                await sendMessage(
                  `✅ *Self-Heal Success*\n\nPipeline failure rate: ${(stats.errorRate * 100).toFixed(0)}%\n\nFixes applied:\n${healResults.filter(r => r.success).map(r => `• ${r.platform}: ${r.message}`).join("\n")}`
                );
              }
            } catch { /* Can't send Telegram */ }
          }

          return {
            name: "Content Pipeline",
            status: "degraded",
            message: `${(stats.errorRate * 100).toFixed(0)}% failure rate — self-heal applied (${allAttempted.length} fixes attempted)`,
            lastChecked: now,
            details: { ...stats, selfHeal: healResults },
          };
        }

        // No fixes worked — return critical with heal details attached
        return {
          name: "Content Pipeline",
          status: "critical",
          message: `${(stats.errorRate * 100).toFixed(0)}% failure rate — self-heal failed`,
          lastChecked: now,
          details: { ...stats, selfHeal: healResults, healSummary },
        };
      } catch (healErr: any) {
        console.error("[SelfMonitor] Self-heal error:", healErr.message);
        return { name: "Content Pipeline", status: "critical", message: `${(stats.errorRate * 100).toFixed(0)}% failure rate`, lastChecked: now, details: stats };
      }
    }
    if (stats.errorRate > 0.2) {
      return { name: "Content Pipeline", status: "degraded", message: `${(stats.errorRate * 100).toFixed(0)}% failure rate`, lastChecked: now, details: stats };
    }

    return {
      name: "Content Pipeline",
      status: "healthy",
      message: `${stats.postedLast24h} posted, ${stats.readyPosts} ready, ${stats.pendingPosts} pending`,
      lastChecked: now,
      details: stats,
    };
  } catch (err: any) {
    return { name: "Content Pipeline", status: "degraded", message: `Cannot check pipeline: ${err.message}`, lastChecked: now };
  }
}

async function checkLLM(): Promise<ComponentHealth> {
  const now = new Date().toISOString();

  const hasGemini = !!ENV.googleApiKey;
  const hasOpenAI = !!ENV.openaiApiKey;
  const hasForge = !!ENV.forgeApiKey;

  if (!hasGemini && !hasOpenAI && !hasForge) {
    return { name: "LLM Provider", status: "critical", message: "No LLM API key configured", lastChecked: now };
  }

  const providers: string[] = [];
  if (hasForge) providers.push("Forge");
  if (hasGemini) providers.push("Gemini");
  if (hasOpenAI) providers.push("OpenAI");

  return {
    name: "LLM Provider",
    status: "healthy",
    message: `Available: ${providers.join(", ")}`,
    lastChecked: now,
    details: { providers },
  };
}

function checkIntegrationConfigs(): ComponentHealth {
  const now = new Date().toISOString();
  const configured: string[] = [];
  const missing: string[] = [];

  if (ENV.telegramBotToken && ENV.telegramChatId) configured.push("Telegram");
  else missing.push("Telegram");

  if (ENV.tavilyApiKey) configured.push("Tavily");
  else missing.push("Tavily");

  if (ENV.browserbaseApiKey) configured.push("Browserbase");
  else missing.push("Browserbase");

  if (ENV.supabaseUrl) configured.push("Supabase");
  else missing.push("Supabase");

  if (ENV.replicateApiToken) configured.push("Replicate");
  else missing.push("Replicate");

  if (process.env.META_PAGE_ACCESS_TOKEN) configured.push("Meta");
  else missing.push("Meta");

  const status: HealthStatus = missing.length > 3 ? "degraded" : "healthy";

  return {
    name: "Integrations",
    status,
    message: `${configured.length} configured, ${missing.length} missing`,
    lastChecked: now,
    details: { configured, missing },
  };
}

// ─── Integration-Specific Checks ────────────────────────────────────────────

async function checkTelegram(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  if (!ENV.telegramBotToken || !ENV.telegramChatId) {
    return { configured: false, working: false, error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set" };
  }
  try {
    const { diagnoseTelegram } = await import("./telegram");
    const result = await diagnoseTelegram();
    return { configured: result.configured, working: result.botWorking, error: result.error };
  } catch (err: any) {
    return { configured: true, working: false, error: err.message };
  }
}

async function checkTavily(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  if (!ENV.tavilyApiKey) {
    return { configured: false, working: false, error: "TAVILY_API_KEY not set" };
  }
  // Don't burn API credits on health checks — just verify config
  return { configured: true, working: true };
}

async function checkBrowserbase(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  if (!ENV.browserbaseApiKey || !ENV.browserbaseProjectId) {
    return { configured: false, working: false, error: "BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID not set" };
  }
  // Don't burn browser minutes on health checks — just verify config
  return { configured: true, working: true };
}

async function checkSupabase(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    return { configured: false, working: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set" };
  }
  try {
    const { isVectorMemoryConfigured } = await import("./vector-memory");
    return { configured: true, working: isVectorMemoryConfigured() };
  } catch (err: any) {
    return { configured: true, working: false, error: err.message };
  }
}

async function checkStripe(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { configured: false, working: false, error: "STRIPE_SECRET_KEY not set" };
  }
  // Verify key format
  if (key.startsWith("sk_live_") || key.startsWith("sk_test_")) {
    return { configured: true, working: true };
  }
  return { configured: true, working: false, error: "Invalid Stripe key format" };
}

async function checkMeta(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) {
    return { configured: false, working: false, error: "META_PAGE_ACCESS_TOKEN or META_PAGE_ID not set" };
  }
  return { configured: true, working: true };
}

async function checkReplicate(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  if (!ENV.replicateApiToken) {
    return { configured: false, working: false, error: "REPLICATE_API_TOKEN not set" };
  }
  return { configured: true, working: true };
}

async function checkHeyGen(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  if (!ENV.heygenApiKey) {
    return { configured: false, working: false, error: "HEYGEN_API_KEY not set" };
  }
  return { configured: true, working: true };
}

async function checkLangSmith(): Promise<{ configured: boolean; working: boolean; error?: string }> {
  if (!ENV.langsmithApiKey || !ENV.langchainTracing) {
    return { configured: false, working: false, error: "LANGCHAIN_API_KEY not set or LANGCHAIN_TRACING_V2 not true" };
  }
  return { configured: true, working: true };
}

// ─── Pipeline Stats ─────────────────────────────────────────────────────────

async function getPipelineStats(): Promise<DiagnosticReport["pipelineStats"]> {
  const defaults = { pendingPosts: 0, readyPosts: 0, postedLast24h: 0, failedLast24h: 0, errorRate: 0 };

  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return defaults;

    const { sql } = await import("drizzle-orm");

    const [rows] = await db.execute(sql`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_count,
        SUM(CASE WHEN status = 'posted' AND posted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as posted_24h,
        SUM(CASE WHEN status = 'failed' AND updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as failed_24h
      FROM content_queue
    `) as any;

    const row = (rows as any[])?.[0] || {};
    const posted = parseInt(row.posted_24h || "0", 10);
    const failed = parseInt(row.failed_24h || "0", 10);
    const total = posted + failed;

    return {
      pendingPosts: parseInt(row.pending_count || "0", 10),
      readyPosts: parseInt(row.ready_count || "0", 10),
      postedLast24h: posted,
      failedLast24h: failed,
      errorRate: total > 0 ? failed / total : 0,
    };
  } catch {
    return defaults;
  }
}

// ─── Cron-based Self-Monitor ───────────────────────────────────────────────

/**
 * Start the self-monitor on a 30-minute cron schedule.
 * Runs a full diagnostic and sends Telegram alerts for critical/degraded status.
 * Called once on server boot alongside Mission Control and the content scheduler.
 */
export function startSelfMonitor(): void {
  console.log("[SelfMonitor] Starting 30-minute health check cron...");

  // Run once on startup (delayed 60s to let other services initialize)
  setTimeout(async () => {
    try {
      console.log("[SelfMonitor] Running initial health check...");
      const report = await runFullDiagnostic();
      console.log(`[SelfMonitor] Initial check: ${report.overall} — ${report.recommendations.length} recommendations`);
    } catch (err: any) {
      console.error("[SelfMonitor] Initial check failed:", err.message);
    }
  }, 60_000);

  // Every 30 minutes: */30 * * * *
  cron.schedule("*/30 * * * *", async () => {
    try {
      console.log("[SelfMonitor] Running scheduled health check...");
      const report = await runFullDiagnostic();
      console.log(`[SelfMonitor] Health: ${report.overall} — ${report.components.length} components, ${report.recommendations.length} recommendations`);
    } catch (err: any) {
      console.error("[SelfMonitor] Scheduled check failed:", err.message);
    }
  });
}
