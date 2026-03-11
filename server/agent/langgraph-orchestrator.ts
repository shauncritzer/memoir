/**
 * LangGraph Orchestrator — Graph-based agent orchestration
 *
 * Replaces the linear loop in orchestrator.ts with a LangGraph StateGraph.
 * Each step (research, content gen, publish, metrics, optimize) is a graph node
 * with conditional edges for routing based on state.
 *
 * Entry points:
 *   - runContentGraph()    — the main content pipeline (research → generate → publish → metrics)
 *   - runFullOrchestration() — all loops including strategy + niche + revenue
 */

import { Annotation, StateGraph, END, START } from "@langchain/langgraph";

// ─── Graph State Definition ──────────────────────────────────────────────────

const OrchestratorState = Annotation.Root({
  // Input
  businessSlug: Annotation<string>,

  // Node result strings (overwrite on each node)
  researchSummary: Annotation<string>,
  contentGenResult: Annotation<string>,
  postingResult: Annotation<string>,
  metricsResult: Annotation<string>,
  qualityResult: Annotation<string>,
  engagementResult: Annotation<string>,
  healthResult: Annotation<string>,
  optimizeResult: Annotation<string>,

  // Accumulated actions log (reducer: appends new entries)
  actions: Annotation<string[]>({
    reducer: (prev: string[], next: string[]) => [...prev, ...next],
    default: () => [],
  }),

  // Accumulated errors (reducer: appends new entries)
  errors: Annotation<string[]>({
    reducer: (prev: string[], next: string[]) => [...prev, ...next],
    default: () => [],
  }),
});

type OrchestratorStateType = typeof OrchestratorState.State;

// ─── Node Functions ──────────────────────────────────────────────────────────

async function researchNode(state: OrchestratorStateType) {
  try {
    const { runResearchLoop } = await import("./orchestrator");
    const result = await runResearchLoop(state.businessSlug);
    if (result) {
      return { researchSummary: result, actions: [`[research] ${result}`] };
    }
    return { researchSummary: "skipped" };
  } catch (err: any) {
    return { researchSummary: `error: ${err.message}`, errors: [`[research] ${err.message}`] };
  }
}

async function replenishNode(_state: OrchestratorStateType) {
  try {
    const { runReplenishLoop } = await import("./orchestrator");
    const result = await runReplenishLoop();
    if (result) {
      return { contentGenResult: result, actions: [`[replenish] ${result}`] };
    }
    return { contentGenResult: "skipped" };
  } catch (err: any) {
    return { contentGenResult: `error: ${err.message}`, errors: [`[replenish] ${err.message}`] };
  }
}

async function contentGenerationNode(_state: OrchestratorStateType) {
  try {
    const { processContentGeneration } = await import("../social/scheduler");
    await processContentGeneration();
    return { contentGenResult: "ok", actions: ["[content-gen] Processed pending content generation"] };
  } catch (err: any) {
    return { contentGenResult: `error: ${err.message}`, errors: [`[content-gen] ${err.message}`] };
  }
}

async function publishNode(_state: OrchestratorStateType) {
  try {
    const { processScheduledPosts } = await import("../social/scheduler");
    await processScheduledPosts();
    return { postingResult: "ok", actions: ["[publish] Processed scheduled posts"] };
  } catch (err: any) {
    return { postingResult: `error: ${err.message}`, errors: [`[publish] ${err.message}`] };
  }
}

async function metricsNode(_state: OrchestratorStateType) {
  try {
    const { updateEngagementMetrics } = await import("../social/scheduler");
    await updateEngagementMetrics();
    return { metricsResult: "ok", actions: ["[metrics] Updated engagement metrics"] };
  } catch (err: any) {
    return { metricsResult: `error: ${err.message}`, errors: [`[metrics] ${err.message}`] };
  }
}

async function qualityNode(_state: OrchestratorStateType) {
  try {
    const { runQualityLoop } = await import("./orchestrator");
    const result = await runQualityLoop();
    if (result) {
      return { qualityResult: result, actions: [`[quality] ${result}`] };
    }
    return { qualityResult: "skipped" };
  } catch (err: any) {
    return { qualityResult: `error: ${err.message}`, errors: [`[quality] ${err.message}`] };
  }
}

async function engagementNode(_state: OrchestratorStateType) {
  try {
    const { runEngagementLoop } = await import("./orchestrator");
    const result = await runEngagementLoop();
    if (result) {
      return { engagementResult: result, actions: [`[engagement] ${result}`] };
    }
    return { engagementResult: "skipped" };
  } catch (err: any) {
    return { engagementResult: `error: ${err.message}`, errors: [`[engagement] ${err.message}`] };
  }
}

async function healthCheckNode(_state: OrchestratorStateType) {
  try {
    const { getEngineHealth } = await import("./self-monitor");
    const health = await getEngineHealth();

    if (health.overall === "critical") {
      // Send critical alert via Telegram
      try {
        const { isTelegramConfigured, sendCriticalAlert } = await import("./telegram");
        if (isTelegramConfigured()) {
          await sendCriticalAlert(
            "Engine Health Critical",
            health.criticals.join(". "),
            health.warnings.join("\n")
          );
        }
      } catch {
        // Non-critical
      }
      return {
        healthResult: `CRITICAL: ${health.criticals.join("; ")}`,
        actions: [`[health] CRITICAL: ${health.criticals.join("; ")}`],
        errors: health.criticals.map(c => `[health] ${c}`),
      };
    }

    if (health.warnings.length > 0) {
      return {
        healthResult: `degraded: ${health.warnings.join("; ")}`,
        actions: [`[health] Warnings: ${health.warnings.join("; ")}`],
      };
    }

    return { healthResult: "healthy" };
  } catch (err: any) {
    return { healthResult: `error: ${err.message}`, errors: [`[health] ${err.message}`] };
  }
}

async function optimizeNode(_state: OrchestratorStateType) {
  try {
    const { runOptimizeLoop } = await import("./orchestrator");
    const result = await runOptimizeLoop();

    // Store performance data in vector memory (non-blocking)
    try {
      const { storePerformanceSnapshot } = await import("./vector-memory-hooks");
      await storePerformanceSnapshot();
    } catch {
      // Vector memory not configured — skip silently
    }

    if (result) {
      return { optimizeResult: result, actions: [`[optimize] ${result}`] };
    }
    return { optimizeResult: "skipped" };
  } catch (err: any) {
    return { optimizeResult: `error: ${err.message}`, errors: [`[optimize] ${err.message}`] };
  }
}

// ─── Graph Builder ───────────────────────────────────────────────────────────

/**
 * Content Pipeline Graph — the core loop:
 *   research → replenish → content-gen → publish → metrics → quality → optimize
 *
 * This replaces `runSchedulerCycle()` + orchestrator research/replenish
 * with a unified, observable graph.
 */
function buildContentPipelineGraph() {
  const graph = new StateGraph(OrchestratorState)
    .addNode("health_check", healthCheckNode)
    .addNode("research", researchNode)
    .addNode("replenish", replenishNode)
    .addNode("content_gen", contentGenerationNode)
    .addNode("publish", publishNode)
    .addNode("metrics", metricsNode)
    .addNode("quality", qualityNode)
    .addNode("engagement", engagementNode)
    .addNode("optimize", optimizeNode)
    .addEdge(START, "health_check")
    .addEdge("health_check", "research")
    .addEdge("research", "replenish")
    .addEdge("replenish", "content_gen")
    .addEdge("content_gen", "publish")
    .addEdge("publish", "metrics")
    .addEdge("metrics", "quality")
    .addEdge("quality", "engagement")
    .addEdge("engagement", "optimize")
    .addEdge("optimize", END);

  return graph.compile();
}

/**
 * Run the content pipeline graph.
 * Returns the same shape as runSchedulerCycle() for backward compatibility,
 * plus the full action/error log from all nodes.
 */
export async function runContentGraph(businessSlug: string = "sober-strong"): Promise<{
  success: boolean;
  contentGeneration: string;
  posting: string;
  metrics: string;
  actions: string[];
  errors: string[];
}> {
  const app = buildContentPipelineGraph();

  console.log("[LangGraph] Starting content pipeline graph...");

  // LangSmith tracing is automatic when LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY are set.
  // Pass run metadata for better organization in the LangSmith dashboard.
  const result = await app.invoke(
    { businessSlug },
    {
      runName: "content-pipeline",
      metadata: { businessSlug, trigger: "scheduler" },
      tags: ["content-pipeline", businessSlug],
    }
  );

  const success = result.errors.length === 0;

  console.log(
    `[LangGraph] Content pipeline complete: ${result.actions.length} actions, ${result.errors.length} errors`
  );

  return {
    success,
    contentGeneration: result.contentGenResult || "ok",
    posting: result.postingResult || "ok",
    metrics: result.metricsResult || "ok",
    actions: result.actions,
    errors: result.errors,
  };
}

/**
 * Stream the content pipeline graph for real-time progress.
 * Returns an async iterable of node updates.
 */
export async function streamContentGraph(businessSlug: string = "sober-strong") {
  const app = buildContentPipelineGraph();

  console.log("[LangGraph] Streaming content pipeline graph...");

  return app.stream({ businessSlug }, { streamMode: "updates" });
}

/**
 * Full orchestration — runs the content pipeline graph
 * plus revenue and strategy loops.
 *
 * This replaces the old `runOrchestration()` from orchestrator.ts.
 */
export async function runFullOrchestration(businessSlug: string = "sober-strong"): Promise<{
  success: boolean;
  actions: string[];
  errors: string[];
}> {
  const pipelineResult = await runContentGraph(businessSlug);

  const allActions = [...pipelineResult.actions];
  const allErrors = [...pipelineResult.errors];

  // Run revenue and strategy loops (standalone, not in the graph)
  const standaloneLoops = [
    { name: "revenue", fn: async () => {
      try {
        const { optimizeRevenue } = await import("./revenue-engine");
        const r = await optimizeRevenue();
        return r ? `${r.ctaAdjustments.length} CTA adjustments` : null;
      } catch { return null; }
    }},
    { name: "strategy", fn: async () => {
      const { runStrategyUpdate } = await import("./strategy-brain");
      const r = await runStrategyUpdate();
      return r.updated ? `Strategy updated: ${r.changes.join("; ")}` : null;
    }},
    { name: "niche", fn: async () => {
      const { runNicheDiscoveryLoop } = await import("./niche-expander");
      return await runNicheDiscoveryLoop();
    }},
  ];

  for (const loop of standaloneLoops) {
    try {
      const result = await loop.fn();
      if (result) {
        allActions.push(`[${loop.name}] ${result}`);
      }
    } catch (err: any) {
      allErrors.push(`[${loop.name}] ${err.message}`);
    }
  }

  console.log(
    `[LangGraph] Full orchestration complete: ${allActions.length} actions, ${allErrors.length} errors`
  );

  return {
    success: allErrors.length === 0,
    actions: allActions,
    errors: allErrors,
  };
}
