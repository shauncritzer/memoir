# DataDisco System Directive
Last updated: March 2026

## Stack Changes
- REMOVE: Make.com scheduler dependency
- REMOVE: Internal Railway cron jobs for publishing  
- ADD: n8n self-hosted on Railway as external trigger
- ADD: LangGraph as agent orchestration layer
- ADD: Supabase pgvector for agent memory
- ADD: LangSmith for observability
- REPLACE: DALL-E image generation → Flux via Replicate API
- KEEP: Everything else unchanged

## Orchestration Architecture
n8n (heartbeat/trigger) → LangGraph (agent coordination) 
→ Claude API Sonnet (complex reasoning) 
→ Claude API Haiku (bulk/simple tasks)
→ All existing tool integrations

## Daily Autonomous Loop (target)
6am: Research agent (Tavily) → trending topics
6:15am: Content agent → platform-optimized posts for all channels
7am: Publish queue executes (Tier 1, no approval)
8pm: Feedback agent → reads engagement data
8:15pm: Memory update → Supabase vector stores what worked

## Immediate Priorities (in order)
1. Fix Ready → Published scheduler bug
2. Install and configure n8n on Railway
3. Fix course_lessons module_id mismatch for video generation
4. Wire LangGraph basic orchestration loop
5. Connect ConvertKit sequences (31 emails ready to import)

## Infrastructure URLs
| Service | URL | Notes |
|---------|-----|-------|
| **Main app** | `https://shauncritzer.com` | Railway, auto-deploys from `main` |
| **n8n** | `https://<n8n-service>.up.railway.app` | Self-hosted, see `n8n/` dir for Dockerfile + workflow |
| **Scheduler endpoint** | `POST /api/scheduler/run` | Bearer auth via `N8N_WEBHOOK_SECRET` env var |

## Do Not Touch
- Course content and UI (7-Day Reset is complete and sellable)
- Stripe configuration (live mode, working)
- IG/Facebook publishing (currently working)
- Site navigation and design
- AI Recovery Coach

## Revenue Priority
7-Day Reset ($47) → on sale immediately once scheduler fixed
Memoir ($19.99) → Amazon KDP + site sales page
30-Day Course ($97) → after video generation fixed
