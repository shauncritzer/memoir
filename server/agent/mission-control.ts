/**
 * MISSION CONTROL - Autonomous Multi-Business Agent System
 *
 * The "brain" of DataDisco. Runs on scheduled loops, manages multiple businesses,
 * takes risk-tiered autonomous actions, generates daily briefings, and proposes
 * strategic improvements.
 *
 * Architecture:
 *   Cron Loop → Load businesses → Per-business monitors → Risk-tiered actions →
 *   Daily briefing → Store in DB → Alert via email/webhook
 *
 * Risk Tiers:
 *   1 = Auto-execute (post content, send scheduled emails)
 *   2 = Execute + notify after (spend < $25, adjust schedule)
 *   3 = Ask first (spend > $25, contact customers, new campaigns)
 *   4 = Must approve (financial decisions > $100, pricing changes, new business)
 *
 * Businesses managed:
 *   - Sober Strong Academy (shauncritzer.com) - recovery coaching, courses, content
 *   - Critzer's Cabinets (critzerscabinets.com) - cabinet business
 *   - DataDisco (SaaS) - content automation platform
 *   - Personal Brand - freedomwithshaun, affiliate marketing
 */

import cron from "node-cron";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Types ─────────────────────────────────────────────────────────────────

export type BusinessProfile = {
  id: number;
  slug: string;
  name: string;
  domain?: string;
  businessType: string;
  brandVoice?: string;
  targetAudience?: string;
  products?: any[];
  dailyBudget: number;
  monthlyBudget: number;
  spentToday: number;
  spentMonth: number;
  status: string;
};

export type AgentAlert = {
  severity: "info" | "warning" | "critical";
  businessSlug: string;
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedAction?: string;
  riskTier: number;
  category: string;
  timestamp: Date;
};

export type AgentState = {
  lastRun: Date | null;
  lastDailyBriefing: Date | null;
  isRunning: boolean;
  activeBusinesses: number;
  pendingApprovals: number;
  todayActions: number;
  alerts: AgentAlert[];
};

// ─── State ─────────────────────────────────────────────────────────────────

const state: AgentState = {
  lastRun: null,
  lastDailyBriefing: null,
  isRunning: false,
  activeBusinesses: 0,
  pendingApprovals: 0,
  todayActions: 0,
  alerts: [],
};

// ─── Database Helpers ──────────────────────────────────────────────────────

async function ensureAgentTables(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const { sql } = await import("drizzle-orm");

    await db.execute(sql`CREATE TABLE IF NOT EXISTS businesses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      domain VARCHAR(255),
      business_type VARCHAR(50) NOT NULL,
      brand_voice TEXT,
      target_audience TEXT,
      products TEXT,
      social_config TEXT,
      stripe_account_id VARCHAR(255),
      daily_budget INT NOT NULL DEFAULT 0,
      monthly_budget INT NOT NULL DEFAULT 0,
      spent_today INT NOT NULL DEFAULT 0,
      spent_month INT NOT NULL DEFAULT 0,
      status ENUM('active', 'paused', 'setup') NOT NULL DEFAULT 'setup',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await db.execute(sql`CREATE TABLE IF NOT EXISTS agent_actions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      category VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      risk_tier INT NOT NULL DEFAULT 1,
      status ENUM('proposed', 'approved', 'executing', 'executed', 'denied', 'failed') NOT NULL DEFAULT 'proposed',
      cost_estimate INT NOT NULL DEFAULT 0,
      actual_cost INT DEFAULT 0,
      result TEXT,
      error_message TEXT,
      metadata TEXT,
      approved_at TIMESTAMP NULL,
      executed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`);

    await db.execute(sql`CREATE TABLE IF NOT EXISTS agent_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      report_type VARCHAR(50) NOT NULL,
      business_id INT,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      metrics TEXT,
      suggested_actions TEXT,
      is_read INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`);

    return true;
  } catch (err: any) {
    console.error("[MissionControl] Table creation error:", err.message);
    return false;
  }
}

async function seedDefaultBusinesses(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");

    // Check if we already have businesses
    const [existing] = await db.execute(sql`SELECT COUNT(*) as cnt FROM businesses`) as any;
    if (existing?.[0]?.cnt > 0) return;

    // Seed Sober Strong Academy
    await db.execute(sql`INSERT INTO businesses (slug, name, domain, business_type, brand_voice, target_audience, products, status) VALUES (
      'sober-strong',
      'Sober Strong Academy',
      'shauncritzer.com',
      'coaching',
      ${`Authentic, vulnerable, no-BS, empowering. Shaun talks TO people not AT them. Uses metaphors from bodybuilding and recovery. Personal stories over generic advice. Real, raw, hopeful, non-judgmental. Never preachy.

IMPORTANT STYLE RULES:
- NEVER start posts with "Hey friend," or any letter-style greeting
- Start with a hook, question, bold statement, or story
- Write like a social media post, NOT a personal letter

Key themes: "You're not broken, you're bent", neuroplasticity, 5 pillars (mindfulness, movement, nutrition, connection, purpose), science-backed approaches`},
      ${"People in recovery from addiction, fitness enthusiasts exploring sober lifestyle, anyone dealing with trauma or compulsive behaviors. Ages 25-55, primarily US."},
      ${JSON.stringify([
        { name: "7-Day REWIRED Reset", price: 4700, url: "/7-day-reset" },
        { name: "From Broken to Whole", price: 9700, url: "/products" },
        { name: "Bent Not Broken Circle", price: 2900, url: "/thriving-sober", recurring: "monthly" },
        { name: "1:1 Coaching", price: 0, url: "/contact", description: "Discovery call" },
        { name: "Free Recovery Guide", price: 0, url: "/resources" },
      ])},
      'active'
    )`);

    // Seed Critzer's Cabinets (currently email-only, AI design + ecomm site in progress)
    await db.execute(sql`INSERT INTO businesses (slug, name, domain, business_type, brand_voice, target_audience, products, status) VALUES (
      'critzer-cabinets',
      ${"Critzer's Cabinets"},
      'critzerscabinets.com',
      'services',
      ${"Professional, reliable, family-owned pride. Quality craftsmanship with personal attention. Local community focused. Warm but business-like. Emphasize custom work, attention to detail, and decades of experience. Currently transitioning to AI-powered design tools and ecommerce — website is being built with integrated AI cabinet design and online ordering."},
      ${"Homeowners doing kitchen/bath remodels, contractors needing cabinet subcontractor, real estate investors flipping properties. Local area focus. Growing to serve online customers via AI design tool."},
      ${JSON.stringify([
        { name: "Custom Kitchen Cabinets", price: 0, description: "Quote-based" },
        { name: "Bathroom Vanities", price: 0, description: "Quote-based" },
        { name: "Cabinet Refacing", price: 0, description: "Quote-based" },
        { name: "AI Cabinet Design", price: 0, description: "Coming soon — AI-powered design visualization", url: "/design" },
        { name: "Free Consultation", price: 0, url: "mailto:contact@critzerscabinets.com", description: "Email for quotes" },
      ])},
      'active'
    )`);

    // Seed DataDisco SaaS
    await db.execute(sql`INSERT INTO businesses (slug, name, domain, business_type, brand_voice, target_audience, status) VALUES (
      'datadisco',
      'DataDisco',
      'datadisco.ai',
      'saas',
      ${"Modern, energetic, tech-savvy but accessible. Speaks to busy entrepreneurs who want results without complexity. Emphasize automation, time-saving, and revenue growth. No jargon - plain language about real outcomes."},
      ${"Content creators, course creators, solopreneurs, coaches, small business owners looking to scale their online presence with AI-powered automation. Ages 25-50, tech-comfortable but not developers."},
      'setup'
    )`);

    console.log("[MissionControl] Seeded 3 default businesses");
  } catch (err: any) {
    // Ignore duplicate errors on re-seed
    if (!err.message?.includes("Duplicate")) {
      console.error("[MissionControl] Seed error:", err.message);
    }
  }
}

// ─── Business Loading ──────────────────────────────────────────────────────

async function loadActiveBusinesses(): Promise<BusinessProfile[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT * FROM businesses WHERE status = 'active' ORDER BY id`
    ) as any;

    return (rows as any[]).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      domain: r.domain,
      businessType: r.business_type,
      brandVoice: r.brand_voice,
      targetAudience: r.target_audience,
      products: r.products ? JSON.parse(r.products) : [],
      dailyBudget: r.daily_budget,
      monthlyBudget: r.monthly_budget,
      spentToday: r.spent_today,
      spentMonth: r.spent_month,
      status: r.status,
    }));
  } catch (err: any) {
    console.error("[MissionControl] Load businesses error:", err.message);
    return [];
  }
}

// ─── Action Management ─────────────────────────────────────────────────────

async function proposeAction(opts: {
  businessId: number | null;
  category: string;
  title: string;
  description: string;
  riskTier: number;
  costEstimate?: number;
  metadata?: any;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const { sql } = await import("drizzle-orm");

    // Tier 1: auto-execute immediately
    // Tier 2: execute and log (notify after)
    // Tier 3-4: propose and wait for approval
    const autoExecute = opts.riskTier <= 2;
    const initialStatus = autoExecute ? "executing" : "proposed";

    const [result] = await db.execute(sql`INSERT INTO agent_actions
      (business_id, category, title, description, risk_tier, status, cost_estimate, metadata)
      VALUES (
        ${opts.businessId},
        ${opts.category},
        ${opts.title},
        ${opts.description},
        ${opts.riskTier},
        ${initialStatus},
        ${opts.costEstimate || 0},
        ${opts.metadata ? JSON.stringify(opts.metadata) : null}
      )`) as any;

    return result.insertId || null;
  } catch (err: any) {
    console.error("[MissionControl] Propose action error:", err.message);
    return null;
  }
}

async function completeAction(actionId: number, result: string, actualCost: number = 0): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`UPDATE agent_actions
      SET status = 'executed', result = ${result}, actual_cost = ${actualCost}, executed_at = NOW()
      WHERE id = ${actionId}`);
  } catch (err: any) {
    console.error("[MissionControl] Complete action error:", err.message);
  }
}

async function failAction(actionId: number, error: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`UPDATE agent_actions
      SET status = 'failed', error_message = ${error}
      WHERE id = ${actionId}`);
  } catch (err: any) {
    console.error("[MissionControl] Fail action error:", err.message);
  }
}

// ─── Monitor Functions ─────────────────────────────────────────────────────

async function monitorContentPipeline(business: BusinessProfile): Promise<AgentAlert[]> {
  const alerts: AgentAlert[] = [];

  // Only Sober Strong has content pipeline currently
  if (business.slug !== "sober-strong") return alerts;

  const db = await getDb();
  if (!db) return alerts;

  try {
    const { sql } = await import("drizzle-orm");

    // Check for failures
    const [failedRows] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM content_queue WHERE status = 'failed' AND updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    ) as any;
    const failedCount = failedRows?.[0]?.cnt || 0;

    if (failedCount > 0) {
      alerts.push({
        severity: failedCount > 5 ? "critical" : "warning",
        businessSlug: business.slug,
        title: "Content posting failures",
        message: `${failedCount} posts failed in the last 24 hours`,
        actionRequired: failedCount > 5,
        suggestedAction: "Review failed posts and retry or regenerate content",
        riskTier: 1,
        category: "content",
        timestamp: new Date(),
      });
    }

    // Check posting frequency
    const [recentPosts] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM content_queue WHERE status = 'posted' AND posted_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)`
    ) as any;
    const recentCount = recentPosts?.[0]?.cnt || 0;

    if (recentCount === 0) {
      alerts.push({
        severity: "warning",
        businessSlug: business.slug,
        title: "No content posted recently",
        message: "No social media content posted in the last 48 hours. Queue may be empty or scheduler may be stuck.",
        actionRequired: true,
        suggestedAction: "Generate fresh content and add to queue",
        riskTier: 2,
        category: "content",
        timestamp: new Date(),
      });
    }

    // Check queue depth
    const [readyRows] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM content_queue WHERE status = 'ready'`
    ) as any;
    const readyCount = readyRows?.[0]?.cnt || 0;

    if (readyCount < 5) {
      alerts.push({
        severity: "info",
        businessSlug: business.slug,
        title: "Content queue running low",
        message: `Only ${readyCount} posts queued. Auto-generating content to maintain posting cadence.`,
        actionRequired: false,
        suggestedAction: "Auto-generate content from recent topics",
        riskTier: 1,
        category: "content",
        timestamp: new Date(),
      });

      // Auto-generate content (tier 1 = auto-execute) — pick a platform that needs content
      // Rate limit: max 1 auto-generation per 6 hours
      const [recentAutoGen] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM agent_actions
            WHERE category = 'content' AND title LIKE 'Auto-generate%'
            AND created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR)`
      ) as any;

      if ((recentAutoGen as any)?.[0]?.cnt === 0) {
        const platforms = ["facebook", "instagram", "x", "linkedin"];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        await proposeAction({
          businessId: business.id,
          category: "content",
          title: `Auto-generate ${platform} content`,
          description: `Content queue low (${readyCount} items). Generating fresh ${platform} content for ${business.name}.`,
          riskTier: 1,
          metadata: { platform, businessSlug: business.slug },
        });
      }
    }
  } catch (err: any) {
    console.error(`[MissionControl] Content pipeline monitor error (${business.slug}):`, err.message);
  }

  return alerts;
}

async function monitorEngagement(business: BusinessProfile): Promise<{ alerts: AgentAlert[]; metrics: Record<string, any> }> {
  const alerts: AgentAlert[] = [];
  const metrics: Record<string, any> = {};

  if (business.slug !== "sober-strong") return { alerts, metrics };

  const db = await getDb();
  if (!db) return { alerts, metrics };

  try {
    const { sql } = await import("drizzle-orm");

    // Platform stats (last 7 days)
    const [platformStats] = await db.execute(
      sql`SELECT platform, COUNT(*) as total_posts,
          SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
          FROM content_queue
          WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY platform`
    ) as any;

    for (const row of (platformStats as any[]) || []) {
      metrics[`${row.platform}_posts_7d`] = row.successful || 0;
      metrics[`${row.platform}_failed_7d`] = row.failed || 0;
    }

    // User stats
    const [userStats] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM users WHERE createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)`
    ) as any;
    metrics.new_users_7d = userStats?.[0]?.cnt || 0;

    // Blog stats
    const [blogStats] = await db.execute(
      sql`SELECT SUM(view_count) as total_views, COUNT(*) as total_posts FROM blog_posts WHERE status = 'published'`
    ) as any;
    metrics.total_blog_views = blogStats?.[0]?.total_views || 0;
    metrics.published_posts = blogStats?.[0]?.total_posts || 0;

    // Email subscribers
    const [emailStats] = await db.execute(
      sql`SELECT COUNT(*) as total FROM email_subscribers WHERE status = 'active'`
    ) as any;
    metrics.active_subscribers = emailStats?.[0]?.total || 0;

    // Revenue (purchases)
    const [revenueStats] = await db.execute(
      sql`SELECT SUM(amount) as total, COUNT(*) as cnt FROM purchases WHERE status = 'completed' AND purchased_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`
    ) as any;
    metrics.revenue_30d_cents = revenueStats?.[0]?.total || 0;
    metrics.purchases_30d = revenueStats?.[0]?.cnt || 0;
  } catch (err: any) {
    console.error(`[MissionControl] Engagement monitor error (${business.slug}):`, err.message);
  }

  return { alerts, metrics };
}

async function monitorSystemHealth(): Promise<AgentAlert[]> {
  const alerts: AgentAlert[] = [];

  const db = await getDb();
  if (!db) {
    alerts.push({
      severity: "critical",
      businessSlug: "system",
      title: "Database unreachable",
      message: "Cannot connect to the database. All services are affected.",
      actionRequired: true,
      suggestedAction: "Check Railway MySQL service status",
      riskTier: 4,
      category: "system",
      timestamp: new Date(),
    });
    return alerts;
  }

  // Check API key configuration
  const socialChecks = [
    { name: "Twitter/X", keys: ["TWITTER_CONSUMER_KEY", "TWITTER_ACCESS_TOKEN"], business: "sober-strong" },
    { name: "Facebook", keys: ["META_PAGE_ACCESS_TOKEN", "META_PAGE_ID"], business: "sober-strong" },
    { name: "OpenAI (DALL-E)", keys: ["OPENAI_API_KEY"], business: "system" },
    { name: "Stripe", keys: ["STRIPE_SECRET_KEY"], business: "system" },
  ];

  for (const check of socialChecks) {
    const missing = check.keys.filter(k => !process.env[k]);
    if (missing.length > 0) {
      alerts.push({
        severity: "info",
        businessSlug: check.business,
        title: `${check.name} not configured`,
        message: `Missing env vars: ${missing.join(", ")}`,
        actionRequired: false,
        riskTier: 1,
        category: "system",
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

// ─── Briefing Delivery (Webhook) ────────────────────────────────────────────

/**
 * Deliver a briefing via webhook (n8n, Zapier, Slack, email API, etc.)
 * Set BRIEFING_WEBHOOK_URL in Railway to enable.
 * Payload: { title, content, type, timestamp, alerts_count, pending_count }
 */
async function deliverBriefingViaWebhook(content: string, title: string, alertsCount: number, pendingCount: number): Promise<void> {
  const webhookUrl = process.env.BRIEFING_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        type: "daily_briefing",
        timestamp: new Date().toISOString(),
        alerts_count: alertsCount,
        pending_count: pendingCount,
      }),
    });

    if (response.ok) {
      console.log("[MissionControl] Briefing delivered via webhook");
    } else {
      console.warn(`[MissionControl] Webhook returned ${response.status}: ${await response.text()}`);
    }
  } catch (err: any) {
    console.error("[MissionControl] Webhook delivery failed:", err.message);
  }
}

// ─── Auto-Execution Engine (Tier 1-2 Actions) ──────────────────────────────

/**
 * Execute queued actions that have status='executing' (auto-approved tier 1-2).
 * Currently supports: content generation.
 */
async function executeQueuedActions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT * FROM agent_actions WHERE status = 'executing' ORDER BY created_at ASC LIMIT 3`
    ) as any;

    for (const action of (rows as any[]) || []) {
      try {
        const metadata = action.metadata ? JSON.parse(action.metadata) : {};

        switch (action.category) {
          case "content": {
            const { generateContentForPlatform } = await import("../social/content-generator");
            const platform = metadata.platform || "facebook";
            const businessSlug = metadata.businessSlug || "sober-strong";

            const content = await generateContentForPlatform({
              platform,
              businessSlug,
            });

            // Add to content queue
            await db.execute(sql`INSERT INTO content_queue
              (platform, content_type, content, status, media_urls)
              VALUES (
                ${platform},
                ${content.contentType},
                ${content.content},
                'ready',
                ${JSON.stringify({
                  hashtags: content.hashtags,
                  suggestedMediaType: content.suggestedMediaType,
                  suggestedMediaPrompt: content.suggestedMediaPrompt,
                  suggestedTools: content.suggestedTools,
                  autoGenerated: true,
                })}
              )`);

            await completeAction(action.id, `Generated ${platform} content: "${content.content.substring(0, 80)}..."`);
            console.log(`[MissionControl] Auto-generated ${platform} content for ${businessSlug}`);
            break;
          }
          default:
            await failAction(action.id, `No executor for category: ${action.category}`);
        }
      } catch (err: any) {
        console.error(`[MissionControl] Action #${action.id} execution failed:`, err.message);
        await failAction(action.id, err.message);
      }
    }
  } catch (err: any) {
    console.error("[MissionControl] Execute queued actions error:", err.message);
  }
}

// ─── Daily Briefing Generator ──────────────────────────────────────────────

async function generateDailyBriefing(
  businesses: BusinessProfile[],
  allAlerts: AgentAlert[],
  allMetrics: Record<string, Record<string, any>>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Get pending approvals count
  const { sql } = await import("drizzle-orm");
  const [pendingRows] = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM agent_actions WHERE status = 'proposed'`
  ) as any;
  const pendingCount = pendingRows?.[0]?.cnt || 0;

  // Get yesterday's executed actions
  const [yesterdayActions] = await db.execute(
    sql`SELECT category, title, result FROM agent_actions
        WHERE status = 'executed' AND executed_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY executed_at DESC LIMIT 20`
  ) as any;

  const promptText = `You are the AI operations manager for Shaun Critzer's business empire.
Generate a concise daily morning briefing.

DATE: ${dateStr}

BUSINESSES MANAGED:
${businesses.map(b => `- ${b.name} (${b.domain || "no domain"}) [${b.businessType}] - Status: ${b.status}`).join("\n")}

METRICS BY BUSINESS:
${JSON.stringify(allMetrics, null, 2)}

ACTIVE ALERTS:
${allAlerts.length > 0 ? allAlerts.map(a => `[${a.severity.toUpperCase()}] ${a.businessSlug}: ${a.title} - ${a.message}`).join("\n") : "No active alerts."}

PENDING APPROVALS: ${pendingCount} actions waiting for your approval

ACTIONS TAKEN IN LAST 24 HOURS:
${(yesterdayActions as any[])?.length > 0
    ? (yesterdayActions as any[]).map((a: any) => `- [${a.category}] ${a.title}`).join("\n")
    : "No actions taken."}

FORMAT YOUR RESPONSE AS:

## Good Morning, Shaun! - ${dateStr}

### Quick Status
(2-3 bullet overview: what's working, what needs attention)

### By Business
(Brief status per active business - 1-2 lines each)

### Actions Taken
(What the agent did autonomously in the last 24 hours)

### Needs Your Approval
(Any tier 3-4 actions waiting, or "Nothing pending")

### Ideas & Opportunities
(1-2 proactive suggestions for growth, optimization, or new initiatives)

### Today's Plan
(What the agent plans to do today)

Keep it scannable. Shaun has ADHD - give him the 2-minute version. Use real numbers.`;

  try {
    const result = await invokeLLM({
      messages: [{ role: "user", content: promptText }],
      maxTokens: 1500,
    });

    const briefingContent = (result.choices?.[0]?.message?.content as string) || "Briefing generation failed.";

    // Store the briefing
    await db.execute(sql`INSERT INTO agent_reports
      (report_type, title, content, metrics, suggested_actions)
      VALUES (
        'daily_briefing',
        ${`Daily Briefing - ${dateStr}`},
        ${briefingContent},
        ${JSON.stringify(allMetrics)},
        ${JSON.stringify(allAlerts.filter(a => a.suggestedAction).map(a => ({
          business: a.businessSlug,
          action: a.suggestedAction,
          priority: a.severity,
        })))}
      )`);

    console.log("[MissionControl] Daily briefing generated and stored");
    state.lastDailyBriefing = now;

    // Deliver via webhook (email/Slack/n8n)
    await deliverBriefingViaWebhook(briefingContent, `Daily Briefing - ${dateStr}`, allAlerts.length, pendingCount);

    // Also trigger Make.com daily metrics report if configured
    try {
      const { triggerScenario } = await import("./make-automation");
      await triggerScenario("daily-metrics-report", "sober-strong", {
        metrics: allMetrics,
        alerts: allAlerts.map(a => ({ severity: a.severity, title: a.title, message: a.message })),
        date: dateStr,
        briefing: briefingContent.substring(0, 2000),
      });
    } catch {
      // Make.com not configured yet — silent fail
    }
  } catch (err: any) {
    console.error("[MissionControl] Briefing generation failed:", err.message);

    // Store a fallback briefing with raw data
    try {
      await db.execute(sql`INSERT INTO agent_reports
        (report_type, title, content, metrics)
        VALUES (
          'daily_briefing',
          ${`Daily Briefing - ${dateStr}`},
          ${`## Daily Briefing - ${dateStr}\n\n*AI analysis unavailable: ${err.message}*\n\n### Raw Alerts\n${allAlerts.map(a => `- [${a.severity}] ${a.title}: ${a.message}`).join("\n") || "None"}\n\n### Pending Approvals: ${pendingCount}`},
          ${JSON.stringify(allMetrics)}
        )`);
    } catch (e: any) {
      console.error("[MissionControl] Failed to store fallback briefing:", e.message);
    }
  }
}

// ─── Proactive Strategy Engine ─────────────────────────────────────────────

async function generateStrategicIdeas(
  businesses: BusinessProfile[],
  metrics: Record<string, Record<string, any>>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");

    // Only generate strategic ideas once per week
    const [recentIdeas] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM agent_reports
          WHERE report_type = 'idea' AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`
    ) as any;
    if ((recentIdeas as any)?.[0]?.cnt > 0) return;

    const promptText = `You are the AI business strategist for Shaun Critzer's multi-business empire.

BUSINESSES:
${businesses.map(b => `- ${b.name} (${b.businessType}): ${b.targetAudience || "Not defined"}`).join("\n")}

CURRENT METRICS:
${JSON.stringify(metrics, null, 2)}

Generate 3 strategic ideas that could grow revenue or efficiency across these businesses.
For each idea include:
1. Which business it applies to (or "cross-business")
2. The idea in 1-2 sentences
3. Estimated effort (low/medium/high)
4. Estimated impact (low/medium/high)
5. Specific first step to implement

Focus on quick wins and cross-business synergies. Be specific, not generic.

RESPOND IN JSON:
[
  {
    "business": "business-slug or cross-business",
    "title": "Short title",
    "description": "1-2 sentence description",
    "effort": "low|medium|high",
    "impact": "low|medium|high",
    "firstStep": "Specific actionable first step"
  }
]`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a business strategist. Respond with valid JSON only." },
        { role: "user", content: promptText },
      ],
      maxTokens: 1000,
    });

    const responseText = (result.choices?.[0]?.message?.content as string) || "[]";
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let ideas: any[];
    try {
      ideas = JSON.parse(cleanJson);
    } catch {
      ideas = [];
    }

    if (ideas.length > 0) {
      await db.execute(sql`INSERT INTO agent_reports
        (report_type, title, content, suggested_actions)
        VALUES (
          'idea',
          ${"Weekly Strategic Ideas"},
          ${ideas.map((i: any, idx: number) => `### ${idx + 1}. ${i.title}\n**Business:** ${i.business} | **Effort:** ${i.effort} | **Impact:** ${i.impact}\n\n${i.description}\n\n**First step:** ${i.firstStep}`).join("\n\n---\n\n")},
          ${JSON.stringify(ideas)}
        )`);

      console.log(`[MissionControl] Generated ${ideas.length} strategic ideas`);
    }
  } catch (err: any) {
    console.error("[MissionControl] Strategic ideas error:", err.message);
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
    // Load active businesses
    const businesses = await loadActiveBusinesses();
    state.activeBusinesses = businesses.length;

    if (businesses.length === 0) {
      console.log("[MissionControl] No active businesses, skipping cycle");
      state.isRunning = false;
      return state;
    }

    // Run monitors for each business
    const allAlerts: AgentAlert[] = [];
    const allMetrics: Record<string, Record<string, any>> = {};

    // System health check (cross-business)
    const healthAlerts = await monitorSystemHealth();
    allAlerts.push(...healthAlerts);

    // Per-business monitors
    for (const business of businesses) {
      const contentAlerts = await monitorContentPipeline(business);
      const { alerts: engagementAlerts, metrics } = await monitorEngagement(business);

      allAlerts.push(...contentAlerts, ...engagementAlerts);
      allMetrics[business.slug] = metrics;
    }

    state.alerts = allAlerts;
    state.lastRun = new Date();

    // Count pending approvals
    const db = await getDb();
    if (db) {
      const { sql } = await import("drizzle-orm");
      const [pendingRows] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM agent_actions WHERE status = 'proposed'`
      ) as any;
      state.pendingApprovals = pendingRows?.[0]?.cnt || 0;

      // Count today's actions
      const [todayRows] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM agent_actions WHERE status = 'executed' AND executed_at > CURDATE()`
      ) as any;
      state.todayActions = todayRows?.[0]?.cnt || 0;
    }

    // Execute any auto-approved actions (tier 1-2)
    await executeQueuedActions();

    // Log summary
    const criticalCount = allAlerts.filter(a => a.severity === "critical").length;
    const warningCount = allAlerts.filter(a => a.severity === "warning").length;
    console.log(`[MissionControl] Cycle complete: ${businesses.length} businesses, ${criticalCount} critical, ${warningCount} warnings, ${allAlerts.length} total alerts`);

    // Generate daily briefing (once per day, after 6 AM)
    const now = new Date();
    const hour = now.getHours();
    const shouldBrief = hour >= 6 && (
      !state.lastDailyBriefing ||
      now.toDateString() !== state.lastDailyBriefing.toDateString()
    );

    if (shouldBrief) {
      console.log("[MissionControl] Generating daily briefing...");
      await generateDailyBriefing(businesses, allAlerts, allMetrics);
    }

    // Generate strategic ideas (weekly)
    await generateStrategicIdeas(businesses, allMetrics);

  } catch (err: any) {
    console.error("[MissionControl] Agent cycle error:", err);
  } finally {
    state.isRunning = false;
  }

  return state;
}

// ─── Public API ────────────────────────────────────────────────────────────

export function getAgentState(): AgentState {
  return { ...state };
}

export async function getBusinesses(): Promise<BusinessProfile[]> {
  return loadActiveBusinesses();
}

export async function getAllBusinesses(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(sql`SELECT * FROM businesses ORDER BY id`) as any;
    return (rows as any[]).map((r: any) => ({
      ...r,
      products: r.products ? JSON.parse(r.products) : [],
    }));
  } catch {
    return [];
  }
}

export async function getPendingActions(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT a.*, b.name as business_name, b.slug as business_slug
          FROM agent_actions a
          LEFT JOIN businesses b ON a.business_id = b.id
          WHERE a.status = 'proposed'
          ORDER BY a.risk_tier DESC, a.created_at ASC`
    ) as any;
    return rows as any[];
  } catch {
    return [];
  }
}

export async function getRecentActions(limit: number = 50): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT a.*, b.name as business_name, b.slug as business_slug
          FROM agent_actions a
          LEFT JOIN businesses b ON a.business_id = b.id
          ORDER BY a.created_at DESC
          LIMIT ${limit}`
    ) as any;
    return rows as any[];
  } catch {
    return [];
  }
}

export async function getReports(type?: string, limit: number = 20): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { sql } = await import("drizzle-orm");
    const query = type
      ? sql`SELECT * FROM agent_reports WHERE report_type = ${type} ORDER BY created_at DESC LIMIT ${limit}`
      : sql`SELECT * FROM agent_reports ORDER BY created_at DESC LIMIT ${limit}`;
    const [rows] = await db.execute(query) as any;
    return rows as any[];
  } catch {
    return [];
  }
}

export async function approveAction(actionId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(
      sql`UPDATE agent_actions SET status = 'approved', approved_at = NOW() WHERE id = ${actionId} AND status = 'proposed'`
    );
    return true;
  } catch {
    return false;
  }
}

export async function denyAction(actionId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(
      sql`UPDATE agent_actions SET status = 'denied' WHERE id = ${actionId} AND status = 'proposed'`
    );
    return true;
  } catch {
    return false;
  }
}

export async function markReportRead(reportId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`UPDATE agent_reports SET is_read = 1 WHERE id = ${reportId}`);
    return true;
  } catch {
    return false;
  }
}

// ─── Owner Command Processing ────────────────────────────────────────────

/**
 * Process an owner command — store it as an action that the agent will pick up.
 * This allows the owner to send instructions like "fix content queue" or "generate more IG posts"
 */
export async function proposeOwnerCommand(message: string, businessSlug?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");

    // Find the business ID if slug provided
    let businessId: number | null = null;
    if (businessSlug && businessSlug !== "all") {
      const [rows] = await db.execute(sql`SELECT id FROM businesses WHERE slug = ${businessSlug} LIMIT 1`) as any;
      if ((rows as any[])?.[0]?.id) {
        businessId = (rows as any[])[0].id;
      }
    }

    await proposeAction({
      businessId,
      category: "owner_command",
      title: `Owner instruction: ${message.substring(0, 80)}`,
      description: message,
      riskTier: 2, // Auto-execute since the owner explicitly asked
      metadata: { source: "mission_control_ui", businessSlug: businessSlug || "all" },
    });

    console.log(`[MissionControl] Owner command received: ${message.substring(0, 80)}`);
  } catch (err: any) {
    console.error("[MissionControl] Failed to process owner command:", err.message);
  }
}

// ─── Startup ───────────────────────────────────────────────────────────────

export function startMissionControl(): void {
  console.log("[MissionControl] Starting autonomous agent system...");

  // Ensure tables exist and seed defaults (non-blocking)
  ensureAgentTables().then(async (success) => {
    if (!success) {
      console.error("[MissionControl] Failed to create agent tables");
      return;
    }
    await seedDefaultBusinesses();
    console.log("[MissionControl] Agent tables ready");

    // Initialize Make.com automation table and seed default scenarios
    try {
      const { ensureMakeTable, seedDefaultScenarios } = await import("./make-automation");
      const makeReady = await ensureMakeTable();
      if (makeReady) {
        await seedDefaultScenarios();
        console.log("[MissionControl] Make.com automation ready");
      }
    } catch (err: any) {
      console.warn("[MissionControl] Make.com setup skipped (non-fatal):", err.message);
    }
  }).catch(err => {
    console.error("[MissionControl] Table setup error:", err.message);
  });

  // Main agent cycle: every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runAgentCycle();
    } catch (err: any) {
      console.error("[MissionControl] Scheduled cycle failed:", err.message);
    }
  });

  // Run first cycle after 60 seconds (let tables create first)
  setTimeout(async () => {
    try {
      await runAgentCycle();
    } catch (err: any) {
      console.error("[MissionControl] Initial cycle failed:", err.message);
    }
  }, 60_000);

  console.log("[MissionControl] Agent started - monitoring every 30 minutes");
}
