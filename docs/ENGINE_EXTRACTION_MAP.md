# Content Engine Extraction Map

**Purpose:** Planning artifact for extracting the content engine out of this repo into
`shauncritzer/TrueLeadEngine` (white-label, multi-tenant SaaS — brand: True Lead Engine,
domain trueleadengine.com). Produced July 2026 from a full recon of this codebase.

**Session plan:**
- **Session B (in the TrueLeadEngine repo):** scaffold the engine app, port the MOVES list, get it building. Do NOT modify the memoir repo.
- **Session C:** multi-tenancy refactor (tenants table, per-tenant config for everything under "Hardcoded brand context" below).
- **Session D:** Critzer's Cabinets as tenant #1 + quote calculator fix (needs the Critzers-Cabinets repo).
- **Session E:** white-label client dashboard v1.
- **Final memoir cleanup session:** remove engine code from this repo, verify shauncritzer.com builds and deploys clean.

---

## 1. MOVES to TrueLeadEngine (pure content-engine code)

- **server/social/** (~11 files, ~135 KB): `content-generator.ts` (351 lines), `scheduler.ts` (~950), `twitter.ts`, `meta.ts`, `linkedin.ts`, `youtube.ts`, `elevenlabs.ts`, `heygen.ts`, `image-generator.ts`, `image-proxy.ts`, `index.ts`
- **server/agent/** (all 22 files, ~430 KB): `mission-control.ts` (~1400), `orchestrator.ts`, `langgraph-orchestrator.ts`, `coordination.ts`, `research-creator.ts`, `course-factory.ts`, `content-feedback.ts`, `engagement-reader.ts`, `niche-expander.ts`, `revenue-engine.ts`, `strategy-brain.ts`, `self-heal.ts`, `self-monitor.ts`, `video-producer.ts`, `video-generator.ts`, `web-research.ts`, `browser-arm.ts`, `telegram.ts`, `discord-command-poller.ts`, `vector-memory.ts`, `vector-memory-hooks.ts`
- **server/discord/** (`bot.ts`, `discord-command-poller.ts`) — agent command bridge
- **server/_core/llm.ts** (560 lines) — LLM provider chain, engine-only
- **n8n/** (Dockerfile, railway.toml, workflow JSON) — external scheduler trigger
- **api-monitor/**, **coach/** — likely engine-adjacent; verify during extraction
- **Engine-only tRPC routers** inside `server/routers.ts`: `contentPipeline` (L3441–4025), `agent` (L4326–end), `cta` (L4026–4195). `aiCoach` (L3365–3440) is borderline — it's website lead-gen, probably STAYS.

## 2. STAYS in memoir repo (website/product)

`server/stripe-webhook.ts`, `server/convertkit.ts`, `server/integrations/convertkit.ts`,
`server/email.ts`, `server/storage.ts`, blog seed data files, all `seed-*` scripts.
Routers: `auth`, `email`, `leadMagnets`, `stripe`, `convertkit`, `blog`, `members`,
`courseAdmin`, `admin`, `affiliate`. Plus `client/`, `products/`, `manuscript/`,
`lead_magnets/`, `pdf-templates/`.

## 3. ENTANGLED (needs untangling)

- **server/routers.ts (5,019 lines)** — one monolithic appRouter. Engine sections (~1,300 lines: contentPipeline/agent/cta) split out; website keeps the rest. Biggest untangle.
- **server/_core/index.ts (947 lines)** — server bootstrap. Website side: express, Stripe webhook (L36+), OAuth, Vite. Engine side: `/api/scheduler/run` (L399), `/api/telegram/webhook` (L443), Discord poller boot (L832), `startScheduler()` (L866), Mission Control boot (L875, currently disabled). Engine boot hooks move out.
- **server/db.ts + drizzle/schema.ts** — shared Drizzle client. Table split:
  - *Website:* `users`, `blogPosts`, `emailSubscribers`, `leadMagnets`, `leadMagnetDownloads`, `purchases`, `courseModules`, `courseLessons`, `courseProgress`, `lessons`, `lessonProgress`, `loginTokens`, `aiCoachUsers`
  - *Engine:* `contentQueue`, `ctaOffers`, `socialAccounts`, `contentTemplates`, `businesses` (becomes the tenants table), `agentActions`, `agentReports`
  - *Shared/cross-reads:* `users`, `businesses`, `purchases` (revenue-engine reads purchases — in the extracted engine this becomes a per-tenant metrics API, not a direct DB read)
- **server/_core/env.ts** — split: website keys (Stripe, ConvertKit, JWT, DATABASE_URL) vs engine keys (OpenAI/Anthropic/Google, YouTube, ElevenLabs, HeyGen, Tavily, Browserbase, n8n, LangSmith, Supabase, Replicate, Telegram, Discord, R2)
- **shared/** — `convertkit-config.ts` (website); `const.ts`, `types.ts`, `_core/errors.ts` (both). `server/_core/context.ts`, `trpc.ts`, `sdk.ts` are shared plumbing — engine gets its own copies.

## 4. Hardcoded brand context → per-tenant config

Everything below must resolve from the tenant record (name, brand_voice, target_audience,
products JSON, domain, verticals, mission) instead of being hardcoded:

| File | Location | What's hardcoded |
|---|---|---|
| `server/social/content-generator.ts` | L63–94, L100 | `DEFAULT_BRAND_CONTEXT` (Shaun bio, "Bent, Not Broken", tone rules); default slug `"sober-strong"`. **Already partly DB-driven via `businesses` (L108–133) — use as the tenancy template.** |
| `server/agent/mission-control.ts` | 15 hits: L19, L31, L165–169, L181–183, L514, L787, L899 | Business name/domain, `MISSION` ($10K/90 days), product names + prices, sale CTAs |
| `server/agent/video-producer.ts` | L155–157, L185, L231, L293 | Shaun bio, Mr. Teen USA, course title |
| `server/agent/niche-expander.ts` | L125 | `APPROVED_VERTICALS` |
| `server/agent/content-feedback.ts` | L206 | "Sober Strong Academy" |
| `server/agent/strategy-brain.ts` | L57, L74–76 | Recovery hashtags / winning themes |
| `server/agent/discord-command-poller.ts` | L417 | Hardcoded `https://shauncritzer.com/api/...` callback URL |

## 5. Decisions already made

- Freddy (OpenClaw cloud) + Maverick (OpenClaw desktop): **decommissioned** — see AGENT_DIRECTIVE.md roster.
- Engine DB target: consolidate on Postgres (Supabase already holds agent memory/coordination) — migration, not a rename.
- The memoir repo keeps running its engine copy until TrueLeadEngine is stable; cut-over is the LAST step, not the first.
