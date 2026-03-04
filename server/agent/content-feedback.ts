/**
 * CONTENT FEEDBACK AGENT
 *
 * Accepts feedback/criticism/suggestions about any content asset (course content,
 * images, video, audio, blog posts, social posts, etc.), then:
 *
 * 1. Analyzes the feedback and determines what needs to change
 * 2. Retrieves the current content from the database or storage
 * 3. Uses AI to generate improved versions
 * 4. Re-uploads modified assets to storage (Cloudflare R2 / Forge storage)
 * 5. Updates database records with new content/URLs
 * 6. Logs all changes as agent actions for audit trail
 *
 * Integrates with Mission Control risk tiers:
 *   Tier 1: Fix typos, minor copy edits, metadata updates
 *   Tier 2: Rewrite social posts, update blog content, regenerate images
 *   Tier 3: Modify course content, change pricing copy, update lead magnets
 *   Tier 4: Structural changes to courses, new product creation
 */

import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// ─── Types ──────────────────────────────────────────────────────────────────

export type FeedbackTarget =
  | "blog_post"
  | "social_post"
  | "course_lesson"
  | "course_module"
  | "lead_magnet"
  | "image"
  | "video_script"
  | "audio_script"
  | "page_copy"
  | "product_description";

export type FeedbackType =
  | "criticism"
  | "suggestion"
  | "bug_report"
  | "content_update"
  | "style_change"
  | "factual_correction"
  | "tone_adjustment";

export type FeedbackRequest = {
  /** What type of content is being reviewed */
  target: FeedbackTarget;
  /** ID of the specific item (blog post ID, lesson ID, queue item ID, etc.) */
  targetId?: number;
  /** Slug or identifier if not numeric */
  targetSlug?: string;
  /** The feedback/criticism/suggestion text */
  feedback: string;
  /** Type of feedback */
  feedbackType?: FeedbackType;
  /** Which business this applies to */
  businessSlug?: string;
  /** Whether to auto-apply changes (tier 1-2) or propose for approval (tier 3-4) */
  autoApply?: boolean;
  /** Optional: specific field to modify (e.g. "title", "description", "content") */
  fieldToModify?: string;
};

export type FeedbackResult = {
  success: boolean;
  /** What the agent analyzed */
  analysis: string;
  /** What changes were made or proposed */
  changes: FeedbackChange[];
  /** The agent action ID for tracking */
  actionId?: number;
  /** Error if something went wrong */
  error?: string;
};

export type FeedbackChange = {
  field: string;
  original: string;
  modified: string;
  changeType: "applied" | "proposed";
  reason: string;
};

// ─── Risk Assessment ────────────────────────────────────────────────────────

function assessRiskTier(target: FeedbackTarget, feedbackType?: FeedbackType): number {
  // Tier 1: Low risk, auto-execute
  if (feedbackType === "bug_report") return 1;
  if (target === "social_post" && feedbackType === "style_change") return 1;

  // Tier 2: Medium risk, execute and notify
  if (target === "social_post") return 2;
  if (target === "blog_post" && feedbackType === "factual_correction") return 2;
  if (target === "image") return 2;

  // Tier 3: Higher risk, ask first
  if (target === "blog_post") return 3;
  if (target === "course_lesson" || target === "course_module") return 3;
  if (target === "lead_magnet") return 3;
  if (target === "product_description") return 3;

  // Tier 4: Major changes
  if (target === "page_copy") return 4;

  return 2; // Default
}

// ─── Content Retrieval ──────────────────────────────────────────────────────

async function retrieveContent(target: FeedbackTarget, targetId?: number, targetSlug?: string): Promise<{
  found: boolean;
  content: Record<string, any>;
  error?: string;
}> {
  const db = await getDb();
  if (!db) return { found: false, content: {}, error: "Database unavailable" };

  const { sql } = await import("drizzle-orm");

  switch (target) {
    case "blog_post": {
      const query = targetId
        ? sql`SELECT * FROM blog_posts WHERE id = ${targetId} LIMIT 1`
        : sql`SELECT * FROM blog_posts WHERE slug = ${targetSlug || ""} LIMIT 1`;
      const [rows] = await db.execute(query) as any;
      const post = (rows as any[])?.[0];
      if (!post) return { found: false, content: {}, error: "Blog post not found" };
      return { found: true, content: post };
    }

    case "social_post": {
      if (!targetId) return { found: false, content: {}, error: "Need targetId for social post" };
      const [rows] = await db.execute(
        sql`SELECT * FROM content_queue WHERE id = ${targetId} LIMIT 1`
      ) as any;
      const item = (rows as any[])?.[0];
      if (!item) return { found: false, content: {}, error: "Content queue item not found" };
      return { found: true, content: item };
    }

    case "course_lesson": {
      if (!targetId) return { found: false, content: {}, error: "Need targetId for course lesson" };
      const [rows] = await db.execute(
        sql`SELECT cl.*, cm.title as module_title, cm.product_id
            FROM course_lessons cl
            LEFT JOIN course_modules cm ON cl.module_id = cm.id
            WHERE cl.id = ${targetId} LIMIT 1`
      ) as any;
      const lesson = (rows as any[])?.[0];
      if (!lesson) return { found: false, content: {}, error: "Course lesson not found" };
      return { found: true, content: lesson };
    }

    case "course_module": {
      if (!targetId) return { found: false, content: {}, error: "Need targetId for course module" };
      const [rows] = await db.execute(
        sql`SELECT * FROM course_modules WHERE id = ${targetId} LIMIT 1`
      ) as any;
      const mod = (rows as any[])?.[0];
      if (!mod) return { found: false, content: {}, error: "Course module not found" };
      return { found: true, content: mod };
    }

    case "lead_magnet": {
      const query = targetId
        ? sql`SELECT * FROM lead_magnets WHERE id = ${targetId} LIMIT 1`
        : sql`SELECT * FROM lead_magnets WHERE slug = ${targetSlug || ""} LIMIT 1`;
      const [rows] = await db.execute(query) as any;
      const item = (rows as any[])?.[0];
      if (!item) return { found: false, content: {}, error: "Lead magnet not found" };
      return { found: true, content: item };
    }

    case "product_description": {
      if (!targetSlug) return { found: false, content: {}, error: "Need targetSlug for product" };
      const [rows] = await db.execute(
        sql`SELECT * FROM businesses WHERE slug = ${targetSlug} LIMIT 1`
      ) as any;
      const biz = (rows as any[])?.[0];
      if (!biz) return { found: false, content: {}, error: "Business not found" };
      return { found: true, content: biz };
    }

    default:
      return { found: false, content: {}, error: `Unsupported target type: ${target}` };
  }
}

// ─── AI Analysis & Modification ─────────────────────────────────────────────

async function analyzeAndModify(
  target: FeedbackTarget,
  content: Record<string, any>,
  feedback: string,
  feedbackType?: FeedbackType,
  fieldToModify?: string,
): Promise<{ analysis: string; changes: { field: string; original: string; modified: string; reason: string }[] }> {
  // Build content summary for the AI
  const contentSummary = Object.entries(content)
    .filter(([k, v]) => v && typeof v === "string" && k !== "passwordHash" && !k.includes("token"))
    .map(([k, v]) => `${k}: ${String(v).substring(0, 500)}`)
    .join("\n");

  const prompt = `You are a content quality agent for a recovery coaching brand (Sober Strong Academy).

CONTENT TYPE: ${target}
${fieldToModify ? `FIELD TO MODIFY: ${fieldToModify}` : ""}
FEEDBACK TYPE: ${feedbackType || "general"}

CURRENT CONTENT:
${contentSummary}

FEEDBACK/CRITICISM RECEIVED:
${feedback}

TASK: Analyze the feedback and propose specific changes. For each change, specify:
1. Which field to modify
2. The original value
3. The improved value
4. Why this change addresses the feedback

BRAND GUIDELINES:
- Tone: Real, raw, hopeful, non-judgmental
- Never preachy. Talk TO people not AT them
- Use metaphors from bodybuilding and recovery
- Personal stories over generic advice
- NEVER start with "Hey friend," or letter-style greetings

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code fences):
{
  "analysis": "Brief analysis of the feedback and what needs to change",
  "changes": [
    {
      "field": "field_name",
      "original": "original value (first 200 chars)",
      "modified": "the improved version",
      "reason": "why this change addresses the feedback"
    }
  ]
}

If the feedback is invalid or no changes are needed, return an empty changes array with an explanation in analysis.`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: "You are a content quality specialist. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    maxTokens: 2000,
  });

  const responseText = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : "";

  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(cleanJson);
  } catch {
    return {
      analysis: `AI analysis could not parse response. Raw: ${responseText.substring(0, 200)}`,
      changes: [],
    };
  }
}

// ─── Content Update Application ─────────────────────────────────────────────

async function applyChanges(
  target: FeedbackTarget,
  targetId: number | undefined,
  targetSlug: string | undefined,
  changes: { field: string; modified: string }[],
): Promise<{ applied: string[]; failed: string[] }> {
  const db = await getDb();
  if (!db) return { applied: [], failed: ["Database unavailable"] };

  const { sql } = await import("drizzle-orm");
  const applied: string[] = [];
  const failed: string[] = [];

  for (const change of changes) {
    try {
      switch (target) {
        case "blog_post": {
          const id = targetId;
          if (!id) { failed.push(`No ID for blog_post.${change.field}`); break; }

          if (change.field === "title") {
            await db.execute(sql`UPDATE blog_posts SET title = ${change.modified} WHERE id = ${id}`);
          } else if (change.field === "content") {
            await db.execute(sql`UPDATE blog_posts SET content = ${change.modified} WHERE id = ${id}`);
          } else if (change.field === "excerpt") {
            await db.execute(sql`UPDATE blog_posts SET excerpt = ${change.modified} WHERE id = ${id}`);
          } else {
            failed.push(`Unknown blog field: ${change.field}`);
            break;
          }
          applied.push(`blog_post.${change.field}`);
          break;
        }

        case "social_post": {
          const id = targetId;
          if (!id) { failed.push(`No ID for social_post.${change.field}`); break; }

          if (change.field === "content") {
            await db.execute(sql`UPDATE content_queue SET content = ${change.modified}, status = 'ready' WHERE id = ${id}`);
          } else {
            failed.push(`Unknown social field: ${change.field}`);
            break;
          }
          applied.push(`social_post.${change.field}`);
          break;
        }

        case "course_lesson": {
          const id = targetId;
          if (!id) { failed.push(`No ID for course_lesson.${change.field}`); break; }

          if (change.field === "title") {
            await db.execute(sql`UPDATE course_lessons SET title = ${change.modified} WHERE id = ${id}`);
          } else if (change.field === "description") {
            await db.execute(sql`UPDATE course_lessons SET description = ${change.modified} WHERE id = ${id}`);
          } else {
            failed.push(`Unknown lesson field: ${change.field}`);
            break;
          }
          applied.push(`course_lesson.${change.field}`);
          break;
        }

        case "course_module": {
          const id = targetId;
          if (!id) { failed.push(`No ID for course_module.${change.field}`); break; }

          if (change.field === "title") {
            await db.execute(sql`UPDATE course_modules SET title = ${change.modified} WHERE id = ${id}`);
          } else if (change.field === "description") {
            await db.execute(sql`UPDATE course_modules SET description = ${change.modified} WHERE id = ${id}`);
          } else {
            failed.push(`Unknown module field: ${change.field}`);
            break;
          }
          applied.push(`course_module.${change.field}`);
          break;
        }

        case "lead_magnet": {
          const id = targetId;
          if (!id) { failed.push(`No ID for lead_magnet.${change.field}`); break; }

          if (change.field === "title") {
            await db.execute(sql`UPDATE lead_magnets SET title = ${change.modified} WHERE id = ${id}`);
          } else if (change.field === "description") {
            await db.execute(sql`UPDATE lead_magnets SET description = ${change.modified} WHERE id = ${id}`);
          } else {
            failed.push(`Unknown lead_magnet field: ${change.field}`);
            break;
          }
          applied.push(`lead_magnet.${change.field}`);
          break;
        }

        case "product_description": {
          if (!targetSlug) { failed.push("No slug for product"); break; }

          if (change.field === "brand_voice") {
            await db.execute(sql`UPDATE businesses SET brand_voice = ${change.modified} WHERE slug = ${targetSlug}`);
          } else if (change.field === "target_audience") {
            await db.execute(sql`UPDATE businesses SET target_audience = ${change.modified} WHERE slug = ${targetSlug}`);
          } else {
            failed.push(`Unknown product field: ${change.field}`);
            break;
          }
          applied.push(`product_description.${change.field}`);
          break;
        }

        default:
          failed.push(`Apply not implemented for ${target}.${change.field}`);
      }
    } catch (err: any) {
      failed.push(`${target}.${change.field}: ${err.message}`);
    }
  }

  return { applied, failed };
}

// ─── Storage Operations (for media re-upload) ───────────────────────────────

async function regenerateAndUploadImage(
  description: string,
  originalUrl?: string,
): Promise<{ success: boolean; newUrl?: string; error?: string }> {
  try {
    const { generatePostImage, isImageGenerationConfigured } = await import("../social/image-generator");
    if (!isImageGenerationConfigured()) {
      return { success: false, error: "Image generation not configured (OPENAI_API_KEY required)" };
    }

    const result = await generatePostImage({
      content: description,
      platform: "instagram", // Use square format as default
      suggestedMediaPrompt: description,
    });

    if (!result.success || !result.imageUrl) {
      return { success: false, error: result.error || "Image generation failed" };
    }

    // Upload to Forge storage if available
    try {
      const { storagePut } = await import("../storage");
      const imageResponse = await fetch(result.imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const key = `feedback-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      const uploaded = await storagePut(key, imageBuffer, "image/png");
      return { success: true, newUrl: uploaded.url };
    } catch {
      // Forge storage not available, return the DALL-E URL directly
      return { success: true, newUrl: result.imageUrl };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Action Logging ─────────────────────────────────────────────────────────

async function logFeedbackAction(opts: {
  businessSlug?: string;
  target: FeedbackTarget;
  targetId?: number;
  feedback: string;
  analysis: string;
  changes: FeedbackChange[];
  riskTier: number;
  autoApplied: boolean;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const { sql } = await import("drizzle-orm");

    // Find business ID
    let businessId: number | null = null;
    if (opts.businessSlug) {
      const [rows] = await db.execute(
        sql`SELECT id FROM businesses WHERE slug = ${opts.businessSlug} LIMIT 1`
      ) as any;
      businessId = (rows as any[])?.[0]?.id || null;
    }

    const status = opts.autoApplied ? "executed" : "proposed";
    const [result] = await db.execute(sql`INSERT INTO agent_actions
      (business_id, category, title, description, risk_tier, status, metadata, executed_at)
      VALUES (
        ${businessId},
        'content_feedback',
        ${`Feedback: ${opts.target} #${opts.targetId || "N/A"}`},
        ${opts.analysis},
        ${opts.riskTier},
        ${status},
        ${JSON.stringify({
          target: opts.target,
          targetId: opts.targetId,
          feedback: opts.feedback,
          changes: opts.changes,
        })},
        ${opts.autoApplied ? new Date() : null}
      )`) as any;

    return result.insertId || null;
  } catch (err: any) {
    console.error("[ContentFeedback] Failed to log action:", err.message);
    return null;
  }
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

export async function processContentFeedback(request: FeedbackRequest): Promise<FeedbackResult> {
  const { target, targetId, targetSlug, feedback, feedbackType, businessSlug, autoApply, fieldToModify } = request;

  console.log(`[ContentFeedback] Processing ${feedbackType || "general"} feedback for ${target} #${targetId || targetSlug || "unknown"}`);

  // 1. Retrieve current content
  const retrieved = await retrieveContent(target, targetId, targetSlug);
  if (!retrieved.found) {
    return {
      success: false,
      analysis: `Could not find ${target}`,
      changes: [],
      error: retrieved.error,
    };
  }

  // 2. Analyze feedback and generate modifications
  const aiResult = await analyzeAndModify(target, retrieved.content, feedback, feedbackType, fieldToModify);

  if (aiResult.changes.length === 0) {
    return {
      success: true,
      analysis: aiResult.analysis,
      changes: [],
    };
  }

  // 3. Determine risk tier and whether to auto-apply
  const riskTier = assessRiskTier(target, feedbackType);
  const shouldAutoApply = autoApply !== undefined ? autoApply : riskTier <= 2;

  // 4. Apply changes or propose them
  const feedbackChanges: FeedbackChange[] = [];

  if (shouldAutoApply) {
    const { applied, failed } = await applyChanges(target, targetId, targetSlug, aiResult.changes);

    for (const change of aiResult.changes) {
      const wasApplied = applied.includes(`${target}.${change.field}`);
      feedbackChanges.push({
        field: change.field,
        original: change.original,
        modified: change.modified,
        changeType: wasApplied ? "applied" : "proposed",
        reason: change.reason,
      });
    }

    if (failed.length > 0) {
      console.warn(`[ContentFeedback] Some changes failed to apply:`, failed);
    }
  } else {
    // Propose changes without applying
    for (const change of aiResult.changes) {
      feedbackChanges.push({
        field: change.field,
        original: change.original,
        modified: change.modified,
        changeType: "proposed",
        reason: change.reason,
      });
    }
  }

  // 5. Handle image regeneration if feedback targets media
  if (target === "image" || (feedbackType === "content_update" && feedback.toLowerCase().includes("image"))) {
    const imageResult = await regenerateAndUploadImage(feedback);
    if (imageResult.success && imageResult.newUrl) {
      feedbackChanges.push({
        field: "image_url",
        original: "previous image",
        modified: imageResult.newUrl,
        changeType: shouldAutoApply ? "applied" : "proposed",
        reason: "Regenerated image based on feedback",
      });
    }
  }

  // 6. Log the action
  const actionId = await logFeedbackAction({
    businessSlug,
    target,
    targetId,
    feedback,
    analysis: aiResult.analysis,
    changes: feedbackChanges,
    riskTier,
    autoApplied: shouldAutoApply,
  });

  return {
    success: true,
    analysis: aiResult.analysis,
    changes: feedbackChanges,
    actionId: actionId || undefined,
  };
}

// ─── Bulk Feedback (apply feedback across multiple items) ───────────────────

export async function processBulkFeedback(
  requests: FeedbackRequest[],
): Promise<{ results: FeedbackResult[]; summary: string }> {
  const results: FeedbackResult[] = [];

  for (const request of requests) {
    try {
      const result = await processContentFeedback(request);
      results.push(result);
    } catch (err: any) {
      results.push({
        success: false,
        analysis: "Processing failed",
        changes: [],
        error: err.message,
      });
    }
  }

  const applied = results.reduce((sum, r) => sum + r.changes.filter(c => c.changeType === "applied").length, 0);
  const proposed = results.reduce((sum, r) => sum + r.changes.filter(c => c.changeType === "proposed").length, 0);
  const failed = results.filter(r => !r.success).length;

  return {
    results,
    summary: `Processed ${requests.length} feedback items: ${applied} changes applied, ${proposed} proposed, ${failed} failures.`,
  };
}

// ─── Apply a previously proposed change (from approval flow) ────────────────

export async function applyProposedFeedback(actionId: number): Promise<{
  success: boolean;
  applied: string[];
  error?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, applied: [], error: "Database unavailable" };

  try {
    const { sql } = await import("drizzle-orm");

    // Get the proposed action
    const [rows] = await db.execute(
      sql`SELECT * FROM agent_actions WHERE id = ${actionId} AND category = 'content_feedback' AND status = 'proposed' LIMIT 1`
    ) as any;
    const action = (rows as any[])?.[0];
    if (!action) return { success: false, applied: [], error: "Action not found or not in proposed state" };

    const metadata = JSON.parse(action.metadata || "{}");
    const changes = metadata.changes || [];

    // Apply the changes
    const changesToApply = changes
      .filter((c: FeedbackChange) => c.changeType === "proposed")
      .map((c: FeedbackChange) => ({ field: c.field, modified: c.modified }));

    const { applied, failed } = await applyChanges(
      metadata.target,
      metadata.targetId,
      undefined,
      changesToApply,
    );

    // Update the action status
    await db.execute(sql`UPDATE agent_actions
      SET status = 'executed', executed_at = NOW(), result = ${`Applied ${applied.length} changes`}
      WHERE id = ${actionId}`);

    return { success: true, applied };
  } catch (err: any) {
    return { success: false, applied: [], error: err.message };
  }
}
