/**
 * YouTube API Connector
 * Supports uploading videos, posting Shorts, and fetching analytics
 *
 * Required env vars:
 *   YOUTUBE_CLIENT_ID     - Google OAuth 2.0 client ID
 *   YOUTUBE_CLIENT_SECRET - Google OAuth 2.0 client secret
 *   YOUTUBE_REDIRECT_URI  - OAuth callback URL (https://shauncritzer.com/api/youtube/callback)
 *   YOUTUBE_REFRESH_TOKEN - Long-lived refresh token (obtained via OAuth flow)
 *
 * YouTube Data API v3 quota: 10,000 units/day
 *   - Video upload: 1,600 units
 *   - Video update: 50 units
 *   - Search: 100 units
 *   - List (videos, channels): 1 unit
 */

// ─── Credentials ───────────────────────────────────────────────────────────

function getYouTubeCredentials() {
  return {
    clientId: process.env.YOUTUBE_CLIENT_ID || "",
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || "",
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || "",
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || "",
  };
}

export function isYouTubeConfigured(): boolean {
  const { clientId, clientSecret, refreshToken } = getYouTubeCredentials();
  return !!(clientId && clientSecret && refreshToken);
}

// ─── Token Management ─────────────────────────────────────────────────────

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const { clientId, clientSecret, refreshToken } = getYouTubeCredentials();
  if (!refreshToken) throw new Error("YouTube refresh token not configured. Visit /api/youtube/connect to authorize.");
  if (!clientId || !clientSecret) throw new Error("YouTube OAuth credentials missing (YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET).");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsed: any = {};
    try { parsed = JSON.parse(errText); } catch {}

    // Clear cached token on any refresh failure
    cachedAccessToken = null;
    tokenExpiresAt = 0;

    if (parsed.error === "invalid_grant") {
      throw new Error(
        `YouTube token expired (invalid_grant). ` +
        `COMMON CAUSES: (1) Google Cloud project is in "Testing" mode — tokens expire after 7 days. ` +
        `Fix: Go to Google Cloud Console → APIs & Services → OAuth consent screen → click "Publish App" to move to Production. ` +
        `(2) User revoked access. (3) Token was regenerated elsewhere. ` +
        `FIX: Visit /api/youtube/connect to re-authorize and get a new YOUTUBE_REFRESH_TOKEN, ` +
        `then update it in Railway env vars and redeploy.`
      );
    }

    if (parsed.error === "invalid_client") {
      throw new Error(
        `YouTube OAuth error: invalid_client. Your YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET is wrong. ` +
        `Check Google Cloud Console → APIs & Services → Credentials.`
      );
    }

    throw new Error(`YouTube token refresh failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  return cachedAccessToken!;
}

// ─── OAuth Flow ───────────────────────────────────────────────────────────

/** Generate the OAuth URL to redirect the user to for authorization */
export function getYouTubeAuthUrl(): string {
  const { clientId, redirectUri } = getYouTubeCredentials();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent", // Forces refresh token generation
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Exchange authorization code for tokens */
export async function exchangeYouTubeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret, redirectUri } = getYouTubeCredentials();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`YouTube token exchange failed: ${err}`);
  }

  const data = await response.json();

  // Cache the access token
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type YouTubeUploadResult = {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
};

export type YouTubeVideoMetrics = {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  favorites: number;
} | null;

// ─── Video Upload ─────────────────────────────────────────────────────────

/**
 * Upload a video to YouTube via resumable upload
 * For Shorts: set isShort=true and video should be vertical (9:16) and < 60s
 */
export async function uploadVideo(opts: {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string; // 22 = People & Blogs, 27 = Education
  isShort?: boolean;
  privacyStatus?: "public" | "unlisted" | "private";
  scheduledPublishAt?: string; // ISO 8601 date for scheduled publish
  videoBuffer: Buffer;
  mimeType?: string;
}): Promise<YouTubeUploadResult> {
  try {
    const accessToken = await getAccessToken();

    const {
      title,
      description,
      tags = [],
      categoryId = "22",
      isShort = false,
      privacyStatus = "public",
      scheduledPublishAt,
      videoBuffer,
      mimeType = "video/mp4",
    } = opts;

    // For Shorts, add #Shorts to title if not already there
    const finalTitle = isShort && !title.includes("#Shorts")
      ? `${title} #Shorts`
      : title;

    // Build the video metadata
    const metadata: any = {
      snippet: {
        title: finalTitle,
        description,
        tags,
        categoryId,
      },
      status: {
        privacyStatus: scheduledPublishAt ? "private" : privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    };

    // If scheduled, set publish time
    if (scheduledPublishAt) {
      metadata.status.privacyStatus = "private";
      metadata.status.publishAt = scheduledPublishAt;
    }

    // Step 1: Initiate resumable upload
    const initResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(videoBuffer.length),
          "X-Upload-Content-Type": mimeType,
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      const err = await initResponse.text();
      return { success: false, error: `Upload init failed: ${err}` };
    }

    const uploadUrl = initResponse.headers.get("location");
    if (!uploadUrl) {
      return { success: false, error: "No upload URL returned" };
    }

    // Step 2: Upload the video binary
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(videoBuffer.length),
      },
      body: new Uint8Array(videoBuffer),
    });

    if (!uploadResponse.ok) {
      const err = await uploadResponse.text();
      return { success: false, error: `Video upload failed: ${err}` };
    }

    const result = await uploadResponse.json();
    const videoId = result.id;

    return {
      success: true,
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Video Metadata Update ────────────────────────────────────────────────

/** Update video title, description, tags after upload */
export async function updateVideoMetadata(opts: {
  videoId: string;
  title?: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();

    // First fetch current snippet to preserve fields we're not updating
    const getResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${opts.videoId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!getResponse.ok) {
      return { success: false, error: "Failed to fetch video" };
    }

    const current = await getResponse.json();
    if (!current.items?.length) {
      return { success: false, error: "Video not found" };
    }

    const snippet = current.items[0].snippet;

    const updateResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/videos?part=snippet",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: opts.videoId,
          snippet: {
            title: opts.title ?? snippet.title,
            description: opts.description ?? snippet.description,
            tags: opts.tags ?? snippet.tags,
            categoryId: opts.categoryId ?? snippet.categoryId,
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const err = await updateResponse.text();
      return { success: false, error: `Update failed: ${err}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Metrics ──────────────────────────────────────────────────────────────

/** Get video statistics (views, likes, comments) */
export async function getVideoMetrics(videoId: string): Promise<YouTubeVideoMetrics> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.items?.length) return null;

    const stats = data.items[0].statistics;
    return {
      views: parseInt(stats.viewCount || "0"),
      likes: parseInt(stats.likeCount || "0"),
      dislikes: parseInt(stats.dislikeCount || "0"),
      comments: parseInt(stats.commentCount || "0"),
      favorites: parseInt(stats.favoriteCount || "0"),
    };
  } catch {
    return null;
  }
}

// ─── Channel Info ─────────────────────────────────────────────────────────

/** Get authenticated channel info (for verifying connection) */
export async function getChannelInfo(): Promise<{
  id: string;
  title: string;
  subscriberCount: number;
  videoCount: number;
} | null> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.items?.length) return null;

    const channel = data.items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
      videoCount: parseInt(channel.statistics.videoCount || "0"),
    };
  } catch {
    return null;
  }
}

/** Full diagnostic check for YouTube integration */
export async function diagnoseYouTube(): Promise<{
  configured: boolean;
  credentials: Record<string, boolean>;
  tokenTest?: { success: boolean; error?: string };
  channelTest?: { success: boolean; channelTitle?: string; error?: string };
  quotaEstimate?: string;
  diagnosis: string;
}> {
  const creds = getYouTubeCredentials();
  const credentials = {
    YOUTUBE_CLIENT_ID: !!creds.clientId,
    YOUTUBE_CLIENT_SECRET: !!creds.clientSecret,
    YOUTUBE_REDIRECT_URI: !!creds.redirectUri,
    YOUTUBE_REFRESH_TOKEN: !!creds.refreshToken,
  };

  if (!creds.clientId || !creds.clientSecret) {
    return {
      configured: false,
      credentials,
      diagnosis: "Missing OAuth credentials. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET from Google Cloud Console → APIs & Services → Credentials.",
    };
  }

  if (!creds.refreshToken) {
    return {
      configured: false,
      credentials,
      diagnosis: "No refresh token. Visit /api/youtube/connect to authorize your YouTube channel, then save the YOUTUBE_REFRESH_TOKEN to Railway env vars.",
    };
  }

  // Test token refresh
  let tokenTest: { success: boolean; error?: string };
  try {
    await getAccessToken();
    tokenTest = { success: true };
  } catch (err: any) {
    return {
      configured: true,
      credentials,
      tokenTest: { success: false, error: err.message },
      diagnosis: err.message,
    };
  }

  // Test channel access
  let channelTest: { success: boolean; channelTitle?: string; error?: string };
  try {
    const channel = await getChannelInfo();
    if (channel) {
      channelTest = { success: true, channelTitle: channel.title };
    } else {
      channelTest = { success: false, error: "No channel found for this account" };
    }
  } catch (err: any) {
    channelTest = { success: false, error: err.message };
  }

  const diagnosis = channelTest.success
    ? `YouTube connected to "${channelTest.channelTitle}". Token refresh working. Ready to upload videos. Quota: 10,000 units/day (6 video uploads/day max).`
    : `Token works but channel access failed: ${channelTest.error}. Ensure the authorized Google account has a YouTube channel.`;

  return {
    configured: true,
    credentials,
    tokenTest,
    channelTest,
    quotaEstimate: "10,000 units/day (1,600 per upload = ~6 uploads/day)",
    diagnosis,
  };
}

/** List recent uploads from the channel */
export async function getRecentUploads(maxResults = 10): Promise<{
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
}[]> {
  try {
    const accessToken = await getAccessToken();

    // Get the uploads playlist ID
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!channelResponse.ok) return [];

    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    // Get recent videos from uploads playlist
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!playlistResponse.ok) return [];

    const playlistData = await playlistResponse.json();
    return (playlistData.items || []).map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
    }));
  } catch {
    return [];
  }
}
