/**
 * VIDEO GENERATION AGENT — Autonomous Course Video Pipeline
 *
 * Runs on each agent cycle (30 min) and does two things:
 *
 * 1. SUBMIT: Find the next course_lesson with a video_script but no video_url
 *    and no in-progress heygen_job_id → submit to HeyGen → store job ID.
 *
 * 2. POLL: Find all course_lessons with a heygen_job_id but no video_url →
 *    check HeyGen status → if complete, save video_url + notify via Telegram.
 *
 * Tier 2 action: auto-executes but notifies (each video costs HeyGen credits).
 */

import { ENV } from "../_core/env";
import { getDb } from "../db";

// ─── Config ─────────────────────────────────────────────────────────────────

const MAX_SCRIPT_CHARS = 3000; // HeyGen limit per video
let columnVerified = false; // cached result of column-existence check

export function isVideoGenerationReady(): boolean {
  return !!(ENV.heygenApiKey);
}

/**
 * Check whether heygen_job_id column exists in course_lessons.
 * The column is defined in drizzle/schema.ts and should be created
 * via `pnpm run db:push`. If the DB hasn't been migrated yet, skip
 * the video cycle silently rather than crashing.
 */
async function isColumnReady(): Promise<boolean> {
  if (columnVerified) return true;
  const db = await getDb();
  if (!db) return false;
  try {
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'course_lessons' AND COLUMN_NAME = 'heygen_job_id'
          LIMIT 1`
    ) as any;
    const exists = (rows as any[])?.length > 0;
    if (exists) {
      columnVerified = true;
    } else {
      console.warn("[VideoGen] heygen_job_id column not found — run `pnpm run db:push` to add it. Skipping cycle.");
    }
    return exists;
  } catch (err: any) {
    console.warn("[VideoGen] Column check failed (non-fatal):", err.message);
    return false;
  }
}

// ─── Submit Next Lesson ─────────────────────────────────────────────────────

/**
 * Find the next course lesson that has a script but no video,
 * and no in-progress job. Submit it to HeyGen.
 */
export async function submitNextLesson(): Promise<{
  submitted: boolean;
  lessonId?: number;
  lessonTitle?: string;
  heygenVideoId?: string;
  error?: string;
}> {
  if (!isVideoGenerationReady()) {
    return { submitted: false, error: "HEYGEN_API_KEY not configured" };
  }

  const db = await getDb();
  if (!db) return { submitted: false, error: "Database not available" };

  try {
    const { sql } = await import("drizzle-orm");

    // Find next lesson: has script, no video, no in-progress job
    const [rows] = await db.execute(
      sql`SELECT id, title, video_script, module_id, lesson_number
          FROM course_lessons
          WHERE video_script IS NOT NULL
            AND video_script != ''
            AND (video_url IS NULL OR video_url = '')
            AND (heygen_job_id IS NULL OR heygen_job_id = '')
          ORDER BY module_id ASC, lesson_number ASC
          LIMIT 1`
    ) as any;

    const lesson = (rows as any[])?.[0];
    if (!lesson) {
      return { submitted: false, error: "No lessons need video generation" };
    }

    // Truncate script to HeyGen's limit
    let script = lesson.video_script as string;
    if (script.length > MAX_SCRIPT_CHARS) {
      script = script.slice(0, MAX_SCRIPT_CHARS - 3) + "...";
      console.warn(`[VideoGen] Script for lesson #${lesson.id} truncated to ${MAX_SCRIPT_CHARS} chars`);
    }

    // Submit to HeyGen
    const { createVideo } = await import("../social/heygen");
    const result = await createVideo({
      script,
      avatarId: ENV.heygenAvatarId || undefined,
      voiceId: ENV.elevenlabsVoiceId || undefined,
      title: lesson.title,
      aspectRatio: "16:9",
    });

    if (!result.success || !result.videoId) {
      // Log failure to agent_actions
      await logAction(
        `Video gen failed: ${lesson.title}`,
        `HeyGen rejected script for lesson #${lesson.id}: ${result.error}`,
        "failed",
        result.error
      );
      return { submitted: false, lessonId: lesson.id, error: result.error };
    }

    // Store the job ID in the database
    await db.execute(
      sql`UPDATE course_lessons SET heygen_job_id = ${result.videoId} WHERE id = ${lesson.id}`
    );

    // Log to agent_actions
    await logAction(
      `Video queued: ${lesson.title}`,
      `Submitted lesson #${lesson.id} (Module ${lesson.module_id}, Lesson ${lesson.lesson_number}) to HeyGen. Job ID: ${result.videoId}`,
      "executed"
    );

    console.log(`[VideoGen] Submitted lesson #${lesson.id} "${lesson.title}" → HeyGen job ${result.videoId}`);
    return {
      submitted: true,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      heygenVideoId: result.videoId,
    };
  } catch (err: any) {
    console.error("[VideoGen] submitNextLesson error:", err.message);
    return { submitted: false, error: err.message };
  }
}

// ─── Poll In-Progress Jobs ──────────────────────────────────────────────────

/**
 * Check all course lessons with a heygen_job_id but no video_url.
 * If any are complete, save the video URL and send a Telegram notification.
 */
export async function pollPendingVideos(): Promise<{
  checked: number;
  completed: number;
  failed: number;
  results: Array<{ lessonId: number; title: string; status: string; videoUrl?: string }>;
}> {
  const summary = { checked: 0, completed: 0, failed: 0, results: [] as any[] };

  if (!isVideoGenerationReady()) return summary;

  const db = await getDb();
  if (!db) return summary;

  try {
    const { sql } = await import("drizzle-orm");

    // Find all lessons with in-progress jobs
    const [rows] = await db.execute(
      sql`SELECT id, title, heygen_job_id, module_id, lesson_number
          FROM course_lessons
          WHERE heygen_job_id IS NOT NULL
            AND heygen_job_id != ''
            AND (video_url IS NULL OR video_url = '')
          ORDER BY module_id ASC, lesson_number ASC`
    ) as any;

    const pending = rows as any[];
    if (pending.length === 0) return summary;

    const { getVideoStatus } = await import("../social/heygen");

    for (const lesson of pending) {
      summary.checked++;
      const jobId = lesson.heygen_job_id as string;

      try {
        const status = await getVideoStatus(jobId);

        if (status.status === "completed" && status.videoUrl) {
          // Save video URL to database
          await db.execute(
            sql`UPDATE course_lessons
                SET video_url = ${status.videoUrl},
                    video_provider = 'other',
                    video_duration = ${status.duration || null}
                WHERE id = ${lesson.id}`
          );

          summary.completed++;
          summary.results.push({
            lessonId: lesson.id,
            title: lesson.title,
            status: "completed",
            videoUrl: status.videoUrl,
          });

          // Log success
          await logAction(
            `Video ready: ${lesson.title}`,
            `HeyGen video complete for lesson #${lesson.id} (Module ${lesson.module_id}, Lesson ${lesson.lesson_number}). URL: ${status.videoUrl}`,
            "executed"
          );

          // Send Telegram notification
          try {
            const { isTelegramConfigured, sendMessage } = await import("./telegram");
            if (isTelegramConfigured()) {
              await sendMessage(
                `🎬 *Video Complete*\n\n` +
                `*${lesson.title}*\n` +
                `Module ${lesson.module_id}, Lesson ${lesson.lesson_number}\n\n` +
                `${status.videoUrl}`
              );
            }
          } catch { /* Telegram unavailable */ }

          console.log(`[VideoGen] Video complete: lesson #${lesson.id} "${lesson.title}" → ${status.videoUrl}`);
        } else if (status.status === "failed") {
          // Clear the job ID so it can be retried
          await db.execute(
            sql`UPDATE course_lessons SET heygen_job_id = NULL WHERE id = ${lesson.id}`
          );

          summary.failed++;
          summary.results.push({
            lessonId: lesson.id,
            title: lesson.title,
            status: "failed",
          });

          await logAction(
            `Video failed: ${lesson.title}`,
            `HeyGen video failed for lesson #${lesson.id}: ${status.error || "unknown error"}. Job ID cleared for retry.`,
            "failed",
            status.error
          );

          console.error(`[VideoGen] Video failed: lesson #${lesson.id} "${lesson.title}" — ${status.error}`);
        } else {
          // Still processing
          summary.results.push({
            lessonId: lesson.id,
            title: lesson.title,
            status: status.status,
          });
          console.log(`[VideoGen] Still processing: lesson #${lesson.id} "${lesson.title}" (${status.status})`);
        }
      } catch (err: any) {
        console.error(`[VideoGen] Error checking job ${jobId}:`, err.message);
        summary.results.push({
          lessonId: lesson.id,
          title: lesson.title,
          status: "error",
        });
      }
    }
  } catch (err: any) {
    console.error("[VideoGen] pollPendingVideos error:", err.message);
  }

  return summary;
}

// ─── Combined Cycle ─────────────────────────────────────────────────────────

/**
 * Run one full video generation cycle:
 * 1. Poll any in-progress jobs first (so completed ones free up before we submit new)
 * 2. Submit the next lesson if nothing is currently processing
 *
 * Called by Mission Control's 30-minute cron cycle.
 */
export async function runVideoGenerationCycle(): Promise<{
  poll: Awaited<ReturnType<typeof pollPendingVideos>>;
  submit: Awaited<ReturnType<typeof submitNextLesson>> | null;
}> {
  console.log("[VideoGen] Running video generation cycle...");

  // Verify heygen_job_id column exists before querying it
  if (!(await isColumnReady())) {
    return { poll: { checked: 0, completed: 0, failed: 0, results: [] }, submit: null };
  }

  // 1. Check in-progress jobs
  const poll = await pollPendingVideos();
  if (poll.checked > 0) {
    console.log(`[VideoGen] Polled ${poll.checked} pending videos: ${poll.completed} completed, ${poll.failed} failed`);
  }

  // 2. Only submit a new job if nothing is currently processing
  // (HeyGen processes one at a time, and we want to be conservative with credits)
  const hasProcessing = poll.results.some(r => r.status === "processing" || r.status === "pending");
  let submit = null;

  if (!hasProcessing) {
    submit = await submitNextLesson();
    if (submit.submitted) {
      console.log(`[VideoGen] Submitted new lesson: ${submit.lessonTitle}`);
    }
  } else {
    console.log("[VideoGen] Videos still processing, skipping new submission");
  }

  return { poll, submit };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function logAction(
  title: string,
  description: string,
  status: "executed" | "failed",
  errorMessage?: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");
    const executedAt = status === "executed" ? sql`NOW()` : sql`NULL`;

    await db.execute(
      sql`INSERT INTO agent_actions
        (category, title, description, risk_tier, status, result, error_message, executed_at)
        VALUES (
          'video_generation',
          ${title},
          ${description},
          2,
          ${status},
          ${description},
          ${errorMessage || null},
          ${executedAt}
        )`
    );
  } catch (err: any) {
    console.error("[VideoGen] Failed to log action:", err.message);
  }
}
