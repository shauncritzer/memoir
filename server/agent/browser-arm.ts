/**
 * BROWSER AUTOMATION ARM — Browserbase + Playwright Integration
 *
 * Gives the agent system a real browser for tasks that can't be done via API.
 * Uses Browserbase for managed cloud browser infrastructure + Playwright for control.
 *
 * Capabilities:
 *   1. Navigate to pages and take screenshots (auditing, verification)
 *   2. Fill forms and click buttons (ConvertKit email creation, etc.)
 *   3. Log into authenticated services
 *   4. Extract content from pages that block API scraping
 *   5. Post to platforms without posting APIs (TikTok — experimental)
 *
 * Risk Tiers:
 *   Tier 1: Screenshots, page reads, content extraction (read-only)
 *   Tier 2: Form fills, content posting on owned accounts
 *   Tier 3: Actions on third-party platforms (TikTok posting, etc.)
 *   Tier 4: Financial actions via browser (purchases, ad spend)
 *
 * Architecture:
 *   Browserbase provides cloud browsers (no local Chrome needed)
 *   Playwright-core controls the browser (no bundled browser binary)
 *   Sessions are short-lived (5 min timeout on Developer plan)
 *
 * Plan limits (Developer $20/mo):
 *   - 25 concurrent browsers
 *   - 6,000 browser minutes/month
 *   - 1GB proxy usage
 *   - 5 min session timeout
 */

import { ENV } from "../_core/env";

// ─── Types ──────────────────────────────────────────────────────────────────

export type BrowserTaskType =
  | "screenshot"
  | "extract_content"
  | "fill_form"
  | "click_action"
  | "login_and_act"
  | "social_post"
  | "audit_page";

export type BrowserTask = {
  /** What kind of browser task */
  type: BrowserTaskType;
  /** Target URL */
  url: string;
  /** Human-readable description of what to do */
  description: string;
  /** Step-by-step instructions for complex tasks */
  steps?: BrowserStep[];
  /** Risk tier for this task */
  riskTier?: number;
  /** Timeout in ms (max 300000 = 5 min for Developer plan) */
  timeout?: number;
};

export type BrowserStep = {
  /** Action type */
  action: "navigate" | "click" | "type" | "wait" | "screenshot" | "extract" | "select";
  /** CSS selector for the target element */
  selector?: string;
  /** Value for type/select actions */
  value?: string;
  /** URL for navigate actions */
  url?: string;
  /** Wait time in ms */
  waitMs?: number;
  /** Description of this step */
  description?: string;
};

export type BrowserResult = {
  success: boolean;
  /** What happened */
  summary: string;
  /** Screenshot as base64 (if requested) */
  screenshot?: string;
  /** Extracted text content */
  extractedContent?: string;
  /** Page title */
  pageTitle?: string;
  /** Final URL (after redirects) */
  finalUrl?: string;
  /** Error details */
  error?: string;
  /** How long the session took in ms */
  durationMs?: number;
};

// ─── Configuration ──────────────────────────────────────────────────────────

function getBrowserbaseConfig(): { apiKey: string; projectId: string } {
  const apiKey = ENV.browserbaseApiKey;
  const projectId = ENV.browserbaseProjectId;

  if (!apiKey) {
    throw new Error(
      "BROWSERBASE_API_KEY not configured. Add it to Railway environment variables."
    );
  }
  if (!projectId) {
    throw new Error(
      "BROWSERBASE_PROJECT_ID not configured. Add it to Railway environment variables."
    );
  }

  return { apiKey, projectId };
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Create a new Browserbase session and get a Playwright browser connection.
 * Each session uses a fresh cloud browser.
 */
async function createSession(): Promise<{
  sessionId: string;
  connectUrl: string;
}> {
  const { apiKey, projectId } = getBrowserbaseConfig();

  const response = await fetch("https://api.browserbase.com/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bb-api-key": apiKey,
    },
    body: JSON.stringify({
      projectId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Browserbase session creation failed: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return {
    sessionId: data.id,
    connectUrl: `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${data.id}`,
  };
}

/**
 * Take a screenshot of a URL.
 * Tier 1 — read-only, no side effects.
 */
export async function takeScreenshot(url: string): Promise<BrowserResult> {
  const startTime = Date.now();

  try {
    const { chromium } = await import("playwright-core");
    const session = await createSession();

    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const screenshot = await page.screenshot({ type: "png" });
    const title = await page.title();
    const finalUrl = page.url();

    await browser.close();

    return {
      success: true,
      summary: `Screenshot taken of "${title}"`,
      screenshot: screenshot.toString("base64"),
      pageTitle: title,
      finalUrl,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      summary: "Screenshot failed",
      error: err.message,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Extract text content from a URL.
 * Tier 1 — read-only.
 */
export async function extractPageContent(url: string): Promise<BrowserResult> {
  const startTime = Date.now();

  try {
    const { chromium } = await import("playwright-core");
    const session = await createSession();

    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const title = await page.title();
    const finalUrl = page.url();
    const content = await page.evaluate(() => document.body.innerText);

    await browser.close();

    return {
      success: true,
      summary: `Extracted content from "${title}" (${content.length} chars)`,
      extractedContent: content,
      pageTitle: title,
      finalUrl,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      summary: "Content extraction failed",
      error: err.message,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Execute a multi-step browser task.
 * Risk tier depends on the steps — read-only steps are Tier 1, form fills are Tier 2+.
 */
export async function executeBrowserTask(task: BrowserTask): Promise<BrowserResult> {
  const startTime = Date.now();
  const timeout = Math.min(task.timeout || 240000, 280000); // Max ~4.5 min (leave buffer for 5 min limit)

  try {
    const { chromium } = await import("playwright-core");
    const session = await createSession();

    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = await context.newPage();

    // Navigate to starting URL
    await page.goto(task.url, { waitUntil: "networkidle", timeout: 30000 });

    let lastScreenshot: string | undefined;
    let extractedContent: string | undefined;
    const stepResults: string[] = [];

    // Execute steps
    if (task.steps) {
      for (const step of task.steps) {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          stepResults.push(`TIMEOUT: Stopped before step "${step.description || step.action}"`);
          break;
        }

        try {
          switch (step.action) {
            case "navigate":
              if (step.url) {
                await page.goto(step.url, { waitUntil: "networkidle", timeout: 30000 });
                stepResults.push(`Navigated to ${step.url}`);
              }
              break;

            case "click":
              if (step.selector) {
                await page.click(step.selector, { timeout: 10000 });
                stepResults.push(`Clicked ${step.selector}`);
                // Brief wait for page updates
                await page.waitForTimeout(1000);
              }
              break;

            case "type":
              if (step.selector && step.value) {
                await page.fill(step.selector, step.value, { timeout: 10000 });
                stepResults.push(`Typed into ${step.selector}`);
              }
              break;

            case "select":
              if (step.selector && step.value) {
                await page.selectOption(step.selector, step.value, { timeout: 10000 });
                stepResults.push(`Selected ${step.value} in ${step.selector}`);
              }
              break;

            case "wait":
              await page.waitForTimeout(step.waitMs || 2000);
              stepResults.push(`Waited ${step.waitMs || 2000}ms`);
              break;

            case "screenshot":
              const ss = await page.screenshot({ type: "png" });
              lastScreenshot = ss.toString("base64");
              stepResults.push("Screenshot taken");
              break;

            case "extract":
              if (step.selector) {
                const el = await page.$(step.selector);
                extractedContent = el ? await el.innerText() : "Element not found";
              } else {
                extractedContent = await page.evaluate(() => document.body.innerText);
              }
              stepResults.push(`Extracted content (${(extractedContent || "").length} chars)`);
              break;
          }
        } catch (stepErr: any) {
          stepResults.push(`Step "${step.description || step.action}" failed: ${stepErr.message}`);
        }
      }
    }

    const title = await page.title();
    const finalUrl = page.url();

    await browser.close();

    return {
      success: true,
      summary: `Task completed: ${task.description}\nSteps: ${stepResults.join(" → ")}`,
      screenshot: lastScreenshot,
      extractedContent,
      pageTitle: title,
      finalUrl,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      summary: `Task failed: ${task.description}`,
      error: err.message,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Audit a page — navigate, screenshot, extract key info.
 * Useful for Mission Control to verify that pages/content look correct.
 * Tier 1 — read-only.
 */
export async function auditPage(url: string): Promise<BrowserResult> {
  return executeBrowserTask({
    type: "audit_page",
    url,
    description: `Audit page at ${url}`,
    steps: [
      { action: "screenshot", description: "Take initial screenshot" },
      { action: "extract", description: "Extract page content" },
    ],
  });
}

// ─── Diagnostic Function ────────────────────────────────────────────────────

/**
 * Check if Browserbase is properly configured and can create sessions.
 */
export async function diagnoseBrowserbase(): Promise<{
  configured: boolean;
  canCreateSession: boolean;
  error?: string;
}> {
  if (!ENV.browserbaseApiKey) {
    return {
      configured: false,
      canCreateSession: false,
      error: "BROWSERBASE_API_KEY not set in environment variables",
    };
  }

  if (!ENV.browserbaseProjectId) {
    return {
      configured: false,
      canCreateSession: false,
      error: "BROWSERBASE_PROJECT_ID not set. Find it in Browserbase dashboard → Project settings",
    };
  }

  try {
    // Try to create and immediately close a session
    const session = await createSession();
    return {
      configured: true,
      canCreateSession: true,
    };
  } catch (err: any) {
    return {
      configured: true,
      canCreateSession: false,
      error: err.message,
    };
  }
}
