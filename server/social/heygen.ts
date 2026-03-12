/**
 * HeyGen API Connector
 * Generate AI avatar talking-head videos from scripts
 *
 * Required env vars:
 *   HEYGEN_API_KEY - API key from app.heygen.com/settings
 *
 * Flow:
 *   1. Create video from script → returns video_id
 *   2. Poll for completion (takes 1-5 minutes)
 *   3. Get video URL → download or upload to YouTube
 *
 * API: https://docs.heygen.com/reference
 */

const HEYGEN_BASE = "https://api.heygen.com";

// ─── Credentials ───────────────────────────────────────────────────────────

function getCredentials() {
  return {
    apiKey: process.env.HEYGEN_API_KEY || "",
  };
}

export function isHeyGenConfigured(): boolean {
  return !!getCredentials().apiKey;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type HeyGenVideoResult = {
  success: boolean;
  videoId?: string;
  error?: string;
};

export type HeyGenVideoStatus = {
  status: "processing" | "completed" | "failed" | "pending";
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
};

export type AvatarInfo = {
  avatar_id: string;
  avatar_name: string;
  preview_image_url: string;
  gender: string;
};

// ─── Avatars ───────────────────────────────────────────────────────────────

/** List available avatars */
export async function listAvatars(): Promise<AvatarInfo[]> {
  const { apiKey } = getCredentials();
  if (!apiKey) return [];

  try {
    const response = await fetch(`${HEYGEN_BASE}/v2/avatars`, {
      headers: {
        "X-Api-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data?.avatars || [];
  } catch {
    return [];
  }
}

// ─── Video Generation ──────────────────────────────────────────────────────

/**
 * Create a talking-head video from a script
 * Returns a video_id that can be polled for completion
 */
export async function createVideo(opts: {
  script: string;
  avatarId?: string;       // Default: first available avatar
  voiceId?: string;         // HeyGen voice ID or ElevenLabs voice ID
  title?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1"; // 9:16 for Shorts/Reels
  test?: boolean;           // True for test mode (watermarked, doesn't use credits)
}): Promise<HeyGenVideoResult> {
  const { apiKey } = getCredentials();
  if (!apiKey) return { success: false, error: "HeyGen API key not configured" };

  const {
    script,
    avatarId,
    voiceId,
    title,
    aspectRatio = "16:9",
    test = false,
  } = opts;

  try {
    // Determine dimensions from aspect ratio
    const dimensions: Record<string, { width: number; height: number }> = {
      "16:9": { width: 1920, height: 1080 },
      "9:16": { width: 1080, height: 1920 },
      "1:1": { width: 1080, height: 1080 },
    };

    const { width, height } = dimensions[aspectRatio] || dimensions["16:9"];

    // Resolve avatar ID: use provided, env var, or first available
    let resolvedAvatarId = avatarId || process.env.HEYGEN_AVATAR_ID || "";
    if (!resolvedAvatarId) {
      try {
        const avatars = await listAvatars();
        if (avatars.length > 0) {
          resolvedAvatarId = avatars[0].avatar_id;
          console.log(`[HeyGen] Using first available avatar: ${resolvedAvatarId} (${avatars[0].avatar_name})`);
        }
      } catch {}
    }
    if (!resolvedAvatarId) {
      return { success: false, error: "No HeyGen avatar available. Set HEYGEN_AVATAR_ID env var or ensure your account has avatars." };
    }

    // Resolve voice: explicit param → ElevenLabs env var → HeyGen default
    const resolvedVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || "";

    let voiceConfig: any;
    if (resolvedVoiceId) {
      // ElevenLabs voice via HeyGen's ElevenLabs integration
      voiceConfig = {
        type: "text",
        input_text: script,
        voice_id: resolvedVoiceId,
        speed: 1.0,
      };
      console.log(`[HeyGen] Using ElevenLabs voice: ${resolvedVoiceId}`);
    } else {
      voiceConfig = {
        type: "text",
        input_text: script,
        voice_id: "en-US-default",
      };
      console.log("[HeyGen] No ELEVENLABS_VOICE_ID set, using default HeyGen voice");
    }

    const payload: any = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: resolvedAvatarId,
            avatar_style: "normal",
          },
          voice: voiceConfig,
          background: {
            type: "color",
            value: "#1a1a2e",
          },
        },
      ],
      dimension: { width, height },
      test,
    };

    if (title) {
      payload.title = title;
    }

    const response = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `HeyGen video creation failed: ${err}` };
    }

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message || data.error };
    }

    return {
      success: true,
      videoId: data.data?.video_id,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Video Status ──────────────────────────────────────────────────────────

/** Check the status of a video generation job */
export async function getVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
  const { apiKey } = getCredentials();
  if (!apiKey) return { status: "failed", error: "HeyGen API key not configured" };

  try {
    const response = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        "X-Api-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const err = await response.text();
      return { status: "failed", error: `Status check failed: ${err}` };
    }

    const data = await response.json();
    const videoData = data.data;

    if (videoData.status === "completed") {
      return {
        status: "completed",
        videoUrl: videoData.video_url,
        thumbnailUrl: videoData.thumbnail_url,
        duration: videoData.duration,
      };
    }

    if (videoData.status === "failed") {
      return { status: "failed", error: videoData.error || "Video generation failed" };
    }

    return { status: videoData.status || "processing" };
  } catch (err: any) {
    return { status: "failed", error: err.message };
  }
}

/** Poll for video completion (returns when done or timeout) */
export async function waitForVideo(videoId: string, opts?: {
  maxWaitMs?: number;    // Default: 10 minutes
  pollIntervalMs?: number; // Default: 15 seconds
}): Promise<HeyGenVideoStatus> {
  const maxWait = opts?.maxWaitMs || 10 * 60 * 1000;
  const pollInterval = opts?.pollIntervalMs || 15_000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const status = await getVideoStatus(videoId);

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return { status: "failed", error: "Timeout waiting for video generation" };
}

// ─── Download Video ────────────────────────────────────────────────────────

/** Download a completed video as a Buffer */
export async function downloadVideo(videoUrl: string): Promise<{
  success: boolean;
  videoBuffer?: Buffer;
  error?: string;
}> {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      return { success: false, error: `Download failed: ${response.status}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      success: true,
      videoBuffer: Buffer.from(arrayBuffer),
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Full Pipeline: Script → Video → YouTube ──────────────────────────────

/**
 * End-to-end pipeline: generate a video from a script,
 * wait for completion, and optionally upload to YouTube
 */
export async function scriptToVideo(opts: {
  script: string;
  title: string;
  description?: string;
  avatarId?: string;
  voiceId?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  uploadToYouTube?: boolean;
  youTubeTags?: string[];
  isShort?: boolean;
}): Promise<{
  success: boolean;
  heygenVideoId?: string;
  heygenVideoUrl?: string;
  youtubeVideoId?: string;
  youtubeVideoUrl?: string;
  error?: string;
}> {
  // Step 1: Create the video
  const createResult = await createVideo({
    script: opts.script,
    avatarId: opts.avatarId,
    voiceId: opts.voiceId,
    title: opts.title,
    aspectRatio: opts.aspectRatio,
  });

  if (!createResult.success || !createResult.videoId) {
    return { success: false, error: createResult.error };
  }

  console.log(`[HeyGen] Video created: ${createResult.videoId}, waiting for completion...`);

  // Step 2: Wait for completion
  const status = await waitForVideo(createResult.videoId);

  if (status.status !== "completed" || !status.videoUrl) {
    return {
      success: false,
      heygenVideoId: createResult.videoId,
      error: status.error || "Video generation did not complete",
    };
  }

  console.log(`[HeyGen] Video completed: ${status.videoUrl}`);

  // Step 3: Optionally upload to YouTube
  if (opts.uploadToYouTube) {
    try {
      const { uploadVideo, isYouTubeConfigured } = await import("./youtube");

      if (!isYouTubeConfigured()) {
        return {
          success: true,
          heygenVideoId: createResult.videoId,
          heygenVideoUrl: status.videoUrl,
          error: "YouTube not configured — video generated but not uploaded",
        };
      }

      // Download the video
      const downloadResult = await downloadVideo(status.videoUrl);
      if (!downloadResult.success || !downloadResult.videoBuffer) {
        return {
          success: true,
          heygenVideoId: createResult.videoId,
          heygenVideoUrl: status.videoUrl,
          error: "Video generated but download failed for YouTube upload",
        };
      }

      // Upload to YouTube
      const ytResult = await uploadVideo({
        title: opts.title,
        description: opts.description || opts.script,
        tags: opts.youTubeTags,
        isShort: opts.isShort,
        videoBuffer: downloadResult.videoBuffer,
      });

      return {
        success: ytResult.success,
        heygenVideoId: createResult.videoId,
        heygenVideoUrl: status.videoUrl,
        youtubeVideoId: ytResult.videoId,
        youtubeVideoUrl: ytResult.videoUrl,
        error: ytResult.error,
      };
    } catch (err: any) {
      return {
        success: true,
        heygenVideoId: createResult.videoId,
        heygenVideoUrl: status.videoUrl,
        error: `YouTube upload failed: ${err.message}`,
      };
    }
  }

  return {
    success: true,
    heygenVideoId: createResult.videoId,
    heygenVideoUrl: status.videoUrl,
  };
}

// ─── Account Info ──────────────────────────────────────────────────────────

/** Get remaining credits */
export async function getRemainingCredits(): Promise<{
  remainingQuota: number;
  usedQuota: number;
} | null> {
  const { apiKey } = getCredentials();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${HEYGEN_BASE}/v2/user/remaining_quota`, {
      headers: {
        "X-Api-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      remainingQuota: data.data?.remaining_quota || 0,
      usedQuota: data.data?.used_quota || 0,
    };
  } catch {
    return null;
  }
}
