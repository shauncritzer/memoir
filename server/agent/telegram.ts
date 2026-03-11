/**
 * TELEGRAM INTEGRATION — Direct Messaging for Briefings & Approvals
 *
 * Sends daily briefings, Tier 3-4 approval requests, and critical alerts
 * directly to Shaun's phone via Telegram Bot API.
 *
 * Setup:
 *   1. Message @BotFather on Telegram → /newbot → get TELEGRAM_BOT_TOKEN
 *   2. Message your bot, then visit:
 *      https://api.telegram.org/bot<TOKEN>/getUpdates
 *      to get your chat_id from the response
 *   3. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway env vars
 *
 * Why Telegram:
 *   - Free forever (no per-message cost)
 *   - Bot API is simple and reliable
 *   - Supports Markdown formatting
 *   - Supports inline buttons (for approvals)
 *   - Instant push notifications
 *
 * Message Types:
 *   - Daily briefing (morning summary)
 *   - Tier 3 approval request (with approve/deny buttons)
 *   - Tier 4 approval request (high-stakes, requires explicit confirmation)
 *   - Critical alert (system down, payment failure, etc.)
 *   - Action summary (what the engine did autonomously)
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
  return !!(ENV.telegramBotToken && ENV.telegramChatId);
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

// ─── Webhook Handler for Button Callbacks ───────────────────────────────────

/**
 * Process Telegram callback queries (button presses).
 * Wire this into an Express route: POST /api/telegram/webhook
 */
export async function handleTelegramWebhook(body: any): Promise<{ handled: boolean; action?: string }> {
  const callbackQuery = body?.callback_query;
  if (!callbackQuery) {
    return { handled: false };
  }

  const data = callbackQuery.data;
  const messageId = callbackQuery.message?.message_id;

  // Answer the callback to remove the loading spinner
  try {
    const { token } = getConfig();
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

    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return { handled: false };

      const { sql } = await import("drizzle-orm");

      if (action === "approve") {
        await db.execute(
          sql`UPDATE agent_actions SET status = 'approved', approved_at = NOW() WHERE id = ${actionId} AND status = 'proposed'`
        );

        // Update the Telegram message to show it was approved
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

        return { handled: true, action: `approved_${actionId}` };
      } else {
        await db.execute(
          sql`UPDATE agent_actions SET status = 'denied' WHERE id = ${actionId} AND status = 'proposed'`
        );

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

        return { handled: true, action: `denied_${actionId}` };
      }
    } catch (err: any) {
      console.error("[Telegram] Webhook processing error:", err.message);
      return { handled: false };
    }
  }

  // Handle "view_approvals" — send a list of pending actions
  if (data === "view_approvals") {
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

  return { handled: false };
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
