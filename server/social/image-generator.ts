/**
 * Image Generation for Social Media Posts
 *
 * Primary: Flux 1.1 Pro via Replicate (~$0.04/image, photorealistic)
 * Fallback: DALL-E 3 via OpenAI (~$0.04/image)
 *
 * Rotates through visual styles for feed diversity.
 */

import Replicate from "replicate";

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:2";

const PLATFORM_ASPECT_RATIOS: Record<string, AspectRatio> = {
  instagram: "1:1",      // Square for feed posts
  facebook: "16:9",      // Landscape for FB feed
  x: "16:9",             // Landscape for tweet cards
  linkedin: "16:9",      // Landscape for LinkedIn
  youtube: "16:9",       // Landscape thumbnail
  tiktok: "9:16",        // Portrait for TikTok
  blog: "16:9",          // Landscape for blog headers
};

// Legacy DALL-E sizes for fallback
type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";
const PLATFORM_IMAGE_SIZES: Record<string, ImageSize> = {
  instagram: "1024x1024",
  facebook: "1792x1024",
  x: "1792x1024",
  linkedin: "1792x1024",
  youtube: "1792x1024",
  tiktok: "1024x1792",
  blog: "1792x1024",
};

/** Visual style variations for feed diversity */
const IMAGE_STYLES: { name: string; prompt: string }[] = [
  {
    name: "editorial-photo",
    prompt: "Style: photorealistic editorial photography. Natural lighting, shallow depth of field. Color palette: warm earth tones, deep teal accents, golden hour warmth. Mood: authentic, hopeful, intimate. High-end magazine quality.",
  },
  {
    name: "watercolor",
    prompt: "Style: expressive watercolor painting. Soft, flowing brushstrokes with intentional white space. Color palette: deep teal washes, warm amber/gold accents, soft lavender. Mood: emotional, contemplative, artistic. Fine art gallery quality.",
  },
  {
    name: "cinematic",
    prompt: "Style: cinematic widescreen composition. Dramatic natural lighting with lens flare. Color palette: rich contrast, deep shadows with warm highlights, teal and amber color grading. Mood: epic, transformational, powerful. Movie poster quality.",
  },
  {
    name: "minimalist",
    prompt: "Style: clean minimalist design. Simple geometric shapes, bold negative space, strong focal point. Color palette: muted earth tones with one vibrant accent color (teal or amber). Mood: calm, focused, modern. Scandinavian design quality.",
  },
  {
    name: "documentary",
    prompt: "Style: raw documentary photography. Candid, unposed feeling. Natural imperfections. Color palette: desaturated with warm undertones, vintage film grain. Mood: real, gritty, vulnerable, human. Photojournalism quality.",
  },
];

function getRandomStyle(): { name: string; prompt: string } {
  const index = Math.floor(Math.random() * IMAGE_STYLES.length);
  return IMAGE_STYLES[index];
}

// ─── Flux via Replicate (Primary) ────────────────────────────────────────────

async function generateWithFlux(opts: {
  prompt: string;
  platform: string;
  style?: string;
}): Promise<{ success: boolean; imageUrl?: string; styleName?: string; error?: string }> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return { success: false, error: "REPLICATE_API_TOKEN not configured" };
  }

  const aspectRatio = PLATFORM_ASPECT_RATIOS[opts.platform] || "1:1";
  const selectedStyle = opts.style ? { name: "custom", prompt: opts.style } : getRandomStyle();

  const enhancedPrompt = `${opts.prompt}. ${selectedStyle.prompt} Avoid: clinical/medical imagery, dark/depressing tones, religious symbols. No text or words in the image.`;

  try {
    const replicate = new Replicate({ auth: apiToken });

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input: {
        prompt: enhancedPrompt,
        aspect_ratio: aspectRatio,
        output_format: "webp",
        output_quality: 85,
        prompt_upsampling: true,
        safety_tolerance: 2,
      },
    });

    // output is a FileOutput object with a url() method, or a string URL
    const imageUrl = typeof output === "string"
      ? output
      : (output as any)?.url?.() || (output as any)?.toString() || String(output);

    if (!imageUrl || imageUrl === "undefined") {
      return { success: false, error: "No image URL returned from Flux" };
    }

    console.log(`[ImageGen] Flux ${selectedStyle.name} image for ${opts.platform}`);
    return { success: true, imageUrl, styleName: selectedStyle.name };
  } catch (err: any) {
    return { success: false, error: `Flux generation failed: ${err.message}` };
  }
}

// ─── DALL-E 3 via OpenAI (Fallback) ──────────────────────────────────────────

async function generateWithDallE(opts: {
  prompt: string;
  platform: string;
  style?: string;
}): Promise<{ success: boolean; imageUrl?: string; styleName?: string; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OPENAI_API_KEY not configured" };
  }

  const size = PLATFORM_IMAGE_SIZES[opts.platform] || "1024x1024";
  const selectedStyle = opts.style ? { name: "custom", prompt: opts.style } : getRandomStyle();

  const enhancedPrompt = `${opts.prompt}. ${selectedStyle.prompt} Avoid: clinical/medical imagery, dark/depressing tones, religious symbols. No text or words in the image.`;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality: "hd",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `DALL-E error: ${data.error?.message || JSON.stringify(data)}`,
      };
    }

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) {
      return { success: false, error: "No image URL returned from DALL-E" };
    }

    console.log(`[ImageGen] DALL-E fallback ${selectedStyle.name} for ${opts.platform}`);
    return { success: true, imageUrl, styleName: selectedStyle.name };
  } catch (err: any) {
    return { success: false, error: `DALL-E generation failed: ${err.message}` };
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Generate an image — tries Flux first, falls back to DALL-E */
export async function generateImage(opts: {
  prompt: string;
  platform: string;
  style?: string;
}): Promise<{ success: boolean; imageUrl?: string; styleName?: string; error?: string }> {
  // Try Flux first (Replicate)
  const fluxResult = await generateWithFlux(opts);
  if (fluxResult.success) return fluxResult;

  // Fall back to DALL-E
  console.warn(`[ImageGen] Flux failed (${fluxResult.error}), trying DALL-E fallback`);
  return generateWithDallE(opts);
}

/** Generate an image for a social media post based on content and platform */
export async function generatePostImage(opts: {
  content: string;
  platform: string;
  suggestedMediaPrompt?: string;
}): Promise<{ success: boolean; imageUrl?: string; styleName?: string; error?: string }> {
  const prompt = opts.suggestedMediaPrompt
    || `Create a visually compelling image for a social media post about recovery and personal transformation. The post discusses: ${opts.content.substring(0, 200)}`;

  return generateImage({
    prompt,
    platform: opts.platform,
  });
}

export function isImageGenerationConfigured(): boolean {
  return !!(process.env.REPLICATE_API_TOKEN || process.env.OPENAI_API_KEY);
}
