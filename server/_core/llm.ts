import { ENV } from "./env";
import Anthropic from "@anthropic-ai/sdk";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

type LLMProvider = {
  apiUrl: string;
  apiKey: string;
  model: string;
  name: string;
};

const resolveProvider = (): LLMProvider => {
  // Debug logging to diagnose why Gemini is selected instead of Anthropic
  console.log("[LLM] Provider resolution:");
  console.log(`  forgeApiKey: ${ENV.forgeApiKey ? `SET (${ENV.forgeApiKey.length} chars)` : "NOT SET"}`);
  console.log(`  anthropicApiKey: ${ENV.anthropicApiKey ? `SET (${ENV.anthropicApiKey.length} chars)` : "NOT SET"}`);
  console.log(`  googleApiKey: ${ENV.googleApiKey ? `SET (${ENV.googleApiKey.length} chars)` : "NOT SET"}`);
  console.log(`  openaiApiKey: ${ENV.openaiApiKey ? `SET (${ENV.openaiApiKey.length} chars)` : "NOT SET"}`);

  // Priority 1: Forge (Manus dev environment)
  if (ENV.forgeApiKey) {
    console.log("[LLM] Selected provider: Forge");
    const baseUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
      ? ENV.forgeApiUrl.replace(/\/$/, "")
      : "https://forge.manus.im";
    return {
      apiUrl: `${baseUrl}/v1/chat/completions`,
      apiKey: ENV.forgeApiKey,
      model: "gemini-2.5-flash",
      name: "Forge",
    };
  }

  // Priority 2: Claude (Anthropic) — fast, reliable, no free-tier rate limits
  if (ENV.anthropicApiKey) {
    console.log("[LLM] Selected provider: Anthropic Claude");
    return {
      apiUrl: "https://api.anthropic.com",
      apiKey: ENV.anthropicApiKey,
      model: "claude-haiku-4-5",
      name: "Claude",
    };
  }

  // Priority 3: Google Gemini (via OpenAI-compatible endpoint)
  if (ENV.googleApiKey) {
    console.log("[LLM] Selected provider: Google Gemini (free tier - 20/day limit)");
    return {
      apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: ENV.googleApiKey,
      model: "gemini-2.5-flash",
      name: "Google Gemini",
    };
  }

  // Priority 4: OpenAI directly
  if (ENV.openaiApiKey) {
    console.log("[LLM] Selected provider: OpenAI");
    return {
      apiUrl: "https://api.openai.com/v1/chat/completions",
      apiKey: ENV.openaiApiKey,
      model: "gpt-4o-mini",
      name: "OpenAI",
    };
  }

  console.error("[LLM] NO PROVIDER CONFIGURED - all env vars empty");
  throw new Error(
    "No AI API key configured. Set one of: ANTHROPIC_API_KEY (recommended), GOOGLE_API_KEY, OPENAI_API_KEY, or BUILT_IN_FORGE_API_KEY in Railway environment variables."
  );
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

/**
 * Invoke Claude via the Anthropic SDK and return an OpenAI-shaped InvokeResult
 * so all 12 consumers work without changes.
 */
async function invokeClaudeNative(
  provider: LLMProvider,
  params: InvokeParams
): Promise<InvokeResult> {
  const client = new Anthropic({ apiKey: provider.apiKey });

  const { messages, tools, toolChoice, tool_choice, maxTokens, max_tokens } =
    params;

  // Split system message from the rest (Anthropic takes system as a top-level param)
  const systemMessages = messages.filter((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const systemText = systemMessages
    .map((m) => {
      const parts = ensureArray(m.content);
      return parts
        .map((p) => (typeof p === "string" ? p : "text" in p ? p.text : ""))
        .join("\n");
    })
    .join("\n\n");

  // Convert messages to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = nonSystemMessages.map(
    (m) => {
      const parts = ensureArray(m.content);
      if (parts.length === 1 && typeof parts[0] === "string") {
        return { role: m.role as "user" | "assistant", content: parts[0] };
      }
      const contentBlocks: Anthropic.ContentBlockParam[] = parts.map((p) => {
        if (typeof p === "string") return { type: "text" as const, text: p };
        if (p.type === "text") return { type: "text" as const, text: p.text };
        if (p.type === "image_url") {
          return {
            type: "text" as const,
            text: `[Image: ${p.image_url.url}]`,
          };
        }
        return { type: "text" as const, text: "[Unsupported content]" };
      });
      return {
        role: m.role as "user" | "assistant",
        content: contentBlocks,
      };
    }
  );

  // Convert tools to Anthropic format
  const anthropicTools: Anthropic.Tool[] | undefined =
    tools && tools.length > 0
      ? tools.map((t) => ({
          name: t.function.name,
          description: t.function.description ?? "",
          input_schema: (t.function.parameters ?? {
            type: "object",
            properties: {},
          }) as Anthropic.Tool.InputSchema,
        }))
      : undefined;

  // Convert tool_choice
  const resolvedToolChoice = toolChoice || tool_choice;
  let anthropicToolChoice: Anthropic.MessageCreateParams["tool_choice"];
  if (resolvedToolChoice === "auto") {
    anthropicToolChoice = { type: "auto" };
  } else if (resolvedToolChoice === "required") {
    anthropicToolChoice = { type: "any" };
  } else if (resolvedToolChoice === "none") {
    anthropicToolChoice = undefined;
    // Also clear tools so Anthropic doesn't try to use them
  } else if (resolvedToolChoice && "name" in resolvedToolChoice) {
    anthropicToolChoice = {
      type: "tool",
      name: resolvedToolChoice.name,
    };
  } else if (
    resolvedToolChoice &&
    typeof resolvedToolChoice === "object" &&
    "function" in resolvedToolChoice
  ) {
    anthropicToolChoice = {
      type: "tool",
      name: (resolvedToolChoice as ToolChoiceExplicit).function.name,
    };
  }

  const requestParams: Anthropic.MessageCreateParams = {
    model: provider.model,
    max_tokens: maxTokens || max_tokens || 4096,
    messages: anthropicMessages,
    ...(systemText ? { system: systemText } : {}),
    ...(anthropicTools ? { tools: anthropicTools } : {}),
    ...(anthropicToolChoice ? { tool_choice: anthropicToolChoice } : {}),
  };

  const response = await client.messages.create(requestParams);

  // Convert Anthropic response → OpenAI-shaped InvokeResult
  const textParts = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text);

  const toolUseParts = response.content
    .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
    .map((b) => ({
      id: b.id,
      type: "function" as const,
      function: {
        name: b.name,
        arguments: JSON.stringify(b.input),
      },
    }));

  return {
    id: response.id,
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: textParts.join("\n") || "",
          ...(toolUseParts.length > 0 ? { tool_calls: toolUseParts } : {}),
        },
        finish_reason:
          response.stop_reason === "end_turn" ? "stop" : response.stop_reason,
      },
    ],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens:
        response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const provider = resolveProvider();

  // Route Claude to native Anthropic SDK (not OpenAI-compatible)
  if (provider.name === "Claude") {
    return invokeClaudeNative(provider, params);
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: provider.model,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = 32768;

  // Only add thinking for Forge provider (not supported by Google or OpenAI directly)
  if (provider.name === "Forge") {
    payload.thinking = {
      "budget_tokens": 128
    };
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(provider.apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed (${provider.name}): ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}
