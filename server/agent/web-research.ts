/**
 * WEB RESEARCH ARM — Tavily Integration
 *
 * Gives the agent system real-time web research capabilities.
 * Uses Tavily API for search, extract, and research operations.
 *
 * Capabilities:
 *   1. Search the web for current information (competitors, trends, news)
 *   2. Extract clean content from specific URLs
 *   3. Deep research on topics (multi-step, comprehensive)
 *
 * Risk Tiers:
 *   Tier 1: Search queries and content extraction (read-only, no side effects)
 *   Tier 2: Save research reports to DB
 *
 * Used by:
 *   - Research Creator agent (replaces "use your training knowledge" with live data)
 *   - Mission Control (market monitoring, competitor tracking)
 *   - Content Pipeline (trending topic discovery)
 */

import { ENV } from "../_core/env";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SearchDepth = "basic" | "advanced";

export type SearchRequest = {
  /** The search query */
  query: string;
  /** Search depth — basic is faster, advanced is more thorough */
  depth?: SearchDepth;
  /** Maximum number of results */
  maxResults?: number;
  /** Filter to specific domains */
  includeDomains?: string[];
  /** Exclude specific domains */
  excludeDomains?: string[];
  /** Include an AI-generated answer summary */
  includeAnswer?: boolean;
  /** Include raw HTML content */
  includeRawContent?: boolean;
};

export type SearchResult = {
  title: string;
  url: string;
  content: string;
  score: number;
  rawContent?: string;
};

export type SearchResponse = {
  success: boolean;
  query: string;
  answer?: string;
  results: SearchResult[];
  error?: string;
};

export type ExtractRequest = {
  /** URLs to extract content from */
  urls: string[];
};

export type ExtractedContent = {
  url: string;
  rawContent: string;
  error?: string;
};

export type ExtractResponse = {
  success: boolean;
  results: ExtractedContent[];
  error?: string;
};

export type ResearchRequest = {
  /** The topic to research in depth */
  topic: string;
  /** Additional context to guide the research */
  context?: string;
  /** Maximum number of search iterations */
  maxIterations?: number;
};

export type ResearchResponse = {
  success: boolean;
  topic: string;
  summary: string;
  sources: Array<{ title: string; url: string }>;
  findings: string[];
  error?: string;
};

// ─── Configuration ──────────────────────────────────────────────────────────

const TAVILY_BASE_URL = "https://api.tavily.com";

function getTavilyKey(): string {
  const key = ENV.tavilyApiKey;
  if (!key) {
    throw new Error(
      "TAVILY_API_KEY not configured. Add it to Railway environment variables."
    );
  }
  return key;
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Search the web for information on a topic.
 * Tier 1 action — read-only, no side effects.
 */
export async function tavilySearch(
  request: SearchRequest
): Promise<SearchResponse> {
  const apiKey = getTavilyKey();

  try {
    const response = await fetch(`${TAVILY_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: request.query,
        search_depth: request.depth || "basic",
        max_results: request.maxResults || 5,
        include_domains: request.includeDomains || [],
        exclude_domains: request.excludeDomains || [],
        include_answer: request.includeAnswer ?? true,
        include_raw_content: request.includeRawContent ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        query: request.query,
        results: [],
        error: `Tavily search failed: ${response.status} — ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      query: request.query,
      answer: data.answer || undefined,
      results: (data.results || []).map((r: any) => ({
        title: r.title || "",
        url: r.url || "",
        content: r.content || "",
        score: r.score || 0,
        rawContent: r.raw_content || undefined,
      })),
    };
  } catch (err: any) {
    return {
      success: false,
      query: request.query,
      results: [],
      error: `Tavily search error: ${err.message}`,
    };
  }
}

/**
 * Extract clean content from one or more URLs.
 * Tier 1 action — read-only.
 */
export async function tavilyExtract(
  request: ExtractRequest
): Promise<ExtractResponse> {
  const apiKey = getTavilyKey();

  try {
    const response = await fetch(`${TAVILY_BASE_URL}/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        urls: request.urls,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        results: [],
        error: `Tavily extract failed: ${response.status} — ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      results: (data.results || []).map((r: any) => ({
        url: r.url || "",
        rawContent: r.raw_content || "",
      })),
    };
  } catch (err: any) {
    return {
      success: false,
      results: [],
      error: `Tavily extract error: ${err.message}`,
    };
  }
}

/**
 * Multi-step deep research on a topic.
 * Performs multiple searches and synthesizes findings.
 * Tier 1 action — read-only, but more expensive (multiple API calls).
 */
export async function tavilyResearch(
  request: ResearchRequest
): Promise<ResearchResponse> {
  const maxIterations = request.maxIterations || 3;
  const allResults: SearchResult[] = [];
  const findings: string[] = [];

  try {
    // Initial broad search
    const initial = await tavilySearch({
      query: request.topic,
      depth: "advanced",
      maxResults: 5,
      includeAnswer: true,
    });

    if (!initial.success) {
      return {
        success: false,
        topic: request.topic,
        summary: "",
        sources: [],
        findings: [],
        error: initial.error,
      };
    }

    allResults.push(...initial.results);
    if (initial.answer) {
      findings.push(initial.answer);
    }

    // Follow-up searches based on initial results
    const followUpQueries = generateFollowUpQueries(
      request.topic,
      initial.results,
      request.context
    );

    for (let i = 0; i < Math.min(followUpQueries.length, maxIterations - 1); i++) {
      const followUp = await tavilySearch({
        query: followUpQueries[i],
        depth: "basic",
        maxResults: 3,
        includeAnswer: true,
      });

      if (followUp.success) {
        allResults.push(...followUp.results);
        if (followUp.answer) {
          findings.push(followUp.answer);
        }
      }
    }

    // Deduplicate results by URL
    const seen = new Set<string>();
    const uniqueResults = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Build summary from findings
    const summary = findings.length > 0
      ? findings.join("\n\n")
      : uniqueResults.map((r) => r.content).join("\n\n");

    return {
      success: true,
      topic: request.topic,
      summary,
      sources: uniqueResults.map((r) => ({ title: r.title, url: r.url })),
      findings,
    };
  } catch (err: any) {
    return {
      success: false,
      topic: request.topic,
      summary: "",
      sources: [],
      findings: [],
      error: `Research error: ${err.message}`,
    };
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function generateFollowUpQueries(
  topic: string,
  initialResults: SearchResult[],
  context?: string
): string[] {
  const queries: string[] = [];

  // Add competitor-focused query
  queries.push(`${topic} competitors pricing comparison 2026`);

  // Add trend-focused query
  queries.push(`${topic} trends statistics latest data`);

  // Add strategy query if context suggests it
  if (context) {
    queries.push(`${topic} ${context} best practices strategies`);
  }

  return queries;
}

// ─── Diagnostic Function ────────────────────────────────────────────────────

/**
 * Check if Tavily is properly configured and working.
 */
export async function diagnoseTavily(): Promise<{
  configured: boolean;
  working: boolean;
  error?: string;
}> {
  if (!ENV.tavilyApiKey) {
    return {
      configured: false,
      working: false,
      error: "TAVILY_API_KEY not set in environment variables",
    };
  }

  try {
    const result = await tavilySearch({
      query: "test",
      maxResults: 1,
      depth: "basic",
      includeAnswer: false,
    });

    return {
      configured: true,
      working: result.success,
      error: result.error,
    };
  } catch (err: any) {
    return {
      configured: true,
      working: false,
      error: err.message,
    };
  }
}
