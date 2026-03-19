/**
 * DISCORD COMMAND POLLER — Picks up pending commands from Supabase
 *
 * The Discord bot writes pending_command rows to the `agent_coordination` table
 * in Supabase. This poller watches for those rows, processes them (via the
 * Rewired Engine's own capabilities), and writes responses back to `system_state`
 * so the Discord bot can deliver them to #command-center.
 *
 * IMPORTANT: This queries Supabase (agent_coordination lives there), NOT the
 * Railway MySQL database. Uses the same Supabase client as coordination.ts
 * and vector-memory.ts.
 *
 * Flow:
 *   1. Poll agent_coordination for rows with action_type='pending_command' AND status='pending'
 *   2. Mark each as 'processing' to prevent double-pickup
 *   3. Process the command (engine status, queue info, health check, etc.)
 *   4. Write the response to system_state at key discord_response:{message_id}
 *   5. Mark the coordination row as 'completed'
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import cron from "node-cron";

// ─── Supabase Client ─────────────────────────────────────────────────────────
// Same pattern as coordination.ts — uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

let sbClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (sbClient) return sbClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  sbClient = createClient(url, key);
  return sbClient;
}

// ─── Command Processing ─────────────────────────────────────────────────────

/**
 * Process a single command from Discord and return a text response.
 */
async function processCommand(message: string, author: string): Promise<string> {
  const lower = message.toLowerCase().trim();

  // ── Built-in commands the Rewired Engine can answer directly ──

  if (lower === "status" || lower === "engine status") {
    return await getEngineStatusSummary();
  }

  if (lower === "health" || lower === "health check") {
    return await getHealthSummary();
  }

  if (lower === "queue" || lower === "queue status") {
    return await getQueueSummary();
  }

  if (lower === "platforms" || lower === "platform status") {
    return await getPlatformSummary();
  }

  if (lower === "help" || lower === "commands") {
    return [
      "**Rewired Engine Commands:**",
      "`status` — Engine overview (uptime, scheduler, health)",
      "`health` — Full health check (database, pipeline, LLM, integrations)",
      "`queue` — Content pipeline queue counts",
      "`platforms` — Social platform connection status",
      "`help` — This message",
      "",
      "Everything else gets a full AI response from Freddy.",
    ].join("\n");
  }

  // ── Not a built-in command — route to Claude for an intelligent response ──
  return await askFreddy(message, author);
}

// ─── Freddy AI (Claude) ──────────────────────────────────────────────────────

const FREDDY_SYSTEM_PROMPT = `You are Freddy, the autonomous AI agent running Shaun Critzer's business systems. You operate inside Discord #command-center as Shaun's right-hand operator.

## Who you work for
Shaun Critzer — recovery coach, author of "Crooked Lines: Bent, Not Broken", founder of Sober Strong Academy and the REWIRED methodology. Communication style: informal, direct, no corporate speak.

## The businesses you manage
1. **Sober Strong Academy** (shauncritzer.com) — Recovery coaching, memoir, digital products, automated content. This is the primary business.
2. **Critzer's Cabinets** (critzerscabinets.com) — 40-year family cabinet business, AI sales agent (future).
3. **The Engine** (SaaS, name TBD) — The autonomous business OS that runs #1 and #2.

## What's live and working
- Website at shauncritzer.com (Railway, auto-deploys from GitHub main)
- Instagram + Facebook auto-posting (content generation + DALL-E images + posting)
- Stripe checkout for 7-Day REWIRED Reset ($47) — live and selling
- AI Coach (10 free messages, then upsell)
- Email capture → ConvertKit (7 sequences, 31 emails)
- Lead magnet downloads (First 3 Chapters, Recovery Toolkit, Reading Guide)
- Mission Control agent dashboard
- Content pipeline scheduler (cron-based)
- Supabase coordination layer (shared state between agents)
- Discord bot (this conversation)
- Telegram briefings + approvals

## Products
| Product | Price | Status |
|---------|-------|--------|
| 7-Day REWIRED Reset | $47 | LIVE — selling |
| From Broken to Whole (30-day course) | $97 | Content seeded, needs videos |
| Crooked Lines memoir | $19.99 | Manuscript complete, needs KDP |
| Bent Not Broken Circle | $29/mo | After 50 course sales |

## Tech stack
- Frontend: React 19 + TypeScript + Vite + Tailwind + Radix UI
- Backend: Express + tRPC + Drizzle ORM (MySQL on Railway)
- AI: Claude (primary via Anthropic API), Gemini Flash (free fallback), OpenAI (DALL-E images)
- Social: Instagram/Facebook (working), Twitter (needs $200/mo API), LinkedIn (not connected), YouTube (token issues)
- Agent memory: Supabase pgvector
- Orchestration: LangGraph
- Video: HeyGen AI avatars, ElevenLabs TTS

## Tier permission system
- Tier 1: Auto-execute (post content, send emails)
- Tier 2: Execute + notify (spend < $25)
- Tier 3: Ask first (spend $25-$100)
- Tier 4: Must approve (financial > $100)

## Current priorities
1. Build "From Broken to Whole" 30-day course content ($97)
2. Complete course delivery UI with video embedding + progress tracking
3. Fix YouTube pipeline (Google Cloud Testing → Production)
4. Connect LinkedIn
5. Grow email list to 5K+

## How to respond
- Keep responses concise and actionable. Discord messages should be scannable.
- Use markdown formatting (bold, code blocks, lists) — Discord renders it.
- If Shaun asks you to do something that's Tier 3-4, tell him you need explicit approval.
- When asked about the system, pull from the context above — don't guess.
- Be direct and honest. If something is broken, say so. If you don't know, say so.
- You can reference built-in commands: status, health, queue, platforms.`;

/**
 * Route a free-form message to Claude via the existing LLM provider chain.
 * Returns an intelligent response as Freddy.
 */
async function askFreddy(message: string, author: string): Promise<string> {
  try {
    const { invokeLLM } = await import("../_core/llm");

    // Gather live context to inject into the conversation
    let liveContext = "";
    try {
      const healthSummary = await getHealthSummary();
      const queueSummary = await getQueueSummary();
      liveContext = `\n\n## Live engine state (just now)\n${healthSummary}\n\n${queueSummary}`;
    } catch {
      // Non-critical — Freddy can still respond without live data
    }

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: FREDDY_SYSTEM_PROMPT + liveContext,
        },
        {
          role: "user",
          content: `[${author} in #command-center]: ${message}`,
        },
      ],
      maxTokens: 1024,
    });

    const text = result.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.trim()) {
      return text.trim();
    }

    // Handle array content (shouldn't happen normally but defensive)
    if (Array.isArray(text)) {
      const joined = text
        .map((part: any) => (typeof part === "string" ? part : part?.text ?? ""))
        .join("");
      if (joined.trim()) return joined.trim();
    }

    return "I processed your message but got an empty response. Try again or use `help` for built-in commands.";
  } catch (err: any) {
    console.error("[CommandPoller] Freddy AI error:", err.message);
    return `LLM error: ${err.message}\n\nBuilt-in commands still work — try \`status\`, \`health\`, \`queue\`, or \`platforms\`.`;
  }
}

async function getEngineStatusSummary(): Promise<string> {
  const lines: string[] = ["**Rewired Engine Status**", ""];

  try {
    const { getSchedulerStatus } = await import("../social/scheduler");
    const sched = getSchedulerStatus();
    lines.push(`Scheduler: ${sched.running ? "running" : "stopped"}`);
    for (const [task, state] of Object.entries(sched.tasks)) {
      lines.push(`  ${task}: ${state}`);
    }
  } catch {
    lines.push("Scheduler: could not query");
  }

  try {
    const { getEngineHealth } = await import("../agent/self-monitor");
    const health = await getEngineHealth();
    lines.push("");
    lines.push(`Overall health: **${health.overall}**`);
    lines.push(`Uptime: ${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`);
    if (health.warnings.length > 0) lines.push(`Warnings: ${health.warnings.join(", ")}`);
    if (health.criticals.length > 0) lines.push(`Criticals: ${health.criticals.join(", ")}`);
  } catch {
    lines.push("Health: could not query");
  }

  return lines.join("\n");
}

async function getHealthSummary(): Promise<string> {
  try {
    const { getEngineHealth } = await import("../agent/self-monitor");
    const health = await getEngineHealth();
    const lines: string[] = [
      `**Health: ${health.overall}** (uptime ${Math.floor(health.uptime / 3600)}h)`,
      "",
    ];
    for (const c of health.components) {
      const icon = c.status === "healthy" ? "+" : c.status === "degraded" ? "!" : "X";
      lines.push(`[${icon}] ${c.name}: ${c.message}`);
    }
    return lines.join("\n");
  } catch (err: any) {
    return `Health check failed: ${err.message}`;
  }
}

async function getQueueSummary(): Promise<string> {
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return "Database not available.";

    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(sql`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'generating' THEN 1 ELSE 0 END) as generating,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN status = 'posted' AND posted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as posted_24h,
        SUM(CASE WHEN status = 'failed' AND updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as failed_24h
      FROM content_queue
    `) as any;

    const r = (rows as any[])?.[0] || {};
    return [
      "**Content Queue**",
      `Pending: ${r.pending || 0}`,
      `Generating: ${r.generating || 0}`,
      `Ready: ${r.ready || 0}`,
      `Posted (24h): ${r.posted_24h || 0}`,
      `Failed (24h): ${r.failed_24h || 0}`,
    ].join("\n");
  } catch (err: any) {
    return `Queue query failed: ${err.message}`;
  }
}

async function getPlatformSummary(): Promise<string> {
  const lines: string[] = ["**Platform Status**", ""];
  const checks: [string, () => boolean | Promise<boolean>][] = [];

  try {
    const meta = await import("../social/meta");
    checks.push(["Instagram/Facebook", () => !!(process.env.META_PAGE_ACCESS_TOKEN && process.env.META_PAGE_ID)]);
  } catch { /* */ }

  try {
    const { isLinkedInConfigured } = await import("../social/linkedin");
    checks.push(["LinkedIn", isLinkedInConfigured]);
  } catch { /* */ }

  try {
    const { isYouTubeConfigured } = await import("../social/youtube");
    checks.push(["YouTube", isYouTubeConfigured]);
  } catch { /* */ }

  try {
    const { isHeyGenConfigured } = await import("../social/heygen");
    checks.push(["HeyGen", isHeyGenConfigured]);
  } catch { /* */ }

  checks.push(["Twitter/X", () => !!(process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_ACCESS_TOKEN)]);

  for (const [name, check] of checks) {
    try {
      const ok = await check();
      lines.push(`${ok ? "[+]" : "[-]"} ${name}: ${ok ? "configured" : "not configured"}`);
    } catch {
      lines.push(`[?] ${name}: check failed`);
    }
  }

  return lines.join("\n");
}

// ─── Poller Loop ─────────────────────────────────────────────────────────────

async function pollPendingCommands(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  try {
    // Query agent_coordination in Supabase for pending commands
    const { data: pendingRows, error: fetchError } = await sb
      .from("agent_coordination")
      .select("*")
      .eq("action_type", "pending_command")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("[CommandPoller] Supabase query error:", fetchError.message);
      return;
    }

    if (!pendingRows || pendingRows.length === 0) return;

    console.log(`[CommandPoller] Found ${pendingRows.length} pending command(s)`);

    for (const row of pendingRows) {
      const details = row.details as Record<string, any> || {};
      const messageId = details.message_id;
      const message = details.message || "";
      const author = details.author || "unknown";

      if (!messageId) {
        // Malformed row — mark completed to avoid infinite retry
        await sb.from("agent_coordination")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", row.id);
        continue;
      }

      // Mark as processing to prevent double-pickup
      const { error: updateError } = await sb
        .from("agent_coordination")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("status", "pending"); // Optimistic lock

      if (updateError) {
        console.error(`[CommandPoller] Failed to mark ${messageId} as processing:`, updateError.message);
        continue;
      }

      // Process the command
      let response: string;
      try {
        response = await processCommand(message, author);
      } catch (err: any) {
        response = `Command processing error: ${err.message}`;
      }

      // Write response to system_state so the Discord bot picks it up
      const responseKey = `discord_response:${messageId}`;
      const { error: stateError } = await sb
        .from("system_state")
        .upsert(
          {
            key: responseKey,
            value: { response, processed_at: new Date().toISOString() },
            updated_by: "rewired_engine",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (stateError) {
        console.error(`[CommandPoller] Failed to write response for ${messageId}:`, stateError.message);
      }

      // Mark the coordination row as completed
      await sb.from("agent_coordination")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", row.id);

      console.log(`[CommandPoller] Processed ${messageId} from ${author}: "${message.slice(0, 60)}"`);
    }
  } catch (err: any) {
    console.error("[CommandPoller] Poll cycle error:", err.message);
  }
}

// ─── Start / Stop ────────────────────────────────────────────────────────────

let pollerTask: cron.ScheduledTask | null = null;

export function startCommandPoller(): void {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log("[CommandPoller] Supabase not configured — poller disabled");
    return;
  }

  console.log("[CommandPoller] Starting (polls every 5 seconds)...");

  // Run immediately on startup
  pollPendingCommands().catch((err) => {
    console.error("[CommandPoller] Initial poll failed:", err.message);
  });

  // Then every 5 seconds via cron (finest granularity for near-realtime)
  pollerTask = cron.schedule("*/5 * * * * *", async () => {
    await pollPendingCommands();
  });
}

export function stopCommandPoller(): void {
  if (pollerTask) {
    pollerTask.stop();
    pollerTask = null;
    console.log("[CommandPoller] Stopped");
  }
}
