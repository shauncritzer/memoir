/**
 * Agent Vector Memory — Supabase pgvector
 *
 * Stores content performance data, agent decisions, and learnings as embeddings.
 * Used by the content generation pipeline to learn what works.
 *
 * Tables (created in Supabase SQL Editor):
 *   - agent_memory: vector embeddings of content + performance data
 *
 * Embeddings: Google Gemini embedding-001 (free tier, 768 dimensions)
 *
 * Setup:
 *   1. Create a Supabase project (free tier)
 *   2. Run the SQL in setupInstructions() in the Supabase SQL Editor
 *   3. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway env vars
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MemoryEntry = {
  id?: number;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  similarity?: number;
  created_at?: string;
};

export type MemoryCategory =
  | "content_performance"   // What content performed well/poorly
  | "topic_research"        // Research findings from Tavily
  | "strategy_insight"      // Strategic learnings
  | "audience_signal"       // Engagement patterns
  | "cta_performance";      // Which CTAs convert

// ─── Supabase Client ─────────────────────────────────────────────────────────

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

// ─── Embedding Generation (Gemini free tier) ─────────────────────────────────

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

async function generateEmbedding(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"): Promise<number[] | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn("[VectorMemory] No GOOGLE_API_KEY — cannot generate embeddings");
    return null;
  }

  try {
    // Use Gemini's REST API directly (avoids adding another SDK)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[VectorMemory] Embedding error:", err);
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (err: any) {
    console.error("[VectorMemory] Embedding generation failed:", err.message);
    return null;
  }
}

// ─── Store & Retrieve ────────────────────────────────────────────────────────

/**
 * Store a memory entry with its embedding.
 * Content is embedded via Gemini and stored in Supabase pgvector.
 */
export async function storeMemory(
  content: string,
  category: MemoryCategory,
  metadata: Record<string, unknown> = {}
): Promise<boolean> {
  const client = getSupabase();
  if (!client) {
    console.warn("[VectorMemory] Supabase not configured — skipping memory store");
    return false;
  }

  const embedding = await generateEmbedding(content);
  if (!embedding) return false;

  try {
    const { error } = await client.from("agent_memory").insert({
      content,
      category,
      metadata,
      embedding,
    });

    if (error) {
      console.error("[VectorMemory] Store error:", error.message);
      return false;
    }

    console.log(`[VectorMemory] Stored ${category} memory (${content.substring(0, 50)}...)`);
    return true;
  } catch (err: any) {
    console.error("[VectorMemory] Store failed:", err.message);
    return false;
  }
}

/**
 * Search for similar memories using cosine similarity.
 * Returns the top N most similar entries above the threshold.
 */
export async function searchMemory(
  query: string,
  opts: {
    category?: MemoryCategory;
    limit?: number;
    threshold?: number;
  } = {}
): Promise<MemoryEntry[]> {
  const client = getSupabase();
  if (!client) return [];

  const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");
  if (!queryEmbedding) return [];

  try {
    const { data, error } = await client.rpc("match_agent_memory", {
      query_embedding: queryEmbedding,
      match_threshold: opts.threshold ?? 0.7,
      match_count: opts.limit ?? 10,
      filter_category: opts.category ?? null,
    });

    if (error) {
      console.error("[VectorMemory] Search error:", error.message);
      return [];
    }

    return (data || []) as MemoryEntry[];
  } catch (err: any) {
    console.error("[VectorMemory] Search failed:", err.message);
    return [];
  }
}

// ─── High-Level Memory Helpers ───────────────────────────────────────────────

/**
 * Store content performance data after a post is published and metrics are collected.
 * Called by the optimize loop to remember what worked.
 */
export async function rememberContentPerformance(opts: {
  platform: string;
  content: string;
  engagement: number;
  metrics: Record<string, unknown>;
}): Promise<boolean> {
  const performanceLevel = opts.engagement > 50 ? "high" : opts.engagement > 10 ? "medium" : "low";

  const summary = `[${opts.platform}] ${performanceLevel} performance (${opts.engagement} engagements): ${opts.content.substring(0, 300)}`;

  return storeMemory(summary, "content_performance", {
    platform: opts.platform,
    engagement: opts.engagement,
    performanceLevel,
    ...opts.metrics,
  });
}

/**
 * Store research findings from Tavily or other sources.
 */
export async function rememberResearch(opts: {
  topic: string;
  findings: string;
  source?: string;
}): Promise<boolean> {
  const summary = `Research on "${opts.topic}": ${opts.findings.substring(0, 500)}`;

  return storeMemory(summary, "topic_research", {
    topic: opts.topic,
    source: opts.source || "tavily",
  });
}

/**
 * Get relevant context for content generation.
 * Searches memory for similar topics and past performance data.
 */
export async function getContentContext(topic: string, platform?: string): Promise<string> {
  const memories = await searchMemory(topic, {
    limit: 5,
    threshold: 0.65,
  });

  if (memories.length === 0) return "";

  const context = memories
    .map((m, i) => `${i + 1}. ${m.content}`)
    .join("\n");

  return `\n\nRELEVANT PAST PERFORMANCE DATA:\n${context}\n\nUse this data to inform your content strategy. Replicate patterns from high-performing content and avoid patterns from low-performing content.`;
}

/**
 * Check if vector memory is configured and ready.
 */
export function isVectorMemoryConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.GOOGLE_API_KEY);
}

// ─── Setup Instructions ─────────────────────────────────────────────────────

/**
 * SQL to run in Supabase SQL Editor to set up the agent_memory table.
 * This is returned as a string so it can be shown in the admin UI.
 */
export function setupInstructions(): string {
  return `
-- Run this in your Supabase SQL Editor:

-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Create the agent_memory table
create table if not exists agent_memory (
  id bigint primary key generated always as identity,
  content text not null,
  category varchar(50) not null default 'content_performance',
  metadata jsonb default '{}',
  embedding vector(768) not null,
  created_at timestamptz default now()
);

-- 3. Create index for fast similarity search
create index if not exists agent_memory_embedding_idx
  on agent_memory using hnsw (embedding vector_cosine_ops);

-- 4. Create the search function
create or replace function match_agent_memory(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 10,
  filter_category text default null
)
returns table (
  id bigint,
  content text,
  category varchar,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    agent_memory.id,
    agent_memory.content,
    agent_memory.category,
    agent_memory.metadata,
    1 - (agent_memory.embedding <=> query_embedding) as similarity
  from agent_memory
  where 1 - (agent_memory.embedding <=> query_embedding) >= match_threshold
    and (filter_category is null or agent_memory.category = filter_category)
  order by agent_memory.embedding <=> query_embedding asc
  limit match_count;
$$;

-- 5. Enable RLS (optional, recommended for production)
alter table agent_memory enable row level security;

-- Allow service role full access
create policy "Service role access"
  on agent_memory for all
  using (true)
  with check (true);
`;
}
