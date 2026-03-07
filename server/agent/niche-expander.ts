/**
 * NICHE EXPANDER — Autonomous Niche Discovery & Content System
 *
 * For the SaaS vision: discover profitable niches, auto-create content,
 * build courses, and scale across any topic — not just recovery.
 *
 * Capabilities:
 *   1. Research profitable niches using Tavily + LLM
 *   2. Validate niche viability (audience size, competition, monetization)
 *   3. Auto-create a content strategy for any niche
 *   4. Generate and queue niche-specific content
 *   5. Build courses for validated niches (via Course Factory)
 *   6. Track niche performance and double down or pivot
 *
 * This is what turns the system into a SaaS platform — it can
 * do for ANY niche what it does for recovery coaching.
 *
 * Risk Tiers:
 *   Tier 1: Niche research and validation
 *   Tier 2: Content generation for validated niches
 *   Tier 3: Course creation for new niches
 *   Tier 4: New business/brand creation, domain registration
 */

import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Types ──────────────────────────────────────────────────────────────────

export type NicheProfile = {
  slug: string;
  name: string;
  description: string;
  targetAudience: string;
  brandVoice: string;
  /** Viability score 1-10 */
  viabilityScore: number;
  /** Monthly search volume estimate */
  searchVolume: string;
  /** Competition level */
  competition: "low" | "medium" | "high";
  /** Monetization potential */
  monetization: "low" | "medium" | "high";
  /** Suggested products */
  suggestedProducts: string[];
  /** Content themes */
  contentThemes: string[];
  /** Status: discovered, validating, active, paused, abandoned */
  status: "discovered" | "validating" | "active" | "paused" | "abandoned";
};

export type NicheDiscoveryResult = {
  niches: NicheProfile[];
  researchSources: string[];
  analysisNotes: string;
};

// ─── Niche Discovery ────────────────────────────────────────────────────────

export async function discoverNiches(
  seedTopic?: string,
  count: number = 5,
): Promise<NicheDiscoveryResult> {
  console.log(`[NicheExpander] Discovering niches${seedTopic ? ` around "${seedTopic}"` : ""}...`);

  // Web research for trending niches
  let webData = "";
  try {
    const { tavilySearch } = await import("./web-research");
    const queries = seedTopic
      ? [
          `${seedTopic} profitable online course niches 2026`,
          `${seedTopic} digital products market demand`,
          `underserved ${seedTopic} communities online`,
        ]
      : [
          "most profitable online course niches 2026",
          "trending digital product ideas high demand low competition",
          "underserved online communities willing to pay",
        ];

    for (const query of queries) {
      try {
        const result = await tavilySearch({ query, depth: "advanced", maxResults: 5 });
        if (result.success) {
          for (const r of result.results) {
            webData += `SOURCE: ${r.title}\n${r.content?.substring(0, 300)}\n\n`;
          }
        }
      } catch { /* skip */ }
    }
  } catch {
    webData = "[Web research unavailable]";
  }

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a niche market researcher. Identify profitable niches for digital products and online courses. Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `WEB RESEARCH:\n${webData}\n\n${seedTopic ? `SEED TOPIC: "${seedTopic}"` : "Find the best niches across all categories."}\n\nIdentify ${count} profitable niches. For each, evaluate:\n- Audience size and willingness to pay\n- Competition level\n- Content creation feasibility\n- Monetization paths\n\nReturn JSON:\n{\n  "niches": [\n    {\n      "slug": "niche-slug",\n      "name": "Niche Name",\n      "description": "What this niche is about",\n      "targetAudience": "Who the customers are",\n      "brandVoice": "Recommended brand voice/tone",\n      "viabilityScore": 8,\n      "searchVolume": "10K-50K/month",\n      "competition": "medium",\n      "monetization": "high",\n      "suggestedProducts": ["Course on X ($97)", "Toolkit ($47)", "Membership ($29/mo)"],\n      "contentThemes": ["theme 1", "theme 2", "theme 3"],\n      "status": "discovered"\n    }\n  ],\n  "analysisNotes": "Overall analysis of the niche landscape"\n}`,
      },
    ],
    maxTokens: 4000,
  });

  const text = (result.choices?.[0]?.message?.content as string) || "{}";
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(clean);
    const discovery: NicheDiscoveryResult = {
      niches: parsed.niches || [],
      researchSources: [],
      analysisNotes: parsed.analysisNotes || "",
    };

    // Save to database
    await saveNicheDiscovery(discovery);
    console.log(`[NicheExpander] Discovered ${discovery.niches.length} niches`);
    return discovery;
  } catch {
    return { niches: [], researchSources: [], analysisNotes: "Failed to parse results" };
  }
}

// ─── Niche Validation ───────────────────────────────────────────────────────

export async function validateNiche(slug: string): Promise<{
  valid: boolean;
  score: number;
  recommendation: string;
}> {
  const db = await getDb();
  if (!db) return { valid: false, score: 0, recommendation: "Database unavailable" };

  const { sql } = await import("drizzle-orm");

  // Load niche profile
  const [rows] = await db.execute(
    sql`SELECT content, metrics FROM agent_reports
        WHERE report_type = 'niche_discovery'
        AND JSON_EXTRACT(metrics, '$.slug') = ${slug}
        ORDER BY created_at DESC LIMIT 1`
  ) as any;

  if (!(rows as any[])?.length) {
    return { valid: false, score: 0, recommendation: `Niche "${slug}" not found` };
  }

  // Do deeper research
  let webData = "";
  try {
    const { tavilySearch } = await import("./web-research");
    const niche = JSON.parse((rows as any[])[0].metrics);
    const result = await tavilySearch({
      query: `${niche.name} online course reviews competitors pricing`,
      depth: "advanced",
      maxResults: 10,
    });
    if (result.success) {
      webData = result.results.map(r => `${r.title}: ${r.content?.substring(0, 200)}`).join("\n");
    }
  } catch { /* skip */ }

  const validationResult = await invokeLLM({
    messages: [
      { role: "system", content: "You are a niche validation expert. Score the niche 1-10 and give a go/no-go recommendation. Be honest." },
      { role: "user", content: `NICHE: ${slug}\nDEEPER RESEARCH:\n${webData}\n\nScore 1-10 and recommend: go, modify, or abandon. Return JSON: {"score": 8, "valid": true, "recommendation": "explanation"}` },
    ],
    maxTokens: 500,
  });

  const text = (validationResult.choices?.[0]?.message?.content as string) || "{}";
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(clean);
  } catch {
    return { valid: false, score: 0, recommendation: "Validation failed" };
  }
}

// ─── Niche Activation ───────────────────────────────────────────────────────

/**
 * Activate a niche: create business profile, generate initial content,
 * optionally build a course.
 */
export async function activateNiche(
  niche: NicheProfile,
  opts: { createCourse?: boolean; contentCount?: number } = {},
): Promise<{ success: boolean; actions: string[] }> {
  const db = await getDb();
  if (!db) return { success: false, actions: ["Database unavailable"] };

  const { sql } = await import("drizzle-orm");
  const actions: string[] = [];

  // 1. Create business profile in DB
  try {
    await db.execute(sql`INSERT INTO businesses
      (slug, name, business_type, brand_voice, target_audience, status)
      VALUES (
        ${niche.slug},
        ${niche.name},
        'digital_products',
        ${niche.brandVoice},
        ${niche.targetAudience},
        'active'
      )
      ON DUPLICATE KEY UPDATE
        brand_voice = VALUES(brand_voice),
        target_audience = VALUES(target_audience),
        status = 'active'
    `);
    actions.push(`Created business profile: ${niche.name}`);
  } catch (err: any) {
    actions.push(`Business profile creation failed: ${err.message}`);
  }

  // 2. Generate initial content queue
  const contentCount = opts.contentCount || 10;
  try {
    const { generateContentForPlatform } = await import("../social/content-generator");
    const platforms = ["instagram", "facebook", "linkedin"];
    let generated = 0;

    for (let i = 0; i < contentCount; i++) {
      const platform = platforms[i % platforms.length];
      const theme = niche.contentThemes[i % niche.contentThemes.length];

      try {
        const content = await generateContentForPlatform({
          platform,
          businessSlug: niche.slug,
          topic: `Create content about "${theme}" for the ${niche.name} niche. Target audience: ${niche.targetAudience}. Voice: ${niche.brandVoice}`,
        });

        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + Math.floor(i / platforms.length));
        scheduledFor.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

        await db.execute(sql`INSERT INTO content_queue
          (platform, content_type, content, status, scheduled_for, media_urls)
          VALUES (
            ${platform},
            ${content.contentType || "post"},
            ${content.content},
            'ready',
            ${scheduledFor.toISOString().slice(0, 19).replace("T", " ")},
            ${JSON.stringify({ businessSlug: niche.slug, nicheContent: true })}
          )`);
        generated++;
      } catch { /* skip failed */ }
    }
    actions.push(`Generated ${generated} content posts for ${niche.name}`);
  } catch (err: any) {
    actions.push(`Content generation failed: ${err.message}`);
  }

  // 3. Build a course if requested
  if (opts.createCourse) {
    try {
      const { buildCourseFromPrompt } = await import("./course-factory");
      const courseResult = await buildCourseFromPrompt({
        prompt: `${niche.name}: ${niche.description}. Target audience: ${niche.targetAudience}`,
        businessSlug: niche.slug,
        generateVideoScripts: true,
        generateWorkbook: true,
      });

      if (courseResult.success) {
        actions.push(`Course created: ${courseResult.blueprint?.title} (${courseResult.lessonCount} lessons, ${courseResult.totalWords?.toLocaleString()} words)`);
      } else {
        actions.push(`Course creation failed: ${courseResult.errors.join(", ")}`);
      }
    } catch (err: any) {
      actions.push(`Course creation error: ${err.message}`);
    }
  }

  // Log the activation
  try {
    await db.execute(sql`INSERT INTO agent_actions
      (category, title, description, risk_tier, status, result, executed_at)
      VALUES (
        'niche_activation',
        ${`Activated niche: ${niche.name}`},
        ${`Niche "${niche.name}" activated. Actions: ${actions.join("; ")}`},
        3,
        'executed',
        ${JSON.stringify({ slug: niche.slug, actions })},
        NOW()
      )`);
  } catch { /* skip */ }

  console.log(`[NicheExpander] Activated niche "${niche.name}": ${actions.length} actions`);
  return { success: true, actions };
}

// ─── Persistence ────────────────────────────────────────────────────────────

async function saveNicheDiscovery(discovery: NicheDiscoveryResult): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { sql } = await import("drizzle-orm");

  for (const niche of discovery.niches) {
    try {
      await db.execute(sql`INSERT INTO agent_reports
        (report_type, title, content, metrics)
        VALUES (
          'niche_discovery',
          ${`Niche: ${niche.name} (score: ${niche.viabilityScore}/10)`},
          ${`## ${niche.name}\n\n${niche.description}\n\n**Target Audience:** ${niche.targetAudience}\n**Viability:** ${niche.viabilityScore}/10\n**Competition:** ${niche.competition}\n**Monetization:** ${niche.monetization}\n**Search Volume:** ${niche.searchVolume}\n\n### Suggested Products\n${niche.suggestedProducts.map(p => `- ${p}`).join("\n")}\n\n### Content Themes\n${niche.contentThemes.map(t => `- ${t}`).join("\n")}`},
          ${JSON.stringify(niche)}
        )`);
    } catch { /* skip */ }
  }
}

// ─── Auto-Discovery Loop (for Orchestrator) ─────────────────────────────────

/**
 * Called periodically by the orchestrator to discover and validate niches.
 * Only runs once per week.
 */
export async function runNicheDiscoveryLoop(): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const { sql } = await import("drizzle-orm");

  // Check if we ran recently
  const [recent] = await db.execute(
    sql`SELECT id FROM agent_actions
        WHERE category = 'niche_discovery'
        AND executed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        LIMIT 1`
  ) as any;

  if ((recent as any[])?.length > 0) {
    return null; // Already ran this week
  }

  // Discover new niches
  const discovery = await discoverNiches();

  if (discovery.niches.length > 0) {
    // Auto-validate top niche
    const topNiche = discovery.niches.sort((a, b) => b.viabilityScore - a.viabilityScore)[0];
    const validation = await validateNiche(topNiche.slug);

    let result = `Discovered ${discovery.niches.length} niches. Top: "${topNiche.name}" (${topNiche.viabilityScore}/10)`;

    if (validation.valid && validation.score >= 7) {
      result += ` — Validated! Score: ${validation.score}/10`;
      // Log as a Tier 3 action for approval before activation
      await db.execute(sql`INSERT INTO agent_actions
        (category, title, description, risk_tier, status, metadata, executed_at)
        VALUES (
          'niche_activation',
          ${`Activate niche: ${topNiche.name}?`},
          ${`High-viability niche discovered: "${topNiche.name}" (score ${validation.score}/10). ${validation.recommendation}. Approve to activate with content generation and optional course creation.`},
          3,
          'proposed',
          ${JSON.stringify({ niche: topNiche, validation })},
          NOW()
        )`);
      result += " — Proposed for activation (awaiting approval)";
    }

    return result;
  }

  return null;
}
