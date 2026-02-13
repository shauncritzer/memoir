/**
 * DALL-E 3 Image Generation for Social Media Posts
 * Uses OpenAI's Images API to generate platform-appropriate visuals.
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

/** Brand style guidelines for consistent AI image generation */
const BRAND_STYLE = `Style: warm, hopeful, authentic. Color palette: deep teal, warm amber/gold, soft earth tones.
Mood: resilience, transformation, quiet strength. Avoid: clinical/medical imagery, dark/depressing tones, religious symbols.
Aesthetic: modern, clean, editorial quality. Think: sunrise over mountains, calm waters, strong trees, open roads.`;

export async function generateImage(opts: {
  prompt: string;
  platform: string;
  style?: string;
}): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OPENAI_API_KEY not configured" };
  }

  const size = PLATFORM_IMAGE_SIZES[opts.platform] || "1024x1024";

  // Enhance the prompt with brand guidelines
  const enhancedPrompt = `${opts.prompt}. ${opts.style || BRAND_STYLE} No text or words in the image.`;

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
        quality: "standard",
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

    return { success: true, imageUrl };
  } catch (err: any) {
    return { success: false, error: `Image generation failed: ${err.message}` };
  }
}

/** Generate an image for a social media post based on content and platform */
export async function generatePostImage(opts: {
  content: string;
  platform: string;
  suggestedMediaPrompt?: string;
}): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
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
