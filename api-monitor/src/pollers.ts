/**
 * API POLLERS — Fetch usage data from each service's API.
 *
 * Each poller returns a normalized UsageData object.
 * Some APIs don't expose usage endpoints — those use available
 * alternatives (credit balance, subscription info, etc.).
 */

import { upsertUsage } from "./db.js";

// ─── Shared Types ────────────────────────────────────────────────────────────

type UsageData = {
  service: string;
  tokens_used: number;
  characters_used: number;
  credits_used: number;
  credits_remaining: number | null;
  cost_usd: number;
  raw_response: any;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

async function pollAnthropic(): Promise<UsageData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return emptyUsage("anthropic", "API key not set");

  try {
    // Anthropic doesn't have a public usage API endpoint.
    // We check the /v1/messages endpoint with a minimal call to verify the key works,
    // then track usage locally from our own logs.
    // For now, fetch billing page data if available via beta endpoint.
    const dateStr = today();

    // Try the beta usage endpoint (may not be available on all plans)
    const res = await fetch(
      `https://api.anthropic.com/v1/organizations/usage?start_date=${dateStr}&end_date=${dateStr}`,
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "usage-2025-01-01",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const totalTokens = (data.input_tokens ?? 0) + (data.output_tokens ?? 0);
      // Approximate cost: Haiku ~$0.25/MTok input + $1.25/MTok output
      const inputCost = ((data.input_tokens ?? 0) / 1_000_000) * 0.80;
      const outputCost = ((data.output_tokens ?? 0) / 1_000_000) * 4.00;
      return {
        service: "anthropic",
        tokens_used: totalTokens,
        characters_used: 0,
        credits_used: 0,
        credits_remaining: null,
        cost_usd: Math.round((inputCost + outputCost) * 10000) / 10000,
        raw_response: data,
      };
    }

    // Fallback: just verify the key is valid
    const verifyRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });

    const verifyData = await verifyRes.json();
    const inputTokens = verifyData.usage?.input_tokens ?? 0;
    const outputTokens = verifyData.usage?.output_tokens ?? 0;

    return {
      service: "anthropic",
      tokens_used: inputTokens + outputTokens,
      characters_used: 0,
      credits_used: 0,
      credits_remaining: null,
      cost_usd: 0,
      raw_response: { note: "Usage API unavailable, key verified", status: verifyRes.status },
    };
  } catch (err: any) {
    return emptyUsage("anthropic", err.message);
  }
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

async function pollOpenAI(): Promise<UsageData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return emptyUsage("openai", "API key not set");

  try {
    // OpenAI usage endpoint (admin key required, may 403 on project keys)
    const dateStr = today();
    const res = await fetch(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${Math.floor(new Date(dateStr).getTime() / 1000)}&limit=1&group_by=model`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (res.ok) {
      const data = await res.json();
      let totalTokens = 0;
      let totalCost = 0;
      for (const bucket of data.data ?? []) {
        for (const result of bucket.results ?? []) {
          totalTokens += (result.input_tokens ?? 0) + (result.output_tokens ?? 0);
          // DALL-E 3: ~$0.04/image, GPT-4o-mini: ~$0.15/MTok input
          totalCost += ((result.input_tokens ?? 0) / 1_000_000) * 0.15;
          totalCost += ((result.output_tokens ?? 0) / 1_000_000) * 0.60;
        }
      }
      return {
        service: "openai",
        tokens_used: totalTokens,
        characters_used: 0,
        credits_used: 0,
        credits_remaining: null,
        cost_usd: Math.round(totalCost * 10000) / 10000,
        raw_response: data,
      };
    }

    // Fallback: check billing/subscription
    const subRes = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return {
      service: "openai",
      tokens_used: 0,
      characters_used: 0,
      credits_used: 0,
      credits_remaining: null,
      cost_usd: 0,
      raw_response: { note: "Usage API requires admin key", key_valid: subRes.ok, status: res.status },
    };
  } catch (err: any) {
    return emptyUsage("openai", err.message);
  }
}

// ─── ElevenLabs ──────────────────────────────────────────────────────────────

async function pollElevenLabs(): Promise<UsageData> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return emptyUsage("elevenlabs", "API key not set");

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": apiKey },
    });

    if (!res.ok) return emptyUsage("elevenlabs", `HTTP ${res.status}`);

    const data = await res.json();
    const used = data.character_count ?? 0;
    const limit = data.character_limit ?? 0;
    const remaining = Math.max(0, limit - used);

    // Approximate cost: Starter plan ~$5/30k chars
    const costPer1kChars = 5 / 30000;
    const estimatedCost = used * costPer1kChars;

    return {
      service: "elevenlabs",
      tokens_used: 0,
      characters_used: used,
      credits_used: used,
      credits_remaining: remaining,
      cost_usd: Math.round(estimatedCost * 10000) / 10000,
      raw_response: {
        character_count: used,
        character_limit: limit,
        tier: data.tier,
        next_reset: data.next_character_count_reset_unix,
      },
    };
  } catch (err: any) {
    return emptyUsage("elevenlabs", err.message);
  }
}

// ─── HeyGen ──────────────────────────────────────────────────────────────────

async function pollHeyGen(): Promise<UsageData> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return emptyUsage("heygen", "API key not set");

  try {
    const res = await fetch("https://api.heygen.com/v1/user/remaining_quota", {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    });

    if (!res.ok) return emptyUsage("heygen", `HTTP ${res.status}`);

    const data = await res.json();
    const remaining = data.data?.remaining_quota ?? data.remaining_quota ?? 0;

    // HeyGen credits: 1 credit ~= 1 second of video, ~$0.01/credit on Creator plan
    return {
      service: "heygen",
      tokens_used: 0,
      characters_used: 0,
      credits_used: 0,
      credits_remaining: remaining,
      cost_usd: 0,
      raw_response: data.data ?? data,
    };
  } catch (err: any) {
    return emptyUsage("heygen", err.message);
  }
}

// ─── Replicate ───────────────────────────────────────────────────────────────

async function pollReplicate(): Promise<UsageData> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) return emptyUsage("replicate", "API token not set");

  try {
    // Get recent predictions to estimate spend
    const res = await fetch("https://api.replicate.com/v1/predictions?limit=50", {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!res.ok) return emptyUsage("replicate", `HTTP ${res.status}`);

    const data = await res.json();
    const dateStr = today();
    let todayCount = 0;
    let todayCost = 0;

    for (const pred of data.results ?? []) {
      const predDate = (pred.created_at ?? "").slice(0, 10);
      if (predDate === dateStr) {
        todayCount++;
        // Flux 1.1 Pro: ~$0.04/image; other models vary
        if (pred.model?.includes("flux")) {
          todayCost += 0.04;
        } else {
          todayCost += 0.01; // Default estimate
        }
      }
    }

    return {
      service: "replicate",
      tokens_used: 0,
      characters_used: 0,
      credits_used: todayCount,
      credits_remaining: null,
      cost_usd: Math.round(todayCost * 10000) / 10000,
      raw_response: {
        today_predictions: todayCount,
        total_returned: (data.results ?? []).length,
      },
    };
  } catch (err: any) {
    return emptyUsage("replicate", err.message);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyUsage(service: string, error: string): UsageData {
  return {
    service,
    tokens_used: 0,
    characters_used: 0,
    credits_used: 0,
    credits_remaining: null,
    cost_usd: 0,
    raw_response: { error },
  };
}

// ─── Run All Pollers ─────────────────────────────────────────────────────────

const POLLERS = [
  pollAnthropic,
  pollOpenAI,
  pollElevenLabs,
  pollHeyGen,
  pollReplicate,
];

/**
 * Poll all APIs, store results in DB, return the collected data.
 */
export async function pollAllApis(): Promise<UsageData[]> {
  const dateStr = today();
  const results: UsageData[] = [];

  for (const poller of POLLERS) {
    try {
      const data = await poller();
      await upsertUsage({ ...data, date: dateStr });
      results.push(data);
      console.log(`[Poller] ${data.service}: $${data.cost_usd}`);
    } catch (err: any) {
      console.error(`[Poller] ${poller.name} failed:`, err.message);
    }
  }

  return results;
}
