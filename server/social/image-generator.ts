/**
 * DALL-E 3 Image Generation for Social Media Posts
 * Uses OpenAI's Images API to generate platform-appropriate visuals.
 * Rotates through multiple visual styles for feed diversity.
 */

const OPENAI_IMAGES_API = "https://api.openai.com/v1/images/generations";

type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";

const PLATFORM_IMAGE_SIZES: Record<string, ImageSize> = {
  instagram: "1024x1024",    // Square for feed posts
  facebook: "1792x1024",     // Landscape for FB feed
  x: "1792x1024",            // Landscape for tweet cards
  linkedin: "1792x1024",     // Landscape for LinkedIn
  youtube: "1792x1024",      // Landscape thumbnail
  tiktok: "1024x1792",       // Portrait for TikTok
  blog: "1792x1024",         // Landscape for blog headers
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

/** Pick a random style, ensuring variety */
function getRandomStyle(): { name: string; prompt: string } {
  const index = Math.floor(Math.random() * IMAGE_STYLES.length);
  return IMAGE_STYLES[index];
}

export async function generateImage(opts: {
  prompt: string;
  platform: string;
  style?: string;
}): Promise<{ success: boolean; imageUrl?: string; styleName?: string; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OPENAI_API_KEY not configured" };
  }

  const size = PLATFORM_IMAGE_SIZES[opts.platform] || "1024x1024";

  // Use provided style, or pick a random one for variety
  const selectedStyle = opts.style ? { name: "custom", prompt: opts.style } : getRandomStyle();

  // Enhance the prompt with selected style
  const enhancedPrompt = `${opts.prompt}. ${selectedStyle.prompt} Avoid: clinical/medical imagery, dark/depressing tones, religious symbols. No text or words in the image.`;

  try {
    const response = await fetch(OPENAI_IMAGES_API, {
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

    console.log(`[ImageGen] Generated ${selectedStyle.name} style image for ${opts.platform}`);
    return { success: true, imageUrl, styleName: selectedStyle.name };
  } catch (err: any) {
    return { success: false, error: `Image generation failed: ${err.message}` };
  }
}

/** Generate an image for a social media post based on content and platform */
export async function generatePostImage(opts: {
  content: string;
  platform: string;
  suggestedMediaPrompt?: string;
}): Promise<{ success: boolean; imageUrl?: string; styleName?: string; error?: string }> {
  // Use the suggested media prompt from content generation if available
  const prompt = opts.suggestedMediaPrompt
    || `Create a visually compelling image for a social media post about recovery and personal transformation. The post discusses: ${opts.content.substring(0, 200)}`;

  return generateImage({
    prompt,
    platform: opts.platform,
  });
}

export function isImageGenerationConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
