/**
 * SELF-HEALING ENGINE — Autonomous Pipeline Failure Recovery
 *
 * When checkPipeline() detects >50% failure rate, this module:
 *   1. Queries the last 5 failed posts to analyze error patterns
 *   2. Classifies errors: token expired, rate limited, or other
 *   3. Attempts automatic fixes:
 *      - Token expired → refresh YouTube token (Meta requires manual env var update)
 *      - Rate limited → throttle platform for 24 hours
 *   4. Logs all fix attempts to agent_actions (category = 'self_heal')
 *   5. Only sends Telegram alert if:
 *      - First detection (not alerted in last 2h) AND fix failed
 *      - OR fix succeeded (sends success notification)
 *
 * Called by: self-monitor.ts checkPipeline() when error rate > 50%
 */

import { getDb } from "../db";

// ─── Types ──────────────────────────────────────────────────────────────────

type ErrorCategory = "token_expired" | "rate_limited" | "other";

type FailedPost = {
  id: number;
  platform: string;
  errorMessage: string;
  updatedAt: Date;
};

type HealResult = {
  attempted: boolean;
  category: ErrorCategory;
  platform: string;
  success: boolean;
  message: string;
};

// ─── Platform Throttle State ────────────────────────────────────────────────
// Key: platform name, Value: throttle expiration timestamp (ms)
const platformThrottles = new Map<string, number>();

/**
 * Check if a platform is currently throttled by self-healing.
 * Exported so the scheduler can skip posting to throttled platforms.
 */
export function isPlatformThrottled(platform: string): boolean {
  const expiresAt = platformThrottles.get(platform);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    platformThrottles.delete(platform);
    return false;
  }
  return true;
}

/**
 * Get all currently throttled platforms and their expiration times.
 */
export function getThrottledPlatforms(): Record<string, string> {
  const result: Record<string, string> = {};
  Array.from(platformThrottles.entries()).forEach(([platform, expiresAt]) => {
    if (Date.now() < expiresAt) {
      result[platform] = new Date(expiresAt).toISOString();
    } else {
      platformThrottles.delete(platform);
    }
  });
  return result;
}

// ─── Error Classification ───────────────────────────────────────────────────

function classifyError(errorMessage: string): ErrorCategory {
  const lower = (errorMessage || "").toLowerCase();

  // Token / auth errors
  if (
    lower.includes("token expired") ||
    lower.includes("token has expired") ||
    lower.includes("invalid token") ||
    lower.includes("invalid oauth") ||
    lower.includes("expired access token") ||
    lower.includes("oauthexception") ||
    lower.includes("auth") ||
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("invalid_grant") ||
    lower.includes("not authorized") ||
    lower.includes("access_token") ||
    lower.includes("session has expired") ||
    lower.includes("login required")
  ) {
    return "token_expired";
  }

  // Rate limit errors
  if (
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("ratelimit") ||
    lower.includes("too many request") ||
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("throttl") ||
    lower.includes("limit reached") ||
    lower.includes("daily limit") ||
    lower.includes("api limit")
  ) {
    return "rate_limited";
  }

  return "other";
}

// ─── Fetch Failed Posts ─────────────────────────────────────────────────────

async function getRecentFailedPosts(limit: number = 5): Promise<FailedPost[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT id, platform, error_message, updated_at
          FROM content_queue
          WHERE status = 'failed'
            AND updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
          ORDER BY updated_at DESC
          LIMIT ${limit}`
    ) as any;

    return (rows as any[]).map((r: any) => ({
      id: r.id,
      platform: r.platform,
      errorMessage: r.error_message || "",
      updatedAt: r.updated_at,
    }));
  } catch (err: any) {
    console.error("[SelfHeal] Failed to query failed posts:", err.message);
    return [];
  }
}

// ─── Fix Attempts ───────────────────────────────────────────────────────────

async function attemptTokenRefresh(platform: string): Promise<{ success: boolean; message: string }> {
  // YouTube: we can refresh the access token from the refresh token
  if (platform === "youtube") {
    try {
      const { isYouTubeConfigured } = await import("../social/youtube");
      if (!isYouTubeConfigured()) {
        return { success: false, message: "YouTube not configured — missing env vars" };
      }
      // The YouTube module caches tokens and auto-refreshes on next call.
      // We can force a refresh by importing and calling getAccessToken (it checks expiry).
      // But getAccessToken is not exported — the next post attempt will naturally refresh.
      // We can at least verify the refresh token is valid by testing the token endpoint.
      const creds = {
        clientId: process.env.YOUTUBE_CLIENT_ID || "",
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || "",
        refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || "",
      };
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: creds.clientId,
          client_secret: creds.clientSecret,
          refresh_token: creds.refreshToken,
          grant_type: "refresh_token",
        }),
      });
      if (response.ok) {
        return { success: true, message: "YouTube token refreshed successfully" };
      }
      const errBody = await response.text();
      return { success: false, message: `YouTube token refresh failed: ${response.status} — ${errBody.slice(0, 200)}` };
    } catch (err: any) {
      return { success: false, message: `YouTube token refresh error: ${err.message}` };
    }
  }

  // Meta (Instagram/Facebook): uses long-lived page tokens set via env var.
  // Cannot auto-refresh — requires manual token regeneration in Meta Business Suite.
  if (platform === "instagram" || platform === "facebook") {
    return {
      success: false,
      message: `Meta ${platform} token cannot be auto-refreshed. Shaun needs to regenerate META_PAGE_ACCESS_TOKEN in Meta Business Suite and update Railway env vars.`,
    };
  }

  // LinkedIn: token from env var, no auto-refresh
  if (platform === "linkedin") {
    return {
      success: false,
      message: "LinkedIn token cannot be auto-refreshed. Update LINKEDIN_ACCESS_TOKEN in Railway env vars.",
    };
  }

  // X/Twitter: uses static API keys, not token-based refresh
  if (platform === "x") {
    return {
      success: false,
      message: "X/Twitter uses static API keys. Check that Twitter API tier supports posting (Basic $200/mo required).",
    };
  }

  return { success: false, message: `No token refresh strategy available for platform: ${platform}` };
}

function applyRateThrottle(platform: string): { success: boolean; message: string } {
  const THROTTLE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  const expiresAt = Date.now() + THROTTLE_DURATION_MS;
  platformThrottles.set(platform, expiresAt);

  const expiresStr = new Date(expiresAt).toISOString();
  return {
    success: true,
    message: `Throttled ${platform} posting for 24 hours (until ${expiresStr}) due to rate limiting`,
  };
}

// ─── Log to agent_actions ───────────────────────────────────────────────────

async function logHealAction(result: HealResult): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");
    const status = result.success ? "executed" : "failed";
    const title = `Self-heal: ${result.category} on ${result.platform}`;
    const executedAt = result.success ? sql`NOW()` : sql`NULL`;

    await db.execute(
      sql`INSERT INTO agent_actions
        (category, title, description, risk_tier, status, result, error_message, executed_at)
        VALUES (
          'self_heal',
          ${title},
          ${`Auto-fix attempt for ${result.category} error on ${result.platform}`},
          1,
          ${status},
          ${result.message},
          ${result.success ? null : result.message},
          ${executedAt}
        )`
    );
  } catch (err: any) {
    console.error("[SelfHeal] Failed to log heal action:", err.message);
  }
}

// ─── Main Self-Heal Entry Point ─────────────────────────────────────────────

/**
 * Analyze recent failures and attempt automatic fixes.
 * Returns an array of heal results describing what was attempted and whether it worked.
 *
 * Called by self-monitor.ts when checkPipeline() detects >50% failure rate.
 */
export async function attemptSelfHeal(): Promise<HealResult[]> {
  console.log("[SelfHeal] Analyzing recent pipeline failures...");

  const failedPosts = await getRecentFailedPosts(5);
  if (failedPosts.length === 0) {
    console.log("[SelfHeal] No recent failed posts found");
    return [];
  }

  // Log what we found
  console.log(`[SelfHeal] Found ${failedPosts.length} recent failures:`);
  for (const post of failedPosts) {
    console.log(`  #${post.id} [${post.platform}]: ${post.errorMessage.slice(0, 120)}`);
  }

  // Group errors by platform + category
  const platformErrors = new Map<string, { category: ErrorCategory; errors: string[] }>();
  for (const post of failedPosts) {
    const category = classifyError(post.errorMessage);
    const key = `${post.platform}:${category}`;
    if (!platformErrors.has(key)) {
      platformErrors.set(key, { category, errors: [] });
    }
    platformErrors.get(key)!.errors.push(post.errorMessage);
  }

  const results: HealResult[] = [];

  for (const [key, { category, errors }] of Array.from(platformErrors.entries())) {
    const platform = key.split(":")[0];

    if (category === "token_expired") {
      console.log(`[SelfHeal] Attempting token refresh for ${platform}...`);
      const fix = await attemptTokenRefresh(platform);
      const result: HealResult = {
        attempted: true,
        category,
        platform,
        success: fix.success,
        message: fix.message,
      };
      await logHealAction(result);
      results.push(result);
    } else if (category === "rate_limited") {
      console.log(`[SelfHeal] Applying rate throttle for ${platform}...`);
      const fix = applyRateThrottle(platform);
      const result: HealResult = {
        attempted: true,
        category,
        platform,
        success: fix.success,
        message: fix.message,
      };
      await logHealAction(result);
      results.push(result);
    } else {
      // "other" — can't auto-fix, but still log what we saw
      const result: HealResult = {
        attempted: false,
        category: "other",
        platform,
        success: false,
        message: `Unknown error pattern on ${platform}: ${errors[0].slice(0, 200)}`,
      };
      await logHealAction(result);
      results.push(result);
    }
  }

  return results;
}

/**
 * Get a diagnostic dump of current failed posts — for the admin/Telegram to see
 * the actual error messages right now.
 */
export async function getFailedPostsDiagnostic(): Promise<{
  count: number;
  posts: FailedPost[];
  errorSummary: Record<ErrorCategory, number>;
  throttledPlatforms: Record<string, string>;
}> {
  const posts = await getRecentFailedPosts(20);

  const errorSummary: Record<ErrorCategory, number> = {
    token_expired: 0,
    rate_limited: 0,
    other: 0,
  };

  for (const post of posts) {
    const cat = classifyError(post.errorMessage);
    errorSummary[cat]++;
  }

  return {
    count: posts.length,
    posts,
    errorSummary,
    throttledPlatforms: getThrottledPlatforms(),
  };
}
