/**
 * Diagnostic API Routes
 * /api/diagnostic/instagram - Instagram API health check
 * /api/diagnostic/meta-token - Meta token debug info
 */

import { Router } from "express";
import { debugMetaToken, verifyMetaConnection } from "../social/meta";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const diagnosticRouter = Router();

// Instagram diagnostic endpoint
diagnosticRouter.get("/instagram", async (req, res) => {
  try {
    const db = await getDb();
    
    // 1. Token debug
    const tokenDebug = await debugMetaToken();
    
    // 2. Connection verification
    const connectionStatus = await verifyMetaConnection();
    
    // 3. Recent failures
    let recentFailures: any[] = [];
    if (db) {
      const [rows] = await db.execute(
        sql`SELECT id, platform, status, error_message, created_at, content
            FROM content_queue
            WHERE platform = 'instagram'
            AND status = 'failed'
            ORDER BY created_at DESC
            LIMIT 10`
      ) as any;
      recentFailures = rows || [];
    }
    
    // 4. Success rate (last 7 days)
    let successRate = { total: 0, successful: 0, failed: 0, rate: 0 };
    if (db) {
      const [stats] = await db.execute(
        sql`SELECT
              COUNT(*) as total,
              SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as successful,
              SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM content_queue
            WHERE platform = 'instagram'
            AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ) as any;
      const row = (stats as any[])[0];
      successRate = {
        total: row?.total || 0,
        successful: row?.successful || 0,
        failed: row?.failed || 0,
        rate: row?.total > 0 ? Math.round((row.successful / row.total) * 100) : 0,
      };
    }

    res.json({
      status: tokenDebug.valid && connectionStatus.success ? "healthy" : "degraded",
      token: {
        valid: tokenDebug.valid,
        expiresAt: tokenDebug.expiresAt,
        scopes: tokenDebug.scopes,
        error: tokenDebug.error,
      },
      connection: connectionStatus,
      successRate,
      recentFailures: recentFailures.map(f => ({
        id: f.id,
        timestamp: f.created_at,
        error: f.error_message,
        contentPreview: f.content?.substring(0, 100),
      })),
      recommendations: generateRecommendations(tokenDebug, connectionStatus, successRate),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Meta token debug endpoint
diagnosticRouter.get("/meta-token", async (req, res) => {
  try {
    const tokenDebug = await debugMetaToken();
    res.json(tokenDebug);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// LLM provider debug endpoint
diagnosticRouter.get("/llm-provider", async (req, res) => {
  try {
    const { ENV } = await import("../_core/env");
    
    // Check which keys are set
    const keys = {
      forgeApiKey: ENV.forgeApiKey ? { set: true, length: ENV.forgeApiKey.length, preview: ENV.forgeApiKey.substring(0, 10) } : { set: false },
      anthropicApiKey: ENV.anthropicApiKey ? { set: true, length: ENV.anthropicApiKey.length, preview: ENV.anthropicApiKey.substring(0, 10) } : { set: false },
      googleApiKey: ENV.googleApiKey ? { set: true, length: ENV.googleApiKey.length, preview: ENV.googleApiKey.substring(0, 10) } : { set: false },
      openaiApiKey: ENV.openaiApiKey ? { set: true, length: ENV.openaiApiKey.length, preview: ENV.openaiApiKey.substring(0, 10) } : { set: false },
    };
    
    // Determine selected provider
    let selectedProvider = "none";
    if (ENV.forgeApiKey) selectedProvider = "Forge";
    else if (ENV.anthropicApiKey) selectedProvider = "Anthropic Claude";
    else if (ENV.googleApiKey) selectedProvider = "Google Gemini";
    else if (ENV.openaiApiKey) selectedProvider = "OpenAI";
    
    res.json({
      selectedProvider,
      keys,
      rawEnvCheck: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? { set: true, length: process.env.ANTHROPIC_API_KEY.length } : { set: false },
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? { set: true, length: process.env.GOOGLE_API_KEY.length } : { set: false },
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Generate actionable recommendations
function generateRecommendations(
  tokenDebug: any,
  connectionStatus: any,
  successRate: any
): string[] {
  const recommendations: string[] = [];

  // Token issues
  if (!tokenDebug.valid) {
    recommendations.push("🔴 CRITICAL: Token is invalid or expired. Generate a new long-lived token immediately.");
  } else if (tokenDebug.expiresAt && tokenDebug.expiresAt !== "never") {
    const expiryDate = new Date(tokenDebug.expiresAt);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 7) {
      recommendations.push(`⚠️  Token expires in ${daysUntilExpiry} days. Refresh it soon to avoid disruption.`);
    }
  }

  // Scope issues
  const requiredScopes = ["instagram_basic", "instagram_content_publish"];
  const missingScopes = requiredScopes.filter(s => !tokenDebug.scopes?.includes(s));
  if (missingScopes.length > 0) {
    recommendations.push(`🔴 CRITICAL: Missing required scopes: ${missingScopes.join(", ")}. Regenerate token with all permissions.`);
  }

  // Connection issues
  if (!connectionStatus.success) {
    recommendations.push(`🔴 CRITICAL: ${connectionStatus.error || "Could not connect to Instagram account"}`);
  }

  // Success rate
  if (successRate.total > 0 && successRate.rate < 50) {
    recommendations.push(`⚠️  Low success rate (${successRate.rate}%). Check recent failures for error patterns.`);
  }

  // All good
  if (recommendations.length === 0) {
    recommendations.push("✅ Instagram API is healthy. No action needed.");
  }

  return recommendations;
}

export default diagnosticRouter;
