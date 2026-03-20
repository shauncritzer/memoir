/**
 * API MONITOR — Mission Control API Usage Tracker
 *
 * A standalone Express service that polls API usage from Anthropic, OpenAI,
 * ElevenLabs, HeyGen, and Replicate daily at 6am ET. Stores results in the
 * shared Railway MySQL database and posts a summary to Discord.
 *
 * Endpoints:
 *   GET  /dashboard    — HTML dashboard with Chart.js graphs
 *   GET  /api/summary  — Latest daily summary as JSON
 *   POST /api/sync     — Manual trigger to poll all APIs now
 */

import express from "express";
import cron from "node-cron";
import { initDb, getLatestSummary, getMtdTotals, getLast30Days } from "./db.js";
import { pollAllApis } from "./pollers.js";
import { sendDailyReport } from "./discord.js";

const app = express();
app.use(express.json());

// ─── GET /api/summary ────────────────────────────────────────────────────────

app.get("/api/summary", async (_req, res) => {
  try {
    const latest = await getLatestSummary();
    const mtd = await getMtdTotals();

    const totalToday = latest.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
    const mtdTotal = mtd.reduce((s, r) => s + (r.total_cost ?? 0), 0);

    res.json({
      ok: true,
      date: latest[0]?.date ?? null,
      total_today_usd: Math.round(totalToday * 100) / 100,
      mtd_total_usd: Math.round(mtdTotal * 100) / 100,
      services: latest,
      mtd_by_service: mtd,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/sync ──────────────────────────────────────────────────────────

app.post("/api/sync", async (_req, res) => {
  try {
    console.log("[Sync] Manual sync triggered");
    const results = await pollAllApis();
    const sent = await sendDailyReport();
    res.json({
      ok: true,
      polled: results.length,
      discord_sent: sent,
      services: results.map((r) => ({
        service: r.service,
        cost_usd: r.cost_usd,
        tokens_used: r.tokens_used,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── GET /dashboard ──────────────────────────────────────────────────────────

app.get("/dashboard", async (_req, res) => {
  try {
    const latest = await getLatestSummary();
    const mtd = await getMtdTotals();
    const history = await getLast30Days();

    // Group history by date for charting
    const dateMap = new Map<string, Record<string, number>>();
    for (const row of history) {
      const d = typeof row.date === "string" ? row.date : new Date(row.date).toISOString().slice(0, 10);
      if (!dateMap.has(d)) dateMap.set(d, {});
      dateMap.get(d)![row.service] = row.cost_usd ?? 0;
    }

    const dates = Array.from(dateMap.keys()).sort();
    const services = [...new Set(history.map((r) => r.service))].sort();
    const colors: Record<string, string> = {
      anthropic: "#d97706",
      openai: "#10b981",
      elevenlabs: "#6366f1",
      heygen: "#ec4899",
      replicate: "#06b6d4",
    };

    const datasets = services.map((svc) => ({
      label: svc.charAt(0).toUpperCase() + svc.slice(1),
      data: dates.map((d) => dateMap.get(d)?.[svc] ?? 0),
      borderColor: colors[svc] ?? "#888",
      backgroundColor: (colors[svc] ?? "#888") + "33",
      fill: true,
      tension: 0.3,
    }));

    const totalToday = latest.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
    const mtdTotal = mtd.reduce((s, r) => s + (r.total_cost ?? 0), 0);

    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mission Control — API Monitor</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #94a3b8; margin-bottom: 24px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; }
    .card .label { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
    .card .value.green { color: #34d399; }
    .card .value.yellow { color: #fbbf24; }
    .card .value.red { color: #f87171; }
    .chart-container { background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn { display: inline-block; background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-top: 16px; }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <h1>Mission Control — API Monitor</h1>
  <p class="subtitle">Daily API usage tracking across all services</p>

  <div class="cards">
    <div class="card">
      <div class="label">Today's Spend</div>
      <div class="value ${totalToday > 10 ? "red" : totalToday > 5 ? "yellow" : "green"}">$${totalToday.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="label">MTD Total</div>
      <div class="value ${mtdTotal > 100 ? "red" : mtdTotal > 50 ? "yellow" : "green"}">$${mtdTotal.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="label">Services Tracked</div>
      <div class="value">${latest.length}</div>
    </div>
    <div class="card">
      <div class="label">Last Sync</div>
      <div class="value" style="font-size:16px">${latest[0]?.date ?? "never"}</div>
    </div>
  </div>

  <div class="chart-container">
    <h2 style="margin-bottom:16px">Daily Spend — Last 30 Days</h2>
    <canvas id="spendChart" height="100"></canvas>
  </div>

  <div class="card">
    <h2 style="margin-bottom:8px">Today's Breakdown</h2>
    <table>
      <tr><th>Service</th><th>Cost</th><th>Tokens</th><th>Credits/Chars</th><th>Remaining</th></tr>
      ${latest
        .map(
          (r) => `<tr>
        <td>${r.service.charAt(0).toUpperCase() + r.service.slice(1)}</td>
        <td>$${(r.cost_usd ?? 0).toFixed(2)}</td>
        <td>${r.tokens_used > 0 ? r.tokens_used.toLocaleString() : "-"}</td>
        <td>${r.characters_used > 0 ? r.characters_used.toLocaleString() + " ch" : r.credits_used > 0 ? r.credits_used.toLocaleString() : "-"}</td>
        <td>${r.credits_remaining != null ? r.credits_remaining.toLocaleString() : "-"}</td>
      </tr>`
        )
        .join("")}
    </table>
    <button class="btn" onclick="doSync()">Sync Now</button>
    <span id="syncStatus" style="margin-left:12px;color:#94a3b8"></span>
  </div>

  <script>
    new Chart(document.getElementById('spendChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: ${JSON.stringify(datasets)},
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#e2e8f0' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#94a3b8', callback: v => '$' + v }, grid: { color: '#334155' } },
        },
      },
    });

    async function doSync() {
      const el = document.getElementById('syncStatus');
      el.textContent = 'Syncing...';
      try {
        const res = await fetch('/api/sync', { method: 'POST' });
        const data = await res.json();
        el.textContent = data.ok ? 'Done — reloading...' : 'Error: ' + data.error;
        if (data.ok) setTimeout(() => location.reload(), 1500);
      } catch (e) {
        el.textContent = 'Network error';
      }
    }
  </script>
</body>
</html>`);
  } catch (err: any) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// ─── Cron: 6am ET daily ──────────────────────────────────────────────────────

function startCron(): void {
  // 6am ET = "0 6 * * *" in America/New_York
  // node-cron supports timezone via options
  cron.schedule(
    "0 6 * * *",
    async () => {
      console.log("[Cron] 6am ET — starting daily API poll");
      try {
        await pollAllApis();
        await sendDailyReport();
        console.log("[Cron] Daily poll + report complete");
      } catch (err: any) {
        console.error("[Cron] Daily poll failed:", err.message);
      }
    },
    { timezone: "America/New_York" }
  );

  console.log("[Cron] Scheduled daily API poll at 6:00 AM ET");
}

// ─── Boot ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3001", 10);

async function boot() {
  await initDb();
  startCron();

  app.listen(PORT, () => {
    console.log(`[API Monitor] Running on http://localhost:${PORT}`);
    console.log(`  GET  /dashboard    — HTML dashboard`);
    console.log(`  GET  /api/summary  — JSON summary`);
    console.log(`  POST /api/sync     — Manual poll trigger`);
  });
}

boot().catch((err) => {
  console.error("[API Monitor] Boot failed:", err);
  process.exit(1);
});
