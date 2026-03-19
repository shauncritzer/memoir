/**
 * DISCORD BOT — Command Center Bridge
 *
 * Connects the memoir Railway deployment to Discord:
 *   - Listens in #command-center for messages → forwards to OpenClaw agent (Freddy)
 *   - Posts Freddy's responses back to #command-center
 *   - Logs all activity to #freddy-log automatically
 *
 * Environment variables (set in Railway):
 *   DISCORD_BOT_TOKEN          — Bot token from Discord Developer Portal
 *   DISCORD_COMMAND_CHANNEL_ID — Channel ID for #command-center
 *   DISCORD_LOG_CHANNEL_ID     — Channel ID for #freddy-log
 *   OPENCLAW_API_URL           — Base URL of the OpenClaw agent API (optional, for forwarding)
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
import { logCoordinationAction, isCoordinationConfigured } from "../agent/coordination";

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

async function forwardToOpenClaw(
  content: string,
  authorTag: string
): Promise<string> {
  const cfg = getConfig();

  if (!cfg.openClawApiUrl) {
    return "OpenClaw API URL not configured (OPENCLAW_API_URL). Message logged but not forwarded.";
  }

  try {
    const response = await fetch(`${cfg.openClawApiUrl}/api/agent/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.adminSecret ? { "X-Admin-Secret": cfg.adminSecret } : {}),
      },
      body: JSON.stringify({
        message: content,
        source: "discord",
        author: authorTag,
        channel: "command-center",
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown error");
      return `Freddy returned ${response.status}: ${errText}`;
    }

    const data = await response.json();
    return data.response || data.message || JSON.stringify(data);
  } catch (err: any) {
    console.error("[Discord] OpenClaw forward failed:", err.message);
    return `Could not reach Freddy: ${err.message}`;
  }
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

  // Log to coordination layer if configured
  if (isCoordinationConfigured()) {
    await logCoordinationAction("discord_bot", "message_received", "completed", {
      author: authorTag,
      content: content.slice(0, 500),
      channel: "command-center",
    });
  }

  // Show typing indicator while waiting for response
  try {
    await message.channel.sendTyping();
  } catch {
    // Non-critical
  }

  // Forward to Freddy and get response
  const response = await forwardToOpenClaw(content, authorTag);

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
    await logToChannel("system", "Bot Online", `Discord bot connected as ${client!.user?.tag}`, {
      "Command Channel": cfg.commandChannelId,
      "Log Channel": cfg.logChannelId,
      "OpenClaw URL": cfg.openClawApiUrl || "not configured",
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
