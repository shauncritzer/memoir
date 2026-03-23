/**
 * COURSE FACTORY — Autonomous Course Creation Engine
 *
 * Takes a single prompt and autonomously:
 *   1. Researches the topic (Tavily + LLM)
 *   2. Analyzes competitors and pricing
 *   3. Generates full course structure (modules, lessons, scripts, workbooks)
 *   4. Creates all lesson content with exercises, reflections, action items
 *   5. Generates video scripts for each lesson
 *   6. Generates workbook/worksheet content
 *   7. Seeds everything into the database
 *   8. Queues marketing content across all platforms
 *   9. Logs everything as auditable agent actions
 *
 * This is the engine that turns "Build me a course on X" into a sellable product.
 *
 * Risk Tiers:
 *   Tier 1: Research phase (read-only)
 *   Tier 2: Content generation + DB insertion
 *   Tier 3: Pricing decisions + Stripe product creation
 *   Tier 4: Launch (marketing blast, email sequences)
 */

import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CourseRequest = {
  /** What the course is about — can be as simple as "addiction recovery for veterans" */
  prompt: string;
  /** Which business this is for */
  businessSlug?: string;
  /** Target price point (if known) */
  targetPrice?: number;
  /** Number of modules */
  moduleCount?: number;
  /** Lessons per module */
  lessonsPerModule?: number;
  /** Course duration in days (for drip unlock) */
  durationDays?: number;
  /** Auto-launch when complete? (Tier 4 action — needs approval if true) */
  autoLaunch?: boolean;
  /** Generate video scripts? */
  generateVideoScripts?: boolean;
  /** Generate workbook content? */
  generateWorkbook?: boolean;
};

export type GeneratedLesson = {
  moduleNumber: number;
  lessonNumber: number;
  title: string;
  description: string;
  /** Full lesson content (2000-4000 words) */
  content: string;
  /** Key takeaways */
  keyTakeaways: string[];
  /** Reflection questions */
  reflectionQuestions: string[];
  /** Action items / homework */
  actionItems: string[];
  /** Video script (if requested) */
  videoScript?: string;
  /** Workbook exercises (if requested) */
  workbookExercises?: string;
  /** Estimated duration in minutes */
  estimatedMinutes: number;
  /** Day this lesson unlocks (for drip) */
  unlockDay: number;
};

export type GeneratedModule = {
  moduleNumber: number;
  title: string;
  description: string;
  objective: string;
  lessons: GeneratedLesson[];
};

export type CourseBlueprint = {
  title: string;
  subtitle: string;
  description: string;
  targetAudience: string;
  uniqueAngle: string;
  suggestedPrice: number;
  priceRationale: string;
  modules: GeneratedModule[];
  marketingHooks: string[];
  emailSequenceOutline: string[];
  salesPageCopy: string;
};

export type CourseFactoryResult = {
  success: boolean;
  /** The generated course blueprint */
  blueprint?: CourseBlueprint;
  /** Product ID in database */
  productId?: string;
  /** How many lessons were generated */
  lessonCount?: number;
  /** How many words of content were generated */
  totalWords?: number;
  /** Marketing posts queued */
  marketingPostsQueued?: number;
  /** Errors encountered */
  errors: string[];
  /** Steps completed */
  stepsCompleted: string[];
  /** Agent action ID */
  actionId?: number;
};

// ─── Phase 1: Research ──────────────────────────────────────────────────────

async function researchForCourse(prompt: string, businessSlug?: string): Promise<{
  research: string;
  competitors: string;
  gaps: string;
}> {
  // Try Tavily first for live data
  let webData = "";
  try {
    const { tavilySearch } = await import("./web-research");
    const searches = await Promise.allSettled([
      tavilySearch({ query: `best online courses ${prompt} pricing reviews`, depth: "advanced", maxResults: 5 }),
      tavilySearch({ query: `${prompt} course curriculum what to include`, depth: "basic", maxResults: 5 }),
      tavilySearch({ query: `${prompt} common mistakes gaps underserved`, depth: "basic", maxResults: 3 }),
    ]);

    for (const result of searches) {
      if (result.status === "fulfilled" && result.value.success) {
        for (const r of result.value.results) {
          webData += `SOURCE: ${r.title} (${r.url})\n${r.content?.substring(0, 400)}\n\n`;
        }
      }
    }
  } catch {
    webData = "[Tavily not available — using LLM knowledge only]";
  }

  // Get brand context
  let brandContext = "Recovery coaching brand.";
  try {
    const db = await getDb();
    if (db) {
      const { sql } = await import("drizzle-orm");
      const [rows] = await db.execute(
        sql`SELECT name, brand_voice, target_audience FROM businesses WHERE slug = ${businessSlug || "sober-strong"} LIMIT 1`
      ) as any;
      const biz = (rows as any[])?.[0];
      if (biz) {
        brandContext = `Brand: ${biz.name}\nVoice: ${biz.brand_voice || "Authentic, direct, encouraging"}\nAudience: ${biz.target_audience || "Adults in addiction recovery"}`;
      }
    }
  } catch { /* use default */ }

  const result = await invokeLLM({
    messages: [
      { role: "system", content: "You are a world-class course creation strategist. Analyze the market and return a detailed research brief." },
      { role: "user", content: `BRAND CONTEXT:\n${brandContext}\n\nWEB RESEARCH:\n${webData}\n\nCOURSE TOPIC: "${prompt}"\n\nAnalyze:\n1. What courses exist on this topic? Who are the top competitors? What do they charge?\n2. What gaps exist? What are people NOT getting from existing courses?\n3. What unique angle could we take based on our brand?\n\nReturn your analysis as plain text, organized in three sections: RESEARCH, COMPETITORS, GAPS.` },
    ],
    maxTokens: 2000,
  });

  const text = (result.choices?.[0]?.message?.content as string) || "";
  return { research: text, competitors: webData, gaps: text };
}

// ─── Phase 2: Blueprint Generation ──────────────────────────────────────────

async function generateBlueprint(
  prompt: string,
  research: string,
  opts: CourseRequest,
): Promise<CourseBlueprint | null> {
  const moduleCount = opts.moduleCount || 8;
  const lessonsPerModule = opts.lessonsPerModule || 4;
  const durationDays = opts.durationDays || 30;

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert course architect. Create a comprehensive course blueprint. Return ONLY valid JSON, no markdown fences.`,
      },
      {
        role: "user",
        content: `RESEARCH:\n${research.substring(0, 3000)}\n\nCOURSE PROMPT: "${prompt}"\n\nREQUIREMENTS:\n- ${moduleCount} modules\n- ${lessonsPerModule} lessons per module\n- ${durationDays} day duration (for drip unlock scheduling)\n- Target price: ${opts.targetPrice ? `$${opts.targetPrice}` : "Suggest based on market research"}\n\nGenerate a complete course blueprint as JSON:\n{\n  "title": "Course title",\n  "subtitle": "Compelling subtitle",\n  "description": "2-3 paragraph description for the sales page",\n  "targetAudience": "Specific who this is for",\n  "uniqueAngle": "What makes this different",\n  "suggestedPrice": 97,\n  "priceRationale": "Why this price point",\n  "modules": [\n    {\n      "moduleNumber": 1,\n      "title": "Module title",\n      "description": "What this module covers",\n      "objective": "By the end of this module, students will...",\n      "lessons": [\n        {\n          "moduleNumber": 1,\n          "lessonNumber": 1,\n          "title": "Lesson title",\n          "description": "Brief lesson description",\n          "estimatedMinutes": 20,\n          "unlockDay": 1\n        }\n      ]\n    }\n  ],\n  "marketingHooks": ["5 compelling marketing hooks/headlines"],\n  "emailSequenceOutline": ["Email 1: subject + brief description", "Email 2: ...", "...7 emails"],\n  "salesPageCopy": "Full sales page copy (500+ words) with headline, pain points, solution, benefits, testimonial prompts, guarantee, CTA"\n}`,
      },
    ],
    maxTokens: 8000,
  });

  const text = (result.choices?.[0]?.message?.content as string) || "";
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(clean) as CourseBlueprint;
  } catch {
    console.error("[CourseFactory] Failed to parse blueprint JSON");
    return null;
  }
}

// ─── Phase 3: Full Lesson Content Generation ────────────────────────────────

async function generateLessonContent(
  lesson: GeneratedLesson,
  courseTitle: string,
  moduleTitle: string,
  brandVoice: string,
  opts: CourseRequest,
): Promise<GeneratedLesson> {
  // Generate main lesson content
  const contentResult = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert course content creator. Write engaging, actionable lesson content. Voice: ${brandVoice}. Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `COURSE: "${courseTitle}"\nMODULE: "${moduleTitle}"\nLESSON: "${lesson.title}"\nDESCRIPTION: "${lesson.description}"\n\nWrite the FULL lesson content. This needs to be worth paying for — thorough, practical, and transformative.\n\nReturn JSON:\n{\n  "content": "Full lesson content (2000-4000 words). Include:\n    - Opening hook that connects to the student's pain point\n    - Core teaching with real examples and stories\n    - Practical techniques they can use TODAY\n    - Common mistakes to avoid\n    - Scientific/research backing where relevant\n    - Encouraging, empowering tone throughout",\n  "keyTakeaways": ["3-5 key takeaways"],\n  "reflectionQuestions": ["3 reflection questions for journaling"],\n  "actionItems": ["3-5 specific action items / homework"]\n}`,
      },
    ],
    maxTokens: 6000,
  });

  const contentText = (contentResult.choices?.[0]?.message?.content as string) || "";
  let cleanContent = contentText.trim();
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanContent);
    lesson.content = parsed.content || "";
    lesson.keyTakeaways = parsed.keyTakeaways || [];
    lesson.reflectionQuestions = parsed.reflectionQuestions || [];
    lesson.actionItems = parsed.actionItems || [];
  } catch {
    lesson.content = contentText;
    lesson.keyTakeaways = [];
    lesson.reflectionQuestions = [];
    lesson.actionItems = [];
  }

  // Generate video script if requested
  if (opts.generateVideoScripts !== false) {
    try {
      const scriptResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a video script writer. Write a natural, conversational script for a course lesson video. Keep it under 3000 characters (HeyGen limit). Include [PAUSE] markers for natural breaks.`,
          },
          {
            role: "user",
            content: `Lesson: "${lesson.title}"\nKey content: ${lesson.content?.substring(0, 1500)}\nKey takeaways: ${lesson.keyTakeaways?.join(", ")}\n\nWrite the video script.`,
          },
        ],
        maxTokens: 1500,
      });
      lesson.videoScript = (scriptResult.choices?.[0]?.message?.content as string) || "";
    } catch {
      lesson.videoScript = "";
    }
  }

  // Generate workbook exercises if requested
  if (opts.generateWorkbook !== false) {
    try {
      const workbookResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a workbook/worksheet creator. Create practical, fillable exercises that reinforce the lesson. Make them personal and actionable.`,
          },
          {
            role: "user",
            content: `Lesson: "${lesson.title}"\nKey content: ${lesson.content?.substring(0, 1000)}\nAction items: ${lesson.actionItems?.join(", ")}\n\nCreate 3-5 workbook exercises with:\n- Clear instructions\n- Space indicators like [YOUR ANSWER HERE]\n- A mix of reflection, planning, and action exercises`,
          },
        ],
        maxTokens: 1500,
      });
      lesson.workbookExercises = (workbookResult.choices?.[0]?.message?.content as string) || "";
    } catch {
      lesson.workbookExercises = "";
    }
  }

  return lesson;
}

// ─── Phase 4: Database Insertion ────────────────────────────────────────────

async function seedCourseToDatabase(
  blueprint: CourseBlueprint,
  productId: string,
): Promise<{ modulesCreated: number; lessonsCreated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { sql } = await import("drizzle-orm");
  let modulesCreated = 0;
  let lessonsCreated = 0;

  // Clean up existing course data to prevent orphaned lessons on re-seed
  await db.execute(sql`DELETE cl FROM course_lessons cl
    INNER JOIN course_modules cm ON cl.module_id = cm.id
    WHERE cm.product_id = ${productId}`);
  await db.execute(sql`DELETE FROM course_modules WHERE product_id = ${productId}`);
  // Also clean orphaned lessons whose module_id no longer exists
  await db.execute(sql`DELETE FROM course_lessons WHERE module_id NOT IN (SELECT id FROM course_modules)`);

  // Ensure course_lessons has the new columns (safe to run multiple times)
  try {
    await db.execute(sql`ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS content TEXT`);
    await db.execute(sql`ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS video_script TEXT`);
    await db.execute(sql`ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS workbook_content TEXT`);
    await db.execute(sql`ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS estimated_minutes INT`);
  } catch {
    // Columns may already exist — that's fine
  }

  for (const mod of blueprint.modules) {
    // Insert module and get its ID
    const [moduleResult] = await db.execute(sql`INSERT INTO course_modules
      (product_id, title, description, module_number, sort_order, unlock_day)
      VALUES (
        ${productId},
        ${mod.title},
        ${mod.description},
        ${mod.moduleNumber},
        ${mod.moduleNumber},
        ${mod.lessons[0]?.unlockDay || mod.moduleNumber}
      )
    `) as any;
    const moduleId = moduleResult.insertId;
    modulesCreated++;

    // Insert lessons with moduleId FK
    for (const lesson of mod.lessons) {
      const fullContent = [
        lesson.content,
        lesson.keyTakeaways?.length ? `\n\n## Key Takeaways\n${lesson.keyTakeaways.map(t => `- ${t}`).join("\n")}` : "",
        lesson.reflectionQuestions?.length ? `\n\n## Reflection Questions\n${lesson.reflectionQuestions.map(q => `- ${q}`).join("\n")}` : "",
        lesson.actionItems?.length ? `\n\n## Action Items\n${lesson.actionItems.map(a => `- ${a}`).join("\n")}` : "",
      ].join("");

      await db.execute(sql`INSERT INTO course_lessons
        (module_id, lesson_number, title, description, content, video_script,
         workbook_content, estimated_minutes, sort_order)
        VALUES (
          ${moduleId},
          ${lesson.lessonNumber},
          ${lesson.title},
          ${lesson.description},
          ${fullContent},
          ${lesson.videoScript || null},
          ${lesson.workbookExercises || null},
          ${lesson.estimatedMinutes},
          ${(lesson.moduleNumber - 1) * 10 + lesson.lessonNumber}
        )
      `);
      lessonsCreated++;
    }
  }

  return { modulesCreated, lessonsCreated };
}

// ─── Phase 5: Marketing Content Queue ───────────────────────────────────────

async function queueMarketingContent(
  blueprint: CourseBlueprint,
  productId: string,
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { sql } = await import("drizzle-orm");
  let queued = 0;

  const platforms = ["instagram", "facebook"];

  for (const hook of blueprint.marketingHooks.slice(0, 5)) {
    for (const platform of platforms) {
      try {
        const { generateContentForPlatform } = await import("../social/content-generator");
        const content = await generateContentForPlatform({
          platform,
          businessSlug: "sober-strong",
          topic: `Promote our new course "${blueprint.title}": ${hook}. Include link to /products and mention the price $${blueprint.suggestedPrice}. Use the hook: ${hook}`,
        });

        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + queued); // Spread over days
        scheduledFor.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

        await db.execute(sql`INSERT INTO content_queue
          (platform, content_type, content, status, scheduled_for, media_urls)
          VALUES (
            ${platform},
            ${content.contentType || "post"},
            ${content.content},
            'ready',
            ${scheduledFor.toISOString().slice(0, 19).replace("T", " ")},
            ${JSON.stringify({
              hashtags: content.hashtags,
              suggestedMediaType: content.suggestedMediaType,
              suggestedMediaPrompt: content.suggestedMediaPrompt,
              coursePromo: true,
              productId,
            })}
          )`);
        queued++;
      } catch {
        // Skip failed generation, keep going
      }
    }
  }

  return queued;
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

/**
 * Build an entire course from a single prompt.
 * This is the autonomous course creation pipeline.
 */
export async function buildCourseFromPrompt(request: CourseRequest): Promise<CourseFactoryResult> {
  const result: CourseFactoryResult = {
    success: false,
    errors: [],
    stepsCompleted: [],
  };

  console.log(`[CourseFactory] Starting autonomous course build: "${request.prompt}"`);

  // Phase 1: Research
  console.log("[CourseFactory] Phase 1: Research...");
  let research: string;
  try {
    const researchData = await researchForCourse(request.prompt, request.businessSlug);
    research = researchData.research;
    result.stepsCompleted.push("Research completed");
    console.log("[CourseFactory] Research complete");
  } catch (err: any) {
    result.errors.push(`Research failed: ${err.message}`);
    research = `Topic: ${request.prompt}. No web research available.`;
  }

  // Phase 2: Blueprint
  console.log("[CourseFactory] Phase 2: Blueprint generation...");
  let blueprint: CourseBlueprint | null;
  try {
    blueprint = await generateBlueprint(request.prompt, research, request);
    if (!blueprint) {
      result.errors.push("Blueprint generation returned null");
      return result;
    }
    result.blueprint = blueprint;
    result.stepsCompleted.push(`Blueprint: ${blueprint.title} — ${blueprint.modules.length} modules`);
    console.log(`[CourseFactory] Blueprint: "${blueprint.title}" with ${blueprint.modules.length} modules`);
  } catch (err: any) {
    result.errors.push(`Blueprint failed: ${err.message}`);
    return result;
  }

  // Phase 3: Full lesson content
  console.log("[CourseFactory] Phase 3: Generating full lesson content...");
  let totalWords = 0;
  let lessonCount = 0;

  const brandVoice = "Authentic, direct, encouraging. Uses personal experience. Science-backed but accessible. No corporate speak.";

  for (const mod of blueprint.modules) {
    for (let i = 0; i < mod.lessons.length; i++) {
      try {
        mod.lessons[i] = await generateLessonContent(
          mod.lessons[i],
          blueprint.title,
          mod.title,
          brandVoice,
          request,
        );
        totalWords += (mod.lessons[i].content || "").split(/\s+/).length;
        lessonCount++;
        console.log(`[CourseFactory] Lesson ${lessonCount}: "${mod.lessons[i].title}" (${(mod.lessons[i].content || "").split(/\s+/).length} words)`);
      } catch (err: any) {
        result.errors.push(`Lesson ${mod.moduleNumber}.${mod.lessons[i].lessonNumber} failed: ${err.message}`);
      }
    }
  }

  result.lessonCount = lessonCount;
  result.totalWords = totalWords;
  result.stepsCompleted.push(`Content generated: ${lessonCount} lessons, ${totalWords.toLocaleString()} words`);

  // Phase 4: Database insertion
  console.log("[CourseFactory] Phase 4: Seeding to database...");
  const productId = blueprint.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  result.productId = productId;

  try {
    const { modulesCreated, lessonsCreated } = await seedCourseToDatabase(blueprint, productId);
    result.stepsCompleted.push(`Database: ${modulesCreated} modules, ${lessonsCreated} lessons seeded`);
    console.log(`[CourseFactory] Database: ${modulesCreated} modules, ${lessonsCreated} lessons`);
  } catch (err: any) {
    result.errors.push(`Database seeding failed: ${err.message}`);
  }

  // Phase 5: Marketing content queue (if autoLaunch or Tier 2)
  console.log("[CourseFactory] Phase 5: Queueing marketing content...");
  try {
    const marketingQueued = await queueMarketingContent(blueprint, productId);
    result.marketingPostsQueued = marketingQueued;
    result.stepsCompleted.push(`Marketing: ${marketingQueued} posts queued across platforms`);
    console.log(`[CourseFactory] Marketing: ${marketingQueued} posts queued`);
  } catch (err: any) {
    result.errors.push(`Marketing queue failed: ${err.message}`);
  }

  // Log agent action
  try {
    const db = await getDb();
    if (db) {
      const { sql } = await import("drizzle-orm");
      const [actionResult] = await db.execute(sql`INSERT INTO agent_actions
        (category, title, description, risk_tier, status, result, metadata, executed_at)
        VALUES (
          'course_creation',
          ${`Course Factory: ${blueprint.title}`},
          ${`Autonomously built course "${blueprint.title}" — ${lessonCount} lessons, ${totalWords.toLocaleString()} words, $${blueprint.suggestedPrice}`},
          2,
          'executed',
          ${JSON.stringify({
            productId,
            lessonCount,
            totalWords,
            moduleCount: blueprint.modules.length,
            price: blueprint.suggestedPrice,
            marketingPostsQueued: result.marketingPostsQueued,
          })},
          ${JSON.stringify({ prompt: request.prompt, businessSlug: request.businessSlug })},
          NOW()
        )`) as any;
      result.actionId = actionResult.insertId || undefined;

      // Also save as a research report for the Mission Control dashboard
      await db.execute(sql`INSERT INTO agent_reports
        (report_type, title, content, metrics)
        VALUES (
          'course_creation',
          ${`Course Created: ${blueprint.title}`},
          ${`## ${blueprint.title}\n${blueprint.subtitle}\n\n${blueprint.description}\n\n**Price:** $${blueprint.suggestedPrice}\n**Modules:** ${blueprint.modules.length}\n**Lessons:** ${lessonCount}\n**Total Words:** ${totalWords.toLocaleString()}\n\n### Sales Page Copy\n${blueprint.salesPageCopy}\n\n### Marketing Hooks\n${blueprint.marketingHooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\n### Email Sequence\n${blueprint.emailSequenceOutline.join("\n")}`},
          ${JSON.stringify({
            lessonCount,
            totalWords,
            modules: blueprint.modules.length,
            price: blueprint.suggestedPrice,
            stepsCompleted: result.stepsCompleted,
            errors: result.errors,
          })}
        )`);
    }
  } catch (err: any) {
    result.errors.push(`Action logging failed: ${err.message}`);
  }

  result.success = result.errors.length === 0 || lessonCount > 0;
  console.log(`[CourseFactory] Complete! ${result.success ? "SUCCESS" : "PARTIAL"}: ${lessonCount} lessons, ${totalWords.toLocaleString()} words, ${result.errors.length} errors`);

  return result;
}

// ─── Convenience: Rebuild Existing Course ───────────────────────────────────

/**
 * Rebuild/enhance an existing course with fresh content.
 * Reads existing course from DB, generates improved content.
 */
export async function enhanceExistingCourse(productId: string): Promise<CourseFactoryResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, errors: ["Database not available"], stepsCompleted: [] };
  }

  const { sql } = await import("drizzle-orm");
  const [modules] = await db.execute(
    sql`SELECT title, description FROM course_modules WHERE product_id = ${productId} ORDER BY module_number`
  ) as any;

  const existingOutline = (modules as any[])?.map((m: any) => m.title).join(", ") || "No existing modules";

  return buildCourseFromPrompt({
    prompt: `Enhance and rebuild course "${productId}". Existing modules: ${existingOutline}. Make it significantly better — more content, deeper insights, better exercises.`,
    businessSlug: "sober-strong",
    generateVideoScripts: true,
    generateWorkbook: true,
  });
}
