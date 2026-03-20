/**
 * Discord Webhook Reporter — Posts daily API usage summary to #mission-control-dashboard.
 */

import { getLatestSummary, getMtdTotals, type UsageRow } from "./db.js";

const ALERT_THRESHOLD = parseFloat(process.env.ALERT_DAILY_THRESHOLD ?? "10.00");

/**
 * Build and send the daily report to Discord via webhook.
 */
export async function sendDailyReport(): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not set — skipping report");
    return false;
  }

  const rows = await getLatestSummary();
  const mtd = await getMtdTotals();

  if (rows.length === 0) {
    console.warn("[Discord] No usage data to report");
    return false;
  }

  const message = formatReport(rows, mtd);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[Discord] Webhook failed: ${res.status} ${errText}`);
      return false;
    }

    console.log("[Discord] Daily report sent");
    return true;
  } catch (err: any) {
    console.error("[Discord] Webhook error:", err.message);
    return false;
  }
}

function formatReport(rows: UsageRow[], mtd: { service: string; total_cost: number }[]): string {
  const date = rows[0]?.date ?? "unknown";
  const totalSpend = rows.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);
  const mtdTotal = mtd.reduce((sum, r) => sum + (r.total_cost ?? 0), 0);

  const lines: string[] = [];

  lines.push("## Mission Control — Daily API Report");
  lines.push(`**Date:** ${date}`);
  lines.push(`**Total spend today:** $${totalSpend.toFixed(2)}`);
  lines.push(`**MTD total:** $${mtdTotal.toFixed(2)}`);
  lines.push("");
  lines.push("### Per-Service Breakdown");
  lines.push("```");
  lines.push(padRight("Service", 14) + padRight("Cost", 10) + padRight("Tokens", 12) + padRight("Credits", 10) + "Remaining");
  lines.push("-".repeat(60));

  for (const row of rows) {
    const svc = row.service.charAt(0).toUpperCase() + row.service.slice(1);
    const cost = `$${(row.cost_usd ?? 0).toFixed(2)}`;
    const tokens = row.tokens_used > 0 ? row.tokens_used.toLocaleString() : "-";
    const credits = row.credits_used > 0
      ? row.credits_used.toLocaleString()
      : row.characters_used > 0
        ? `${row.characters_used.toLocaleString()} ch`
        : "-";
    const remaining = row.credits_remaining != null
      ? row.credits_remaining.toLocaleString()
      : "-";

    lines.push(padRight(svc, 14) + padRight(cost, 10) + padRight(tokens, 12) + padRight(credits, 10) + remaining);
  }

  lines.push("```");

  // MTD by service
  if (mtd.length > 0) {
    lines.push("");
    lines.push("### Month-to-Date by Service");
    for (const m of mtd) {
      const svc = m.service.charAt(0).toUpperCase() + m.service.slice(1);
      lines.push(`- **${svc}:** $${m.total_cost.toFixed(2)}`);
    }
  }

  // Alerts
  const alerts: string[] = [];
  for (const row of rows) {
    if (row.cost_usd > ALERT_THRESHOLD) {
      alerts.push(`**${row.service}** exceeded $${ALERT_THRESHOLD.toFixed(2)}/day ($${row.cost_usd.toFixed(2)})`);
    }
    if (row.credits_remaining != null && row.credits_remaining < 100 && row.credits_remaining >= 0) {
      alerts.push(`**${row.service}** credits low: ${row.credits_remaining} remaining`);
    }
  }

  if (alerts.length > 0) {
    lines.push("");
    lines.push("### Alerts");
    for (const a of alerts) {
      lines.push(`- ${a}`);
    }
  }

  return lines.join("\n");
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}
