import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

/** Platform-specific content constraints and formatting rules */
const PLATFORM_RULES: Record<string, {
  maxLength: number;
  style: string;
  contentType: string;
  hashtagStrategy: string;
  ctaPlacement: string;
}> = {
  x: {
    maxLength: 280,
    style: "Punchy, direct, conversational. Use line breaks for impact. Thread format: tweet 1 grabs attention, subsequent tweets expand the idea. Each tweet must stand alone but flow as a narrative.",
    contentType: "thread",
    hashtagStrategy: "1-2 relevant hashtags max at the end of the last tweet. Never overuse hashtags on X.",
    ctaPlacement: "Last tweet of the thread, natural and non-salesy.",
  },
  instagram: {
    maxLength: 2200,
    style: "Emotional storytelling. Start with a hook line. Use short paragraphs with line breaks. Relatable and vulnerable tone. End with a question to encourage comments.",
    contentType: "post",
    hashtagStrategy: "20-30 relevant hashtags in a comment block below the caption, mixing popular and niche tags.",
    ctaPlacement: "Near the end before hashtags. 'Link in bio' format.",
  },
  linkedin: {
    maxLength: 3000,
    style: "Professional but personal. Start with a bold statement or story hook. Use short paragraphs (1-2 sentences each). Include data/insights. Thoughtful and authoritative tone.",
    contentType: "article",
    hashtagStrategy: "3-5 industry hashtags at the end.",
    ctaPlacement: "Final paragraph as a natural next step.",
  },
  facebook: {
    maxLength: 5000,
    style: "Community-focused and warm. Longer form storytelling is welcome. Conversational tone, like talking to a friend. Ask questions to drive engagement.",
    contentType: "post",
    hashtagStrategy: "2-3 hashtags max or none. Facebook deprioritizes hashtag-heavy posts.",
    ctaPlacement: "Naturally woven into the conclusion.",
  },
  youtube: {
    maxLength: 5000,
    style: "Video script format. Start with a hook (first 5 seconds are critical). Include timestamps/sections. Educational and inspirational tone. End with a clear CTA.",
    contentType: "video_script",
    hashtagStrategy: "5-10 tags in the description for discoverability.",
    ctaPlacement: "Verbal CTA at the end of the script, plus in the description.",
  },
  tiktok: {
    maxLength: 300,
    style: "Ultra-casual, trend-aware. Script format for short-form video (15-60 seconds). Start with an immediate hook. Fast-paced. Use popular audio references when possible.",
    contentType: "reel",
    hashtagStrategy: "3-5 trending + niche hashtags.",
    ctaPlacement: "On-screen text or final line of script.",
  },
  podcast: {
    maxLength: 10000,
    style: "Long-form conversational script. Outline format with talking points. Include an intro hook, 3-5 main points with stories/examples, and a closing reflection. 5-15 minute episode.",
    contentType: "audio_script",
    hashtagStrategy: "N/A for audio. Include show notes with relevant keywords.",
    ctaPlacement: "Mid-roll mention and closing CTA.",
  },
};

/** Fallback brand context for Sober Strong (used if DB not available) */
const DEFAULT_BRAND_CONTEXT = `
You are writing content for Shaun Critzer, a recovery coach, author of the memoir "Bent, Not Broken",
and founder of RewiredCourse. His brand focuses on:

- Addiction recovery and healing from trauma
- Nervous system regulation and neuroplasticity
- The message that compulsive behaviors are nervous system responses, NOT moral failures
- Personal transformation through evidence-based approaches
- His journey: from childhood trauma to Mr. Teen USA to addiction to recovery to helping others

Key themes in his work:
- "You're not broken, you're bent" - recovery is possible
- Trauma rewires the brain, but neuroplasticity means you can rewire it back
- The 5 pillars: mindfulness, movement, nutrition, connection, purpose
- Practical, science-backed approaches (not just willpower)
- Vulnerability and authenticity

Tone: Real, raw, hopeful, non-judgmental. Never preachy. He talks TO people not AT them.
He uses his own story to connect, not to seek sympathy.

IMPORTANT STYLE RULES:
- NEVER start posts with "Hey friend," "Hey there," or any letter-style greeting
- Start with a hook, question, bold statement, or story — not a greeting
- Write like a social media post or article, NOT like a personal letter or email

Products/offers he promotes:
- 7-Day REWIRED Reset ($47) - Quick-start program
- From Broken to Whole course ($97) - Deep-dive 8-module course
- Bent Not Broken Circle ($29/mo) - Monthly membership community
- Free lead magnets (PDFs, guides)
`;

/**
 * Load brand context from the businesses table.
 * Falls back to the default Sober Strong context if DB is unavailable.
 */
async function getBrandContext(businessSlug?: string): Promise<string> {
  const slug = businessSlug || "sober-strong";

  try {
    const db = await getDb();
    if (!db) return DEFAULT_BRAND_CONTEXT;

    const { sql } = await import("drizzle-orm");
    const [rows] = await db.execute(
      sql`SELECT name, brand_voice, target_audience, products FROM businesses WHERE slug = ${slug} LIMIT 1`
    ) as any;

    const biz = (rows as any[])?.[0];
    if (!biz || !biz.brand_voice) return DEFAULT_BRAND_CONTEXT;

    let products = "";
    try {
      const parsed = JSON.parse(biz.products || "[]");
      if (parsed.length > 0) {
        products = "\n\nProducts/offers to promote:\n" + parsed.map((p: any) =>
          `- ${p.name}${p.price ? ` ($${(p.price / 100).toFixed(0)})` : " (Free)"}${p.description ? ` - ${p.description}` : ""}`
        ).join("\n");
      }
    } catch {}

    return `
You are writing content for ${biz.name}.

BRAND VOICE & STYLE:
${biz.brand_voice}

TARGET AUDIENCE:
${biz.target_audience || "General audience"}
${products}

IMPORTANT STYLE RULES:
- NEVER start posts with "Hey friend," "Hey there," or any letter-style greeting
- Start with a hook, question, bold statement, or story — not a greeting
- Write like a social media post or article, NOT like a personal letter or email
`;
  } catch (err: any) {
    console.warn("[ContentGenerator] Failed to load brand context from DB:", err.message);
    return DEFAULT_BRAND_CONTEXT;
  }
}

export type GeneratedContent = {
  platform: string;
  contentType: string;
  content: string;
  hashtags?: string;
  suggestedMediaType?: "image" | "video" | "carousel" | "audio" | "none";
  suggestedMediaPrompt?: string; // For AI image generation
  suggestedTools?: string[]; // Which tools to use (Canva, HeyGen, etc.)
};

/** Generate platform-specific content from a blog post or topic */
export async function generateContentForPlatform(opts: {
  platform: string;
  sourceBlogTitle?: string;
  sourceBlogContent?: string;
  topic?: string;
  ctaText?: string;
  ctaUrl?: string;
  businessSlug?: string;
}): Promise<GeneratedContent> {
  const { platform, sourceBlogTitle, sourceBlogContent, topic, ctaText, ctaUrl, businessSlug } = opts;
  const rules = PLATFORM_RULES[platform];

  if (!rules) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  // Load brand context from DB based on business
  const brandContext = await getBrandContext(businessSlug);

  const sourceContext = sourceBlogContent
    ? `\n\nSOURCE BLOG POST:\nTitle: "${sourceBlogTitle}"\nContent:\n${sourceBlogContent.substring(0, 4000)}`
    : topic
      ? `\n\nTOPIC TO WRITE ABOUT: ${topic}`
      : "";

  const ctaContext = ctaText && ctaUrl
    ? `\n\nCTA TO INCLUDE: "${ctaText}" linking to ${ctaUrl}`
    : "";

  // Retrieve past performance context from vector memory (pgvector)
  let memoryContext = "";
  try {
    const { getMemoryContext } = await import("../agent/vector-memory-hooks");
    memoryContext = await getMemoryContext(topic || sourceBlogTitle || "recovery", platform);
  } catch {
    // Vector memory not configured — proceed without it
  }

  const prompt = `${brandContext}

TASK: Generate a ${rules.contentType} for ${platform.toUpperCase()}.
${sourceContext}
${ctaContext}
${memoryContext}

PLATFORM RULES FOR ${platform.toUpperCase()}:
- Max length: ${rules.maxLength} characters${platform === "x" ? " per tweet" : ""}
- Style: ${rules.style}
- Hashtag strategy: ${rules.hashtagStrategy}
- CTA placement: ${rules.ctaPlacement}

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code fences):
{
  "content": "The actual post content ready to publish. For X threads, separate each tweet with |||TWEET_BREAK|||",
  "hashtags": "Hashtags to include (already in content or as a separate block for IG)",
  "suggestedMediaType": "image|video|carousel|audio|none",
  "suggestedMediaPrompt": "A description of what the accompanying media should look like, for AI image generation",
  "suggestedTools": ["tool1", "tool2"]
}

TOOL OPTIONS for suggestedTools: canva, midjourney, dalle, heygen, elevenlabs, pictory, capcut

IMPORTANT:
- Write in first person as the brand
- Be authentic, not corporate
- The content must be ready to post as-is
- For X threads, each tweet MUST be under 280 characters
- Match the platform's native culture and format
- For Instagram: ALWAYS set suggestedMediaType to "image" and provide a suggestedMediaPrompt — Instagram requires an image to post
- For Facebook: ALWAYS set suggestedMediaType to "image" and provide a suggestedMediaPrompt — images dramatically increase engagement
- If a CTA URL is provided, include the FULL URL in the content text (not just "click here" or "link in bio" without the URL)`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: "You are a world-class social media content strategist. You always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
  });

  const responseText = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : Array.isArray(result.choices[0].message.content)
      ? result.choices[0].message.content.map(c => "text" in c ? c.text : "").join("")
      : "";

  // Parse the JSON response - handle potential markdown fences
  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      platform,
      contentType: rules.contentType,
      content: parsed.content || "",
      hashtags: parsed.hashtags,
      suggestedMediaType: parsed.suggestedMediaType || "none",
      suggestedMediaPrompt: parsed.suggestedMediaPrompt,
      suggestedTools: parsed.suggestedTools || [],
    };
  } catch {
    // If JSON parsing fails, use the raw text as content
    console.warn(`[ContentGenerator] Failed to parse JSON for ${platform}, using raw text`);
    return {
      platform,
      contentType: rules.contentType,
      content: responseText,
      suggestedMediaType: "none",
      suggestedTools: [],
    };
  }
}

/** Generate content for multiple platforms at once */
export async function generateContentForPlatforms(opts: {
  platforms: string[];
  sourceBlogTitle?: string;
  sourceBlogContent?: string;
  topic?: string;
  ctaText?: string;
  ctaUrl?: string;
  businessSlug?: string;
}): Promise<GeneratedContent[]> {
  const results = await Promise.allSettled(
    opts.platforms.map(platform =>
      generateContentForPlatform({
        platform,
        sourceBlogTitle: opts.sourceBlogTitle,
        sourceBlogContent: opts.sourceBlogContent,
        topic: opts.topic,
        ctaText: opts.ctaText,
        ctaUrl: opts.ctaUrl,
        businessSlug: opts.businessSlug,
      })
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<GeneratedContent> => r.status === "fulfilled")
    .map(r => r.value);
}

/** Generate a standalone content idea (no source blog post needed) */
export async function generateContentIdea(opts?: { theme?: string; businessSlug?: string }): Promise<{
  topic: string;
  hook: string;
  platforms: string[];
  suggestedCta: string;
}> {
  const brandContext = await getBrandContext(opts?.businessSlug);

  const prompt = `${brandContext}

Generate a fresh content idea for social media. ${opts?.theme ? `Theme: ${opts.theme}` : "Pick a topic from the brand's key themes that would resonate with the target audience."}

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code fences):
{
  "topic": "The core topic/angle",
  "hook": "An attention-grabbing opening line",
  "platforms": ["x", "instagram", "linkedin"],
  "suggestedCta": "Which product/offer fits this topic best"
}

The idea should be something that could go viral with this audience.`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: "You are a social media strategist. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const responseText = typeof result.choices[0].message.content === "string"
    ? result.choices[0].message.content
    : "";

  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(cleanJson);
  } catch {
    return {
      topic: "Your story matters - share it authentically",
      hook: "The thing that makes you different is the thing that makes you powerful...",
      platforms: ["x", "instagram", "linkedin"],
      suggestedCta: "Check out our latest content",
    };
  }
}
