# AGENT_DIRECTIVE.md — Master Operations Directive
Last updated: March 11, 2026

> **Read this first in every Claude Code session.** This is the single source of truth for what exists, what's wired, what's not, and what to build next.

---

## The Three Businesses

1. **Shaun Critzer Brand** (shauncritzer.com) — Recovery coaching, memoir, digital products, content
2. **Critzer's Cabinets** (critzerscabinets.com) — 40-year family cabinet business, AI sales agent (separate repo, future)
3. **The Engine** (SaaS, name TBD) — The autonomous business OS that runs #1 and #2, sold to the world

This repo is **Business 1**. Cabinets and The Engine are future projects.

---

## Tech Stack — What's Live vs What's Not

### Brain-Eyes-Arms-Ears Framework

| Role | Tool | Status | Notes |
|------|------|--------|-------|
| **BRAIN** | Claude API Sonnet | NOT WIRED | Complex tasks, agent decisions, content generation |
| **BRAIN** | Claude API Haiku | NOT WIRED | Bulk simple tasks (20x cheaper than Sonnet) |
| **BRAIN** | LangGraph | NOT WIRED | Agent orchestration — coordinates who does what |
| **BRAIN** | Gemini Flash (free) | LIVE | Current LLM provider for content generation |
| **EYES** | Tavily | NOT WIRED | Web research API for trending topics, competitor intel |
| **EYES** | Firecrawl | NOT WIRED | Deep site scraping when Tavily isn't enough |
| **ARMS** | n8n (Railway) | LIVE | Workflow triggers and scheduling, replaces Make.com |
| **ARMS** | Browserbase | NOT WIRED | Cloud browser automation (already paid) |
| **EARS** | LangSmith | NOT WIRED | Agent observability — see every decision and failure |
| **EARS** | Supabase pgvector | NOT WIRED | Agent memory — stores what worked |
| **EARS** | Platform APIs | PARTIAL | IG/FB working, Twitter broken, LinkedIn not connected |

### Full Stack Status

| Tool | Status | Purpose |
|------|--------|---------|
| Railway | LIVE | Hosting — auto-deploys from `main` |
| Stripe (Live) | LIVE | Payments — checkout sessions + webhooks |
| HeyGen (1500cr) | LIVE (needs testing) | AI avatar video generation |
| ElevenLabs | LIVE (needs testing) | Voice cloning / TTS |
| ConvertKit | LIVE | Email sequences + lead magnets |
| Cloudflare R2 | NOT WIRED | Media storage — should replace Forge proxy |
| GitHub | LIVE | Source control |
| n8n | LIVE | Self-hosted on Railway, hourly scheduler |
| Flux (Replicate) | NOT WIRED | Image generation — replaces DALL-E |
| Ideogram | NOT WIRED | Text-in-image for quote graphics |
| LangGraph | NOT WIRED | Agent orchestration backbone |
| Supabase pgvector | NOT WIRED | Agent memory — free tier |
| LangSmith | NOT WIRED | Agent observability |
| Tavily | NOT WIRED | Search API for research agent |
| Browserbase | NOT WIRED | Cloud browser — already paid |
| DALL-E | LIVE (being replaced) | Current image gen — switching to Flux |
| Make.com | CANCELLED | Replaced by n8n |

### AI Model Routing (Target)

| Model | Use For | Status |
|-------|---------|--------|
| Claude Sonnet | Content generation, agent decisions, complex reasoning | NOT WIRED |
| Claude Haiku | Bulk formatting, data extraction, simple classification | NOT WIRED |
| Flux (Replicate) | Lifestyle photos, people, recovery imagery | NOT WIRED |
| Ideogram | Quote graphics, text overlays, branded visuals | NOT WIRED |
| Gemini Flash | Free-tier — current primary LLM | LIVE |
| ElevenLabs | Course narration, podcast audio | LIVE (needs testing) |
| HeyGen | Course lesson videos, YouTube avatar content | LIVE (needs testing) |

---

## Orchestration Architecture (Target)

```
n8n (heartbeat/trigger) → LangGraph (agent coordination)
  → Research node (Tavily) → trending topics
  → Content node (Claude Sonnet) → platform-optimized posts
  → Publish node (existing pipeline) → IG, FB, LinkedIn, YouTube
  → Feedback node (Browserbase) → reads engagement
  → Memory node (Supabase pgvector) → stores what worked
```

### Daily Autonomous Loop (Target — Not Yet Built)
- 6:00am — Research agent (Tavily) → trending topics
- 6:15am — Content agent (Claude Sonnet) → platform-optimized posts
- 7:00am — Publish queue executes (Tier 1, no approval needed)
- 8:00pm — Feedback agent (Browserbase) → reads engagement data
- 8:15pm — Memory update → Supabase vector stores what worked

---

## Tier Permission System

| Tier | Type | Examples | Action |
|------|------|----------|--------|
| 1 | Auto-Execute | Post content, send scheduled emails, generate images | Just happens |
| 2 | Execute + Notify | Spend under $25, adjust schedules, update copy | Review in briefing |
| 3 | Ask First | Spend $25-$100, contact customers, new campaigns | YES or NO in Mission Control |
| 4 | Must Approve | Financial over $100, pricing changes, new business | Explicit YES required |

**Niche restriction enforced:** Agent research limited to recovery, sobriety, fitness, transformation, bodybuilding, nervous system regulation, trauma, special needs parenting. No AI/ML/tech/SaaS niches.

---

## Products & Revenue

| Product | Price | Status |
|---------|-------|--------|
| 7-Day REWIRED Reset | $47 | LIVE — ready to sell |
| 30-Day From Broken to Whole | $97 | Content seeded, needs videos |
| Crooked Lines Memoir | $19.99 | Manuscript complete, needs KDP + sales page |
| Bent Not Broken Circle | $29/mo | After 50 course sales |
| REWIRED Methodology License | $2k-$5k | Year 2 |

### Revenue Targets
- Month 1-3: $0 → $3,000/mo (personal brand)
- Month 4-6: $3k → $15,000/mo (brand + cabinets)
- Month 7-9: $15k → $40,000/mo (all three businesses)
- Month 10-12: $40k → $85,000/mo (scale SaaS)

---

## Build Sequence — 90 Days

### Week 1 — Make It Actually Post
1. ~~Fix Ready → Published scheduler bug~~ ✓ DONE
2. ~~Install and configure n8n on Railway~~ ✓ DONE — live at https://n8n-production-cddc.up.railway.app
3. ~~Fix course_lessons module_id mismatch for video generation~~ ✓ DONE
4. ~~Restrict niche research to brand verticals~~ ✓ DONE
5. ~~Verify Stripe → ConvertKit webhook flow~~ ✓ DONE
6. ~~Verify 7-Day Reset Stripe checkout wiring~~ ✓ DONE
7. [SHAUN] Import ConvertKit sequences (31 emails, 7 sequences, 6 automation rules — manual task)

### Week 2 — Make It Actually Think
8. Wire LangGraph as orchestration layer
   - Install LangGraph
   - Create basic agent graph: Research → Content → Publish
   - Replace linear cron with graph orchestration
9. Add Supabase pgvector for agent memory
   - Enable pgvector on Supabase
   - Create embeddings table
   - Store content performance data
   - Feed back into content generation
10. Add LangSmith observability
    - LANGSMITH_API_KEY in Railway env vars
    - Wrap LangGraph calls with LangSmith tracing
    - Agent decision visibility

### Week 3 — Make It Actually Sell
11. Replace DALL-E with Flux via Replicate
    - Add REPLICATE_API_KEY to Railway
    - Update image generation to use Flux Pro
    - Use Ideogram for text-in-image / quote graphics
12. [SHAUN] 7-Day REWIRED Reset launch — announce, $47, first sale validates the system
13. [SHAUN] Memoir final edits + Amazon KDP setup ($19.99)

### Week 4 — Make It Actually Learn
14. Browserbase engagement feedback loop
    - Monitor published posts on each platform
    - Read actual engagement data
    - Feed back to Supabase vector store
    - Content agent uses data to optimize topics/timing
15. Connect remaining social platforms
    - LinkedIn: set LINKEDIN_ACCESS_TOKEN + LINKEDIN_PERSON_URN env vars
    - YouTube: publish Google Cloud project to "Production" mode
    - Twitter/X: decide on $200/mo Basic tier vs manual posting

### Month 2 — Course Videos + Cabinets
16. Complete 30-Day course video pipeline
    - Render Module 1-4 (scripts exist)
    - Auto-generate Module 5-8 scripts via LLM
    - Batch render all 30 days via HeyGen
    - Course goes live at $97
17. Critzer's Cabinets site + AI agent (separate repo)

### Month 3 — The Engine as Product
18. Document the engine, build SaaS onboarding, get 3 beta clients

---

## Infrastructure URLs

| Service | URL | Notes |
|---------|-----|-------|
| **Main app** | `https://shauncritzer.com` | Railway, auto-deploys from `main` |
| **n8n** | `https://n8n-production-cddc.up.railway.app` | Self-hosted on Railway, PostgreSQL storage |
| **Scheduler endpoint** | `POST /api/scheduler/run` | Bearer auth via hardcoded secret |
| **Active workflow** | `Sober Strong – Hourly Scheduler` | Fires every hour, calls `/api/scheduler/run` |

---

## Do Not Touch
- Course content and UI (7-Day Reset is complete and sellable)
- Stripe configuration (live mode, working)
- IG/Facebook publishing (currently working)
- Site navigation and design
- AI Recovery Coach

---

## Anti-Loop Protocol for Code Sessions

Every Code session follows this pattern:
1. **OPEN:** "Read AGENT_DIRECTIVE.md."
2. **TASK:** "Your task is [item N]. Do it now."
3. **DONE:** "Show me the diff and confirm deployment."
4. **ENFORCE:** If scope creeps — "Stop. One task. Back to [item N]."
5. **CONFIRM:** Verify the fix actually works before ending.
6. **UPDATE:** Mark completed items in this file.

**Do not:** Analyze the full codebase. Do not ask "want me to do that?" Just do it.
