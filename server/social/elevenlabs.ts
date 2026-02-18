/**
 * ElevenLabs API Connector
 * Text-to-speech, voice cloning, and blog-to-podcast automation
 *
 * Required env vars:
 *   ELEVENLABS_API_KEY - API key from elevenlabs.io/settings
 *   ELEVENLABS_VOICE_ID - (Optional) Default voice ID for Shaun's cloned voice
 *
 * API: https://elevenlabs.io/docs/api-reference
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// ─── Credentials ───────────────────────────────────────────────────────────

function getCredentials() {
  return {
    apiKey: process.env.ELEVENLABS_API_KEY || "",
    defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || "",
  };
}

export function isElevenLabsConfigured(): boolean {
  return !!getCredentials().apiKey;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type Voice = {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
};

export type TTSResult = {
  success: boolean;
  audioBuffer?: Buffer;
  contentType?: string;
  error?: string;
};

export type VoiceSettings = {
  stability?: number;       // 0-1, default 0.5
  similarity_boost?: number; // 0-1, default 0.75
  style?: number;           // 0-1, default 0 (only for v2 models)
  use_speaker_boost?: boolean;
};

// ─── Voices ────────────────────────────────────────────────────────────────

/** List all available voices (including cloned voices) */
export async function listVoices(): Promise<Voice[]> {
  const { apiKey } = getCredentials();
  if (!apiKey) return [];

  try {
    const response = await fetch(`${ELEVENLABS_BASE}/voices`, {
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.voices || [];
  } catch {
    return [];
  }
}

/** Get a specific voice by ID */
export async function getVoice(voiceId: string): Promise<Voice | null> {
  const { apiKey } = getCredentials();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${ELEVENLABS_BASE}/voices/${voiceId}`, {
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ─── Text-to-Speech ────────────────────────────────────────────────────────

/** Convert text to speech audio using a specific voice */
export async function textToSpeech(opts: {
  text: string;
  voiceId?: string;
  modelId?: string; // "eleven_multilingual_v2" or "eleven_monolingual_v1"
  voiceSettings?: VoiceSettings;
  outputFormat?: "mp3_44100_128" | "mp3_22050_32" | "pcm_16000" | "pcm_22050";
}): Promise<TTSResult> {
  const { apiKey, defaultVoiceId } = getCredentials();
  if (!apiKey) return { success: false, error: "ElevenLabs API key not configured" };

  const voiceId = opts.voiceId || defaultVoiceId;
  if (!voiceId) return { success: false, error: "No voice ID specified" };

  try {
    const response = await fetch(
      `${ELEVENLABS_BASE}/text-to-speech/${voiceId}?output_format=${opts.outputFormat || "mp3_44100_128"}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: opts.text,
          model_id: opts.modelId || "eleven_multilingual_v2",
          voice_settings: {
            stability: opts.voiceSettings?.stability ?? 0.5,
            similarity_boost: opts.voiceSettings?.similarity_boost ?? 0.75,
            style: opts.voiceSettings?.style ?? 0,
            use_speaker_boost: opts.voiceSettings?.use_speaker_boost ?? true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `TTS failed: ${err}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      success: true,
      audioBuffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") || "audio/mpeg",
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Blog-to-Podcast ───────────────────────────────────────────────────────

/** Convert a blog post into a podcast-style audio episode */
export async function blogToPodcast(opts: {
  title: string;
  content: string;
  voiceId?: string;
  addIntro?: boolean;
  addOutro?: boolean;
}): Promise<TTSResult> {
  const { title, content, voiceId, addIntro = true, addOutro = true } = opts;

  // Clean HTML tags and format for spoken word
  const cleanContent = content
    .replace(/<[^>]*>/g, "") // Strip HTML
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
    .trim();

  // Build podcast script
  let script = "";

  if (addIntro) {
    script += `Welcome back to the Rewired podcast. I'm Shaun Critzer, and today I want to talk about: ${title}. `;
    script += `\n\n`;
  }

  script += cleanContent;

  if (addOutro) {
    script += `\n\n`;
    script += `Thanks for listening. If this resonated with you, check out the 7-Day Rewired Reset at shauncritzer.com. `;
    script += `Remember, you're not broken. You're bent. And bent things can be straightened. `;
    script += `I'll catch you in the next episode.`;
  }

  // ElevenLabs has a ~5000 char limit per request, split if needed
  if (script.length <= 5000) {
    return textToSpeech({ text: script, voiceId });
  }

  // For longer content, split into chunks and concatenate
  const chunks = splitTextIntoChunks(script, 4500);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const result = await textToSpeech({ text: chunk, voiceId });
    if (!result.success || !result.audioBuffer) {
      return { success: false, error: `Failed on chunk: ${result.error}` };
    }
    audioBuffers.push(result.audioBuffer);
  }

  // Concatenate all audio buffers
  return {
    success: true,
    audioBuffer: Buffer.concat(audioBuffers),
    contentType: "audio/mpeg",
  };
}

/** Split text into chunks at sentence boundaries */
function splitTextIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    // Find the last sentence boundary before maxLength
    let splitIndex = remaining.lastIndexOf(". ", maxLength);
    if (splitIndex === -1) splitIndex = remaining.lastIndexOf("! ", maxLength);
    if (splitIndex === -1) splitIndex = remaining.lastIndexOf("? ", maxLength);
    if (splitIndex === -1) splitIndex = maxLength; // Force split if no sentence boundary

    chunks.push(remaining.substring(0, splitIndex + 1).trim());
    remaining = remaining.substring(splitIndex + 1).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

// ─── Usage Info ────────────────────────────────────────────────────────────

/** Get current subscription/usage info */
export async function getUsageInfo(): Promise<{
  characterCount: number;
  characterLimit: number;
  remainingCharacters: number;
} | null> {
  const { apiKey } = getCredentials();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${ELEVENLABS_BASE}/user/subscription`, {
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      characterCount: data.character_count || 0,
      characterLimit: data.character_limit || 0,
      remainingCharacters: (data.character_limit || 0) - (data.character_count || 0),
    };
  } catch {
    return null;
  }
}
