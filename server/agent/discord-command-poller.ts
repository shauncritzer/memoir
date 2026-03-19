/**
 * Discord Command Poller
 * Polls Supabase agent_coordination table for pending Discord commands
 * Processes them and writes responses back to system_state
 */

import { getDb } from "../db";

interface DiscordCommand {
  id: string;
  messageId: string;
  command: string;
  args?: Record<string, any>;
  userId: string;
  username: string;
  timestamp: string;
  status: "pending" | "processing" | "completed";
}

interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

let pollingActive = false;
let pollInterval: NodeJS.Timeout | null = null;

/** Start polling for Discord commands every 10 seconds */
export async function startDiscordCommandPoller() {
  if (pollingActive) {
    console.log("[DiscordPoller] Already polling, skipping start");
    return;
  }

  pollingActive = true;
  console.log("[DiscordPoller] Starting Discord command poller (10s interval)");

  // Poll immediately on start
  await pollForCommands();

  // Then poll every 10 seconds
  pollInterval = setInterval(async () => {
    try {
      await pollForCommands();
    } catch (err) {
      console.error("[DiscordPoller] Error in polling cycle:", err);
    }
  }, 10000);
}

/** Stop the polling loop */
export function stopDiscordCommandPoller() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  pollingActive = false;
  console.log("[DiscordPoller] Stopped Discord command poller");
}

/** Poll for pending commands and process them */
async function pollForCommands() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DiscordPoller] Database not available");
      return;
    }

    // Query pending commands from agent_coordination table
    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT id, message_id, command, args, user_id, username, timestamp, status 
          FROM agent_coordination 
          WHERE status = 'pending' 
          AND type = 'discord_command'
          ORDER BY timestamp ASC
          LIMIT 10`
    ) as any;

    if (!rows || (rows as any[]).length === 0) {
      return; // No commands to process
    }

    console.log(`[DiscordPoller] Found ${rows.length} pending commands`);

    for (const row of rows as any[]) {
      try {
        const command = {
          id: row.id,
          messageId: row.message_id,
          command: row.command,
          args: row.args ? JSON.parse(row.args) : {},
          userId: row.user_id,
          username: row.username,
          timestamp: row.timestamp,
          status: row.status,
        };

        console.log(`[DiscordPoller] Processing command: ${command.command} (${command.messageId})`);

        // Mark as processing
        await db.execute(
          sql`UPDATE agent_coordination SET status = 'processing' WHERE id = ${command.id}`
        );

        // IMMEDIATE ACKNOWLEDGMENT (within 5 seconds)
        const responseKey = `discord_response:${command.messageId}`;
        await writeCommandResponse(db, responseKey, {
          success: true,
          message: `🔄 Processing: ${command.command}...`,
        }, command);
        console.log(`[DiscordPoller] ✅ ACK sent (5s): ${command.messageId}`);

        // Process the command (can take longer)
        const response = await processCommand(command);

        // Update with full response
        await writeCommandResponse(db, responseKey, response, command);
        console.log(`[DiscordPoller] ✅ Full response sent: ${command.messageId}`);

        // Mark as completed
        await db.execute(
          sql`UPDATE agent_coordination SET status = 'completed' WHERE id = ${command.id}`
        );

        console.log(
          `[DiscordPoller] ✅ Completed: ${command.command} (${command.messageId})`
        );
      } catch (err: any) {
        console.error(`[DiscordPoller] Error processing command:`, err);
        // Mark as failed
        await db.execute(
          sql`UPDATE agent_coordination 
              SET status = 'failed', error_message = ${err.message}
              WHERE id = ${(row as any).id}`
        );
      }
    }
  } catch (err) {
    console.error("[DiscordPoller] Fatal error in poll cycle:", err);
  }
}

/** Process a single Discord command */
async function processCommand(command: DiscordCommand): Promise<CommandResponse> {
  const { command: cmd, args } = command;

  try {
    switch (cmd) {
      case "status":
        return await handleStatusCommand(args);

      case "activity":
        return await handleActivityCommand(args);

      case "pause":
        return await handlePauseCommand(args);

      case "resume":
        return await handleResumeCommand(args);

      case "check_platforms":
        return await handleCheckPlatformsCommand();

      case "queue_status":
        return await handleQueueStatusCommand();

      case "help":
        return handleHelpCommand();

      default:
        return {
          success: false,
          message: `Unknown command: ${cmd}. Type 'help' for available commands.`,
        };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Error executing command: ${err.message}`,
      error: err.message,
    };
  }
}

/** Get system status */
async function handleStatusCommand(
  args: Record<string, any>
): Promise<CommandResponse> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable",
    };
  }

  const { sql } = await import("drizzle-orm");

  try {
    // Get queue stats
    const [queueStats] = await db.execute(
      sql`SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
            SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
          FROM content_queue`
    ) as any;

    const stats = (queueStats as any[])[0];

    return {
      success: true,
      message: "System Status",
      data: {
        queue: {
          total: stats.total,
          ready: stats.ready,
          posted: stats.posted,
          failed: stats.failed,
        },
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Error getting status",
      error: err.message,
    };
  }
}

/** Get recent activity */
async function handleActivityCommand(
  args: Record<string, any>
): Promise<CommandResponse> {
  const limit = args?.limit || 5;

  try {
    const fs = await import("fs");
    const path = await import("path");
    const logPath = path.join(process.cwd(), "memory", "activity-log.jsonl");

    if (!fs.existsSync(logPath)) {
      return {
        success: true,
        message: "No activity yet",
        data: [],
      };
    }

    const lines = fs
      .readFileSync(logPath, "utf-8")
      .split("\n")
      .filter((l) => l.trim());
    const activities = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse()
      .slice(0, limit);

    const summary = activities
      .map(
        (a: any) =>
          `[${a.status.toUpperCase()}] ${a.action}${
            a.tokensUsed ? ` (+${a.tokensUsed} tokens)` : ""
          }`
      )
      .join("\n");

    return {
      success: true,
      message: `Recent activity (last ${limit}):\n${summary}`,
      data: activities,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Error reading activity",
      error: err.message,
    };
  }
}

/** Pause operations */
async function handlePauseCommand(
  args: Record<string, any>
): Promise<CommandResponse> {
  // This would integrate with your coordination layer
  // to pause scheduler, generation, etc.
  return {
    success: true,
    message: "Operations paused (implementation pending)",
  };
}

/** Resume operations */
async function handleResumeCommand(
  args: Record<string, any>
): Promise<CommandResponse> {
  // Resume paused operations
  return {
    success: true,
    message: "Operations resumed (implementation pending)",
  };
}

/** Check platform health */
async function handleCheckPlatformsCommand(): Promise<CommandResponse> {
  // Return platform status from coordination state
  return {
    success: true,
    message: "Platform check (implementation pending)",
    data: {
      instagram: "healthy",
      facebook: "healthy",
      youtube: "healthy",
    },
  };
}

/** Get content queue status */
async function handleQueueStatusCommand(): Promise<CommandResponse> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable",
    };
  }

  const { sql } = await import("drizzle-orm");

  try {
    const [rows] = await db.execute(
      sql`SELECT platform, status, COUNT(*) as count
          FROM content_queue
          GROUP BY platform, status
          ORDER BY platform, status`
    ) as any;

    const summary = (rows as any[])
      .map((r) => `${r.platform}: ${r.status}(${r.count})`)
      .join(", ");

    return {
      success: true,
      message: `Queue Status:\n${summary}`,
      data: rows,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Error getting queue status",
      error: err.message,
    };
  }
}

/** Help command */
function handleHelpCommand(): CommandResponse {
  const commands = [
    "**status** — Get system status and queue counts",
    "**activity [limit:5]** — Get recent activity (last N)",
    "**queue_status** — Detailed content queue breakdown",
    "**check_platforms** — Check health of all platforms",
    "**pause** — Pause all operations",
    "**resume** — Resume operations",
    "**help** — Show this help message",
  ];

  return {
    success: true,
    message: `Available commands:\n${commands.join("\n")}`,
  };
}

/** Write command response to system_state */
async function writeCommandResponse(
  db: any,
  key: string,
  response: CommandResponse,
  command: DiscordCommand
) {
  const { curl } = await import("child_process");
  const ADMIN_SECRET = process.env.ADMIN_SECRET;

  if (!ADMIN_SECRET) {
    console.error("[DiscordPoller] ADMIN_SECRET not set");
    return;
  }

  const payload = {
    key,
    value: {
      ...response,
      respondedAt: new Date().toISOString(),
      commandId: command.id,
      username: command.username,
    },
    agent: "freddy",
  };

  try {
    const response_res = await fetch(
      "https://shauncritzer.com/api/coordination/update",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": ADMIN_SECRET,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response_res.ok) {
      console.error(
        `[DiscordPoller] Failed to write response: ${response_res.statusText}`
      );
    }
  } catch (err) {
    console.error("[DiscordPoller] Error writing response:", err);
  }
}
