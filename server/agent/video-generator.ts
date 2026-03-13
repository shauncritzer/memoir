/**
 * VIDEO GENERATION AGENT — Autonomous Course Video Pipeline
 *
 * Runs on each agent cycle (30 min) and does two things:
 *
 * 1. SUBMIT: Find the next lesson (from `lessons` table) with a description but
 *    no video_url and no in-progress job → submit to HeyGen → store job in video_generation_jobs.
 *
 * 2. POLL: Find all video_generation_jobs with status='pending' →
 *    check HeyGen status → if complete, save video_url + notify via Telegram.
 *
 * Job tracking uses a separate video_generation_jobs table (created via
 * CREATE TABLE IF NOT EXISTS on boot) to avoid DDL ALTER TABLE issues.
 *
 * Tier 2 action: auto-executes but notifies (each video costs HeyGen credits).
 */

import { ENV } from "../_core/env";
import { getDb } from "../db";

// ─── Config ─────────────────────────────────────────────────────────────────

const MAX_SCRIPT_CHARS = 3000; // HeyGen limit per video
let tableEnsured = false; // cached — only run CREATE TABLE once per process

export function isVideoGenerationReady(): boolean {
  return !!(ENV.heygenApiKey);
}

/**
 * Ensure the video_generation_jobs table exists.
 * Uses CREATE TABLE IF NOT EXISTS (DML-safe, no DDL ALTER required).
 */
async function ensureJobsTable(): Promise<boolean> {
  if (tableEnsured) return true;
  const db = await getDb();
  if (!db) return false;
  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS video_generation_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lesson_id INT NOT NULL,
        heygen_job_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL
      )
    `);
    tableEnsured = true;
    return true;
  } catch (err: any) {
    console.warn("[VideoGen] Failed to ensure video_generation_jobs table:", err.message);
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

    // Find next lesson: has description (used as script), no video, no in-progress job
    const [rows] = await db.execute(
      sql`SELECT l.id, l.title, l.description, l.day_number, l.product_id
          FROM lessons l
          WHERE l.description IS NOT NULL
            AND l.description != ''
            AND (l.video_url IS NULL OR l.video_url = '')
            AND l.id NOT IN (
              SELECT vgj.lesson_id FROM video_generation_jobs vgj
              WHERE vgj.status IN ('pending', 'processing')
            )
          ORDER BY l.day_number ASC, l.id ASC
          LIMIT 1`
    ) as any;

    const lesson = (rows as any[])?.[0];
    if (!lesson) {
      return { submitted: false, error: "No lessons need video generation" };
    }

    // Truncate script to HeyGen's limit (description serves as the video script)
    let script = lesson.description as string;
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

    // Store the job in video_generation_jobs
    await db.execute(
      sql`INSERT INTO video_generation_jobs (lesson_id, heygen_job_id, status)
          VALUES (${lesson.id}, ${result.videoId}, 'pending')`
    );

    // Log to agent_actions
    await logAction(
      `Video queued: ${lesson.title}`,
      `Submitted lesson #${lesson.id} (Day ${lesson.day_number}, ${lesson.product_id}) to HeyGen. Job ID: ${result.videoId}`,
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
 * Check all video_generation_jobs with status 'pending' or 'processing'.
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

    // Find all pending/processing jobs joined with lesson info
    const [rows] = await db.execute(
      sql`SELECT vgj.id AS job_id, vgj.lesson_id, vgj.heygen_job_id, vgj.status AS job_status,
                 l.title, l.day_number, l.product_id
          FROM video_generation_jobs vgj
          JOIN lessons l ON l.id = vgj.lesson_id
          WHERE vgj.status IN ('pending', 'processing')
          ORDER BY vgj.created_at ASC`
    ) as any;

    const pending = rows as any[];
    if (pending.length === 0) return summary;

    const { getVideoStatus } = await import("../social/heygen");

    for (const job of pending) {
      summary.checked++;
      const jobId = job.heygen_job_id as string;

      try {
        const status = await getVideoStatus(jobId);

        if (status.status === "completed" && status.videoUrl) {
          // Save video URL to lessons table
          await db.execute(
            sql`UPDATE lessons
                SET video_url = ${status.videoUrl}
                WHERE id = ${job.lesson_id}`
          );

          // Mark job as completed
          await db.execute(
            sql`UPDATE video_generation_jobs
                SET status = 'completed', completed_at = NOW()
                WHERE id = ${job.job_id}`
          );

          summary.completed++;
          summary.results.push({
            lessonId: job.lesson_id,
            title: job.title,
            status: "completed",
            videoUrl: status.videoUrl,
          });

          // Log success
          await logAction(
            `Video ready: ${job.title}`,
            `HeyGen video complete for lesson #${job.lesson_id} (Day ${job.day_number}, ${job.product_id}). URL: ${status.videoUrl}`,
            "executed"
          );

          // Send Telegram notification
          try {
            const { isTelegramConfigured, sendMessage } = await import("./telegram");
            if (isTelegramConfigured()) {
              await sendMessage(
                `🎬 *Video Complete*\n\n` +
                `*${job.title}*\n` +
                `Day ${job.day_number} (${job.product_id})\n\n` +
                `${status.videoUrl}`
              );
            }
          } catch { /* Telegram unavailable */ }

          console.log(`[VideoGen] Video complete: lesson #${job.lesson_id} "${job.title}" → ${status.videoUrl}`);
        } else if (status.status === "failed") {
          // Mark job as failed so lesson can be retried
          await db.execute(
            sql`UPDATE video_generation_jobs
                SET status = 'failed', completed_at = NOW()
                WHERE id = ${job.job_id}`
          );

          summary.failed++;
          summary.results.push({
            lessonId: job.lesson_id,
            title: job.title,
            status: "failed",
          });

          await logAction(
            `Video failed: ${job.title}`,
            `HeyGen video failed for lesson #${job.lesson_id}: ${status.error || "unknown error"}. Job marked failed for retry.`,
            "failed",
            status.error
          );

          console.error(`[VideoGen] Video failed: lesson #${job.lesson_id} "${job.title}" — ${status.error}`);
        } else {
          // Still processing — update status if changed
          if (status.status !== job.job_status) {
            await db.execute(
              sql`UPDATE video_generation_jobs SET status = ${status.status} WHERE id = ${job.job_id}`
            );
          }

          summary.results.push({
            lessonId: job.lesson_id,
            title: job.title,
            status: status.status,
          });
          console.log(`[VideoGen] Still processing: lesson #${job.lesson_id} "${job.title}" (${status.status})`);
        }
      } catch (err: any) {
        console.error(`[VideoGen] Error checking job ${jobId}:`, err.message);
        summary.results.push({
          lessonId: job.lesson_id,
          title: job.title,
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
 * 1. Ensure video_generation_jobs table exists
 * 2. Poll any in-progress jobs first (so completed ones free up before we submit new)
 * 3. Submit the next lesson if nothing is currently processing
 *
 * Called by Mission Control's 30-minute cron cycle.
 */
export async function runVideoGenerationCycle(): Promise<{
  poll: Awaited<ReturnType<typeof pollPendingVideos>>;
  submit: Awaited<ReturnType<typeof submitNextLesson>> | null;
}> {
  console.log("[VideoGen] Running video generation cycle...");

  // Ensure the jobs table exists before querying it
  if (!(await ensureJobsTable())) {
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
