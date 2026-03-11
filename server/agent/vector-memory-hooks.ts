/**
 * Vector Memory Hooks — connects the existing content pipeline to vector memory.
 *
 * Called by the LangGraph optimize node to store performance data,
 * and by the content generator to retrieve relevant context.
 */

import { rememberContentPerformance, isVectorMemoryConfigured, searchMemory } from "./vector-memory";
import { getDb } from "../db";

/**
 * Store a snapshot of recent content performance into vector memory.
 * Called after the optimize loop runs.
 */
export async function storePerformanceSnapshot(): Promise<void> {
  if (!isVectorMemoryConfigured()) return;

  const db = await getDb();
  if (!db) return;

  try {
    const { sql } = await import("drizzle-orm");

    // Get posts from the last 24 hours with metrics
    const [rows] = await db.execute(
      sql`SELECT platform, content, metrics, posted_at
          FROM content_queue
          WHERE status = 'posted'
          AND posted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
          AND metrics IS NOT NULL
          AND content IS NOT NULL
          ORDER BY posted_at DESC
          LIMIT 10`
    ) as any;

    if (!rows || (rows as any[]).length === 0) return;

    let stored = 0;
    for (const row of rows as any[]) {
      let parsedMetrics: Record<string, unknown> = {};
      try { parsedMetrics = JSON.parse(row.metrics); } catch { continue; }

      const engagement = (
        (parsedMetrics.likes as number || 0) +
        (parsedMetrics.comments as number || 0) +
        (parsedMetrics.shares as number || 0) +
        (parsedMetrics.retweets as number || 0)
      );

      const success = await rememberContentPerformance({
        platform: row.platform,
        content: row.content,
        engagement,
        metrics: parsedMetrics,
      });

      if (success) stored++;
    }

    if (stored > 0) {
      console.log(`[VectorMemoryHooks] Stored ${stored} performance entries`);
    }
  } catch (err: any) {
    console.error("[VectorMemoryHooks] Performance snapshot error:", err.message);
  }
}

/**
 * Get memory-augmented context for content generation.
 * Returns a string of relevant past performance data to inject into LLM prompts.
 */
export async function getMemoryContext(topic: string, platform?: string): Promise<string> {
  if (!isVectorMemoryConfigured()) return "";

  try {
    const query = platform ? `${platform} content about ${topic}` : topic;
    const memories = await searchMemory(query, {
      category: "content_performance",
      limit: 5,
      threshold: 0.65,
    });

    if (memories.length === 0) return "";

    return "\n\nPAST PERFORMANCE CONTEXT (from agent memory):\n" +
      memories.map((m, i) => `${i + 1}. ${m.content}`).join("\n") +
      "\n\nUse these insights to create higher-performing content.\n";
  } catch {
    return "";
  }
}
