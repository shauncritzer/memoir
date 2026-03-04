/**
 * RESEARCH & CREATION AGENT
 *
 * Autonomous agent that can:
 * 1. Research what exists in any given niche/topic
 * 2. Analyze competitors, trends, and gaps
 * 3. Generate improved content ideas based on research
 * 4. Create course outlines, digital products, lead magnets
 * 5. Draft content that builds on existing work in the space
 *
 * Used for:
 * - New course/product creation
 * - Competitive analysis before launching content
 * - Identifying market gaps and opportunities
 * - Generating research-backed content strategies
 * - Digital product ideation and planning
 *
 * Integrates with Mission Control risk tiers:
 *   Tier 1: Research and analysis (no side effects)
 *   Tier 2: Draft content and save to DB
 *   Tier 3: Create new products/courses (needs approval)
 *   Tier 4: Pricing and launch decisions
 */

import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ResearchScope =
  | "course"
  | "digital_product"
  | "lead_magnet"
  | "blog_series"
  | "social_campaign"
  | "content_strategy"
  | "competitor_analysis"
  | "market_research";

export type ResearchRequest = {
  /** What are we researching? */
  scope: ResearchScope;
  /** The topic/niche/idea to research */
  topic: string;
  /** Additional context or constraints */
  context?: string;
  /** Which business this is for */
  businessSlug?: string;
  /** How deep should the research go */
  depth?: "quick" | "standard" | "deep";
  /** Should the agent also create draft content? */
  createDraft?: boolean;
};

export type CompetitorInfo = {
  name: string;
  url?: string;
  strengths: string[];
  weaknesses: string[];
  priceRange?: string;
  uniqueAngle?: string;
};

export type ContentGap = {
  topic: string;
  opportunity: string;
  difficulty: "low" | "medium" | "high";
  potentialImpact: "low" | "medium" | "high";
};

export type ResearchResult = {
  success: boolean;
  /** Summary of findings */
  summary: string;
  /** Detailed market analysis */
  marketAnalysis: {
    existingProducts: string[];
    competitors: CompetitorInfo[];
    priceRange: string;
    audienceSize: string;
    trendDirection: string;
  };
  /** Identified gaps and opportunities */
  contentGaps: ContentGap[];
  /** Improvement suggestions */
  improvements: {
    title: string;
    description: string;
    effort: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
  }[];
  /** Draft content (if createDraft was true) */
  draft?: CreatedDraft;
  /** Action ID for tracking */
  actionId?: number;
  error?: string;
};

export type CreatedDraft = {
  type: ResearchScope;
  title: string;
  outline: string[];
  description: string;
  targetAudience: string;
  uniqueAngle: string;
  suggestedPrice?: string;
  estimatedTimeToCreate?: string;
  modules?: CourseModuleDraft[];
  contentPieces?: ContentPieceDraft[];
};

export type CourseModuleDraft = {
  moduleNumber: number;
  title: string;
  description: string;
  lessonTopics: string[];
  estimatedDuration: string;
};

export type ContentPieceDraft = {
  title: string;
  platform: string;
  hook: string;
  outline: string;
};

// ─── Research Functions ─────────────────────────────────────────────────────

async function getBrandContext(businessSlug?: string): Promise<string> {
  const slug = businessSlug || "sober-strong";
  const db = await getDb();
  if (!db) return "Recovery coaching brand focused on science-backed approaches to addiction and trauma healing.";

  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT name, brand_voice, target_audience, products FROM businesses WHERE slug = ${slug} LIMIT 1`
    ) as any;

    const biz = (rows as any[])?.[0];
    if (!biz) return "Recovery coaching brand.";

    return `Brand: ${biz.name}\nVoice: ${biz.brand_voice || "Not defined"}\nAudience: ${biz.target_audience || "Not defined"}\nProducts: ${biz.products || "[]"}`;
  } catch {
    return "Recovery coaching brand.";
  }
}

async function getExistingContent(businessSlug?: string): Promise<string> {
  const db = await getDb();
  if (!db) return "No existing content data available.";

  try {
    const { sql } = await import("drizzle-orm");

    // Get existing courses/modules
    const [modules] = await db.execute(
      sql`SELECT DISTINCT product_id, title FROM course_modules ORDER BY product_id, sort_order`
    ) as any;

    // Get existing lead magnets
    const [magnets] = await db.execute(
      sql`SELECT title, type, description FROM lead_magnets WHERE status = 'active'`
    ) as any;

    // Get recent blog topics
    const [blogs] = await db.execute(
      sql`SELECT title, category FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 20`
    ) as any;

    const parts: string[] = [];

    if ((modules as any[])?.length > 0) {
      parts.push("EXISTING COURSES:\n" + (modules as any[]).map((m: any) => `- [${m.product_id}] ${m.title}`).join("\n"));
    }
    if ((magnets as any[])?.length > 0) {
      parts.push("EXISTING LEAD MAGNETS:\n" + (magnets as any[]).map((m: any) => `- ${m.title} (${m.type}): ${m.description || ""}`).join("\n"));
    }
    if ((blogs as any[])?.length > 0) {
      parts.push("RECENT BLOG TOPICS:\n" + (blogs as any[]).map((b: any) => `- [${b.category || "uncategorized"}] ${b.title}`).join("\n"));
    }

    return parts.length > 0 ? parts.join("\n\n") : "No existing content found.";
  } catch {
    return "Could not load existing content.";
  }
}

// ─── Core Research Engine ───────────────────────────────────────────────────

async function conductResearch(request: ResearchRequest): Promise<ResearchResult> {
  const brandContext = await getBrandContext(request.businessSlug);
  const existingContent = await getExistingContent(request.businessSlug);

  const depthInstructions = {
    quick: "Provide a brief analysis with 3-5 key findings. Focus on the most important opportunities.",
    standard: "Provide a thorough analysis covering competitors, gaps, and opportunities. 8-12 findings.",
    deep: "Provide an exhaustive analysis. Cover every angle: competitors, pricing, audience segments, content gaps, distribution channels, monetization strategies, seasonal trends. 15+ findings.",
  };

  const scopeInstructions: Record<ResearchScope, string> = {
    course: "Analyze the online course market for this topic. What courses exist? What do they charge? What's missing? How can we create something 10x better?",
    digital_product: "Analyze digital products (ebooks, templates, toolkits, apps) in this space. What exists? Where are the gaps? What would people pay for?",
    lead_magnet: "Research effective lead magnets in this niche. What are competitors offering for free? What would attract our ideal audience? What format works best?",
    blog_series: "Research content themes and blog series ideas. What topics get engagement? What's been covered to death? Where's the fresh angle?",
    social_campaign: "Research social media campaigns in this space. What content formats work? What hooks get engagement? What platforms are best?",
    content_strategy: "Research a comprehensive content strategy. What mix of content types, platforms, and topics would maximize growth and conversions?",
    competitor_analysis: "Deep competitive analysis. Who are the top players? What are they doing well? Where are they weak? How can we differentiate?",
    market_research: "Broad market research. Market size, audience demographics, willingness to pay, trending topics, seasonal patterns.",
  };

  const prompt = `You are a world-class market research analyst and content strategist.

BRAND CONTEXT:
${brandContext}

EXISTING CONTENT WE ALREADY HAVE:
${existingContent}

RESEARCH REQUEST:
Scope: ${request.scope}
Topic: "${request.topic}"
${request.context ? `Additional Context: ${request.context}` : ""}

SPECIFIC RESEARCH FOCUS:
${scopeInstructions[request.scope]}

DEPTH: ${depthInstructions[request.depth || "standard"]}

IMPORTANT: Since you cannot browse the web, use your training knowledge about this space. Focus on well-known competitors, established market patterns, and proven strategies. Be specific with names, prices, and strategies you know about.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code fences):
{
  "summary": "2-3 sentence executive summary of findings",
  "marketAnalysis": {
    "existingProducts": ["Product 1 by Company A ($X)", "Product 2 by Company B ($Y)", ...],
    "competitors": [
      {
        "name": "Competitor Name",
        "url": "website if known",
        "strengths": ["strength 1", "strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "priceRange": "$X-$Y",
        "uniqueAngle": "What makes them different"
      }
    ],
    "priceRange": "Overall market price range $X-$Y",
    "audienceSize": "Estimated audience size and characteristics",
    "trendDirection": "Growing/Stable/Declining + explanation"
  },
  "contentGaps": [
    {
      "topic": "Gap topic",
      "opportunity": "Why this is an opportunity",
      "difficulty": "low|medium|high",
      "potentialImpact": "low|medium|high"
    }
  ],
  "improvements": [
    {
      "title": "Improvement idea",
      "description": "Detailed description",
      "effort": "low|medium|high",
      "impact": "low|medium|high"
    }
  ]
}`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert market researcher. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    maxTokens: 3000,
  });

  const responseText = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : "";

  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      success: true,
      summary: parsed.summary || "",
      marketAnalysis: parsed.marketAnalysis || { existingProducts: [], competitors: [], priceRange: "Unknown", audienceSize: "Unknown", trendDirection: "Unknown" },
      contentGaps: parsed.contentGaps || [],
      improvements: parsed.improvements || [],
    };
  } catch {
    return {
      success: false,
      summary: "Research analysis could not be parsed",
      marketAnalysis: { existingProducts: [], competitors: [], priceRange: "Unknown", audienceSize: "Unknown", trendDirection: "Unknown" },
      contentGaps: [],
      improvements: [],
      error: `Failed to parse research results. Raw: ${responseText.substring(0, 300)}`,
    };
  }
}

// ─── Draft Creation Engine ──────────────────────────────────────────────────

async function createDraft(
  scope: ResearchScope,
  topic: string,
  research: ResearchResult,
  businessSlug?: string,
): Promise<CreatedDraft | null> {
  const brandContext = await getBrandContext(businessSlug);

  const prompt = `You are a product creation expert and content strategist.

BRAND CONTEXT:
${brandContext}

PRODUCT TYPE: ${scope}
TOPIC: "${topic}"

MARKET RESEARCH FINDINGS:
Summary: ${research.summary}
Competitors: ${research.marketAnalysis.competitors.map(c => `${c.name}: ${c.uniqueAngle || "N/A"}`).join(", ")}
Price Range: ${research.marketAnalysis.priceRange}
Content Gaps: ${research.contentGaps.map(g => g.topic).join(", ")}
Key Improvements: ${research.improvements.map(i => i.title).join(", ")}

TASK: Create a detailed draft for a ${scope} that:
1. Fills identified content gaps
2. Improves upon what competitors offer
3. Aligns with our brand voice and audience
4. Has a clear unique selling proposition

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code fences):
{
  "title": "Product/course/content title",
  "description": "2-3 sentence description of what this is",
  "targetAudience": "Who this is specifically for",
  "uniqueAngle": "What makes this different from everything else out there",
  "suggestedPrice": "Suggested price point with rationale",
  "estimatedTimeToCreate": "Realistic time estimate",
  ${scope === "course" ? `"modules": [
    {
      "moduleNumber": 1,
      "title": "Module title",
      "description": "What this module covers",
      "lessonTopics": ["Lesson 1 topic", "Lesson 2 topic"],
      "estimatedDuration": "X minutes"
    }
  ],` : ""}
  ${scope === "blog_series" || scope === "social_campaign" ? `"contentPieces": [
    {
      "title": "Piece title",
      "platform": "target platform",
      "hook": "Opening hook",
      "outline": "Brief outline"
    }
  ],` : ""}
  "outline": ["Key section/component 1", "Key section/component 2", "..."]
}`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert product creator. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    maxTokens: 2500,
  });

  const responseText = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : "";

  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      type: scope,
      title: parsed.title || "Untitled Draft",
      outline: parsed.outline || [],
      description: parsed.description || "",
      targetAudience: parsed.targetAudience || "",
      uniqueAngle: parsed.uniqueAngle || "",
      suggestedPrice: parsed.suggestedPrice,
      estimatedTimeToCreate: parsed.estimatedTimeToCreate,
      modules: parsed.modules,
      contentPieces: parsed.contentPieces,
    };
  } catch {
    return null;
  }
}

// ─── Action Logging ─────────────────────────────────────────────────────────

async function logResearchAction(opts: {
  businessSlug?: string;
  scope: ResearchScope;
  topic: string;
  summary: string;
  hasDraft: boolean;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const { sql } = await import("drizzle-orm");

    let businessId: number | null = null;
    if (opts.businessSlug) {
      const [rows] = await db.execute(
        sql`SELECT id FROM businesses WHERE slug = ${opts.businessSlug} LIMIT 1`
      ) as any;
      businessId = (rows as any[])?.[0]?.id || null;
    }

    const [result] = await db.execute(sql`INSERT INTO agent_actions
      (business_id, category, title, description, risk_tier, status, metadata, executed_at)
      VALUES (
        ${businessId},
        'research',
        ${`Research: ${opts.scope} — ${opts.topic.substring(0, 80)}`},
        ${opts.summary},
        ${opts.hasDraft ? 2 : 1},
        'executed',
        ${JSON.stringify({ scope: opts.scope, topic: opts.topic, hasDraft: opts.hasDraft })},
        NOW()
      )`) as any;

    return result.insertId || null;
  } catch (err: any) {
    console.error("[ResearchCreator] Failed to log action:", err.message);
    return null;
  }
}

async function saveResearchReport(opts: {
  businessSlug?: string;
  scope: ResearchScope;
  topic: string;
  result: ResearchResult;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");

    let businessId: number | null = null;
    if (opts.businessSlug) {
      const [rows] = await db.execute(
        sql`SELECT id FROM businesses WHERE slug = ${opts.businessSlug} LIMIT 1`
      ) as any;
      businessId = (rows as any[])?.[0]?.id || null;
    }

    // Build a readable report
    const reportContent = [
      `## Research Report: ${opts.topic}`,
      `**Scope:** ${opts.scope}`,
      `**Summary:** ${opts.result.summary}`,
      "",
      "### Market Analysis",
      `**Price Range:** ${opts.result.marketAnalysis.priceRange}`,
      `**Audience:** ${opts.result.marketAnalysis.audienceSize}`,
      `**Trend:** ${opts.result.marketAnalysis.trendDirection}`,
      "",
      "### Competitors",
      ...opts.result.marketAnalysis.competitors.map(c =>
        `- **${c.name}** ${c.priceRange ? `(${c.priceRange})` : ""}: ${c.uniqueAngle || "No unique angle identified"}`
      ),
      "",
      "### Content Gaps & Opportunities",
      ...opts.result.contentGaps.map(g =>
        `- **${g.topic}** (${g.difficulty} effort / ${g.potentialImpact} impact): ${g.opportunity}`
      ),
      "",
      "### Recommended Improvements",
      ...opts.result.improvements.map(i =>
        `- **${i.title}** (${i.effort} effort / ${i.impact} impact): ${i.description}`
      ),
    ];

    if (opts.result.draft) {
      reportContent.push(
        "",
        "### Draft Created",
        `**Title:** ${opts.result.draft.title}`,
        `**Description:** ${opts.result.draft.description}`,
        `**Unique Angle:** ${opts.result.draft.uniqueAngle}`,
        `**Suggested Price:** ${opts.result.draft.suggestedPrice || "TBD"}`,
        `**Estimated Time:** ${opts.result.draft.estimatedTimeToCreate || "TBD"}`,
        "",
        "**Outline:**",
        ...opts.result.draft.outline.map((item, i) => `${i + 1}. ${item}`),
      );

      if (opts.result.draft.modules) {
        reportContent.push(
          "",
          "**Course Modules:**",
          ...opts.result.draft.modules.map(m =>
            `- Module ${m.moduleNumber}: ${m.title} (${m.estimatedDuration})\n  ${m.lessonTopics.map(l => `  - ${l}`).join("\n")}`
          ),
        );
      }
    }

    await db.execute(sql`INSERT INTO agent_reports
      (report_type, business_id, title, content, metrics, suggested_actions)
      VALUES (
        'research',
        ${businessId},
        ${`Research: ${opts.scope} — ${opts.topic.substring(0, 100)}`},
        ${reportContent.join("\n")},
        ${JSON.stringify({
          competitors: opts.result.marketAnalysis.competitors.length,
          gaps: opts.result.contentGaps.length,
          improvements: opts.result.improvements.length,
        })},
        ${JSON.stringify(opts.result.improvements.slice(0, 5))}
      )`);

    console.log(`[ResearchCreator] Saved research report for "${opts.topic}"`);
  } catch (err: any) {
    console.error("[ResearchCreator] Failed to save report:", err.message);
  }
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

export async function conductResearchAndCreate(request: ResearchRequest): Promise<ResearchResult> {
  console.log(`[ResearchCreator] Starting ${request.depth || "standard"} research on "${request.topic}" (${request.scope})`);

  // 1. Conduct the research
  const research = await conductResearch(request);

  if (!research.success) {
    return research;
  }

  // 2. Create a draft if requested
  if (request.createDraft) {
    const draft = await createDraft(request.scope, request.topic, research, request.businessSlug);
    if (draft) {
      research.draft = draft;
    }
  }

  // 3. Log the action and save the report
  const actionId = await logResearchAction({
    businessSlug: request.businessSlug,
    scope: request.scope,
    topic: request.topic,
    summary: research.summary,
    hasDraft: !!research.draft,
  });
  research.actionId = actionId || undefined;

  await saveResearchReport({
    businessSlug: request.businessSlug,
    scope: request.scope,
    topic: request.topic,
    result: research,
  });

  console.log(`[ResearchCreator] Research complete: ${research.contentGaps.length} gaps, ${research.improvements.length} improvements${research.draft ? ", draft created" : ""}`);

  return research;
}

// ─── Convenience Methods ────────────────────────────────────────────────────

/** Quick competitor analysis */
export async function analyzeCompetitors(topic: string, businessSlug?: string): Promise<ResearchResult> {
  return conductResearchAndCreate({
    scope: "competitor_analysis",
    topic,
    businessSlug,
    depth: "standard",
    createDraft: false,
  });
}

/** Research and draft a new course */
export async function researchAndDraftCourse(topic: string, context?: string, businessSlug?: string): Promise<ResearchResult> {
  return conductResearchAndCreate({
    scope: "course",
    topic,
    context,
    businessSlug,
    depth: "deep",
    createDraft: true,
  });
}

/** Research and draft a new lead magnet */
export async function researchAndDraftLeadMagnet(topic: string, businessSlug?: string): Promise<ResearchResult> {
  return conductResearchAndCreate({
    scope: "lead_magnet",
    topic,
    businessSlug,
    depth: "standard",
    createDraft: true,
  });
}

/** Research a content strategy */
export async function researchContentStrategy(topic: string, businessSlug?: string): Promise<ResearchResult> {
  return conductResearchAndCreate({
    scope: "content_strategy",
    topic,
    businessSlug,
    depth: "deep",
    createDraft: true,
  });
}
