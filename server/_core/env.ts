export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  googleApiKey: process.env.GOOGLE_API_KEY ?? "",
  // YouTube
  youtubeClientId: process.env.YOUTUBE_CLIENT_ID ?? "",
  youtubeClientSecret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
  youtubeRedirectUri: process.env.YOUTUBE_REDIRECT_URI ?? "",
  youtubeRefreshToken: process.env.YOUTUBE_REFRESH_TOKEN ?? "",
  // ElevenLabs
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
  // HeyGen
  heygenApiKey: process.env.HEYGEN_API_KEY ?? "",
  // Tavily (web research)
  tavilyApiKey: process.env.TAVILY_API_KEY ?? "",
  // Browserbase (headless browser automation)
  browserbaseApiKey: process.env.BROWSERBASE_API_KEY ?? "",
  browserbaseProjectId: process.env.BROWSERBASE_PROJECT_ID ?? "",
  // Make.com (workflow automation)
  makeApiKey: process.env.MAKE_API_KEY ?? "",
  makeWebhookSecret: process.env.MAKE_WEBHOOK_SECRET ?? "",
  makeTeamId: process.env.MAKE_TEAM_ID ?? "",
  makeBaseUrl: process.env.MAKE_BASE_URL ?? "https://us2.make.com",
  // n8n (external scheduler trigger)
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET ?? "",
  // LangSmith (agent observability) — set LANGCHAIN_TRACING_V2=true to enable
  langsmithApiKey: process.env.LANGCHAIN_API_KEY ?? "",
  langchainTracing: process.env.LANGCHAIN_TRACING_V2 === "true",
  // Supabase (agent vector memory)
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // Replicate (Flux image generation)
  replicateApiToken: process.env.REPLICATE_API_TOKEN ?? "",
};
