/**
 * DISCORD BOT — Command Center Bridge
 *
 * Connects the memoir Railway deployment to Discord:
 *   - Listens in #command-center for messages → forwards to OpenClaw agent (Freddy)
 *   - Posts Freddy's responses back to #command-center
 *   - Logs all activity to #freddy-log automatically
 *
 * Message delivery strategy (in order):
 *   1. Direct HTTP POST to OPENCLAW_API_URL (fast path, if URL is set and reachable)
 *   2. Supabase coordination layer (reliable path — writes a pending_command to
 *      agent_coordination, Freddy polls for it and writes a response back)
 *
 * Environment variables (set in Railway):
 *   DISCORD_BOT_TOKEN          — Bot token from Discord Developer Portal
 *   DISCORD_COMMAND_CHANNEL_ID — Channel ID for #command-center
 *   DISCORD_LOG_CHANNEL_ID     — Channel ID for #freddy-log
 *   OPENCLAW_API_URL           — Base URL of the OpenClaw agent API (optional fast path)
 *   ADMIN_SECRET               — Shared secret for agent-to-agent auth
 */

import {
  Client,
  GatewayIntentBits,
  type TextChannel,
  type Message,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import {
  logCoordinationAction,
  setSystemState,
  getSystemState,
  isCoordinationConfigured,
} from "../agent/coordination";

// ─── Config ──────────────────────────────────────────────────────────────────

function getConfig() {
  return {
    token: process.env.DISCORD_BOT_TOKEN ?? "",
    commandChannelId: process.env.DISCORD_COMMAND_CHANNEL_ID ?? "",
    logChannelId: process.env.DISCORD_LOG_CHANNEL_ID ?? "",
    openClawApiUrl: process.env.OPENCLAW_API_URL ?? "",
    adminSecret: process.env.ADMIN_SECRET ?? "",
  };
}

export function isDiscordConfigured(): boolean {
  const cfg = getConfig();
  return !!(cfg.token && cfg.commandChannelId && cfg.logChannelId);
}

// ─── Bot Instance ────────────────────────────────────────────────────────────

let client: Client | null = null;
let botReady = false;

export function getDiscordStatus(): {
  configured: boolean;
  connected: boolean;
  username: string | null;
} {
  return {
    configured: isDiscordConfigured(),
    connected: botReady,
    username: client?.user?.tag ?? null,
  };
}

// ─── Log to #freddy-log ─────────────────────────────────────────────────────

async function logToChannel(
  direction: "inbound" | "outbound" | "system",
  title: string,
  content: string,
  metadata?: Record<string, string>
): Promise<void> {
  if (!client || !botReady) return;

  const cfg = getConfig();
  if (!cfg.logChannelId) return;

  try {
    const logChannel = await client.channels.fetch(cfg.logChannelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const colors = {
      inbound: 0x3498db, // blue
      outbound: 0x2ecc71, // green
      system: 0x95a5a6, // grey
    } as const;

    const embed = new EmbedBuilder()
      .setColor(colors[direction])
      .setTitle(title)
      .setDescription(content.length > 4096 ? content.slice(0, 4093) + "..." : content)
      .setTimestamp();

    if (metadata) {
      for (const [key, val] of Object.entries(metadata)) {
        embed.addFields({ name: key, value: val.slice(0, 1024), inline: true });
      }
    }

    await (logChannel as TextChannel).send({ embeds: [embed] });
  } catch (err: any) {
    console.error("[Discord] Log channel write failed:", err.message);
  }
}

// ─── Forward to OpenClaw Agent ───────────────────────────────────────────────

/**
 * Try direct HTTP POST to OpenClaw API.
 * Returns the response string on success, or null if it fails / isn't configured.
 */
async function tryDirectForward(
  content: string,
  authorTag: string
): Promise<string | null> {
  const cfg = getConfig();
  if (!cfg.openClawApiUrl) return null;

  try {
    const response = await fetch(`${cfg.openClawApiUrl}/api/coordination/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.adminSecret ? { "X-Admin-Secret": cfg.adminSecret } : {}),
      },
      body: JSON.stringify({
        key: `discord_command:${Date.now()}`,
        value: {
          message: content,
          source: "discord",
          author: authorTag,
          channel: "command-center",
          timestamp: new Date().toISOString(),
        },
        agent_name: "discord_bot",
      }),
    });

    if (!response.ok) {
      console.warn(`[Discord] Direct forward returned ${response.status}`);
      return null;
    }

    // The direct endpoint is a state update, not a chat endpoint.
    // Return null to fall through to coordination polling.
    return null;
  } catch (err: any) {
    console.warn("[Discord] Direct forward failed:", err.message);
    return null;
  }
}

/**
 * Forward a message to Freddy via the Supabase coordination layer.
 *
 * Writes a pending_command to agent_coordination and sets a system_state key
 * that Freddy can poll. Then polls for up to 30 seconds for a response.
 */
async function forwardToOpenClaw(
  content: string,
  authorTag: string
): Promise<string> {
  const messageId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Strategy 1: Try direct HTTP if OPENCLAW_API_URL is set
  const directResult = await tryDirectForward(content, authorTag);
  if (directResult) return directResult;

  // Strategy 2: Use Supabase coordination layer
  if (!isCoordinationConfigured()) {
    return "Neither OPENCLAW_API_URL nor Supabase coordination is configured. Message was logged to #freddy-log but could not be delivered to Freddy.";
  }

  // Write the command to agent_coordination as a pending action
  await logCoordinationAction("discord_bot", "pending_command", "pending", {
    message_id: messageId,
    message: content,
    author: authorTag,
    channel: "command-center",
    awaiting_response: true,
  });

  // Write to system_state so Freddy can see the latest command at a glance
  await setSystemState(`discord_command:latest`, {
    message_id: messageId,
    message: content,
    author: authorTag,
    channel: "command-center",
    timestamp: new Date().toISOString(),
    status: "pending",
  }, "discord_bot");

  // Poll for Freddy's response (he writes to system_state with the message_id)
  const responseKey = `discord_response:${messageId}`;
  const maxWaitMs = 30_000;
  const pollIntervalMs = 2_000;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const entry = await getSystemState(responseKey);
    if (entry?.value?.response) {
      return entry.value.response as string;
    }
  }

  // Timeout — Freddy didn't respond within 30s
  return `Message delivered to coordination layer (ID: \`${messageId}\`). Freddy hasn't responded yet — he may be busy or offline. Check back in #freddy-log.`;
}

// ─── Message Handler ─────────────────────────────────────────────────────────

async function handleCommandMessage(message: Message): Promise<void> {
  const cfg = getConfig();

  // Ignore bot messages to prevent loops
  if (message.author.bot) return;

  // Only process messages in #command-center
  if (message.channel.id !== cfg.commandChannelId) return;

  const content = message.content.trim();
  if (!content) return;

  const authorTag = message.author.tag;

  console.log(`[Discord] #command-center message from ${authorTag}: ${content.slice(0, 100)}`);

  // Log inbound message to #freddy-log
  await logToChannel("inbound", `Message from ${authorTag}`, content, {
    Author: authorTag,
    Channel: "#command-center",
  });

  // Show typing indicator while waiting for response
  try {
    await message.channel.sendTyping();
  } catch {
    // Non-critical
  }

  // Keep typing indicator alive during the polling window (refreshes every 8s)
  const typingInterval = setInterval(async () => {
    try { await message.channel.sendTyping(); } catch { /* ignore */ }
  }, 8_000);

  // Forward to Freddy via coordination layer (with optional direct HTTP fast path)
  let response: string;
  try {
    response = await forwardToOpenClaw(content, authorTag);
  } finally {
    clearInterval(typingInterval);
  }

  // Post response back to #command-center
  try {
    // Discord has a 2000-char limit per message
    if (response.length <= 2000) {
      await message.reply(response);
    } else {
      // Split long responses into chunks
      const chunks = splitMessage(response, 2000);
      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) {
          await message.reply(chunks[i]);
        } else {
          await message.channel.send(chunks[i]);
        }
      }
    }
  } catch (err: any) {
    console.error("[Discord] Failed to send response:", err.message);
  }

  // Log outbound response to #freddy-log
  await logToChannel("outbound", "Freddy's Response", response, {
    "Replying to": authorTag,
    "Response length": `${response.length} chars`,
  });

  // Log to coordination layer
  if (isCoordinationConfigured()) {
    await logCoordinationAction("discord_bot", "message_forwarded", "completed", {
      author: authorTag,
      response_length: response.length,
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitMessage(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a newline near the limit
    let splitAt = remaining.lastIndexOf("\n", maxLength);
    if (splitAt === -1 || splitAt < maxLength * 0.5) {
      // Fall back to splitting at a space
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitAt === -1 || splitAt < maxLength * 0.5) {
      // Hard split
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

// ─── Bot Lifecycle ───────────────────────────────────────────────────────────

export async function startDiscordBot(): Promise<void> {
  const cfg = getConfig();

  if (!cfg.token) {
    console.log("[Discord] DISCORD_BOT_TOKEN not set — bot disabled");
    return;
  }
  if (!cfg.commandChannelId || !cfg.logChannelId) {
    console.warn("[Discord] DISCORD_COMMAND_CHANNEL_ID or DISCORD_LOG_CHANNEL_ID missing — bot disabled");
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on("ready", async () => {
    botReady = true;
    console.log(`[Discord] Bot online as ${client!.user?.tag}`);

    // Log startup to #freddy-log
    const deliveryMode = cfg.openClawApiUrl
      ? `Direct HTTP (${cfg.openClawApiUrl}) + Supabase coordination`
      : isCoordinationConfigured()
        ? "Supabase coordination layer (polling)"
        : "logging only (no delivery configured)";

    await logToChannel("system", "Bot Online", `Discord bot connected as ${client!.user?.tag}`, {
      "Command Channel": cfg.commandChannelId,
      "Log Channel": cfg.logChannelId,
      "Delivery Mode": deliveryMode,
    });

    // Log to coordination layer
    if (isCoordinationConfigured()) {
      await logCoordinationAction("discord_bot", "bot_started", "completed", {
        bot_tag: client!.user?.tag,
        command_channel: cfg.commandChannelId,
        log_channel: cfg.logChannelId,
      });
    }
  });

  client.on("messageCreate", async (message) => {
    try {
      await handleCommandMessage(message);
    } catch (err: any) {
      console.error("[Discord] Message handler error:", err.message);
      await logToChannel("system", "Error", `Message handler failed: ${err.message}`);
    }
  });

  client.on("error", (err) => {
    console.error("[Discord] Client error:", err.message);
    botReady = false;
  });

  client.on("disconnect", () => {
    console.warn("[Discord] Bot disconnected");
    botReady = false;
  });

  try {
    await client.login(cfg.token);
  } catch (err: any) {
    console.error("[Discord] Login failed:", err.message);
    botReady = false;
  }
}

export async function stopDiscordBot(): Promise<void> {
  if (client) {
    await logToChannel("system", "Bot Shutting Down", "Discord bot disconnecting gracefully");
    client.destroy();
    client = null;
    botReady = false;
    console.log("[Discord] Bot stopped");
  }
}
