import { TwitterApi } from "twitter-api-v2";

/** Environment-based Twitter credentials */
function getCredentials() {
  const consumerKey = process.env.TWITTER_CONSUMER_KEY;
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    return null;
  }

  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

/** Get an authenticated Twitter client for user-context (read+write) */
function getUserClient(): TwitterApi | null {
  const creds = getCredentials();
  if (!creds) return null;

  return new TwitterApi({
    appKey: creds.consumerKey,
    appSecret: creds.consumerSecret,
    accessToken: creds.accessToken,
    accessSecret: creds.accessTokenSecret,
  });
}

/** Get an app-only client using bearer token (read-only) */
function getAppClient(): TwitterApi | null {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) return null;
  return new TwitterApi(bearerToken);
}

export type TweetResult = {
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
};

/**
 * X API Tier Info (as of 2024+):
 *   Free ($0) — READ ONLY: 1,500 tweet reads/month, 1 app, NO tweet creation
 *   Basic ($200/mo) — 3,000 tweets/month (post), 10,000 reads, 1 app, user-context OAuth
 *   Pro ($5,000/mo) — 300,000 tweets/month, 1M reads, 3 apps, full API
 *
 * The "Free" tier does NOT support posting tweets at all.
 * You need at least Basic ($200/mo) to write/post tweets.
 */

/** Format Twitter API errors into actionable messages */
function formatTwitterError(err: any): string {
  const rawMsg = err?.data?.detail || err?.message || String(err);
  const statusCode = err?.code || err?.statusCode || err?.data?.status;

  if (rawMsg.includes("not have any credits") || rawMsg.includes("client-not-enrolled")) {
    return `X API: Not enrolled or no write credits. IMPORTANT: X's Free tier ($0) is READ-ONLY — it cannot post tweets. You need the Basic tier ($200/mo) at developer.x.com/en/portal/products. Raw: ${rawMsg}`;
  }
  if (rawMsg.includes("Your current subscription") || rawMsg.includes("not included in your current subscription")) {
    return `X API: Your subscription tier does not include tweet posting. The Free tier is read-only. Upgrade to Basic ($200/mo) at developer.x.com/en/portal/products. Raw: ${rawMsg}`;
  }
  if (statusCode === 401) {
    return `X API 401 Unauthorized — API keys invalid or expired. Regenerate at developer.x.com → Dashboard → Keys & Tokens. Raw: ${rawMsg}`;
  }
  if (statusCode === 403) {
    return `X API 403 Forbidden — Either (a) Free tier which is read-only (upgrade to Basic $200/mo), or (b) app permissions don't include write access. Check: Developer Portal → App → Settings → User authentication → must be "Read and Write". Raw: ${rawMsg}`;
  }
  if (statusCode === 429) {
    return `X API 429 Rate Limited — too many requests. Basic tier: ~100 tweets/day. Wait 15 min and retry. Raw: ${rawMsg}`;
  }
  return rawMsg;
}

/** Post a single tweet */
export async function postTweet(text: string): Promise<TweetResult> {
  const client = getUserClient();
  if (!client) {
    return { success: false, error: "Twitter credentials not configured" };
  }

  try {
    const result = await client.v2.tweet(text);
    const tweetId = result.data.id;
    // Construct the tweet URL using the authenticated user
    const me = await client.v2.me();
    const tweetUrl = `https://x.com/${me.data.username}/status/${tweetId}`;

    console.log(`[Twitter] Posted tweet ${tweetId}: ${text.substring(0, 50)}...`);
    return { success: true, tweetId, tweetUrl };
  } catch (err: any) {
    const errorMsg = formatTwitterError(err);
    console.error(`[Twitter] Failed to post tweet:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/** Post a thread (array of tweets) */
export async function postThread(tweets: string[]): Promise<TweetResult> {
  const client = getUserClient();
  if (!client) {
    return { success: false, error: "Twitter credentials not configured" };
  }

  if (tweets.length === 0) {
    return { success: false, error: "No tweets provided" };
  }

  if (tweets.length === 1) {
    return postTweet(tweets[0]);
  }

  try {
    // Post as a thread: first tweet, then replies
    const firstResult = await client.v2.tweet(tweets[0]);
    let lastTweetId = firstResult.data.id;

    for (let i = 1; i < tweets.length; i++) {
      const reply = await client.v2.reply(tweets[i], lastTweetId);
      lastTweetId = reply.data.id;
    }

    const me = await client.v2.me();
    const tweetUrl = `https://x.com/${me.data.username}/status/${firstResult.data.id}`;

    console.log(`[Twitter] Posted thread of ${tweets.length} tweets starting at ${firstResult.data.id}`);
    return { success: true, tweetId: firstResult.data.id, tweetUrl };
  } catch (err: any) {
    const errorMsg = formatTwitterError(err);
    console.error(`[Twitter] Failed to post thread:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/** Post a tweet with media (image URL) */
export async function postTweetWithMedia(text: string, mediaUrls: string[]): Promise<TweetResult> {
  const client = getUserClient();
  if (!client) {
    return { success: false, error: "Twitter credentials not configured" };
  }

  try {
    // Download and upload each media file
    const mediaIds: string[] = [];
    for (const url of mediaUrls.slice(0, 4)) { // Twitter allows max 4 images
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const mediaId = await client.v1.uploadMedia(buffer, { mimeType: "image/jpeg" });
      mediaIds.push(mediaId);
    }

    const result = await client.v2.tweet({
      text,
      media: mediaIds.length > 0 ? { media_ids: mediaIds as any } : undefined,
    });

    const tweetId = result.data.id;
    const me = await client.v2.me();
    const tweetUrl = `https://x.com/${me.data.username}/status/${tweetId}`;

    console.log(`[Twitter] Posted tweet with ${mediaIds.length} media: ${tweetId}`);
    return { success: true, tweetId, tweetUrl };
  } catch (err: any) {
    const errorMsg = formatTwitterError(err);
    console.error(`[Twitter] Failed to post tweet with media:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/** Get tweet engagement metrics */
export async function getTweetMetrics(tweetId: string) {
  const client = getUserClient();
  if (!client) return null;

  try {
    const tweet = await client.v2.singleTweet(tweetId, {
      "tweet.fields": ["public_metrics"],
    });

    return tweet.data.public_metrics || null;
  } catch (err: any) {
    console.error(`[Twitter] Failed to get metrics for ${tweetId}:`, err.message);
    return null;
  }
}

/** Check if Twitter is configured */
export function isTwitterConfigured(): boolean {
  return getCredentials() !== null;
}

/** Verify credentials work */
export async function verifyTwitterCredentials(): Promise<{ success: boolean; username?: string; error?: string }> {
  const client = getUserClient();
  if (!client) {
    return { success: false, error: "Twitter credentials not configured" };
  }

  try {
    const me = await client.v2.me();
    return { success: true, username: me.data.username };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/** Full diagnostic check for Twitter/X integration */
export async function diagnoseTwitter(): Promise<{
  configured: boolean;
  credentials: Record<string, boolean>;
  authTest?: { success: boolean; username?: string; error?: string };
  postTest?: { success: boolean; error?: string };
  diagnosis: string;
}> {
  const creds = getCredentials();
  const credentials = {
    TWITTER_CONSUMER_KEY: !!process.env.TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET: !!process.env.TWITTER_CONSUMER_SECRET,
    TWITTER_ACCESS_TOKEN: !!process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET: !!process.env.TWITTER_ACCESS_TOKEN_SECRET,
    TWITTER_BEARER_TOKEN: !!process.env.TWITTER_BEARER_TOKEN,
  };

  if (!creds) {
    const missing = Object.entries(credentials).filter(([, v]) => !v).map(([k]) => k);
    return {
      configured: false,
      credentials,
      diagnosis: `Missing credentials: ${missing.join(", ")}. Add these as env vars in Railway.`,
    };
  }

  // Test authentication (read — works on all tiers)
  const client = getUserClient()!;
  let authTest: { success: boolean; username?: string; error?: string };
  try {
    const me = await client.v2.me();
    authTest = { success: true, username: me.data.username };
  } catch (err: any) {
    const errData = err?.data || {};
    const errorDetail = err?.data?.detail || err?.data?.title || err?.message || String(err);
    const statusCode = err?.code || err?.statusCode || errData?.status;

    let diagnosis = `Auth failed: ${errorDetail}`;
    if (statusCode === 401) {
      diagnosis = "401 Unauthorized — API keys are invalid or expired. Regenerate them at developer.x.com → Dashboard → Keys & Tokens.";
    } else if (statusCode === 403) {
      diagnosis = "403 Forbidden — Your X API tier likely does not support this operation. The Free tier ($0) is READ-ONLY. You need the Basic tier ($200/mo) to post tweets. Upgrade at developer.x.com/en/portal/products.";
    } else if (statusCode === 429) {
      diagnosis = "429 Rate Limited — Too many requests. Wait 15 minutes and retry.";
    } else if (errorDetail.includes("client-not-enrolled")) {
      diagnosis = "Your app is not enrolled in any API tier. Go to developer.x.com/en/portal/products → Subscribe to Basic ($200/mo) for tweet posting.";
    }

    return {
      configured: true,
      credentials,
      authTest: { success: false, error: errorDetail },
      diagnosis,
    };
  }

  // Test write capability by checking usage limits (doesn't actually post)
  let postTest: { success: boolean; error?: string } = { success: false, error: "Not tested" };
  try {
    // Try to access the tweet creation endpoint with a dry-run-like approach:
    // We'll attempt to post and catch any tier/permission errors.
    // NOTE: There's no true dry-run for X API, so we check via the usage endpoint.
    const usageResponse = await fetch("https://api.twitter.com/2/usage/tweets", {
      headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
    });
    if (usageResponse.ok) {
      const usage = await usageResponse.json();
      const cap = usage?.data?.cap_reset_day || "unknown";
      postTest = { success: true, error: `Usage endpoint accessible. Cap resets: ${cap}` };
    } else if (usageResponse.status === 403) {
      postTest = { success: false, error: "403 on usage endpoint — Free tier is READ-ONLY. No tweet posting. Upgrade to Basic ($200/mo)." };
    } else {
      postTest = { success: false, error: `Usage check returned ${usageResponse.status}` };
    }
  } catch (err: any) {
    postTest = { success: false, error: `Usage check failed: ${err.message}` };
  }

  const writeCapable = postTest.success;
  const tierInfo = writeCapable
    ? "Basic or Pro tier detected — tweet posting should work."
    : "WARNING: Your X API tier appears to be Free (read-only). Tweet posting will NOT work. Upgrade to Basic ($200/mo) at developer.x.com/en/portal/products.";

  return {
    configured: true,
    credentials,
    authTest,
    postTest,
    diagnosis: `Authenticated as @${authTest.username}. ${tierInfo} If posting fails: (1) Ensure Basic tier or higher at developer.x.com, (2) App permissions = Read+Write, (3) Monthly tweet limit not exceeded.`,
  };
}
