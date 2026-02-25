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
    const errorMsg = err?.data?.detail || err?.message || String(err);
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
    const errorMsg = err?.data?.detail || err?.message || String(err);
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
    const errorMsg = err?.data?.detail || err?.message || String(err);
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

  // Test authentication
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
      diagnosis = "401 Unauthorized — API keys are invalid or expired. Regenerate them in the Twitter Developer Portal.";
    } else if (statusCode === 403) {
      diagnosis = "403 Forbidden — App doesn't have the right permissions. Check: Developer Portal → App → User authentication settings → App permissions must be 'Read and write'. Also ensure you have at least Free tier access (not just Essential).";
    } else if (statusCode === 429) {
      diagnosis = "429 Rate Limited — Too many requests. Free tier: 500 tweets/month, 17/day.";
    } else if (errorDetail.includes("client-not-enrolled")) {
      diagnosis = "Your app is not enrolled in the Free tier. Go to developer.x.com → Projects & Apps → Subscribe to Free access.";
    }

    return {
      configured: true,
      credentials,
      authTest: { success: false, error: errorDetail },
      diagnosis,
    };
  }

  return {
    configured: true,
    credentials,
    authTest,
    diagnosis: `Authenticated as @${authTest.username}. Credentials OK. If posting fails, check: (1) App permissions = Read+Write in Developer Portal, (2) Free tier active, (3) Monthly tweet limit not exceeded (500/mo).`,
  };
}
