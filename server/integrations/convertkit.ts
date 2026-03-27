/**
 * ConvertKit API v3 Service
 *
 * Agent-friendly interface for email marketing automation.
 * Uses CONVERTKIT_API_KEY / CONVERTKIT_API_SECRET from env vars,
 * falling back to hardcoded keys from the legacy module.
 *
 * API docs: https://developers.convertkit.com/
 */

import { ENV } from "../_core/env";

// ─── Config ─────────────────────────────────────────────────────────────────

const BASE_URL = "https://api.convertkit.com/v3";

// Fallback to hardcoded keys from legacy server/convertkit.ts
const LEGACY_API_KEY = "dZ4CxMb5Zwp-5jy87pwcvQ";
const LEGACY_API_SECRET = "x9Uzt8Xs2179XCHdJ6vZrb_-sq12AGihK_sxmuqK3ZY";

function getApiKey(): string {
  return ENV.convertkitApiKey || LEGACY_API_KEY;
}

function getApiSecret(): string {
  return ENV.convertkitApiSecret || LEGACY_API_SECRET;
}

export function isConvertKitConfigured(): boolean {
  return !!(getApiKey());
}

// ─── Sequence IDs ───────────────────────────────────────────────────────────
// Map Stripe price IDs → ConvertKit sequence IDs for post-purchase automation.
// These correspond to the email sequences Shaun has set up in ConvertKit.

export const PURCHASE_SEQUENCES: Record<string, { sequenceId: number; tagName: string }> = {
  // 7-Day REWIRED Reset ($47)
  "price_1T0QQqC2dOpPzSOO61RNrJQR": {
    sequenceId: 2577789,
    tagName: "purchased-7-day-reset",
  },
  // From Broken to Whole ($97)
  "price_1T83EwC2dOpPzSOOockMjc5R": {
    sequenceId: 2577797,
    tagName: "purchased-from-broken-to-whole",
  },
  // Bent Not Broken Circle ($29/mo)
  "price_1T83FTC2dOpPzSOOQCWvWdJd": {
    sequenceId: 2577810,
    tagName: "purchased-circle-membership",
  },
};

// ─── Core Methods ───────────────────────────────────────────────────────────

async function ckFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return response;
}

/**
 * Add a subscriber to ConvertKit, optionally tagging them.
 * Uses the /forms/{formId}/subscribe endpoint for new subscribers,
 * or /subscribers endpoint directly if no form context.
 */
export async function addSubscriber(
  email: string,
  firstName?: string,
  tags?: string[]
): Promise<{ success: boolean; subscriberId?: number; error?: string }> {
  try {
    // First, subscribe via the general subscribers endpoint
    const response = await ckFetch("/subscribers", {
      method: "POST",
      body: JSON.stringify({
        api_secret: getApiSecret(),
        email_address: email,
        first_name: firstName,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ConvertKit] addSubscriber failed:", errText);
      return { success: false, error: errText };
    }

    const data = await response.json();
    const subscriberId = data.subscriber?.id;

    // Apply tags if provided
    if (tags && tags.length > 0 && subscriberId) {
      for (const tag of tags) {
        await tagSubscriber(email, tag);
      }
    }

    console.log(`[ConvertKit] Added subscriber: ${email} (ID: ${subscriberId})`);
    return { success: true, subscriberId };
  } catch (err: any) {
    console.error("[ConvertKit] addSubscriber error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Tag a subscriber by email. Creates the tag if it doesn't exist.
 * ConvertKit's /tags/{tagId}/subscribe creates-or-finds the subscriber.
 */
export async function tagSubscriber(
  email: string,
  tag: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First find or create the tag
    const tagId = await findOrCreateTag(tag);
    if (!tagId) {
      return { success: false, error: `Failed to find/create tag: ${tag}` };
    }

    // Apply tag to subscriber
    const response = await ckFetch(`/tags/${tagId}/subscribe`, {
      method: "POST",
      body: JSON.stringify({
        api_key: getApiKey(),
        email,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ConvertKit] tagSubscriber failed for ${tag}:`, errText);
      return { success: false, error: errText };
    }

    console.log(`[ConvertKit] Tagged ${email} with "${tag}"`);
    return { success: true };
  } catch (err: any) {
    console.error("[ConvertKit] tagSubscriber error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Trigger an email sequence for a subscriber.
 * Adds the subscriber to the sequence via /sequences/{sequenceId}/subscribe.
 */
export async function triggerSequence(
  email: string,
  sequenceId: number
): Promise<{ success: boolean; error?: string }> {
  if (!sequenceId || sequenceId === 0) {
    console.warn(`[ConvertKit] Sequence ID not configured (${sequenceId}), skipping`);
    return { success: false, error: "Sequence ID not configured — set in PURCHASE_SEQUENCES" };
  }

  try {
    const response = await ckFetch(`/sequences/${sequenceId}/subscribe`, {
      method: "POST",
      body: JSON.stringify({
        api_key: getApiKey(),
        email,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ConvertKit] triggerSequence failed:", errText);
      return { success: false, error: errText };
    }

    console.log(`[ConvertKit] Triggered sequence ${sequenceId} for ${email}`);
    return { success: true };
  } catch (err: any) {
    console.error("[ConvertKit] triggerSequence error:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// Cache tag name → ID so we don't hit the API repeatedly
const tagCache = new Map<string, number>();

async function findOrCreateTag(tagName: string): Promise<number | null> {
  // Check cache first
  const cached = tagCache.get(tagName);
  if (cached) return cached;

  try {
    // List all tags and find by name
    const response = await ckFetch(`/tags?api_key=${getApiKey()}`);
    if (!response.ok) return null;

    const data = await response.json();
    const tags = data.tags || [];
    const existing = tags.find((t: any) => t.name === tagName);

    if (existing) {
      tagCache.set(tagName, existing.id);
      return existing.id;
    }

    // Tag doesn't exist — create it
    const createResponse = await ckFetch("/tags", {
      method: "POST",
      body: JSON.stringify({
        api_key: getApiKey(),
        tag: { name: tagName },
      }),
    });

    if (!createResponse.ok) {
      console.error("[ConvertKit] Failed to create tag:", await createResponse.text());
      return null;
    }

    const created = await createResponse.json();
    const newId = created.id || created.tag?.id;
    if (newId) {
      tagCache.set(tagName, newId);
    }
    return newId || null;
  } catch (err: any) {
    console.error("[ConvertKit] findOrCreateTag error:", err.message);
    return null;
  }
}

// ─── Purchase Automation ────────────────────────────────────────────────────

/**
 * Handle post-purchase ConvertKit automation.
 * Called from the Stripe webhook after a successful purchase.
 *
 * 1. Tags the buyer with the product-specific tag
 * 2. Triggers the product-specific email sequence
 * 3. Tags with "customer" for segmentation
 */
export async function handlePurchaseAutomation(
  email: string,
  firstName: string | undefined,
  priceId: string
): Promise<{ success: boolean; actions: string[]; errors: string[] }> {
  const actions: string[] = [];
  const errors: string[] = [];

  const config = PURCHASE_SEQUENCES[priceId];
  if (!config) {
    console.warn(`[ConvertKit] No purchase automation configured for price: ${priceId}`);
    return { success: true, actions: ["no automation configured for this price"], errors };
  }

  // 1. Tag with product-specific tag
  const tagResult = await tagSubscriber(email, config.tagName);
  if (tagResult.success) {
    actions.push(`Tagged with "${config.tagName}"`);
  } else {
    errors.push(`Tag "${config.tagName}" failed: ${tagResult.error}`);
  }

  // 2. Tag with general "customer" tag
  const customerTagResult = await tagSubscriber(email, "customer");
  if (customerTagResult.success) {
    actions.push('Tagged with "customer"');
  } else {
    errors.push(`Tag "customer" failed: ${customerTagResult.error}`);
  }

  // 3. Trigger product-specific sequence (if configured)
  if (config.sequenceId > 0) {
    const seqResult = await triggerSequence(email, config.sequenceId);
    if (seqResult.success) {
      actions.push(`Triggered sequence ${config.sequenceId}`);
    } else {
      errors.push(`Sequence ${config.sequenceId} failed: ${seqResult.error}`);
    }
  } else {
    actions.push("Sequence ID not set yet — skipped");
  }

  console.log(`[ConvertKit] Purchase automation for ${email}: ${actions.join(", ")}`);
  return { success: errors.length === 0, actions, errors };
}
