/**
 * REVENUE ENGINE — Autonomous Monetization Optimizer
 *
 * The system that tracks what actually makes money and optimizes for it.
 *
 * Capabilities:
 *   1. Tracks which content → which product sales (attribution)
 *   2. Optimizes CTA rotation based on conversion data
 *   3. Analyzes revenue per platform and adjusts posting strategy
 *   4. Identifies top-converting content patterns and creates more of them
 *   5. Suggests pricing adjustments based on market + conversion data
 *   6. Manages affiliate offer rotation for maximum commissions
 *   7. Generates revenue reports and forecasts
 *
 * Data flow:
 *   Content Posted → Tracked Clicks → Purchases (Stripe) → Attribution →
 *   Pattern Analysis → Strategy Adjustment → New Content → Repeat
 *
 * Risk Tiers:
 *   Tier 1: Data analysis, reporting (read-only)
 *   Tier 2: CTA rotation adjustments, content queue adjustments
 *   Tier 3: Pricing recommendations (needs approval)
 *   Tier 4: Pricing changes, new product creation (must approve)
 */

import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Types ──────────────────────────────────────────────────────────────────

export type RevenueSnapshot = {
  period: "day" | "week" | "month";
  totalRevenue: number;
  productBreakdown: { productId: string; revenue: number; count: number }[];
  platformBreakdown: { platform: string; clicks: number; conversions: number; revenue: number }[];
  topConvertingContent: { contentId: number; platform: string; preview: string; conversions: number; revenue: number }[];
  affiliateRevenue: number;
  ctaPerformance: { ctaId: number; label: string; clicks: number; conversions: number; conversionRate: number }[];
};

export type RevenueOptimization = {
  /** Adjustments to CTA weights based on performance */
  ctaAdjustments: { ctaId: number; currentWeight: number; newWeight: number; reason: string }[];
  /** Content types that convert best */
  bestContentPatterns: string[];
  /** Platforms ranked by ROI */
  platformRanking: { platform: string; roi: number; recommendation: string }[];
  /** Pricing suggestions */
  pricingSuggestions: { productId: string; currentPrice: number; suggestedPrice: number; rationale: string }[];
  /** New product/upsell opportunities */
  upsellOpportunities: string[];
  /** Overall strategy recommendation */
  strategyNote: string;
};

// ─── Revenue Data Collection ────────────────────────────────────────────────

export async function getRevenueSnapshot(period: "day" | "week" | "month" = "week"): Promise<RevenueSnapshot | null> {
  const db = await getDb();
  if (!db) return null;

  const { sql } = await import("drizzle-orm");

  const interval = period === "day" ? "1 DAY" : period === "week" ? "7 DAY" : "30 DAY";

  try {
    // Total revenue
    const [revRows] = await db.execute(
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM purchases WHERE created_at > DATE_SUB(NOW(), INTERVAL ${sql.raw(interval)})`
    ) as any;
    const totalRevenue = (revRows as any[])?.[0]?.total || 0;

    // Revenue by product
    const [productRows] = await db.execute(
      sql`SELECT product_id, SUM(amount) as revenue, COUNT(*) as cnt
          FROM purchases
          WHERE created_at > DATE_SUB(NOW(), INTERVAL ${sql.raw(interval)})
          GROUP BY product_id
          ORDER BY revenue DESC`
    ) as any;

    // CTA performance
    const [ctaRows] = await db.execute(
      sql`SELECT id, label, weight, clicks, conversions,
          CASE WHEN clicks > 0 THEN ROUND(conversions / clicks * 100, 1) ELSE 0 END as conversion_rate
          FROM cta_offers
          WHERE is_active = 1
          ORDER BY conversions DESC`
    ) as any;

    // Top converting content (content that has CTAs with conversions)
    const [contentRows] = await db.execute(
      sql`SELECT id, platform, SUBSTRING(content, 1, 100) as preview, metrics
          FROM content_queue
          WHERE status = 'posted'
          AND posted_at > DATE_SUB(NOW(), INTERVAL ${sql.raw(interval)})
          AND metrics IS NOT NULL
          ORDER BY posted_at DESC
          LIMIT 50`
    ) as any;

    // Platform breakdown from posted content
    const [platformRows] = await db.execute(
      sql`SELECT platform, COUNT(*) as posts, SUM(JSON_EXTRACT(metrics, '$.clicks')) as clicks
          FROM content_queue
          WHERE status = 'posted'
          AND posted_at > DATE_SUB(NOW(), INTERVAL ${sql.raw(interval)})
          GROUP BY platform`
    ) as any;

    // Affiliate revenue
    const [affRows] = await db.execute(
      sql`SELECT COALESCE(SUM(commission_amount), 0) as total
          FROM affiliate_referrals
          WHERE status = 'converted'
          AND created_at > DATE_SUB(NOW(), INTERVAL ${sql.raw(interval)})`
    ) as any;

    return {
      period,
      totalRevenue: Number(totalRevenue) / 100, // cents to dollars
      productBreakdown: ((productRows as any[]) || []).map((r: any) => ({
        productId: r.product_id,
        revenue: Number(r.revenue) / 100,
        count: Number(r.cnt),
      })),
      platformBreakdown: ((platformRows as any[]) || []).map((r: any) => ({
        platform: r.platform,
        clicks: Number(r.clicks || 0),
        conversions: 0, // TODO: wire up UTM tracking
        revenue: 0,
      })),
      topConvertingContent: ((contentRows as any[]) || []).slice(0, 10).map((r: any) => ({
        contentId: r.id,
        platform: r.platform,
        preview: r.preview,
        conversions: 0,
        revenue: 0,
      })),
      affiliateRevenue: Number((affRows as any[])?.[0]?.total || 0) / 100,
      ctaPerformance: ((ctaRows as any[]) || []).map((r: any) => ({
        ctaId: r.id,
        label: r.label,
        clicks: Number(r.clicks || 0),
        conversions: Number(r.conversions || 0),
        conversionRate: Number(r.conversion_rate || 0),
      })),
    };
  } catch (err: any) {
    console.error("[RevenueEngine] Snapshot error:", err.message);
    return null;
  }
}

// ─── Revenue Optimization ───────────────────────────────────────────────────

export async function optimizeRevenue(): Promise<RevenueOptimization | null> {
  const snapshot = await getRevenueSnapshot("month");
  if (!snapshot) return null;

  const db = await getDb();
  if (!db) return null;

  const { sql } = await import("drizzle-orm");

  // Step 1: Optimize CTA weights based on conversion data
  const ctaAdjustments: RevenueOptimization["ctaAdjustments"] = [];

  for (const cta of snapshot.ctaPerformance) {
    if (cta.clicks < 5) continue; // Not enough data

    if (cta.conversionRate > 5 && cta.clicks > 20) {
      // High performer — boost weight
      const newWeight = Math.min(50, Math.round(cta.clicks * cta.conversionRate / 10));
      if (newWeight > cta.clicks) { // Using clicks as proxy for current weight since we have it
        ctaAdjustments.push({
          ctaId: cta.ctaId,
          currentWeight: 0, // We'll fetch actual weight when applying
          newWeight,
          reason: `High conversion rate (${cta.conversionRate}%) with ${cta.clicks} clicks`,
        });
      }
    } else if (cta.conversionRate < 0.5 && cta.clicks > 50) {
      // Low performer — reduce weight
      ctaAdjustments.push({
        ctaId: cta.ctaId,
        currentWeight: 0,
        newWeight: 5,
        reason: `Low conversion rate (${cta.conversionRate}%) despite ${cta.clicks} clicks`,
      });
    }
  }

  // Step 2: Apply CTA weight adjustments (Tier 2 — auto-execute)
  for (const adj of ctaAdjustments) {
    try {
      await db.execute(sql`UPDATE cta_offers SET weight = ${adj.newWeight} WHERE id = ${adj.ctaId}`);
    } catch { /* skip */ }
  }

  // Step 3: Ask LLM for strategic analysis
  const analysisResult = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a revenue optimization strategist for digital products. Analyze the data and give specific, actionable recommendations. Return JSON.",
      },
      {
        role: "user",
        content: `REVENUE DATA (last 30 days):\n- Total revenue: $${snapshot.totalRevenue}\n- Products: ${JSON.stringify(snapshot.productBreakdown)}\n- CTA performance: ${JSON.stringify(snapshot.ctaPerformance.slice(0, 5))}\n- Affiliate revenue: $${snapshot.affiliateRevenue}\n- Platform posts: ${JSON.stringify(snapshot.platformBreakdown)}\n\nAnalyze and return JSON:\n{\n  "bestContentPatterns": ["pattern 1", "pattern 2"],\n  "platformRanking": [{"platform": "instagram", "roi": 8.5, "recommendation": "Increase posting frequency"}],\n  "pricingSuggestions": [{"productId": "7-day-reset", "currentPrice": 47, "suggestedPrice": 47, "rationale": "Keep or adjust based on data"}],\n  "upsellOpportunities": ["opportunity 1"],\n  "strategyNote": "Overall strategic recommendation"\n}`,
      },
    ],
    maxTokens: 1500,
  });

  const analysisText = (analysisResult.choices?.[0]?.message?.content as string) || "{}";
  let cleanJson = analysisText.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let analysis: Partial<RevenueOptimization> = {};
  try {
    analysis = JSON.parse(cleanJson);
  } catch { /* use defaults */ }

  const optimization: RevenueOptimization = {
    ctaAdjustments,
    bestContentPatterns: analysis.bestContentPatterns || [],
    platformRanking: analysis.platformRanking || [],
    pricingSuggestions: analysis.pricingSuggestions || [],
    upsellOpportunities: analysis.upsellOpportunities || [],
    strategyNote: analysis.strategyNote || "Insufficient data for recommendations.",
  };

  // Log the optimization action
  try {
    await db.execute(sql`INSERT INTO agent_actions
      (category, title, description, risk_tier, status, result, executed_at)
      VALUES (
        'revenue',
        'Revenue optimization cycle',
        ${`Revenue: $${snapshot.totalRevenue}/month. Adjusted ${ctaAdjustments.length} CTAs. ${optimization.strategyNote}`},
        ${ctaAdjustments.length > 0 ? 2 : 1},
        'executed',
        ${JSON.stringify({
          revenue: snapshot.totalRevenue,
          ctaAdjustments: ctaAdjustments.length,
          pricingSuggestions: optimization.pricingSuggestions.length,
          upsellOpportunities: optimization.upsellOpportunities.length,
        })},
        NOW()
      )`);

    // Save as report
    await db.execute(sql`INSERT INTO agent_reports
      (report_type, title, content, metrics)
      VALUES (
        'revenue',
        ${`Revenue Report — $${snapshot.totalRevenue} (${snapshot.period})`},
        ${`## Revenue Optimization Report\n\n**Period:** Last 30 days\n**Total Revenue:** $${snapshot.totalRevenue}\n**Affiliate Revenue:** $${snapshot.affiliateRevenue}\n\n### Product Breakdown\n${snapshot.productBreakdown.map(p => `- ${p.productId}: $${p.revenue} (${p.count} sales)`).join("\n") || "No sales this period"}\n\n### CTA Adjustments Made\n${ctaAdjustments.map(a => `- CTA #${a.ctaId}: weight → ${a.newWeight} (${a.reason})`).join("\n") || "No adjustments needed"}\n\n### Best Content Patterns\n${optimization.bestContentPatterns.map(p => `- ${p}`).join("\n") || "Insufficient data"}\n\n### Platform Ranking\n${optimization.platformRanking.map(p => `- ${p.platform}: ROI ${p.roi} — ${p.recommendation}`).join("\n") || "Insufficient data"}\n\n### Upsell Opportunities\n${optimization.upsellOpportunities.map(u => `- ${u}`).join("\n") || "None identified"}\n\n### Strategy Note\n${optimization.strategyNote}`},
        ${JSON.stringify({
          totalRevenue: snapshot.totalRevenue,
          ctaAdjustments: ctaAdjustments.length,
          snapshot,
        })}
      )`);
  } catch (err: any) {
    console.error("[RevenueEngine] Failed to log:", err.message);
  }

  console.log(`[RevenueEngine] Optimization complete: $${snapshot.totalRevenue} revenue, ${ctaAdjustments.length} CTA adjustments`);
  return optimization;
}

// ─── Revenue Forecast ───────────────────────────────────────────────────────

export async function generateRevenueForecast(): Promise<string | null> {
  const weekSnapshot = await getRevenueSnapshot("week");
  const monthSnapshot = await getRevenueSnapshot("month");
  if (!weekSnapshot || !monthSnapshot) return null;

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a revenue forecasting analyst. Generate a concise 30/60/90 day forecast based on current trends.",
      },
      {
        role: "user",
        content: `Current data:\n- Weekly revenue: $${weekSnapshot.totalRevenue}\n- Monthly revenue: $${monthSnapshot.totalRevenue}\n- Products: ${JSON.stringify(monthSnapshot.productBreakdown)}\n- Best CTA conversion rate: ${Math.max(...monthSnapshot.ctaPerformance.map(c => c.conversionRate), 0)}%\n\nGenerate a realistic 30/60/90 day forecast with assumptions and recommendations to hit higher targets.`,
      },
    ],
    maxTokens: 1000,
  });

  return (result.choices?.[0]?.message?.content as string) || null;
}
