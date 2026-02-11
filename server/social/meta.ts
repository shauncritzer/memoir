/**
 * Meta Graph API connector for Facebook and Instagram
 *
 * Setup required:
 * 1. Go to https://developers.facebook.com and create an app (Business type)
 * 2. Add Facebook Login, Instagram Graph API products
 * 3. Get a Page Access Token (long-lived) for your Facebook Page
 * 4. Connect your Instagram Business/Creator account to the Facebook Page
 * 5. Set env vars: META_PAGE_ACCESS_TOKEN, META_PAGE_ID, META_INSTAGRAM_ACCOUNT_ID
 *
 * Token flow:
 * - Short-lived user token → Long-lived user token → Page Access Token
 * - Page tokens from long-lived user tokens don't expire
 */

const META_GRAPH_API = "https://graph.facebook.com/v21.0";

/** Environment-based Meta credentials */
function getMetaCredentials() {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const igAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  return { pageAccessToken, pageId, igAccountId, appId, appSecret };
}

export function isFacebookConfigured(): boolean {
  const { pageAccessToken, pageId } = getMetaCredentials();
  return !!(pageAccessToken && pageId);
}

export function isInstagramConfigured(): boolean {
  const { pageAccessToken, igAccountId } = getMetaCredentials();
  return !!(pageAccessToken && igAccountId);
}

export type MetaPostResult = {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
};

// ============================================================
// FACEBOOK
// ============================================================

/** Post text to a Facebook Page */
export async function postToFacebook(text: string): Promise<MetaPostResult> {
  const { pageAccessToken, pageId } = getMetaCredentials();
  if (!pageAccessToken || !pageId) {
    return { success: false, error: "Facebook credentials not configured" };
  }

  try {
    const response = await fetch(`${META_GRAPH_API}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        access_token: pageAccessToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("[Facebook] API error:", data.error.message);
      return { success: false, error: data.error.message };
    }

    const postId = data.id;
    const postUrl = `https://facebook.com/${postId}`;
    console.log(`[Facebook] Posted: ${postId}`);
    return { success: true, postId, postUrl };
  } catch (err: any) {
    console.error("[Facebook] Failed to post:", err.message);
    return { success: false, error: err.message || String(err) };
  }
}

/** Post with an image to Facebook Page */
export async function postToFacebookWithImage(text: string, imageUrl: string): Promise<MetaPostResult> {
  const { pageAccessToken, pageId } = getMetaCredentials();
  if (!pageAccessToken || !pageId) {
    return { success: false, error: "Facebook credentials not configured" };
  }

  try {
    const response = await fetch(`${META_GRAPH_API}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        url: imageUrl,
        access_token: pageAccessToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("[Facebook] Photo API error:", data.error.message);
      return { success: false, error: data.error.message };
    }

    const postId = data.post_id || data.id;
    const postUrl = `https://facebook.com/${postId}`;
    console.log(`[Facebook] Posted photo: ${postId}`);
    return { success: true, postId, postUrl };
  } catch (err: any) {
    console.error("[Facebook] Failed to post photo:", err.message);
    return { success: false, error: err.message || String(err) };
  }
}

/** Post a link to Facebook Page */
export async function postLinkToFacebook(text: string, link: string): Promise<MetaPostResult> {
  const { pageAccessToken, pageId } = getMetaCredentials();
  if (!pageAccessToken || !pageId) {
    return { success: false, error: "Facebook credentials not configured" };
  }

  try {
    const response = await fetch(`${META_GRAPH_API}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        link: link,
        access_token: pageAccessToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    const postId = data.id;
    const postUrl = `https://facebook.com/${postId}`;
    console.log(`[Facebook] Posted link: ${postId}`);
    return { success: true, postId, postUrl };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

// ============================================================
// INSTAGRAM
// ============================================================

/**
 * Post an image to Instagram (requires image URL accessible by Meta servers)
 * Instagram Content Publishing API requires a 2-step process:
 * 1. Create a media container
 * 2. Publish the container
 */
export async function postToInstagram(caption: string, imageUrl: string): Promise<MetaPostResult> {
  const { pageAccessToken, igAccountId } = getMetaCredentials();
  if (!pageAccessToken || !igAccountId) {
    return { success: false, error: "Instagram credentials not configured" };
  }

  try {
    // Step 1: Create media container
    const containerResponse = await fetch(`${META_GRAPH_API}/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: pageAccessToken,
      }),
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      console.error("[Instagram] Container creation error:", containerData.error.message);
      return { success: false, error: containerData.error.message };
    }

    const containerId = containerData.id;

    // Step 2: Wait for container to be ready (Instagram processes media async)
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await fetch(
        `${META_GRAPH_API}/${containerId}?fields=status_code&access_token=${pageAccessToken}`
      );
      const statusData = await statusResponse.json();

      if (statusData.status_code === "FINISHED") {
        ready = true;
      } else if (statusData.status_code === "ERROR") {
        return { success: false, error: "Instagram media processing failed" };
      }
      attempts++;
    }

    if (!ready) {
      return { success: false, error: "Instagram media processing timed out" };
    }

    // Step 3: Publish the container
    const publishResponse = await fetch(`${META_GRAPH_API}/${igAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: pageAccessToken,
      }),
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      console.error("[Instagram] Publish error:", publishData.error.message);
      return { success: false, error: publishData.error.message };
    }

    const postId = publishData.id;
    const postUrl = `https://instagram.com/p/${postId}`;
    console.log(`[Instagram] Published: ${postId}`);
    return { success: true, postId, postUrl };
  } catch (err: any) {
    console.error("[Instagram] Failed to post:", err.message);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Post a carousel (multiple images) to Instagram
 */
export async function postCarouselToInstagram(caption: string, imageUrls: string[]): Promise<MetaPostResult> {
  const { pageAccessToken, igAccountId } = getMetaCredentials();
  if (!pageAccessToken || !igAccountId) {
    return { success: false, error: "Instagram credentials not configured" };
  }

  if (imageUrls.length < 2 || imageUrls.length > 10) {
    return { success: false, error: "Carousel requires 2-10 images" };
  }

  try {
    // Step 1: Create individual media containers for each image
    const containerIds: string[] = [];
    for (const imageUrl of imageUrls) {
      const response = await fetch(`${META_GRAPH_API}/${igAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          is_carousel_item: true,
          access_token: pageAccessToken,
        }),
      });

      const data = await response.json();
      if (data.error) {
        return { success: false, error: `Carousel item failed: ${data.error.message}` };
      }
      containerIds.push(data.id);
    }

    // Step 2: Create the carousel container
    const carouselResponse = await fetch(`${META_GRAPH_API}/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        caption: caption,
        children: containerIds,
        access_token: pageAccessToken,
      }),
    });

    const carouselData = await carouselResponse.json();
    if (carouselData.error) {
      return { success: false, error: carouselData.error.message };
    }

    // Step 3: Wait for processing
    const carouselId = carouselData.id;
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await fetch(
        `${META_GRAPH_API}/${carouselId}?fields=status_code&access_token=${pageAccessToken}`
      );
      const statusData = await statusResponse.json();
      if (statusData.status_code === "FINISHED") ready = true;
      else if (statusData.status_code === "ERROR") {
        return { success: false, error: "Carousel processing failed" };
      }
      attempts++;
    }

    if (!ready) {
      return { success: false, error: "Carousel processing timed out" };
    }

    // Step 4: Publish
    const publishResponse = await fetch(`${META_GRAPH_API}/${igAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carouselId,
        access_token: pageAccessToken,
      }),
    });

    const publishData = await publishResponse.json();
    if (publishData.error) {
      return { success: false, error: publishData.error.message };
    }

    const postId = publishData.id;
    console.log(`[Instagram] Published carousel: ${postId}`);
    return { success: true, postId, postUrl: `https://instagram.com/p/${postId}` };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Post a Reel (video) to Instagram
 */
export async function postReelToInstagram(caption: string, videoUrl: string): Promise<MetaPostResult> {
  const { pageAccessToken, igAccountId } = getMetaCredentials();
  if (!pageAccessToken || !igAccountId) {
    return { success: false, error: "Instagram credentials not configured" };
  }

  try {
    // Step 1: Create video container
    const containerResponse = await fetch(`${META_GRAPH_API}/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: videoUrl,
        caption: caption,
        access_token: pageAccessToken,
      }),
    });

    const containerData = await containerResponse.json();
    if (containerData.error) {
      return { success: false, error: containerData.error.message };
    }

    // Step 2: Wait for processing (videos take longer)
    const containerId = containerData.id;
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const statusResponse = await fetch(
        `${META_GRAPH_API}/${containerId}?fields=status_code&access_token=${pageAccessToken}`
      );
      const statusData = await statusResponse.json();
      if (statusData.status_code === "FINISHED") ready = true;
      else if (statusData.status_code === "ERROR") {
        return { success: false, error: "Reel processing failed" };
      }
      attempts++;
    }

    if (!ready) {
      return { success: false, error: "Reel processing timed out" };
    }

    // Step 3: Publish
    const publishResponse = await fetch(`${META_GRAPH_API}/${igAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: pageAccessToken,
      }),
    });

    const publishData = await publishResponse.json();
    if (publishData.error) {
      return { success: false, error: publishData.error.message };
    }

    const postId = publishData.id;
    console.log(`[Instagram] Published reel: ${postId}`);
    return { success: true, postId, postUrl: `https://instagram.com/reel/${postId}` };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

// ============================================================
// METRICS & INSIGHTS
// ============================================================

/** Get post insights for a Facebook post */
export async function getFacebookPostMetrics(postId: string) {
  const { pageAccessToken } = getMetaCredentials();
  if (!pageAccessToken) return null;

  try {
    const response = await fetch(
      `${META_GRAPH_API}/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${pageAccessToken}`
    );
    const data = await response.json();

    if (data.error) return null;

    return {
      likes: data.likes?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
    };
  } catch {
    return null;
  }
}

/** Get Instagram media insights */
export async function getInstagramMediaMetrics(mediaId: string) {
  const { pageAccessToken } = getMetaCredentials();
  if (!pageAccessToken) return null;

  try {
    const response = await fetch(
      `${META_GRAPH_API}/${mediaId}/insights?metric=impressions,reach,likes,comments,shares,saved&access_token=${pageAccessToken}`
    );
    const data = await response.json();

    if (data.error) return null;

    const metrics: Record<string, number> = {};
    for (const item of data.data || []) {
      metrics[item.name] = item.values?.[0]?.value || 0;
    }

    return {
      impressions: metrics.impressions || 0,
      reach: metrics.reach || 0,
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0,
      saved: metrics.saved || 0,
    };
  } catch {
    return null;
  }
}

// ============================================================
// VERIFICATION
// ============================================================

/** Verify Facebook Page credentials */
export async function verifyFacebookCredentials(): Promise<{ success: boolean; pageName?: string; error?: string }> {
  const { pageAccessToken, pageId } = getMetaCredentials();
  if (!pageAccessToken || !pageId) {
    return { success: false, error: "Facebook credentials not configured. Set META_PAGE_ACCESS_TOKEN and META_PAGE_ID." };
  }

  try {
    const response = await fetch(
      `${META_GRAPH_API}/${pageId}?fields=name,id&access_token=${pageAccessToken}`
    );
    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return { success: true, pageName: data.name };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/** Verify Instagram account credentials */
export async function verifyInstagramCredentials(): Promise<{ success: boolean; username?: string; error?: string }> {
  const { pageAccessToken, igAccountId } = getMetaCredentials();
  if (!pageAccessToken || !igAccountId) {
    return { success: false, error: "Instagram credentials not configured. Set META_PAGE_ACCESS_TOKEN and META_INSTAGRAM_ACCOUNT_ID." };
  }

  try {
    const response = await fetch(
      `${META_GRAPH_API}/${igAccountId}?fields=username,name,followers_count,media_count&access_token=${pageAccessToken}`
    );
    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return { success: true, username: data.username };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Exchange a short-lived token for a long-lived token
 * Run this once to get a long-lived Page Access Token
 */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{ token?: string; error?: string }> {
  const { appId, appSecret } = getMetaCredentials();
  if (!appId || !appSecret) {
    return { error: "META_APP_ID and META_APP_SECRET required for token exchange" };
  }

  try {
    // Step 1: Get long-lived user token
    const response = await fetch(
      `${META_GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    const longLivedUserToken = data.access_token;

    // Step 2: Get page token from long-lived user token
    const pagesResponse = await fetch(
      `${META_GRAPH_API}/me/accounts?access_token=${longLivedUserToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      return { error: pagesData.error.message };
    }

    // Return the first page token (user can specify page ID if multiple pages)
    const page = pagesData.data?.[0];
    if (!page) {
      return { error: "No Facebook Pages found for this account" };
    }

    console.log(`[Meta] Long-lived token obtained for page: ${page.name} (ID: ${page.id})`);
    return { token: page.access_token };
  } catch (err: any) {
    return { error: err.message || String(err) };
  }
}
