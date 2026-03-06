/**
 * MAKE.COM AUTOMATION ARM — Workflow Automation Integration
 *
 * Gives the agent system the ability to trigger and manage Make.com scenarios
 * (formerly Integromat) for cross-platform workflow automation.
 *
 * How it works:
 *   OUTBOUND: Agent triggers Make.com scenarios via webhook URLs
 *   INBOUND:  Make.com sends data/commands back via our webhook endpoint
 *
 * Use cases by business:
 *
 *   Sober Strong Academy:
 *     - Lead nurture sequences (new subscriber → welcome flow → product pitch)
 *     - Purchase follow-up (Stripe webhook → ConvertKit tag → email sequence)
 *     - Content repurposing (1 blog post → social media → email → podcast script)
 *     - Engagement alerts (high-performing post → boost/repost)
 *     - Review/testimonial collection after course completion
 *
 *   Critzer's Cabinets:
 *     - Lead capture → CRM entry → auto-response email
 *     - Quote request → manufacturer price lookup → proposal generation
 *     - Customer communication (appointment reminders, project updates)
 *     - Order placement to manufacturers (future: automated purchasing)
 *     - Invoice generation and follow-up
 *
 *   DataDisco (SaaS):
 *     - User onboarding flows
 *     - Usage monitoring → upgrade prompts
 *     - Support ticket routing
 *
 * Risk Tiers:
 *   Tier 1: Read-only (check scenario status, list scenarios)
 *   Tier 2: Trigger pre-approved automations (content repurpose, lead nurture)
 *   Tier 3: Trigger customer-facing automations (emails, SMS)
 *   Tier 4: Financial automations (place orders, spend money)
 *
 * Architecture:
 *   Each "scenario" in Make.com has a webhook URL that triggers it.
 *   We store scenario configs in DB and can trigger them programmatically.
 *   Make.com handles the multi-step automation (e.g., "get Stripe data → update
 *   ConvertKit → send Slack notification → log to Google Sheets").
 *   Make.com can call back to our inbound webhook with results.
 */

import { ENV } from "../_core/env";
import { getDb } from "../db";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ScenarioCategory =
  | "lead_nurture"
  | "content_repurpose"
  | "customer_comms"
  | "order_management"
  | "reporting"
  | "notification"
  | "onboarding"
  | "custom";

export type ScenarioConfig = {
  id?: number;
  /** Which business this scenario belongs to */
  businessSlug: string;
  /** Human-readable name */
  name: string;
  /** What this scenario does */
  description: string;
  /** Category for organization */
  category: ScenarioCategory;
  /** The Make.com webhook URL that triggers this scenario */
  webhookUrl: string;
  /** Risk tier (1-4) — determines auto-execute vs approval required */
  riskTier: number;
  /** Whether this scenario is active */
  active: boolean;
  /** Expected payload schema (for validation/documentation) */
  payloadSchema?: Record<string, string>;
  /** Last time this scenario was triggered */
  lastTriggered?: Date;
  /** Number of times triggered */
  triggerCount?: number;
};

export type TriggerResult = {
  success: boolean;
  scenarioName: string;
  /** HTTP status from Make.com */
  statusCode?: number;
  /** Response body from Make.com (if any) */
  response?: any;
  /** Error message if failed */
  error?: string;
  /** Logged action ID in agent_actions */
  actionId?: number;
};

export type InboundWebhookPayload = {
  /** Which scenario sent this callback */
  scenarioName: string;
  /** What happened */
  event: string;
  /** Business this relates to */
  businessSlug?: string;
  /** Result data */
  data?: any;
  /** Whether this needs human attention */
  needsApproval?: boolean;
  /** Error info if something failed */
  error?: string;
};

// ─── Configuration ──────────────────────────────────────────────────────────

function getMakeApiKey(): string | null {
  return ENV.makeApiKey || null;
}

function getMakeBaseUrl(): string {
  return ENV.makeBaseUrl || "https://us2.make.com";
}

function getMakeTeamId(): string | null {
  return ENV.makeTeamId || null;
}

// ─── Make.com REST API ──────────────────────────────────────────────────────

/**
 * Call the Make.com REST API.
 * Docs: https://developers.make.com/api-documentation
 */
async function makeApiCall(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: any
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const apiKey = getMakeApiKey();
  if (!apiKey) {
    return { ok: false, status: 0, data: null, error: "MAKE_API_KEY not set" };
  }

  const baseUrl = getMakeBaseUrl();
  const url = `${baseUrl}/api/v2${path}`;

  try {
    const headers: Record<string, string> = {
      "Authorization": `Token ${apiKey}`,
      "Content-Type": "application/json",
    };

    const opts: RequestInit = { method, headers };
    if (body && (method === "POST" || method === "PATCH")) {
      opts.body = JSON.stringify(body);
    }

    const response = await fetch(url, opts);
    const contentType = response.headers.get("content-type") || "";
    let data: any;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data,
        error: typeof data === "object" ? (data.message || data.detail || JSON.stringify(data)) : String(data),
      };
    }

    return { ok: true, status: response.status, data };
  } catch (err: any) {
    return { ok: false, status: 0, data: null, error: `API call failed: ${err.message}` };
  }
}

// ─── Make.com Scenario Management ───────────────────────────────────────────

/**
 * List all scenarios in the Make.com account.
 */
export async function listMakeScenarios(): Promise<{
  success: boolean;
  scenarios: any[];
  error?: string;
}> {
  const teamId = getMakeTeamId();
  if (!teamId) {
    return { success: false, scenarios: [], error: "MAKE_TEAM_ID not set" };
  }

  const result = await makeApiCall("GET", `/scenarios?teamId=${teamId}`);
  if (!result.ok) {
    return { success: false, scenarios: [], error: result.error };
  }

  const scenarios = result.data?.scenarios || result.data || [];
  return { success: true, scenarios };
}

/**
 * Get details of a specific Make.com scenario.
 */
export async function getMakeScenario(scenarioId: number): Promise<{
  success: boolean;
  scenario: any;
  error?: string;
}> {
  const result = await makeApiCall("GET", `/scenarios/${scenarioId}`);
  if (!result.ok) {
    return { success: false, scenario: null, error: result.error };
  }

  return { success: true, scenario: result.data?.scenario || result.data };
}

/**
 * Get the blueprint (full definition) of a Make.com scenario.
 */
export async function getMakeBlueprint(scenarioId: number): Promise<{
  success: boolean;
  blueprint: any;
  error?: string;
}> {
  const result = await makeApiCall("GET", `/scenarios/${scenarioId}/blueprint`);
  if (!result.ok) {
    return { success: false, blueprint: null, error: result.error };
  }

  return { success: true, blueprint: result.data?.response?.blueprint || result.data };
}

/**
 * Create a new scenario in Make.com from a blueprint.
 *
 * @param name - Scenario name
 * @param blueprint - The full scenario blueprint object (will be JSON-stringified)
 * @param scheduling - Scheduling config (default: run every 15 min indefinitely)
 * @param folderId - Optional folder ID
 */
export async function createMakeScenario(
  name: string,
  blueprint: any,
  scheduling?: { type: string; interval: number },
  folderId?: number
): Promise<{
  success: boolean;
  scenarioId?: number;
  webhookUrl?: string;
  scenario?: any;
  error?: string;
}> {
  const teamId = getMakeTeamId();
  if (!teamId) {
    return { success: false, error: "MAKE_TEAM_ID not set" };
  }

  // Make.com requires blueprint as a JSON string
  const blueprintString = typeof blueprint === "string" ? blueprint : JSON.stringify(blueprint);
  const schedulingString = JSON.stringify(scheduling || { type: "indefinitely", interval: 900 });

  const body: any = {
    blueprint: blueprintString,
    scheduling: schedulingString,
    teamId: parseInt(teamId),
    confirmed: true,
  };

  if (folderId) {
    body.folderId = folderId;
  }

  const result = await makeApiCall("POST", "/scenarios", body);
  if (!result.ok) {
    return { success: false, error: result.error };
  }

  const scenario = result.data?.scenario || result.data;
  console.log(`[MakeAPI] Created scenario "${name}" (ID: ${scenario?.id})`);

  return {
    success: true,
    scenarioId: scenario?.id,
    scenario,
  };
}

/**
 * Activate or deactivate a Make.com scenario.
 */
export async function setMakeScenarioActive(scenarioId: number, active: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await makeApiCall("PATCH", `/scenarios/${scenarioId}`, {
    isEnabled: active,
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

/**
 * Run a Make.com scenario on-demand.
 */
export async function runMakeScenario(scenarioId: number, data?: any): Promise<{
  success: boolean;
  executionId?: string;
  error?: string;
}> {
  const body = data ? { data: JSON.stringify(data) } : undefined;
  const result = await makeApiCall("POST", `/scenarios/${scenarioId}/run`, body);

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, executionId: result.data?.executionId };
}

/**
 * Delete a Make.com scenario.
 */
export async function deleteMakeScenario(scenarioId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await makeApiCall("DELETE", `/scenarios/${scenarioId}`);
  if (!result.ok) {
    return { success: false, error: result.error };
  }
  return { success: true };
}

/**
 * List all hooks (webhooks) in the Make.com account.
 */
export async function listMakeHooks(): Promise<{
  success: boolean;
  hooks: any[];
  error?: string;
}> {
  const teamId = getMakeTeamId();
  if (!teamId) {
    return { success: false, hooks: [], error: "MAKE_TEAM_ID not set" };
  }

  const result = await makeApiCall("GET", `/hooks?teamId=${teamId}`);
  if (!result.ok) {
    return { success: false, hooks: [], error: result.error };
  }

  const hooks = result.data?.hooks || result.data || [];
  return { success: true, hooks };
}

/**
 * Get execution log for a scenario.
 */
export async function getMakeExecutions(scenarioId: number, limit: number = 10): Promise<{
  success: boolean;
  executions: any[];
  error?: string;
}> {
  const result = await makeApiCall("GET", `/scenarios/${scenarioId}/logs?pg[limit]=${limit}&pg[sortBy]=timestamp&pg[sortDir]=desc`);
  if (!result.ok) {
    return { success: false, executions: [], error: result.error };
  }

  return { success: true, executions: result.data?.scenarioLogs || result.data || [] };
}

// ─── Blueprint Templates ────────────────────────────────────────────────────

/**
 * Generate a webhook-trigger blueprint for common scenarios.
 * This creates a scenario in Make.com that listens for webhook calls from our system.
 */
export function buildWebhookBlueprint(name: string, modules: BlueprintModule[]): any {
  return {
    name,
    flow: [
      {
        id: 1,
        module: "gateway:CustomWebHook",
        version: 1,
        metadata: { designer: { x: 0, y: 0 } },
      },
      ...modules.map((mod, idx) => ({
        id: idx + 2,
        module: mod.module,
        version: mod.version || 1,
        parameters: mod.parameters || {},
        mapper: mod.mapper || {},
        metadata: { designer: { x: (idx + 1) * 300, y: 0 } },
      })),
    ],
    metadata: { instant: true, version: 1 },
  };
}

export type BlueprintModule = {
  module: string;
  version?: number;
  parameters?: Record<string, any>;
  mapper?: Record<string, any>;
};

/**
 * Full diagnostic of Make.com API integration.
 * Tests API connectivity, lists scenarios, hooks, and reports status.
 */
export async function diagnoseMakeApi(): Promise<{
  apiConnected: boolean;
  teamId: string | null;
  baseUrl: string;
  scenarioCount: number;
  hookCount: number;
  scenarios: Array<{ id: number; name: string; isEnabled: boolean; lastEdit: string }>;
  hooks: Array<{ id: number; name: string; url: string }>;
  error?: string;
}> {
  const teamId = getMakeTeamId();
  const baseUrl = getMakeBaseUrl();
  const apiKey = getMakeApiKey();

  if (!apiKey) {
    return {
      apiConnected: false,
      teamId,
      baseUrl,
      scenarioCount: 0,
      hookCount: 0,
      scenarios: [],
      hooks: [],
      error: "MAKE_API_KEY not set. Go to Make.com → Profile → API Tokens to create one.",
    };
  }

  if (!teamId) {
    return {
      apiConnected: false,
      teamId: null,
      baseUrl,
      scenarioCount: 0,
      hookCount: 0,
      scenarios: [],
      hooks: [],
      error: "MAKE_TEAM_ID not set. Check your Make.com URL — the number after your domain (e.g., us2.make.com/652854/...) is your team/org ID.",
    };
  }

  // Test API connectivity by listing scenarios
  const scenarioResult = await listMakeScenarios();
  if (!scenarioResult.success) {
    return {
      apiConnected: false,
      teamId,
      baseUrl,
      scenarioCount: 0,
      hookCount: 0,
      scenarios: [],
      hooks: [],
      error: `API connection failed: ${scenarioResult.error}`,
    };
  }

  // List hooks
  const hookResult = await listMakeHooks();

  return {
    apiConnected: true,
    teamId,
    baseUrl,
    scenarioCount: scenarioResult.scenarios.length,
    hookCount: hookResult.hooks?.length || 0,
    scenarios: scenarioResult.scenarios.map((s: any) => ({
      id: s.id,
      name: s.name,
      isEnabled: s.isEnabled,
      lastEdit: s.lastEdit || s.updatedAt || "unknown",
    })),
    hooks: (hookResult.hooks || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      url: h.url || "",
    })),
  };
}

// ─── Database: Scenario Registry ────────────────────────────────────────────

/**
 * Ensure the make_scenarios table exists.
 */
export async function ensureMakeTable(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`CREATE TABLE IF NOT EXISTS make_scenarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_slug VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL DEFAULT 'custom',
      webhook_url VARCHAR(500) NOT NULL,
      risk_tier INT NOT NULL DEFAULT 2,
      active TINYINT NOT NULL DEFAULT 1,
      payload_schema TEXT,
      last_triggered TIMESTAMP NULL,
      trigger_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_name_business (name, business_slug)
    )`);
    return true;
  } catch (err: any) {
    console.error("[MakeAutomation] Table creation error:", err.message);
    return false;
  }
}

/**
 * Register a new Make.com scenario webhook.
 * Called from admin UI or programmatically by the agent.
 */
export async function registerScenario(config: Omit<ScenarioConfig, "id" | "lastTriggered" | "triggerCount">): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const { sql } = await import("drizzle-orm");
    const [result] = await db.execute(sql`INSERT INTO make_scenarios
      (business_slug, name, description, category, webhook_url, risk_tier, active, payload_schema)
      VALUES (
        ${config.businessSlug},
        ${config.name},
        ${config.description},
        ${config.category},
        ${config.webhookUrl},
        ${config.riskTier},
        ${config.active ? 1 : 0},
        ${config.payloadSchema ? JSON.stringify(config.payloadSchema) : null}
      )
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        category = VALUES(category),
        webhook_url = VALUES(webhook_url),
        risk_tier = VALUES(risk_tier),
        active = VALUES(active),
        payload_schema = VALUES(payload_schema)`) as any;

    console.log(`[MakeAutomation] Registered scenario: ${config.name} (${config.businessSlug})`);
    return result.insertId || null;
  } catch (err: any) {
    console.error("[MakeAutomation] Register scenario error:", err.message);
    return null;
  }
}

/**
 * Get all registered scenarios, optionally filtered.
 */
export async function getScenarios(opts?: {
  businessSlug?: string;
  category?: ScenarioCategory;
  activeOnly?: boolean;
}): Promise<ScenarioConfig[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { sql } = await import("drizzle-orm");

    let query;
    if (opts?.businessSlug && opts?.activeOnly !== false) {
      query = sql`SELECT * FROM make_scenarios WHERE business_slug = ${opts.businessSlug} AND active = 1 ORDER BY category, name`;
    } else if (opts?.businessSlug) {
      query = sql`SELECT * FROM make_scenarios WHERE business_slug = ${opts.businessSlug} ORDER BY category, name`;
    } else if (opts?.activeOnly !== false) {
      query = sql`SELECT * FROM make_scenarios WHERE active = 1 ORDER BY business_slug, category, name`;
    } else {
      query = sql`SELECT * FROM make_scenarios ORDER BY business_slug, category, name`;
    }

    const [rows] = await db.execute(query) as any;
    return (rows as any[]).map(rowToScenario);
  } catch (err: any) {
    console.error("[MakeAutomation] Get scenarios error:", err.message);
    return [];
  }
}

function rowToScenario(r: any): ScenarioConfig {
  return {
    id: r.id,
    businessSlug: r.business_slug,
    name: r.name,
    description: r.description,
    category: r.category,
    webhookUrl: r.webhook_url,
    riskTier: r.risk_tier,
    active: !!r.active,
    payloadSchema: r.payload_schema ? JSON.parse(r.payload_schema) : undefined,
    lastTriggered: r.last_triggered ? new Date(r.last_triggered) : undefined,
    triggerCount: r.trigger_count,
  };
}

// ─── Core: Trigger Scenarios ────────────────────────────────────────────────

/**
 * Trigger a Make.com scenario by name.
 * Respects risk tiers — tier 3-4 will be proposed for approval instead of auto-executing.
 */
export async function triggerScenario(
  scenarioName: string,
  businessSlug: string,
  payload: Record<string, any> = {},
  options?: { forceExecute?: boolean; reason?: string }
): Promise<TriggerResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, scenarioName, error: "Database unavailable" };
  }

  try {
    const { sql } = await import("drizzle-orm");

    // Look up the scenario
    const [rows] = await db.execute(
      sql`SELECT * FROM make_scenarios WHERE name = ${scenarioName} AND business_slug = ${businessSlug} AND active = 1 LIMIT 1`
    ) as any;

    const scenario = (rows as any[])?.[0];
    if (!scenario) {
      return {
        success: false,
        scenarioName,
        error: `Scenario "${scenarioName}" not found for business "${businessSlug}" or is inactive`,
      };
    }

    const config = rowToScenario(scenario);

    // Risk tier check — tier 3-4 needs approval unless force-executed
    if (config.riskTier >= 3 && !options?.forceExecute) {
      // Log as proposed action, don't execute yet
      const [actionResult] = await db.execute(sql`INSERT INTO agent_actions
        (business_id, category, title, description, risk_tier, status, metadata)
        VALUES (
          (SELECT id FROM businesses WHERE slug = ${businessSlug} LIMIT 1),
          'automation',
          ${`Trigger Make scenario: ${scenarioName}`},
          ${options?.reason || `Trigger "${scenarioName}" automation with payload: ${JSON.stringify(payload).substring(0, 500)}`},
          ${config.riskTier},
          'proposed',
          ${JSON.stringify({ scenarioName, businessSlug, payload, webhookUrl: config.webhookUrl })}
        )`) as any;

      return {
        success: true,
        scenarioName,
        actionId: actionResult.insertId,
        error: `Tier ${config.riskTier} — queued for approval (action #${actionResult.insertId})`,
      };
    }

    // Execute the webhook
    return await executeWebhook(config, payload, db);
  } catch (err: any) {
    return { success: false, scenarioName, error: `Trigger error: ${err.message}` };
  }
}

/**
 * Execute a Make.com webhook call.
 */
async function executeWebhook(
  scenario: ScenarioConfig,
  payload: Record<string, any>,
  db: any
): Promise<TriggerResult> {
  const { sql } = await import("drizzle-orm");

  try {
    // Add metadata to payload so Make.com knows who sent it
    const enrichedPayload = {
      ...payload,
      _meta: {
        source: "datadisco_agent",
        business: scenario.businessSlug,
        scenario: scenario.name,
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch(scenario.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedPayload),
    });

    let responseBody: any;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    // Update trigger stats
    await db.execute(sql`UPDATE make_scenarios
      SET last_triggered = NOW(), trigger_count = trigger_count + 1
      WHERE id = ${scenario.id}`);

    // Log as executed action
    await db.execute(sql`INSERT INTO agent_actions
      (business_id, category, title, description, risk_tier, status, result, executed_at, metadata)
      VALUES (
        (SELECT id FROM businesses WHERE slug = ${scenario.businessSlug} LIMIT 1),
        'automation',
        ${`Triggered: ${scenario.name}`},
        ${`Executed Make.com scenario "${scenario.name}" (${scenario.category})`},
        ${scenario.riskTier},
        'executed',
        ${typeof responseBody === "string" ? responseBody.substring(0, 1000) : JSON.stringify(responseBody).substring(0, 1000)},
        NOW(),
        ${JSON.stringify({ scenarioName: scenario.name, businessSlug: scenario.businessSlug, payload })}
      )`);

    if (!response.ok) {
      console.warn(`[MakeAutomation] Webhook returned ${response.status} for "${scenario.name}"`);
      return {
        success: false,
        scenarioName: scenario.name,
        statusCode: response.status,
        response: responseBody,
        error: `Make.com returned HTTP ${response.status}`,
      };
    }

    console.log(`[MakeAutomation] Triggered "${scenario.name}" for ${scenario.businessSlug} — HTTP ${response.status}`);
    return {
      success: true,
      scenarioName: scenario.name,
      statusCode: response.status,
      response: responseBody,
    };
  } catch (err: any) {
    console.error(`[MakeAutomation] Webhook execution failed for "${scenario.name}":`, err.message);
    return {
      success: false,
      scenarioName: scenario.name,
      error: `Webhook call failed: ${err.message}`,
    };
  }
}

/**
 * Execute a previously approved action (called when admin approves a tier 3-4 scenario trigger).
 */
export async function executeApprovedScenario(actionId: number): Promise<TriggerResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, scenarioName: "unknown", error: "Database unavailable" };
  }

  try {
    const { sql } = await import("drizzle-orm");

    // Get the action
    const [rows] = await db.execute(
      sql`SELECT * FROM agent_actions WHERE id = ${actionId} AND status = 'approved' AND category = 'automation' LIMIT 1`
    ) as any;

    const action = (rows as any[])?.[0];
    if (!action) {
      return { success: false, scenarioName: "unknown", error: `Action #${actionId} not found or not approved` };
    }

    const metadata = action.metadata ? JSON.parse(action.metadata) : {};
    const { scenarioName, businessSlug, payload } = metadata;

    // Look up scenario
    const [scenarioRows] = await db.execute(
      sql`SELECT * FROM make_scenarios WHERE name = ${scenarioName} AND business_slug = ${businessSlug} LIMIT 1`
    ) as any;

    const scenario = (scenarioRows as any[])?.[0];
    if (!scenario) {
      await db.execute(sql`UPDATE agent_actions SET status = 'failed', error_message = 'Scenario not found' WHERE id = ${actionId}`);
      return { success: false, scenarioName, error: "Scenario no longer exists" };
    }

    // Mark as executing
    await db.execute(sql`UPDATE agent_actions SET status = 'executing' WHERE id = ${actionId}`);

    // Execute
    const result = await executeWebhook(rowToScenario(scenario), payload || {}, db);

    // Update action status
    if (result.success) {
      await db.execute(sql`UPDATE agent_actions SET status = 'executed', result = ${JSON.stringify(result.response).substring(0, 1000)}, executed_at = NOW() WHERE id = ${actionId}`);
    } else {
      await db.execute(sql`UPDATE agent_actions SET status = 'failed', error_message = ${result.error || "Unknown error"} WHERE id = ${actionId}`);
    }

    return result;
  } catch (err: any) {
    return { success: false, scenarioName: "unknown", error: `Execution error: ${err.message}` };
  }
}

// ─── Inbound: Process Callbacks from Make.com ───────────────────────────────

/**
 * Process an inbound webhook from Make.com.
 * Make.com scenarios can call back to our server with results.
 */
export async function processInboundWebhook(payload: InboundWebhookPayload): Promise<{
  success: boolean;
  message: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database unavailable" };

  try {
    const { sql } = await import("drizzle-orm");

    console.log(`[MakeAutomation] Inbound webhook: ${payload.event} from "${payload.scenarioName}"`);

    // Log as agent action
    const riskTier = payload.needsApproval ? 3 : 1;
    const status = payload.needsApproval ? "proposed" : "executed";

    await db.execute(sql`INSERT INTO agent_actions
      (business_id, category, title, description, risk_tier, status, result, executed_at, metadata)
      VALUES (
        ${payload.businessSlug ? sql`(SELECT id FROM businesses WHERE slug = ${payload.businessSlug} LIMIT 1)` : sql`NULL`},
        'automation_callback',
        ${`Make.com: ${payload.event}`},
        ${`Callback from "${payload.scenarioName}": ${payload.event}`},
        ${riskTier},
        ${status},
        ${payload.data ? JSON.stringify(payload.data).substring(0, 2000) : null},
        ${status === "executed" ? sql`NOW()` : sql`NULL`},
        ${JSON.stringify({ scenarioName: payload.scenarioName, event: payload.event, businessSlug: payload.businessSlug })}
      )`);

    // If there's an error from Make.com, store as an alert-worthy report
    if (payload.error) {
      await db.execute(sql`INSERT INTO agent_reports
        (report_type, title, content)
        VALUES (
          'automation_error',
          ${`Make.com Error: ${payload.scenarioName}`},
          ${`Scenario "${payload.scenarioName}" reported an error during "${payload.event}":\n\n${payload.error}\n\nPayload data: ${JSON.stringify(payload.data || {}).substring(0, 1000)}`}
        )`);
    }

    return { success: true, message: `Processed: ${payload.event}` };
  } catch (err: any) {
    console.error("[MakeAutomation] Inbound processing error:", err.message);
    return { success: false, message: err.message };
  }
}

// ─── Convenience: Pre-built Scenario Triggers ───────────────────────────────

/**
 * Trigger a "new lead" automation.
 * Used when someone subscribes to email list, downloads lead magnet, etc.
 */
export async function triggerNewLead(businessSlug: string, lead: {
  email: string;
  name?: string;
  source: string;
  leadMagnet?: string;
}): Promise<TriggerResult> {
  return triggerScenario("new-lead-nurture", businessSlug, {
    event: "new_lead",
    ...lead,
  }, { reason: `New lead from ${lead.source}: ${lead.email}` });
}

/**
 * Trigger a "new purchase" follow-up automation.
 */
export async function triggerPurchaseFollowUp(businessSlug: string, purchase: {
  email: string;
  productName: string;
  amount: number;
  stripePaymentId?: string;
}): Promise<TriggerResult> {
  return triggerScenario("purchase-follow-up", businessSlug, {
    event: "new_purchase",
    ...purchase,
  }, { reason: `Purchase follow-up: ${purchase.productName} ($${(purchase.amount / 100).toFixed(2)})` });
}

/**
 * Trigger content repurposing — take one piece of content and distribute across platforms.
 */
export async function triggerContentRepurpose(businessSlug: string, content: {
  originalPlatform: string;
  contentText: string;
  contentUrl?: string;
  targetPlatforms: string[];
}): Promise<TriggerResult> {
  return triggerScenario("content-repurpose", businessSlug, {
    event: "repurpose_content",
    ...content,
  }, { reason: `Repurpose ${content.originalPlatform} content to ${content.targetPlatforms.join(", ")}` });
}

/**
 * Trigger a customer communication for Critzer's Cabinets.
 */
export async function triggerCustomerComm(data: {
  type: "quote_response" | "appointment_reminder" | "project_update" | "invoice_followup";
  customerEmail: string;
  customerName: string;
  subject: string;
  body: string;
}): Promise<TriggerResult> {
  return triggerScenario("customer-communication", "critzer-cabinets", {
    event: "customer_comm",
    ...data,
  }, { reason: `${data.type} to ${data.customerName}` });
}

// ─── Diagnostic ─────────────────────────────────────────────────────────────

/**
 * Check if Make.com integration is configured and list registered scenarios.
 */
export async function diagnoseMake(): Promise<{
  configured: boolean;
  apiKeySet: boolean;
  scenarioCount: number;
  scenarios: Array<{ name: string; business: string; category: string; active: boolean; triggerCount: number }>;
  error?: string;
}> {
  const apiKeySet = !!getMakeApiKey();
  let scenarioCount = 0;
  const scenarioList: Array<{ name: string; business: string; category: string; active: boolean; triggerCount: number }> = [];

  try {
    await ensureMakeTable();
    const scenarios = await getScenarios({ activeOnly: false });
    scenarioCount = scenarios.length;

    for (const s of scenarios) {
      scenarioList.push({
        name: s.name,
        business: s.businessSlug,
        category: s.category,
        active: s.active,
        triggerCount: s.triggerCount || 0,
      });
    }

    return {
      configured: scenarioCount > 0 || apiKeySet,
      apiKeySet,
      scenarioCount,
      scenarios: scenarioList,
    };
  } catch (err: any) {
    return {
      configured: false,
      apiKeySet,
      scenarioCount: 0,
      scenarios: [],
      error: err.message,
    };
  }
}

// ─── Seed Default Scenarios ─────────────────────────────────────────────────

/**
 * Seed placeholder scenarios so the system knows what automations to expect.
 * Webhook URLs need to be updated once Make.com scenarios are created.
 * The agent can update these via the admin UI or API.
 */
export async function seedDefaultScenarios(): Promise<void> {
  const defaults: Array<Omit<ScenarioConfig, "id" | "lastTriggered" | "triggerCount">> = [
    // Sober Strong Academy scenarios
    {
      businessSlug: "sober-strong",
      name: "new-lead-nurture",
      description: "New email subscriber → welcome email → tag in ConvertKit → add to nurture sequence. Triggered when someone signs up or downloads a lead magnet.",
      category: "lead_nurture",
      webhookUrl: "", // Set in Make.com
      riskTier: 2,
      active: false,
      payloadSchema: { email: "string", name: "string?", source: "string", leadMagnet: "string?" },
    },
    {
      businessSlug: "sober-strong",
      name: "purchase-follow-up",
      description: "Post-purchase flow: thank you email → course access confirmation → ConvertKit tag → 7-day check-in sequence.",
      category: "lead_nurture",
      webhookUrl: "",
      riskTier: 2,
      active: false,
      payloadSchema: { email: "string", productName: "string", amount: "number", stripePaymentId: "string?" },
    },
    {
      businessSlug: "sober-strong",
      name: "content-repurpose",
      description: "Take one piece of content and adapt it for multiple platforms. Blog → social posts, email, podcast script.",
      category: "content_repurpose",
      webhookUrl: "",
      riskTier: 2,
      active: false,
      payloadSchema: { originalPlatform: "string", contentText: "string", targetPlatforms: "string[]" },
    },
    {
      businessSlug: "sober-strong",
      name: "engagement-boost",
      description: "When a post gets high engagement, auto-boost: repost to other platforms, create follow-up content, notify Shaun.",
      category: "notification",
      webhookUrl: "",
      riskTier: 2,
      active: false,
      payloadSchema: { platform: "string", postUrl: "string", engagementScore: "number" },
    },
    {
      businessSlug: "sober-strong",
      name: "daily-metrics-report",
      description: "Compile daily metrics from all platforms and send formatted report to Shaun via email/Slack.",
      category: "reporting",
      webhookUrl: "",
      riskTier: 1,
      active: false,
      payloadSchema: { metrics: "object", alerts: "object[]", date: "string" },
    },

    // Critzer's Cabinets scenarios
    {
      businessSlug: "critzer-cabinets",
      name: "customer-communication",
      description: "Send customer communications: quote responses, appointment reminders, project updates, invoice follow-ups.",
      category: "customer_comms",
      webhookUrl: "",
      riskTier: 3,
      active: false,
      payloadSchema: { type: "string", customerEmail: "string", customerName: "string", subject: "string", body: "string" },
    },
    {
      businessSlug: "critzer-cabinets",
      name: "new-quote-request",
      description: "New quote request → log in CRM → auto-reply with estimated timeline → notify Shaun → start follow-up sequence.",
      category: "lead_nurture",
      webhookUrl: "",
      riskTier: 2,
      active: false,
      payloadSchema: { customerName: "string", email: "string", phone: "string?", projectType: "string", details: "string" },
    },
    {
      businessSlug: "critzer-cabinets",
      name: "order-to-manufacturer",
      description: "Place order with manufacturer: validate specs → generate PO → email manufacturer → track order status. REQUIRES APPROVAL.",
      category: "order_management",
      webhookUrl: "",
      riskTier: 4,
      active: false,
      payloadSchema: { manufacturer: "string", items: "object[]", totalCost: "number", customerRef: "string" },
    },

    // Cross-business / DataDisco scenarios
    {
      businessSlug: "datadisco",
      name: "cross-business-report",
      description: "Weekly cross-business performance report: aggregate metrics, identify trends, suggest optimizations.",
      category: "reporting",
      webhookUrl: "",
      riskTier: 1,
      active: false,
      payloadSchema: { businesses: "object[]", period: "string" },
    },
  ];

  for (const scenario of defaults) {
    await registerScenario(scenario);
  }

  console.log(`[MakeAutomation] Seeded ${defaults.length} default scenario templates`);
}
