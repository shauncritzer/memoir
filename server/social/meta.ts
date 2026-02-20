/**
 * Meta Graph API Connector
 * Supports Facebook Page posts and Instagram Content Publishing
 *
 * Required env vars:
 *   META_PAGE_ACCESS_TOKEN - Long-lived Page Access Token
 *   META_PAGE_ID - Facebook Page ID
 *   META_IG_USER_ID - Instagram Business Account ID (linked to the Page)
 */

// ─── Credentials ───────────────────────────────────────────────────────────

function getMetaCredentials() {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const igUserId = process.env.META_IG_USER_ID;

  return { pageAccessToken, pageId, igUserId };
}

export function isFacebookConfigured(): boolean {
  const { pageAccessToken, pageId } = getMetaCredentials();
  return !!(pageAccessToken && pageId);
}

export function isInstagramConfigured(): boolean {
  const { pageAccessToken, igUserId } = getMetaCredentials();
  return !!(pageAccessToken && igUserId);
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type MetaPostResult = {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
};

// ─── Facebook Page Posting ────────────────────────────────────────────────

const GRAPH_API = "https://graph.facebook.com/v21.0";

/** Post a text message to a Facebook Page */
export async function postToFacebookPage(message: string): Promise<MetaPostResult> {
  const { pageAccessToken, pageId } = getMetaCredentials();
  if (!pageAccessToken || !pageId) {
    return { success: false, error: "Facebook credentials not configured (need META_PAGE_ACCESS_TOKEN and META_PAGE_ID)" };
  }

  try {
    const response = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: pageAccessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `Facebook API error: ${data.error?.message || JSON.stringify(data)}`,
      };
    }

    return {
      success: true,
      postId: data.id,
      postUrl: `https://www.facebook.com/${data.id}`,
    };
  } catch (err: any) {
    return { success: false, error: `Facebook post failed: ${err.message}` };
  }
}

/** Post a link with message to a Facebook Page */
export async function postLinkToFacebookPage(message: string, link: string): Promise<MetaPostResult> {
  const { pageAccessToken, pageId } = getMetaCredentials();
  if (!pageAccessToken || !pageId) {
    return { success: false, error: "Facebook credentials not configured" };
  }

  try {
    const response = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        link,
        access_token: pageAccessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `Facebook API error: ${data.error?.message || JSON.stringify(data)}`,
      };
    }

    return {
      success: true,
      postId: data.id,
      postUrl: `https://www.facebook.com/${data.id}`,
    };
  } catch (err: any) {
    return { success: false, error: `Facebook link post failed: ${err.message}` };
  }
}

// ─── Instagram Content Publishing ─────────────────────────────────────────
// Instagram Publishing API requires a 2-step process:
// Step 1: Create a media container
// Step 2: Publish the container

/** Post a text-only carousel caption to Instagram (requires image_url) */
export async function postToInstagram(caption: string, imageUrl: string): Promise<MetaPostResult> {
  const { pageAccessToken, igUserId } = getMetaCredentials();
  if (!pageAccessToken || !igUserId) {
    return { success: false, error: "Instagram credentials not configured (need META_PAGE_ACCESS_TOKEN and META_IG_USER_ID)" };
  }

  if (!imageUrl) {
    return { success: false, error: "Instagram requires an image URL to post" };
  }

  // Instagram captions max 2200 chars - truncate if needed
  if (caption.length > 2200) {
    caption = caption.substring(0, 2197) + "...";
  }

  try {
    // Step 1: Create media container
    const containerResponse = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: pageAccessToken,
      }),
    });

    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      return {
        success: false,
        error: `Instagram container error: ${containerData.error?.message || JSON.stringify(containerData)}`,
      };
    }

    const containerId = containerData.id;

    // Step 2: Publish the container
    const publishResponse = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: pageAccessToken,
      }),
    });

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      return {
        success: false,
        error: `Instagram publish error: ${publishData.error?.message || JSON.stringify(publishData)}`,
      };
    }

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://www.instagram.com/p/${publishData.id}/`,
    };
  } catch (err: any) {
    return { success: false, error: `Instagram post failed: ${err.message}` };
  }
}

/** Post a text-only post to Instagram (as a text image using the feed endpoint) */
export async function postTextToInstagram(caption: string): Promise<MetaPostResult> {
  // Instagram doesn't support text-only posts via API
  // Return a helpful message instead of failing silently
  return {
    success: false,
    error: "Instagram requires an image or video URL. Text-only posts are not supported via the API. Content is saved and ready for manual posting, or add an image URL to post automatically.",
  };
}

// ─── Verification ─────────────────────────────────────────────────────────

/** Verify Meta API connection and get page/account info */
export async function verifyMetaConnection(): Promise<{
  success: boolean;
  facebook?: { pageName: string; pageId: string; followers?: number };
  instagram?: { username: string; accountId: string; followers?: number };
  error?: string;
}> {
  const { pageAccessToken, pageId, igUserId } = getMetaCredentials();

  if (!pageAccessToken) {
    return { success: false, error: "META_PAGE_ACCESS_TOKEN not configured" };
  }

  const result: {
    success: boolean;
    facebook?: { pageName: string; pageId: string; followers?: number };
    instagram?: { username: string; accountId: string; followers?: number };
    error?: string;
  } = { success: false };

  // Verify Facebook Page
  if (pageId) {
    try {
      const response = await fetch(
        `${GRAPH_API}/${pageId}?fields=name,fan_count&access_token=${pageAccessToken}`
      );
      const data = await response.json();

      if (response.ok && data.name) {
        result.facebook = {
          pageName: data.name,
          pageId: pageId,
          followers: data.fan_count,
        };
        result.success = true;
      } else {
        result.error = `Facebook: ${data.error?.message || "Could not verify page"}`;
      }
    } catch (err: any) {
      result.error = `Facebook verification failed: ${err.message}`;
    }
  }

  // Verify Instagram Account
  if (igUserId) {
    try {
      const response = await fetch(
        `${GRAPH_API}/${igUserId}?fields=username,followers_count&access_token=${pageAccessToken}`
      );
      const data = await response.json();

      if (response.ok && data.username) {
        result.instagram = {
          username: data.username,
          accountId: igUserId,
          followers: data.followers_count,
        };
        result.success = true;
      } else {
        if (!result.error) {
          result.error = `Instagram: ${data.error?.message || "Could not verify account"}`;
        }
      }
    } catch (err: any) {
      if (!result.error) {
        result.error = `Instagram verification failed: ${err.message}`;
      }
    }
  }

  if (!pageId && !igUserId) {
    result.error = "Neither META_PAGE_ID nor META_IG_USER_ID configured";
  }

  return result;
}

// ─── Token Exchange ──────────────────────────────────────────────────────

/** Exchange a short-lived token for a long-lived one (60 days) */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ success: boolean; longLivedToken?: string; expiresIn?: number; error?: string }> {
  try {
    const response = await fetch(
      `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: `Token exchange failed: ${data.error?.message || JSON.stringify(data)}`,
      };
    }

    return {
      success: true,
      longLivedToken: data.access_token,
      expiresIn: data.expires_in, // seconds (typically 5184000 = 60 days)
    };
  } catch (err: any) {
    return { success: false, error: `Token exchange error: ${err.message}` };
  }
}

/** Get a long-lived Page Access Token (never expires) from a long-lived User Token */
export async function getLongLivedPageToken(
  longLivedUserToken: string,
  pageId: string
): Promise<{ success: boolean; pageToken?: string; error?: string }> {
  try {
    const response = await fetch(
      `${GRAPH_API}/${pageId}?fields=access_token&access_token=${encodeURIComponent(longLivedUserToken)}`
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: `Page token fetch failed: ${data.error?.message || JSON.stringify(data)}`,
      };
    }

    return {
      success: true,
      pageToken: data.access_token, // This is a never-expiring Page Access Token
    };
  } catch (err: any) {
    return { success: false, error: `Page token error: ${err.message}` };
  }
}

// ─── Metrics ──────────────────────────────────────────────────────────────

/** Get engagement metrics for a Facebook post */
export async function getFacebookPostMetrics(postId: string): Promise<{
  likes: number;
  comments: number;
  shares: number;
  reach?: number;
} | null> {
  const { pageAccessToken } = getMetaCredentials();
  if (!pageAccessToken) return null;

  try {
    const response = await fetch(
      `${GRAPH_API}/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${pageAccessToken}`
    );
    const data = await response.json();

    if (!response.ok) return null;

    return {
      likes: data.likes?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
    };
  } catch {
    return null;
  }
}
