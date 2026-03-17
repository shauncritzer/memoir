/**
 * AGENT COORDINATION LAYER — Supabase shared state
 *
 * A shared coordination layer in Supabase that multiple autonomous agents
 * (Rewired Engine on memoir, Freddy on OpenClaw) can read from and write to.
 *
 * Tables (created in Supabase SQL Editor — see setupCoordinationSQL()):
 *   - agent_coordination: structured action log (who did what, when)
 *   - system_state: key-value store for shared state (platform health, flags, etc.)
 *
 * The Rewired Engine writes:
 *   - platform health after each self-monitor diagnostic
 *   - queue counts after each scheduler cycle
 *   - flags when something breaks or recovers
 *
 * Freddy (or any agent) can:
 *   - Read state via GET /api/coordination/state
 *   - Write state via POST /api/coordination/update (requires ADMIN_SECRET)
 *   - Or use the Supabase client directly if it has the service role key
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CoordinationAction = {
  id?: number;
  agent_name: string;
  action_type: string;
  status: string;
  details?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type SystemStateEntry = {
  key: string;
  value: Record<string, unknown>;
  updated_by: string;
  updated_at?: string;
};

// ─── Supabase Client (reuses the same credentials as vector-memory) ─────────

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  client = createClient(url, key);
  return client;
}

export function isCoordinationConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ─── agent_coordination table ───────────────────────────────────────────────

/**
 * Log an action to the agent_coordination table.
 * Used for cross-agent audit trail: "Rewired Engine posted to Instagram",
 * "Freddy deployed new code", etc.
 */
export async function logCoordinationAction(
  agentName: string,
  actionType: string,
  status: string,
  details: Record<string, unknown> = {}
): Promise<boolean> {
  const sb = getClient();
  if (!sb) {
    console.warn("[Coordination] Supabase not configured — skipping action log");
    return false;
  }

  try {
    const { error } = await sb.from("agent_coordination").insert({
      agent_name: agentName,
      action_type: actionType,
      status,
      details,
    });

    if (error) {
      console.error("[Coordination] Log action error:", error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("[Coordination] Log action failed:", err.message);
    return false;
  }
}

/**
 * Query recent coordination actions, optionally filtered by agent or type.
 */
export async function getCoordinationActions(opts: {
  agentName?: string;
  actionType?: string;
  limit?: number;
} = {}): Promise<CoordinationAction[]> {
  const sb = getClient();
  if (!sb) return [];

  try {
    let query = sb
      .from("agent_coordination")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 50);

    if (opts.agentName) {
      query = query.eq("agent_name", opts.agentName);
    }
    if (opts.actionType) {
      query = query.eq("action_type", opts.actionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Coordination] Get actions error:", error.message);
      return [];
    }

    return (data || []) as CoordinationAction[];
  } catch (err: any) {
    console.error("[Coordination] Get actions failed:", err.message);
    return [];
  }
}

// ─── system_state table ─────────────────────────────────────────────────────

/**
 * Upsert a key-value pair into system_state.
 * Uses Supabase upsert (INSERT ... ON CONFLICT UPDATE) on the `key` column.
 */
export async function setSystemState(
  key: string,
  value: Record<string, unknown>,
  updatedBy: string = "rewired_engine"
): Promise<boolean> {
  const sb = getClient();
  if (!sb) {
    console.warn("[Coordination] Supabase not configured — skipping state update");
    return false;
  }

  try {
    const { error } = await sb.from("system_state").upsert(
      {
        key,
        value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error("[Coordination] Set state error:", error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("[Coordination] Set state failed:", err.message);
    return false;
  }
}

/**
 * Get a single system_state entry by key.
 */
export async function getSystemState(key: string): Promise<SystemStateEntry | null> {
  const sb = getClient();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from("system_state")
      .select("*")
      .eq("key", key)
      .single();

    if (error) {
      // PGRST116 = no rows found, not a real error
      if (error.code === "PGRST116") return null;
      console.error("[Coordination] Get state error:", error.message);
      return null;
    }

    return data as SystemStateEntry;
  } catch (err: any) {
    console.error("[Coordination] Get state failed:", err.message);
    return null;
  }
}

/**
 * Get all system_state entries.
 */
export async function getAllSystemState(): Promise<SystemStateEntry[]> {
  const sb = getClient();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from("system_state")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Coordination] Get all state error:", error.message);
      return [];
    }

    return (data || []) as SystemStateEntry[];
  } catch (err: any) {
    console.error("[Coordination] Get all state failed:", err.message);
    return [];
  }
}

/**
 * Check if a "platform_fix" entry exists in system_state within the last N days.
 * Used by the Rewired Engine before flagging a platform as failing —
 * if someone recently deployed a fix, give it time before re-flagging.
 */
export async function hasRecentPlatformFix(
  platform: string,
  withinDays: number = 7
): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;

  try {
    const cutoff = new Date(Date.now() - withinDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb
      .from("system_state")
      .select("*")
      .eq("key", `platform_fix:${platform}`)
      .gte("updated_at", cutoff)
      .limit(1);

    if (error) {
      console.error("[Coordination] Check platform fix error:", error.message);
      return false;
    }

    return (data || []).length > 0;
  } catch (err: any) {
    console.error("[Coordination] Check platform fix failed:", err.message);
    return false;
  }
}

// ─── High-Level Helpers for the Rewired Engine ──────────────────────────────

/**
 * Write platform health status to system_state.
 * Called after each self-monitor diagnostic cycle.
 */
export async function syncPlatformHealth(health: {
  overall: string;
  components: { name: string; status: string; message: string }[];
  integrations?: { name: string; configured: boolean; working: boolean; error?: string }[];
}): Promise<void> {
  // Build a map of platform statuses
  const platformStatus: Record<string, string> = {};
  const activePlatforms: string[] = [];

  if (health.integrations) {
    for (const integration of health.integrations) {
      const key = integration.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      platformStatus[key] = integration.working ? "working" : integration.configured ? "failing" : "not_configured";
      if (integration.working) activePlatforms.push(key);
    }
  }

  // Write overall engine health
  await setSystemState("engine_health", {
    overall: health.overall,
    components: health.components.map(c => ({
      name: c.name,
      status: c.status,
      message: c.message,
    })),
    checked_at: new Date().toISOString(),
  });

  // Write platform-level status
  await setSystemState("platform_status", {
    platforms: platformStatus,
    active_platforms: activePlatforms,
    checked_at: new Date().toISOString(),
  });

  // Write individual platform flags (only for platforms that are failing)
  // But first check if a recent fix was deployed — if so, don't flag as failing
  for (const [platform, status] of Object.entries(platformStatus)) {
    if (status === "failing") {
      const hasRecentFix = await hasRecentPlatformFix(platform);
      if (hasRecentFix) {
        console.log(`[Coordination] Skipping failure flag for ${platform} — recent fix deployed within 7 days`);
        continue;
      }

      await setSystemState(`platform_failing:${platform}`, {
        status: "failing",
        flagged_at: new Date().toISOString(),
        flagged_by: "rewired_engine",
      });
    }
  }
}

/**
 * Write content pipeline queue counts to system_state.
 * Called after each scheduler cycle.
 */
export async function syncQueueCounts(counts: {
  pending: number;
  generating?: number;
  ready: number;
  posted_24h: number;
  failed_24h: number;
  error_rate: number;
}): Promise<void> {
  await setSystemState("content_queue", {
    ...counts,
    synced_at: new Date().toISOString(),
  });
}

// ─── SQL Setup Instructions ─────────────────────────────────────────────────

/**
 * SQL to run in Supabase SQL Editor to create the coordination tables.
 * This is separate from the vector-memory setup.
 */
export function setupCoordinationSQL(): string {
  return `
-- ============================================================
-- AGENT COORDINATION LAYER — Run this in Supabase SQL Editor
-- ============================================================

-- 1. agent_coordination — cross-agent action log
create table if not exists agent_coordination (
  id bigint primary key generated always as identity,
  agent_name text not null,
  action_type text not null,
  status text not null default 'completed',
  details jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for querying by agent
create index if not exists idx_agent_coordination_agent
  on agent_coordination (agent_name, created_at desc);

-- Index for querying by action type
create index if not exists idx_agent_coordination_type
  on agent_coordination (action_type, created_at desc);

-- Enable RLS
alter table agent_coordination enable row level security;

-- Allow service role full access
create policy "Service role full access on agent_coordination"
  on agent_coordination for all
  using (true)
  with check (true);


-- 2. system_state — shared key-value store
create table if not exists system_state (
  key text primary key,
  value jsonb not null default '{}',
  updated_by text not null default 'unknown',
  updated_at timestamptz default now()
);

-- Index for querying by update time
create index if not exists idx_system_state_updated
  on system_state (updated_at desc);

-- Enable RLS
alter table system_state enable row level security;

-- Allow service role full access
create policy "Service role full access on system_state"
  on system_state for all
  using (true)
  with check (true);
`;
}
