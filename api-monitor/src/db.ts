/**
 * Database — Railway MySQL, same instance as the main memoir app.
 * Creates the api_usage_logs table on first connect if it doesn't exist.
 */

import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 5,
  });

  return pool;
}

/**
 * Run on startup — creates the api_usage_logs table if missing.
 */
export async function initDb(): Promise<void> {
  const db = getPool();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS api_usage_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      tokens_used BIGINT DEFAULT 0,
      characters_used BIGINT DEFAULT 0,
      credits_used DOUBLE DEFAULT 0,
      credits_remaining DOUBLE DEFAULT NULL,
      cost_usd DOUBLE DEFAULT 0,
      raw_response JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_service_date (service, date)
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

  await db.execute(
    `INSERT INTO api_usage_logs
       (service, date, tokens_used, characters_used, credits_used, credits_remaining, cost_usd, raw_response)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       tokens_used = VALUES(tokens_used),
       characters_used = VALUES(characters_used),
       credits_used = VALUES(credits_used),
       credits_remaining = VALUES(credits_remaining),
       cost_usd = VALUES(cost_usd),
       raw_response = VALUES(raw_response),
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

  const [rows] = await db.execute(`
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

  const [rows] = await db.execute(`
    SELECT service, SUM(cost_usd) as total_cost
    FROM api_usage_logs
    WHERE date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
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

  const [rows] = await db.execute(`
    SELECT * FROM api_usage_logs
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ORDER BY date ASC, service ASC
  `);

  return rows as UsageRow[];
}
