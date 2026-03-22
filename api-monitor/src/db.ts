/**
 * Database — Railway Postgres via the pg library.
 * Creates the api_usage_logs table on first connect if it doesn't exist.
 */

import pg from "pg";

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  pool = new pg.Pool({
    connectionString: url,
    max: 5,
  });

  return pool;
}

/**
 * Run on startup — creates the api_usage_logs table if missing.
 */
export async function initDb(): Promise<void> {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS api_usage_logs (
      id SERIAL PRIMARY KEY,
      service VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      tokens_used BIGINT DEFAULT 0,
      characters_used BIGINT DEFAULT 0,
      credits_used DOUBLE PRECISION DEFAULT 0,
      credits_remaining DOUBLE PRECISION DEFAULT NULL,
      cost_usd DOUBLE PRECISION DEFAULT 0,
      raw_response JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (service, date)
    )
  `);

  console.log("[DB] api_usage_logs table ready");
}

export type UsageRow = {
  id: number;
  service: string;
  date: string;
  tokens_used: number;
  characters_used: number;
  credits_used: number;
  credits_remaining: number | null;
  cost_usd: number;
  raw_response: any;
  created_at: string;
};

/**
 * Upsert a usage log row for a given service + date.
 */
export async function upsertUsage(data: {
  service: string;
  date: string;
  tokens_used?: number;
  characters_used?: number;
  credits_used?: number;
  credits_remaining?: number | null;
  cost_usd?: number;
  raw_response?: any;
}): Promise<void> {
  const db = getPool();

  await db.query(
    `INSERT INTO api_usage_logs
       (service, date, tokens_used, characters_used, credits_used, credits_remaining, cost_usd, raw_response)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (service, date) DO UPDATE SET
       tokens_used = EXCLUDED.tokens_used,
       characters_used = EXCLUDED.characters_used,
       credits_used = EXCLUDED.credits_used,
       credits_remaining = EXCLUDED.credits_remaining,
       cost_usd = EXCLUDED.cost_usd,
       raw_response = EXCLUDED.raw_response,
       created_at = CURRENT_TIMESTAMP`,
    [
      data.service,
      data.date,
      data.tokens_used ?? 0,
      data.characters_used ?? 0,
      data.credits_used ?? 0,
      data.credits_remaining ?? null,
      data.cost_usd ?? 0,
      data.raw_response ? JSON.stringify(data.raw_response) : null,
    ]
  );
}

/**
 * Get latest day's usage across all services.
 */
export async function getLatestSummary(): Promise<UsageRow[]> {
  const db = getPool();

  const { rows } = await db.query(`
    SELECT * FROM api_usage_logs
    WHERE date = (SELECT MAX(date) FROM api_usage_logs)
    ORDER BY service
  `);

  return rows as UsageRow[];
}

/**
 * Get month-to-date totals per service.
 */
export async function getMtdTotals(): Promise<{ service: string; total_cost: number }[]> {
  const db = getPool();

  const { rows } = await db.query(`
    SELECT service, SUM(cost_usd) as total_cost
    FROM api_usage_logs
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY service
    ORDER BY total_cost DESC
  `);

  return rows as { service: string; total_cost: number }[];
}

/**
 * Get last 30 days of usage for charting.
 */
export async function getLast30Days(): Promise<UsageRow[]> {
  const db = getPool();

  const { rows } = await db.query(`
    SELECT * FROM api_usage_logs
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY date ASC, service ASC
  `);

  return rows as UsageRow[];
}
