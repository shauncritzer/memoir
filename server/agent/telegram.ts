/**
 * TELEGRAM INTEGRATION — Two-Way Messaging for Briefings, Approvals & Commands
 *
 * Sends daily briefings, Tier 3-4 approval requests, and critical alerts
 * directly to Shaun's phone via Telegram Bot API. Receives text commands
 * back from Shaun and acts on them (approve, deny, post now, pause, status).
 *
 * Setup:
 *   1. Message @BotFather on Telegram → /newbot → get TELEGRAM_BOT_TOKEN
 *   2. Message your bot, then visit:
 *      https://api.telegram.org/bot<TOKEN>/getUpdates
 *      to get your chat_id from the response
 *   3. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway env vars
 *
 * Two-Way Commands (text Shaun can send to the bot):
 *   /status           — Engine status: last run, pending approvals, today's actions
 *   /pending          — List all pending Tier 3-4 approvals with approve/deny buttons
 *   /approve <id>     — Approve action by ID
 *   /deny <id>        — Deny action by ID
 *   /post now         — Trigger immediate content generation + posting cycle
 *   /pause <platform> — Pause posting to a platform (instagram, facebook, etc.)
 *   /resume <platform>— Resume posting to a platform
 *   /help             — Show available commands
 *   (any other text)  — Treated as a direct owner command to the engine
 */

import { ENV } from "../_core/env";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TelegramMessageType =
  | "briefing"
  | "approval_request"
  | "critical_alert"
  | "action_summary"
  | "status_update";

export type InlineButton = {
  text: string;
  callback_data: string;
};

// ─── Configuration ──────────────────────────────────────────────────────────

const TELEGRAM_API = "https://api.telegram.org";

function getConfig(): { token: string; chatId: string } {
  const token = ENV.telegramBotToken;
  const chatId = ENV.telegramChatId;

  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN not configured. Create a bot via @BotFather on Telegram, then add the token to Railway."
    );
  }
  if (!chatId) {
    throw new Error(
      "TELEGRAM_CHAT_ID not configured. Message your bot, then visit https://api.telegram.org/bot<TOKEN>/getUpdates to find your chat_id."
    );
  }

  return { token, chatId };
}

export function isTelegramConfigured(): boolean {
  // DISABLED — migrated to Discord as primary interface. All callers gate on this.
  return false;
}

// ─── Core Send Function ─────────────────────────────────────────────────────

async function sendTelegramRequest(method: string, body: Record<string, any>): Promise<any> {
  const { token } = getConfig();
  const url = `${TELEGRAM_API}/bot${token}/${method}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error (${method}): ${response.status} — ${errorText}`);
  }

  return response.json();
}

// ─── Message Functions ──────────────────────────────────────────────────────

/**
 * Send a plain text or Markdown message to Shaun.
 */
export async function sendMessage(
  text: string,
  options?: { parseMode?: "Markdown" | "HTML"; disablePreview?: boolean }
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  try {
    const { chatId } = getConfig();

    const result = await sendTelegramRequest("sendMessage", {
      chat_id: chatId,
      text: truncateMessage(text),
      parse_mode: options?.parseMode || "Markdown",
      disable_web_page_preview: options?.disablePreview ?? true,
    });

    return { success: true, messageId: result.result?.message_id };
  } catch (err: any) {
    console.error("[Telegram] Send failed:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send a message with inline buttons (for approvals).
 */
export async function sendMessageWithButtons(
  text: string,
  buttons: InlineButton[][],
  options?: { parseMode?: "Markdown" | "HTML" }
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  try {
    const { chatId } = getConfig();

    const result = await sendTelegramRequest("sendMessage", {
      chat_id: chatId,
      text: truncateMessage(text),
      parse_mode: options?.parseMode || "Markdown",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: buttons,
      },
    });

    return { success: true, messageId: result.result?.message_id };
  } catch (err: any) {
    console.error("[Telegram] Send with buttons failed:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── Specialized Message Types ──────────────────────────────────────────────

/**
 * Send the daily morning briefing.
 */
export async function sendDailyBriefing(
  briefingContent: string,
  alertsCount: number,
  pendingApprovals: number
): Promise<{ success: boolean; error?: string }> {
  const header = alertsCount > 0
    ? `🔔 *Daily Briefing* — ${alertsCount} alert${alertsCount > 1 ? "s" : ""}, ${pendingApprovals} pending`
    : `☀️ *Daily Briefing* — All clear, ${pendingApprovals} pending`;

  const message = `${header}\n\n${briefingContent}`;

  // If there are pending approvals, add a button to view them
  if (pendingApprovals > 0) {
    return sendMessageWithButtons(message, [
      [{ text: `📋 View ${pendingApprovals} Pending Approvals`, callback_data: "view_approvals" }],
    ]);
  }

  return sendMessage(message);
}

/**
 * Send a Tier 3-4 approval request with approve/deny buttons.
 */
export async function sendApprovalRequest(
  actionId: number,
  title: string,
  description: string,
  riskTier: number,
  category: string
): Promise<{ success: boolean; error?: string }> {
  const tierEmoji = riskTier >= 4 ? "🔴" : "🟡";
  const tierLabel = riskTier >= 4 ? "TIER 4 — MUST APPROVE" : "TIER 3 — NEEDS APPROVAL";

  const message = [
    `${tierEmoji} *${tierLabel}*`,
    ``,
    `*${escapeMarkdown(title)}*`,
    `Category: ${category}`,
    ``,
    escapeMarkdown(description),
  ].join("\n");

  return sendMessageWithButtons(message, [
    [
      { text: "✅ Approve", callback_data: `approve_${actionId}` },
      { text: "❌ Deny", callback_data: `deny_${actionId}` },
    ],
  ]);
}

/**
 * Send a critical system alert.
 */
export async function sendCriticalAlert(
  title: string,
  message: string,
  details?: string
): Promise<{ success: boolean; error?: string }> {
  const text = [
    `🚨 *CRITICAL ALERT*`,
    ``,
    `*${escapeMarkdown(title)}*`,
    ``,
    escapeMarkdown(message),
    details ? `\n\`\`\`\n${details.substring(0, 500)}\n\`\`\`` : "",
  ].filter(Boolean).join("\n");

  return sendMessage(text);
}

/**
 * Send a summary of autonomous actions taken.
 */
export async function sendActionSummary(
  actions: string[],
  errors: string[]
): Promise<{ success: boolean; error?: string }> {
  if (actions.length === 0 && errors.length === 0) return { success: true };

  const lines: string[] = [];

  if (actions.length > 0) {
    lines.push(`⚡ *Engine Actions* (${actions.length})`);
    for (const action of actions.slice(0, 10)) {
      lines.push(`• ${escapeMarkdown(action)}`);
    }
    if (actions.length > 10) {
      lines.push(`_...and ${actions.length - 10} more_`);
    }
  }

  if (errors.length > 0) {
    lines.push(``);
    lines.push(`⚠️ *Errors* (${errors.length})`);
    for (const error of errors.slice(0, 5)) {
      lines.push(`• ${escapeMarkdown(error)}`);
    }
  }

  return sendMessage(lines.join("\n"));
}

// ─── Webhook Handler for Button Callbacks + Text Commands ────────────────────

/**
 * Process Telegram updates: button callbacks AND text commands.
 * Wire this into an Express route: POST /api/telegram/webhook
 */
export async function handleTelegramWebhook(body: any): Promise<{ handled: boolean; action?: string }> {
  // Route 1: Inline button callbacks (approve/deny buttons)
  if (body?.callback_query) {
    return handleCallbackQuery(body.callback_query);
  }

  // Route 2: Text messages (commands from Shaun)
  if (body?.message?.text) {
    const chatId = String(body.message.chat?.id);
    const configuredChatId = ENV.telegramChatId;

    // Security: only process messages from Shaun's chat
    if (configuredChatId && chatId !== configuredChatId) {
      console.warn(`[Telegram] Ignoring message from unknown chat_id: ${chatId}`);
      return { handled: false };
    }

    return handleTextCommand(body.message.text.trim());
  }

  return { handled: false };
}

/**
 * Handle inline button callback queries (approve/deny/view_approvals).
 */
async function handleCallbackQuery(callbackQuery: any): Promise<{ handled: boolean; action?: string }> {
  const data = callbackQuery.data;
  const messageId = callbackQuery.message?.message_id;

  // Answer the callback to remove the loading spinner
  try {
    await sendTelegramRequest("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
    });
  } catch {
    // Non-critical, continue
  }

  // Handle approval/denial
  if (data?.startsWith("approve_") || data?.startsWith("deny_")) {
    const parts = data.split("_");
    const action = parts[0]; // "approve" or "deny"
    const actionId = parseInt(parts[1], 10);

    if (isNaN(actionId)) {
      return { handled: false };
    }

    return processApproval(action, actionId, messageId);
  }

  // Handle "view_approvals" — send a list of pending actions
  if (data === "view_approvals") {
    return listPendingApprovals();
  }

  return { handled: false };
}

/**
 * Process an approve/deny action (shared by button callbacks and text commands).
 */
async function processApproval(
  action: string,
  actionId: number,
  messageId?: number
): Promise<{ handled: boolean; action?: string }> {
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return { handled: false };

    const { sql } = await import("drizzle-orm");

    if (action === "approve") {
      const [result] = await db.execute(
        sql`UPDATE agent_actions SET status = 'approved', approved_at = NOW() WHERE id = ${actionId} AND status = 'proposed'`
      ) as any;

      const affected = result?.affectedRows ?? result?.changes ?? 0;
      if (affected === 0) {
        await sendMessage(`⚠️ Action #${actionId} not found or already processed.`);
        return { handled: true, action: `approve_not_found_${actionId}` };
      }

      // Update the Telegram message if from a button press
      if (messageId) {
        try {
          const { chatId } = getConfig();
          await sendTelegramRequest("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: `✅ *APPROVED* — Action #${actionId} approved at ${new Date().toLocaleTimeString()}`,
            parse_mode: "Markdown",
          });
        } catch {
          // Non-critical
        }
      } else {
        await sendMessage(`✅ *APPROVED* — Action #${actionId}`, { parseMode: "Markdown" });
      }

      return { handled: true, action: `approved_${actionId}` };
    } else {
      const [result] = await db.execute(
        sql`UPDATE agent_actions SET status = 'denied' WHERE id = ${actionId} AND status = 'proposed'`
      ) as any;

      const affected = result?.affectedRows ?? result?.changes ?? 0;
      if (affected === 0) {
        await sendMessage(`⚠️ Action #${actionId} not found or already processed.`);
        return { handled: true, action: `deny_not_found_${actionId}` };
      }

      if (messageId) {
        try {
          const { chatId } = getConfig();
          await sendTelegramRequest("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: `❌ *DENIED* — Action #${actionId} denied at ${new Date().toLocaleTimeString()}`,
            parse_mode: "Markdown",
          });
        } catch {
          // Non-critical
        }
      } else {
        await sendMessage(`❌ *DENIED* — Action #${actionId}`, { parseMode: "Markdown" });
      }

      return { handled: true, action: `denied_${actionId}` };
    }
  } catch (err: any) {
    console.error("[Telegram] Approval processing error:", err.message);
    return { handled: false };
  }
}

/**
 * List all pending approvals and send them as messages with buttons.
 */
async function listPendingApprovals(): Promise<{ handled: boolean; action?: string }> {
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return { handled: false };

    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT id, title, description, risk_tier, category FROM agent_actions WHERE status = 'proposed' ORDER BY risk_tier DESC, created_at ASC LIMIT 10`
    ) as any;

    if (!rows || (rows as any[]).length === 0) {
      await sendMessage("📋 No pending approvals right now.");
      return { handled: true, action: "view_approvals_empty" };
    }

    // Send each approval as a separate message with buttons
    for (const row of rows as any[]) {
      await sendApprovalRequest(
        row.id,
        row.title,
        row.description || "No description",
        row.risk_tier,
        row.category
      );
    }

    return { handled: true, action: `view_approvals_${(rows as any[]).length}` };
  } catch (err: any) {
    console.error("[Telegram] View approvals error:", err.message);
    return { handled: false };
  }
}

// ─── Text Command Processing ────────────────────────────────────────────────

/**
 * Parse and execute text commands sent by Shaun.
 */
async function handleTextCommand(text: string): Promise<{ handled: boolean; action?: string }> {
  const lower = text.toLowerCase();

  // /help — show available commands
  if (lower === "/help" || lower === "/start") {
    await sendMessage([
      "🤖 *Rewired Engine Commands*",
      "",
      "/status — Engine status overview",
      "/pending — View pending approvals",
      "/approve <id> — Approve an action",
      "/deny <id> — Deny an action",
      "/post now — Trigger content generation \\+ posting",
      "/pause <platform> — Pause posting (instagram, facebook, etc.)",
      "/resume <platform> — Resume posting",
      "/help — This message",
      "",
      "_Or just type a message — the engine treats it as a direct command._",
    ].join("\n"));
    return { handled: true, action: "help" };
  }

  // /status — engine state
  if (lower === "/status") {
    return handleStatusCommand();
  }

  // /pending — list approvals
  if (lower === "/pending") {
    return listPendingApprovals();
  }

  // /approve <id>
  if (lower.startsWith("/approve ")) {
    const id = parseInt(text.substring("/approve ".length).trim(), 10);
    if (isNaN(id)) {
      await sendMessage("⚠️ Usage: /approve <action id>");
      return { handled: true, action: "approve_invalid" };
    }
    return processApproval("approve", id);
  }

  // /deny <id>
  if (lower.startsWith("/deny ")) {
    const id = parseInt(text.substring("/deny ".length).trim(), 10);
    if (isNaN(id)) {
      await sendMessage("⚠️ Usage: /deny <action id>");
      return { handled: true, action: "deny_invalid" };
    }
    return processApproval("deny", id);
  }

  // /post now — trigger immediate content cycle
  if (lower === "/post now" || lower === "/postnow") {
    return handlePostNowCommand();
  }

  // /pause <platform>
  if (lower.startsWith("/pause ")) {
    const platform = text.substring("/pause ".length).trim().toLowerCase();
    return handlePausePlatform(platform, true);
  }

  // /resume <platform>
  if (lower.startsWith("/resume ")) {
    const platform = text.substring("/resume ".length).trim().toLowerCase();
    return handlePausePlatform(platform, false);
  }

  // Anything else — treat as a direct owner command to the engine
  return handleOwnerCommand(text);
}

/**
 * /status — Show engine state, pending approvals, recent actions.
 */
async function handleStatusCommand(): Promise<{ handled: boolean; action?: string }> {
  try {
    const { getAgentState } = await import("./mission-control");
    const agentState = getAgentState();

    const { getDb } = await import("../db");
    const db = await getDb();

    let recentActions = 0;
    let failedToday = 0;
    let queuedContent = 0;
    if (db) {
      const { sql } = await import("drizzle-orm");
      const [acted] = await db.execute(sql`SELECT COUNT(*) as cnt FROM agent_actions WHERE status = 'executed' AND executed_at > CURDATE()`) as any;
      recentActions = (acted as any[])?.[0]?.cnt || 0;
      const [failed] = await db.execute(sql`SELECT COUNT(*) as cnt FROM agent_actions WHERE status = 'failed' AND created_at > CURDATE()`) as any;
      failedToday = (failed as any[])?.[0]?.cnt || 0;
      const [queued] = await db.execute(sql`SELECT COUNT(*) as cnt FROM content_queue WHERE status IN ('pending', 'ready') AND scheduled_for <= NOW()`) as any;
      queuedContent = (queued as any[])?.[0]?.cnt || 0;
    }

    const lastRun = agentState.lastRun
      ? `${Math.round((Date.now() - agentState.lastRun.getTime()) / 60000)}min ago`
      : "never";

    const lines = [
      "📊 *Engine Status*",
      "",
      `Last cycle: ${lastRun}`,
      `Running: ${agentState.isRunning ? "yes ⏳" : "idle"}`,
      `Businesses: ${agentState.activeBusinesses}`,
      `Pending approvals: ${agentState.pendingApprovals}`,
      `Actions today: ${recentActions}`,
      failedToday > 0 ? `Failed today: ${failedToday} ⚠️` : "",
      queuedContent > 0 ? `Content queued: ${queuedContent}` : "",
      agentState.alerts.length > 0 ? `Active alerts: ${agentState.alerts.length}` : "",
    ].filter(Boolean);

    await sendMessage(lines.join("\n"));
    return { handled: true, action: "status" };
  } catch (err: any) {
    await sendMessage(`⚠️ Status check failed: ${err.message}`);
    return { handled: true, action: "status_error" };
  }
}

/**
 * /post now — Trigger immediate content generation and posting.
 */
async function handlePostNowCommand(): Promise<{ handled: boolean; action?: string }> {
  try {
    await sendMessage("⚡ Triggering content generation and posting cycle...");

    const { processContentGeneration, processScheduledPosts } = await import("../social/scheduler");
    await processContentGeneration();
    await processScheduledPosts();

    await sendMessage("✅ *Post cycle complete* — content generated and posted.");
    return { handled: true, action: "post_now" };
  } catch (err: any) {
    await sendMessage(`⚠️ Post cycle failed: ${err.message}`);
    return { handled: true, action: "post_now_error" };
  }
}

/**
 * /pause <platform> or /resume <platform> — Toggle platform posting.
 */
async function handlePausePlatform(
  platform: string,
  pause: boolean
): Promise<{ handled: boolean; action?: string }> {
  const validPlatforms = ["instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok"];
  if (!validPlatforms.includes(platform)) {
    await sendMessage(
      `⚠️ Unknown platform: "${platform}"\n\nValid: ${validPlatforms.join(", ")}`
    );
    return { handled: true, action: "pause_invalid" };
  }

  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) {
      await sendMessage("⚠️ Database unavailable");
      return { handled: false };
    }

    const { sql } = await import("drizzle-orm");

    if (pause) {
      // Mark all pending/ready content for this platform as 'paused'
      await db.execute(
        sql`UPDATE content_queue SET status = 'paused' WHERE platform = ${platform} AND status IN ('pending', 'ready')`
      );
      await sendMessage(`⏸️ *${platform}* paused — no new posts will go out until you /resume ${platform}`);
    } else {
      // Un-pause: set 'paused' items back to 'ready'
      await db.execute(
        sql`UPDATE content_queue SET status = 'ready' WHERE platform = ${platform} AND status = 'paused'`
      );
      await sendMessage(`▶️ *${platform}* resumed — queued posts will go out on next cycle`);
    }

    return { handled: true, action: `${pause ? "pause" : "resume"}_${platform}` };
  } catch (err: any) {
    await sendMessage(`⚠️ Failed to ${pause ? "pause" : "resume"} ${platform}: ${err.message}`);
    return { handled: true, action: `${pause ? "pause" : "resume"}_error` };
  }
}

/**
 * Free-text owner command — forward to Mission Control as a Tier 2 action.
 */
async function handleOwnerCommand(text: string): Promise<{ handled: boolean; action?: string }> {
  try {
    const { proposeOwnerCommand } = await import("./mission-control");
    await proposeOwnerCommand(text, "sober-strong");
    await sendMessage(
      `📝 *Command received*\n\n"${escapeMarkdown(text.substring(0, 200))}"\n\nQueued as Tier 2 action — will execute next cycle.`
    );
    return { handled: true, action: "owner_command" };
  } catch (err: any) {
    await sendMessage(`⚠️ Failed to queue command: ${err.message}`);
    return { handled: true, action: "owner_command_error" };
  }
}

// ─── Polling (getUpdates) — receives text commands without public webhook URL ─

let pollingActive = false;
let pollingOffset = 0;

/**
 * Start long-polling loop to receive Telegram updates.
 * This is the primary way the bot receives text commands from Shaun.
 * Works even if the server has no publicly reachable webhook URL.
 */
export async function startTelegramPolling(): Promise<void> {
  if (!isTelegramConfigured()) {
    console.log("[Telegram] Not configured — polling disabled");
    return;
  }

  if (pollingActive) return;
  pollingActive = true;

  // Delete any stale webhook so getUpdates works
  try {
    await sendTelegramRequest("deleteWebhook", { drop_pending_updates: false });
  } catch {
    // Non-critical
  }

  console.log("[Telegram] Polling started — bot is now two-way");

  pollLoop();
}

async function pollLoop(): Promise<void> {
  while (pollingActive) {
    try {
      const { token } = getConfig();
      const url = `${TELEGRAM_API}/bot${token}/getUpdates`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35_000);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offset: pollingOffset,
          timeout: 30, // Telegram long-poll: wait up to 30s for new updates
          allowed_updates: ["message", "callback_query"],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`[Telegram] Poll error: ${response.status}`);
        await sleep(5000);
        continue;
      }

      const data = await response.json();
      const updates = data.result || [];

      for (const update of updates) {
        pollingOffset = update.update_id + 1;
        try {
          await handleTelegramWebhook(update);
        } catch (err: any) {
          console.error("[Telegram] Error handling update:", err.message);
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Normal timeout, continue polling
        continue;
      }
      console.error("[Telegram] Poll loop error:", err.message);
      await sleep(5000);
    }
  }
}

export function stopTelegramPolling(): void {
  pollingActive = false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Diagnostic Function ────────────────────────────────────────────────────

export async function diagnoseTelegram(): Promise<{
  configured: boolean;
  botWorking: boolean;
  botUsername?: string;
  error?: string;
}> {
  if (!ENV.telegramBotToken) {
    return {
      configured: false,
      botWorking: false,
      error: "TELEGRAM_BOT_TOKEN not set. Create a bot via @BotFather on Telegram.",
    };
  }

  if (!ENV.telegramChatId) {
    return {
      configured: false,
      botWorking: false,
      error: "TELEGRAM_CHAT_ID not set. Message your bot, then visit https://api.telegram.org/bot<TOKEN>/getUpdates",
    };
  }

  try {
    const result = await sendTelegramRequest("getMe", {});
    return {
      configured: true,
      botWorking: true,
      botUsername: result.result?.username,
    };
  } catch (err: any) {
    return {
      configured: true,
      botWorking: false,
      error: err.message,
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Escape special Markdown characters for Telegram's MarkdownV1.
 */
function escapeMarkdown(text: string): string {
  // Telegram MarkdownV1 special chars: _ * [ ] ( ) ~ ` > # + - = | { } . !
  // We only escape the most problematic ones to keep readability
  return text
    .replace(/([_\[\]()~`>#+\-=|{}\.!])/g, "\\$1");
}

/**
 * Telegram messages have a 4096 character limit.
 */
function truncateMessage(text: string, maxLength: number = 4000): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 20) + "\n\n_...truncated_";
}
