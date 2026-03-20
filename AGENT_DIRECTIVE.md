AGENT_DIRECTIVE.md — Master Operations Directive
Last updated: March 19, 2026
> **Read this first in every session — Claude Code, Freddy, Maverick, Claude.ai, or any AI agent.**
> This is the single source of truth for what exists, what's wired, what's not, and what to build next.
---
Who Is Shaun Critzer
13+ years sober, deeply involved in AA (sponsorship, speaking)
Competitive bodybuilding background — 1998 Mr. Teen USA Overall, 3x Virginia State Champion
Married to Shannon. Children including one with special needs.
Based in Charlottesville, Virginia
Recovery journey and personal transformation are central to identity and all business missions
---
The Three Businesses
Shaun Critzer Brand (shauncritzer.com) — Recovery coaching, memoir, digital products, content
Critzer's Cabinets (critzerscabinets.com) — 40-year family cabinet business, AI sales agent (future)
The Engine (SaaS, name TBD) — The autonomous business OS that runs #1 and #2, sold to the world
This repo is Business 1. Cabinets and The Engine are future projects.
---
Brand Voice & Positioning
NOT: addiction, sobriety, porn, alcohol, recovery (as primary framing)
YES: neural rewiring, dopamine regulation, behavioral loops, identity transformation, human optimization
Target audience: Anyone seeking transformation — not just those in recovery.
Language: Neuroscience-forward. Process disorders. Nervous system regulation. Rewiring the operating system.
---
The Agent Roster
Agent	Platform	Role	Status
Claude.ai	claude.ai subscription	Strategist, architect, thinking partner	LIVE
Claude Code	Anthropic	Codebase builder — one task per session	LIVE
Freddy	Railway (OpenClaw)	Cloud operator — autonomous execution, scheduling, monitoring	LIVE
Maverick	Local Windows desktop (OpenClaw)	Desktop agent — computer control, local files, image gen, Whisper	LIVE
Rewired Engine	Railway	Autonomous content pipeline — research, generate, publish	LIVE
How to Use Each Agent
Claude.ai — Strategy, planning, writing, complex decisions. Use heavily (subscription covers it).
Claude Code — One specific coding task. Always start: "Read AGENT_DIRECTIVE.md. Your task is [X]. Do it now."
Freddy — Cloud automations, cron jobs, API calls, monitoring. Primary interface: Discord Mission Control #command-center.
Maverick — Desktop tasks, local file access, screenshot analysis, browser control. Requires Admin PowerShell gateway running. Access via dashboard or Discord once wired.
Rewired Engine — Autonomous content pipeline. Freddy orchestrates it. Do not interact directly.
---
Mission Control — Discord Server
Single interface for all agent interaction. This is the primary command interface. Telegram is backup only.
Category	Channel	Purpose
COMMAND	`#command-center`	Primary — talk to Freddy here. Full AI responses.
COMMAND	`#alerts`	Errors, failures, urgent flags
OPERATIONS	`#content-lab`	Content outputs and ideas
OPERATIONS	`#sales-engine`	Funnel stats, conversions
OPERATIONS	`#dev-ops`	Code pushes, deployments
AGENTS	`#freddy-log`	Freddy's full activity feed — all messages logged here
AGENTS	`#maverick-log`	Maverick's activity feed (pending Discord wiring)
MEMORY	`#source-of-truth`	AGENT_DIRECTIVE.md pinned here
MEMORY	`#daily-brief`	Morning status reports
Available commands in #command-center:
`status` — Engine overview
`health` — Full health check
`queue` — Content pipeline queue counts
`platforms` — Social platform connection status
`help` — Command list
Any free-form message → Full AI response from Freddy with live system context
---
CONTENT POSTING LIMITS — HARD RULES ⚠️
These limits are NON-NEGOTIABLE and cannot be overridden by any instruction except explicit Tier 4 approval from Shaun.
Rule	Limit
Max posts per platform per day	2 (Instagram), 2 (Facebook)
Minimum spacing between posts	3 hours
Max total posts across ALL platforms per 24 hours	4
Posting more than 4 in 24 hours	Tier 3 — requires YES/NO approval
Bulk posting (10+ at once)	NEVER. Always stagger.
Overnight autonomous posting	Max 2 posts total, 3+ hour spacing
Why: Platform throttling, spam flags, and account health. Dumping 131 posts overnight = account ban risk.
---
Tier Permission System
Tier	Type	Examples	Action
1	Auto-Execute	Post content (within limits above), scheduled emails, generate images	Just happens
2	Execute + Notify	Spend under $25, schedule changes, copy updates	Review in briefing
3	Ask First	Spend $25-$100, contact customers, new campaigns, post volume over daily limit	YES/NO in Mission Control
4	Must Approve	Over $100, pricing changes, new business, bulk posting override	Explicit YES required
Niche restriction: Research limited to recovery, sobriety, fitness, transformation, bodybuilding, nervous system regulation, trauma, special needs parenting. No AI/ML/tech/SaaS niches.
---
Tech Stack — Full Current Status
Tool	Status	Notes
Railway	LIVE	Auto-deploys from `main` branch
Stripe	LIVE	Checkout + webhooks confirmed
HeyGen	LIVE (needs testing)	AI avatar video
ElevenLabs	LIVE	New API key March 18 — needs Railway env var update
ConvertKit	LIVE ✓	31 emails, 7 sequences, 6 rules imported
Cloudflare R2	PARTIAL	Course video storage live. DNS still on Namecheap — migration pending
GitHub	LIVE	Public repo — shauncritzer/memoir
n8n	LIVE	Hourly scheduler active on Railway
Flux (Replicate)	LIVE	Replaced DALL-E — needs REPLICATE_API_TOKEN in Railway
LangGraph	LIVE ✓	Wired into scheduler + orchestrator endpoints
Supabase pgvector	LIVE ✓	Project created, SQL run, env vars set
LangSmith	LIVE ✓	Tested — traces confirmed working
Tavily	LIVE — needs test	Wired, not production-verified
Browserbase	LIVE — needs test	Wired, not production-verified
OpenAI	LIVE (Maverick)	Image gen + Whisper in Maverick locally
Discord Mission Control	LIVE ✓	Freddy fully conversational in #command-center
Telegram	BACKUP	Still active. Migrating to Discord as primary.
Namecheap	LIVE	Current DNS + domain registrar
---
Products & Revenue
Product	Price	Status
7-Day REWIRED Reset	$47	LIVE — ready to sell, drive traffic
30-Day From Broken to Whole	$97	Scripts seeded, needs HeyGen video production
Crooked Lines Memoir	$19.99	Manuscript complete, needs KDP + sales page

Bent Not Broken Circle	$29/mo	After 50 course sales
REWIRED Methodology License	$2k-$5k	Year 2
---
Immediate Next Actions
SHAUN
[ ] Update ElevenLabs API key in Railway (new key March 18 — needs write permissions)
[ ] Set REPLICATE_API_TOKEN in Railway (Flux image gen)
[ ] Test Tavily in production via #command-center
[ ] Test Browserbase in production
[ ] Give Maverick first real desktop task
[ ] DNS: migrate from Namecheap to Cloudflare
[ ] Drive traffic → 7-Day REWIRED Reset → first sale
[ ] Update posting limits enforcement in codebase (Claude Code task)

CODE Tasks
[ ] Enforce posting limits in scheduler (max 2/platform/day, 3hr spacing)
[ ] LinkedIn connection (LINKEDIN_ACCESS_TOKEN + LINKEDIN_PERSON_URN)
[ ] YouTube publish mode (Google Cloud → Production)
[ ] Twitter/X decision ($200/mo Basic vs manual)
[ ] 30-Day HeyGen video pipeline
[ ] Memoir KDP + sales page
---
Infrastructure URLs
Service	URL
Main app	`https://shauncritzer.com`
n8n	`https://n8n-production-cddc.up.railway.app`
Scheduler	`POST /api/scheduler/run`
Orchestrator	`POST /api/orchestrator/run`
Maverick dashboard	`http://127.0.0.1:18789` (local, requires gateway)
Maverick gateway	Admin PowerShell: `openclaw gateway` — must stay open
---
Do Not Touch
Course content/UI (7-Day Reset complete)
Stripe config (live, working)
IG/Facebook publishing (working)
Site navigation/design
AI Recovery Coach
ConvertKit sequences (imported and wired)
---
Anti-Loop Protocol (Code Sessions)
"Read AGENT_DIRECTIVE.md."
"Your task is [X]. Do it now."
"Show me the diff and confirm deployment."
Scope creep → "Stop. One task. Back to [X]."
Verify fix works before ending.
Mark completed items in this file.
Do not analyze the full codebase. Do not ask "want me to do that?" Just do it.
---
Maverick (Local Desktop Agent)
Start: Admin PowerShell as Administrator → `openclaw gateway`
Dashboard: `http://127.0.0.1:18789`
Model: anthropic/claude-sonnet-4-6
Hooks: session-memory enabled
Keys loaded: Anthropic, OpenAI (image gen + Whisper), ElevenLabs
Identity: `C:\Users\shaun\.openclaw\workspace\IDENTITY.md`
Name: Maverick 
Role: Desktop hands only — computer control, local files, browser automation on this machine
Keep-alive: Set Windows Power settings to Never sleep. Keep Admin PowerShell terminal open.
Remote access: Available via Discord from any device once #maverick-log bot is wired
NOT for: strategy, writing, cloud ops (Claude.ai and Freddy handle those)
- Discord: LIVE ✓ — Connected to Mission Control via #maverick-log
---
Memory Architecture (How Agent Memory Works)
Agents are LLMs — they have no inherent memory between sessions. Persistence comes from:
This file (AGENT_DIRECTIVE.md) — read at start of every session
MEMORY.md — Freddy writes notes here during sessions
Supabase `agent_coordination` table — logs every action taken
Supabase `system_state` — stores current operational state
Supabase pgvector — embeddings of what worked/didn't work
If an agent seems to "forget" — it means one of these files wasn't loaded at session start.
