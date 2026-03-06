# CLAUDE.md — Sober Strong Academy / shauncritzer.com

> **Purpose of this file:** Give every future Claude session full context on the project — what it is, what's built, what works, what doesn't, what the goals are, and what to work on next. This is the single source of truth.

---

## 1. What This Project Is

A full-stack platform for **Shaun Critzer's** recovery coaching brand ("Sober Strong Academy"), built around his memoir *"Crooked Lines: Bent, Not Broken"* — a 13-year journey from addiction to sobriety. It's an all-in-one system that includes:

1. **Public website** (shauncritzer.com) — memoir pitch, blog, resources, product sales
2. **Automated social media pipeline** — generates, schedules, and posts to 7 platforms
3. **Autonomous AI agent system** ("Mission Control") — manages content, business operations, and strategy
4. **Course/membership delivery** — paid products with Stripe checkout
5. **Email marketing system** — ConvertKit integration with lead magnets and sequences
6. **Affiliate program** — referral tracking and commission system

**Live at:** shauncritzer.com (Railway, auto-deploys from GitHub `main` branch)

### The Person Behind It

Shaun Critzer is a recovery coach, author of the memoir "Crooked Lines: Bent, Not Broken", former Mr. Teen USA competitor, and founder of the REWIRED methodology. His brand focuses on addiction recovery through trauma-informed, neuroscience-based approaches. Core message: *"You're not broken, you're bent — recovery is possible."*

He also runs **Critzer's Cabinets** (a cabinet business) and has an affiliate marketing business at **freedomwithshaun.com** (Udimi solo ads — buying at $0.20, selling at $0.40). The Mission Control agent system is designed to eventually manage all these businesses.

Communication style: Shaun communicates informally and appreciates direct, honest answers. No corporate speak.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite 7, Tailwind CSS 4, Radix UI (shadcn), wouter routing, Framer Motion |
| Backend | Express + tRPC 11, Drizzle ORM (MySQL), JWT auth (jose), Scrypt passwords |
| Database | MySQL (Railway) via Drizzle ORM |
| Payments | Stripe (checkout sessions, webhooks, subscriptions) |
| Email | ConvertKit API (keys hardcoded in `server/convertkit.ts`, not env vars) |
| Social | Twitter/X, Facebook, Instagram, LinkedIn, YouTube (OAuth + API posting) |
| AI/LLM | **Google Gemini** (free tier, primary) → OpenAI (fallback + DALL-E images). Provider chain in `server/_core/llm.ts`: Forge → Gemini → OpenAI |
| Video/Audio | HeyGen (AI avatar video), ElevenLabs (voice synthesis) |
| Storage | Forge storage proxy (Manus origin) — intended to move to Cloudflare R2 |
| State | TanStack React Query + tRPC hooks |
| Package Manager | pnpm |
| Hosting | Railway (auto-deploy from GitHub `main`) |

### Origin Note
The site was originally built by the **Manus AI platform**. Some patterns (Forge storage proxy, Manus OAuth via `openId`) reflect that origin.

---

## 3. Commands

```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (Express + Vite, tsx watch)
pnpm run build        # Production build (Vite + esbuild) → dist/
pnpm run start        # Run production server
pnpm run check        # TypeScript check (NOTE: image-proxy.ts has a pre-existing TS error with Map iteration — doesn't block deploy)
pnpm run test         # Run Vitest tests
pnpm run db:push      # Apply Drizzle schema changes
pnpm run format       # Prettier formatting
```

---

## 4. Project Structure

```
client/src/               # React frontend
  pages/                  # 34 route pages
    Home.tsx              # Landing page with memoir pitch + email capture
    Products.tsx          # Product cards with Stripe checkout
    Blog.tsx / BlogPost.tsx / BlogEditor.tsx
    Course.tsx            # Course delivery page
    MissionControl.tsx    # Autonomous agent dashboard (admin)
    ContentPipeline.tsx   # Social media management (admin)
    AdminDashboard.tsx    # Admin metrics
    AIChatBox.tsx         # AI recovery coach
    Members.tsx           # Member portal for purchased products
  components/             # Shared components + ui/ (Radix/shadcn)
  hooks/                  # useUser, useMobile, useComposition
  lib/                    # trpc client, auth helpers
  App.tsx                 # Router (40+ routes via wouter)

server/                   # Express + tRPC backend
  _core/                  # Core infrastructure
    index.ts              # Express app, middleware, static serving, port (3000-3020)
    trpc.ts               # Procedure definitions (public/protected/admin)
    sdk.ts                # Session & auth utilities
    oauth.ts              # OAuth callback routes
    env.ts                # Environment variable config (check here for full list)
    llm.ts                # LLM provider chain (Forge → Gemini → OpenAI)
    imageGeneration.ts    # DALL-E 3 image generation
    voiceTranscription.ts # Speech-to-text
  routers.ts              # Main tRPC router (~5000 lines) — ALL API endpoints
  social/                 # Social media integrations
    scheduler.ts          # Content pipeline scheduler (~24k lines, cron-based)
    content-generator.ts  # AI content generation with brand voice
    twitter.ts            # X/Twitter API v2
    meta.ts               # Facebook + Instagram Graph API
    youtube.ts            # YouTube Data API v3
    linkedin.ts           # LinkedIn API
    heygen.ts             # HeyGen AI avatar video generation
    elevenlabs.ts         # ElevenLabs text-to-speech
    image-generator.ts    # DALL-E 3 image generation
    image-proxy.ts        # Image caching for Instagram (has pre-existing TS error)
  agent/                  # AI Agent system
    mission-control.ts    # Main autonomous agent (cron-based)
    content-feedback.ts   # Content modification agent
    research-creator.ts   # Research + product creation agent
  db.ts                   # Database helper functions
  stripe-webhook.ts       # Stripe payment webhook handler
  convertkit.ts           # ConvertKit email API (API key hardcoded here)
  storage.ts              # File storage (Forge proxy)

drizzle/                  # Database ORM
  schema.ts               # All table definitions (22+ tables)
  relations.ts            # Table relations
  migrations/             # SQL migrations

shared/                   # Shared TypeScript (types, constants, errors)
manuscript/               # Book manuscript files (full memoir)
products/                 # Product content (markdown)
  rewired_7_day_reset.md
  from_broken_to_whole_course.md
  from_broken_to_whole_video_scripts.md
  rewired_7_day_reset_video_scripts.md
  7_day_reset_workbook.md
  rewired_relief_toolkit.md
lead_magnets/             # Lead magnet source files (markdown)
pdf-templates/            # PDF generation templates
page_texts/               # Editable page copy
upload/                   # Uploaded images/assets
```

---

## 5. Products & Pricing

### Currently Selling
| Product | Price | Stripe Price ID | Status |
|---------|-------|----------------|--------|
| **7-Day REWIRED Reset** | $47 one-time | `price_1T0QQqC2dOpPzSOO61RNrJQR` | Active — selling |

### Built But Needs More Content
| Product | Price | Stripe Price ID | Status |
|---------|-------|----------------|--------|
| **From Broken to Whole** (30-day course) | $97 one-time | `price_1T83EwC2dOpPzSOOockMjc5R` | Content exists in markdown, needs to be turned into robust 30-day course worth $97 |
| **Bent Not Broken Circle** (monthly membership) | $29/month | `price_1T83FTC2dOpPzSOOQCWvWdJd` | Schema built, needs community features and content |

### Not Yet Published
| Product | Price | Stripe Price ID | Status |
|---------|-------|----------------|--------|
| **Crooked Lines memoir** (book) | $19.99 | `price_1T83CrC2dOpPzSOO7aeZQHEe` | Full manuscript exists in repo, needs Amazon listing or direct PDF sales page |

### Free Lead Magnets
| Lead Magnet | ConvertKit Form ID |
|-------------|-------------------|
| **First 3 Chapters** of the memoir (PDF) | 8815112 |
| **Recovery Toolkit** — 10 practical worksheets (PDF) | 8815131 |
| **Reading Guide** — discussion questions (PDF) | 8815140 |
| **AI Coach** — 10 free messages, then upgrade prompt | /ai-coach page |

### Revenue Flow
```
Visitor → Lead Magnet (free PDF) → Email Sequence (ConvertKit, 7 sequences, 31 emails)
→ Product Purchase (Stripe) → Webhook → ConvertKit Form + DB Purchase Record + Course Access
```

---

## 6. Social Media Pipeline

### How Content Gets Created and Posted

1. **Content Generation** (every 5 min cron): `scheduler.ts:processContentGeneration()`
   - Pulls pending items from `content_queue`
   - Uses `content-generator.ts` to prompt the LLM with brand context + platform rules
   - Auto-selects rotating CTA offers from `cta_offers` table
   - Auto-generates images via DALL-E 3 if the LLM suggests media
   - Marks items as `ready`

2. **Posting** (every 2 min cron): `scheduler.ts:processScheduledPosts()`
   - Finds `ready` items where `scheduled_for <= now`
   - Routes to platform-specific posting functions
   - Marks as `posted` with platform post ID/URL, or `failed` with error

3. **Metrics** (every 30 min cron): `scheduler.ts:updateEngagementMetrics()`
   - Fetches engagement stats from platform APIs
   - Updates `metrics` JSON on each posted item

### Platform Integration Status

| Platform | Module | Status | Notes |
|----------|--------|--------|-------|
| **Instagram** | `meta.ts` | **Working** | Posts photos + captions via Graph API. Images cached via `image-proxy.ts` |
| **Facebook** | `meta.ts` | **Working** | Text posts + photo posts to Page |
| **X / Twitter** | `twitter.ts` | **Broken** | Free tier is READ-ONLY. Needs Basic tier ($200/mo) or manual posting. Code handles this gracefully with `diagnoseTwitter()` |
| **LinkedIn** | `linkedin.ts` | **Built, not connected** | Needs `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` env vars |
| **YouTube** | `youtube.ts` + `heygen.ts` | **Partially working** | HeyGen generates avatar videos → uploads to YouTube. Token refresh issues if Google Cloud project is in "Testing" mode. Fix: publish to "Production" in Google Cloud Console → OAuth consent screen |
| **TikTok** | N/A | **No API** | Content generated but must be posted manually (TikTok has no public posting API) |
| **Podcast** | `elevenlabs.ts` | **Built, needs testing** | Generates audio via ElevenLabs TTS. Needs voice clone setup |

### X/Twitter Cost Breakdown
- Free tier ($0): read-only — cannot post
- Basic tier ($200/mo): 3,000 tweets/month
- Pro tier ($5,000/mo): enterprise, irrelevant
- Alternative: Buffer/Hootsuite ($15-30/mo) or post manually

### YouTube/HeyGen Pipeline
- `heygen.ts:scriptToVideo()` → creates AI avatar video from script (≤3,000 chars)
- Video generation is async (webhook callback or polling)
- After video ready → `youtube.ts:uploadVideo()` uploads to YouTube
- Common issue: Google Cloud project in "Testing" mode causes tokens to expire after 7 days. Fix: publish to "Production"
- `diagnoseYouTube()` function checks all credentials, tokens, and quota

---

## 7. AI/LLM System

### Provider Priority (`server/_core/llm.ts`)
1. **Forge** (Manus dev environment) — `BUILT_IN_FORGE_API_KEY`
2. **Google Gemini** (free tier) — `GOOGLE_API_KEY` → model: `gemini-2.5-flash`
3. **OpenAI** — `OPENAI_API_KEY` → model: `gpt-4o-mini`

All providers use OpenAI-compatible chat completions API format. Google Gemini free tier is currently the primary provider — zero cost for text generation. OpenAI is only used for DALL-E image generation.

### Content Generation
- `content-generator.ts` generates platform-specific content with brand voice
- Brand context loaded from `businesses` DB table (falls back to hardcoded Sober Strong context)
- Each platform has specific rules: max length, style, hashtag strategy, CTA placement
- Supports: X threads, IG posts, LinkedIn articles, FB posts, YouTube scripts, TikTok reels, podcast scripts

---

## 8. Agent System

### Mission Control (`server/agent/mission-control.ts`)
The autonomous "brain" that:
- Runs on cron loops
- Monitors all connected businesses
- Takes **risk-tiered actions**:
  - **Tier 1:** Auto-execute (post content, send scheduled emails)
  - **Tier 2:** Execute + notify (spend < $25, adjust schedule)
  - **Tier 3:** Ask first (spend > $25, new campaigns)
  - **Tier 4:** Must approve (financial decisions > $100, pricing changes)
- Generates daily briefings
- Proposes strategic improvements
- Frontend UI at `/admin/mission-control`

### Content Feedback Agent (`server/agent/content-feedback.ts`)
Accepts feedback about any content asset and:
- Analyzes what needs to change
- Retrieves current content from DB
- Uses AI to generate improved versions
- Can regenerate images via DALL-E
- Re-uploads to storage
- Logs all changes as auditable agent actions
- Risk-tiered: minor edits auto-apply, major changes need approval

### Research & Creation Agent (`server/agent/research-creator.ts`)
Autonomous research agent that:
- Conducts market research on topics/niches
- Analyzes competitors (strengths, weaknesses, pricing)
- Identifies content gaps and opportunities
- Drafts course outlines, lead magnets, content strategies
- Saves research reports to `agent_reports` table

---

## 9. Database Schema (MySQL via Drizzle)

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | Auth, roles (admin/user), OAuth + password login |
| `blog_posts` | Blog content with slugs, status, view counts |
| `email_subscribers` | Email capture with tags/segmentation |
| `lead_magnets` | Downloadable resources (PDFs) |
| `lead_magnet_downloads` | Download tracking |
| `purchases` | Stripe purchase records |
| `ai_coach_users` | AI Coach message count tracking (freemium: 10 free messages) |

### Course Tables
| Table | Purpose |
|-------|---------|
| `course_modules` | Module structure (8 modules per course) |
| `course_lessons` | Individual lessons with video URLs |
| `course_progress` | User completion tracking |
| `lessons` | Simplified flat structure for 7-Day Reset |

### Content Pipeline Tables
| Table | Purpose |
|-------|---------|
| `content_queue` | Core pipeline: pending → generating → ready → posting → posted/failed |
| `cta_offers` | Rotating CTAs with weighted selection |
| `content_templates` | Reusable content generation templates |
| `social_accounts` | Connected social media accounts |

### Business/Agent Tables
| Table | Purpose |
|-------|---------|
| `businesses` | Multi-business profiles (Sober Strong, Critzer's Cabinets, DataDisco) |
| `agent_actions` | Risk-tiered actions (tiers 1-4) |
| `agent_reports` | Daily briefings, weekly summaries, research reports |

### Affiliate Tables
| Table | Purpose |
|-------|---------|
| `affiliates` | Affiliate partners with referral codes |
| `affiliate_referrals` | Click/conversion tracking |

---

## 10. Architecture Decisions

- **Auth:** Session-based JWT in cookies, 1-year expiry, Scrypt hashing, Manus OAuth (`openId`)
- **API:** tRPC with `publicProcedure`, `protectedProcedure` (logged-in), `adminProcedure` (role check). tRPC client auto-infers types from `AppRouter` — new endpoints are automatically available on the frontend.
- **TypeScript paths:** `@/*` → `client/src/*`, `@shared/*` → `shared/*`
- **Large files:** `routers.ts` (~5000 lines, ~185K) contains ALL tRPC procedures — read specific sections, don't try to read the whole thing. `scheduler.ts` (~24k lines) contains the full social pipeline.
- **Deployment:** Railway auto-deploys from GitHub `main` branch
- **Social automation:** node-cron schedules content generation (5 min) + posting (2 min) + metrics (30 min)

---

## 11. Environment Variables

All set in Railway dashboard. Check `server/_core/env.ts` for the full list.

### Required
```
DATABASE_URL              # MySQL connection string
JWT_SECRET                # Cookie/auth secret
OWNER_OPEN_ID             # Admin user's OAuth ID
STRIPE_SECRET_KEY         # Stripe API key
STRIPE_WEBHOOK_SECRET     # Stripe webhook signing secret
```

### AI/LLM
```
GOOGLE_API_KEY            # Google Gemini (free tier, primary LLM)
OPENAI_API_KEY            # OpenAI (for DALL-E image generation)
```

### Social Media
```
META_PAGE_ACCESS_TOKEN    # Facebook/Instagram Graph API token
META_PAGE_ID              # Facebook Page ID
META_IG_USER_ID           # Instagram Business Account ID
TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_BEARER_TOKEN,
TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET  # X API (needs Basic $200/mo)
LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN  # LinkedIn (not yet configured)
```

### Video/Audio
```
YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI, YOUTUBE_REFRESH_TOKEN
HEYGEN_API_KEY            # HeyGen AI avatar video
ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID  # ElevenLabs voice synthesis
```

### Email
```
# NOTE: ConvertKit keys are HARDCODED in server/convertkit.ts, not in env vars
```

---

## 12. Frontend Pages

### Public Pages
- `/` — Homepage with memoir pitch, newsletter signup, CTAs
- `/about` — Shaun's story with photos
- `/memoir` — Book page with cover image
- `/blog` — Blog listing
- `/blog/:slug` — Individual blog posts
- `/resources` — Lead magnet downloads
- `/recovery-toolkit`, `/reading-guide`, `/first-3-chapters` — Individual lead magnet pages
- `/rewired-method` — REWIRED methodology explanation
- `/products` — Product catalog with Stripe checkout
- `/7-day-reset` — 7-Day Reset sales page
- `/thriving-sober` — Thriving Sober content
- `/ai-coach` — AI recovery coach (10 free messages)
- `/login` — Authentication
- `/members` — Member portal (purchased products)
- `/course/:productId` — Course delivery
- `/contact`, `/faqs`, `/terms-of-use`, `/refund-policy`, `/privacy-policy` — Standard pages

### Admin Pages (requires admin role)
- `/admin` — Admin dashboard
- `/admin/blog-editor` — Blog CRUD
- `/admin/videos` — Video management
- `/admin/content` — Content management
- `/admin/pipeline` — Content pipeline management (queue, scheduling)
- `/admin/mission-control` — Agent system dashboard (overview, approvals, briefings)
- `/admin/seed` — Database seeding
- `/admin/migrate` — Database migrations

---

## 13. Testing

- **Framework:** Vitest
- **Test files:** `server/auth.logout.test.ts`, `server/leadMagnets.test.ts`, `server/members.test.ts`
- **Run:** `pnpm run test`

---

## 14. What's Working vs What Needs Work

### Working Now
- Website live on shauncritzer.com
- Instagram auto-posting (content generation + DALL-E images + posting)
- Facebook auto-posting
- Blog system (CRUD + public pages)
- Email capture → ConvertKit
- Lead magnet downloads
- Stripe checkout for 7-Day Reset ($47)
- AI Coach (freemium, 10 messages)
- Mission Control agent dashboard (UI + backend)
- Content pipeline scheduler (cron jobs)
- User authentication + admin roles
- Member portal (purchase tracking)

### Needs Fixing
- **X/Twitter:** Needs paid API tier ($200/mo) or alternative approach
- **YouTube:** Token refresh issues — Google Cloud project may need "Production" publishing
- **HeyGen:** API key/credits may be exhausted
- **Pre-existing TypeScript error:** `image-proxy.ts` has a Map iteration issue (doesn't block deploy)

### Needs Building / Completing
- **30-Day Course Content:** "From Broken to Whole" at $97 needs full, robust 30-day curriculum. Current content is an 8-module outline. Needs to be worth the price tag.
- **Course delivery UI:** `/members/7-day-reset` and `/members/from-broken-to-whole` pages not built (video embedding, progress tracking, drip unlock, PDF workbooks)
- **Bent Not Broken Circle:** Monthly membership ($29/mo) needs community features
- **LinkedIn integration:** Code exists but env vars not configured
- **TikTok:** No posting API — manual only
- **Podcast pipeline:** ElevenLabs integration built but needs voice clone + distribution
- **Affiliate system:** Schema exists, code partially built, needs frontend
- **ConvertKit automation:** Remaining 23 emails need to be pasted into ConvertKit (manual task for Shaun). 6 automation rules need setup.
- **Memoir publication:** Not yet available for sale (Amazon or direct)

---

## 15. Known Issues & Technical Debt

1. **`server/routers.ts`** (~5000 lines, ~185K) — monolithic, contains ALL tRPC procedures. Read specific sections as needed.
2. **`server/social/scheduler.ts`** (~24k lines) — extremely large, should be modularized
3. **`todo.md`** (~530 lines) — accumulated since Nov 2025, mixes completed/incomplete, needs cleanup
4. **First 3 Chapters PDF** — may still show placeholder text instead of actual memoir content
5. **Amazon book URL** — still a placeholder link on homepage
6. **Favicon** — `logo-icon.png` exists but hasn't been set as the favicon
7. **ConvertKit API keys** — hardcoded in `server/convertkit.ts`, should move to env vars
8. **Storage** — still using Forge storage proxy (Manus origin), should migrate to Cloudflare R2

---

## 16. Business Strategy Context

### Revenue Model
1. **Digital Products** (primary): 7-Day Reset ($47), From Broken to Whole ($97)
2. **Membership** (recurring): Bent Not Broken Circle ($29/mo)
3. **Book** (one-time): Crooked Lines memoir ($19.99)
4. **Content Monetization** (long-term): YouTube ad revenue (need 1K subs + 4K watch hours)
5. **Lead Magnets** (top of funnel): Free PDFs → email list → course sales
6. **AI Coach** (upsell): 10 free messages → upgrade to $97 course
7. **Affiliate Revenue**: 30% commission on referred sales

### The Funnel
```
AWARENESS (free)           TRUST (free)            MONEY ($$$)
──────────────────         ──────────────          ──────────────
TikTok (viral reach)   →   Email List          →   7-Day Reset ($47)
X/Twitter (volume)     →   (ConvertKit)        →   From Broken to Whole ($97)
YouTube (SEO)          →   Podcast             →   Circle Membership ($29/mo)
Instagram (emotion)    →   FB Community        →   Affiliate Revenue (30%)
LinkedIn (authority)   →   YouTube (long form)  →   YouTube Ad Revenue
```

### Monetization by Platform
- **Instagram:** Brand building + product sales via CTAs. Need 10K+ followers for shopping.
- **Facebook:** Community building. FB Groups for membership audience.
- **X/Twitter:** Volume-based traffic machine. Even 1 course sale/month covers $200/mo API cost.
- **LinkedIn:** Authority + high-value leads. No direct monetization but drives $97 course sales.
- **YouTube:** Highest ceiling. YouTube Partner Program needs 1K subs + 4K watch hours. Recovery niche has $8-15 CPM.
- **TikTok:** Viral reach. TikTok Creativity Program needs 10K followers + 100K views/30 days.
- **Podcast:** Deep trust builder. 20-60 min episodes → high conversion to purchases.

### Multi-Business Vision
The Mission Control agent system manages multiple businesses:
1. **Sober Strong Academy** (shauncritzer.com) — recovery coaching, courses, content (primary)
2. **Critzer's Cabinets** (critzerscabinets.com) — cabinet business (separate domain, could benefit from AI phone answering via Bland.ai or Retell.ai)
3. **DataDisco** (datadisco.ai) — eventual SaaS platform for content automation
4. **Personal Brand** — freedomwithshaun.com (Udimi solo ads — keep running but don't associate with personal brand)

---

## 17. Immediate Priorities (March 2026)

### Revenue-Critical (do first)
1. **Build the "From Broken to Whole" 30-day course** — Only has 8-module outline. Needs full content to justify $97 price. Use Research Agent to study competitor courses. This is the biggest revenue driver.
2. **Complete course delivery UI** — Build `/members/7-day-reset` and `/members/from-broken-to-whole` pages with video embedding, progress tracking, drip unlock, PDF workbooks.
3. **Polish 7-Day Reset delivery** — Only product currently selling. Make the experience premium.
4. **Verify Stripe → ConvertKit → product delivery flow** end-to-end.

### Growth-Critical (do second)
5. **Fix YouTube pipeline** — Google Cloud "Testing" → "Production" mode, refresh tokens, HeyGen credits.
6. **Connect LinkedIn** — Set env vars and start posting.
7. **ConvertKit emails** — Shaun needs to paste 23 remaining emails + set up 6 automation rules.
8. **Grow email list** — Target 5K+ subscribers. Lead magnets + blog + social = funnel.

### Strategic Decisions Needed
9. **X/Twitter approach** — Pay $200/mo for API, use Buffer/Hootsuite ($15-30/mo), or post manually.
10. **Marketing strategy** — Organic platform priorities, posting frequency, paid ads (if any), content repurposing (1 piece → all platforms).

### Nice to Have
11. **Affiliate program frontend** — Schema exists, needs UI.
12. **Refactor large files** — Split `routers.ts` and `scheduler.ts`.
13. **Set favicon** — Quick win.
14. **Update Amazon book URL** — When published.
15. **Migrate storage** — Forge proxy → Cloudflare R2.

---

## 18. Key Files Reference

| File | Lines | What it does |
|------|-------|-------------|
| `server/routers.ts` | ~5000 | ALL tRPC API endpoints — read specific sections, not the whole file |
| `server/social/scheduler.ts` | ~24k | Full social media pipeline (cron: gen 5min, post 2min, metrics 30min) |
| `server/agent/mission-control.ts` | ~500 | Autonomous multi-business agent |
| `server/agent/content-feedback.ts` | — | Content modification agent (feedback → AI revision → re-upload) |
| `server/agent/research-creator.ts` | — | Research + product creation agent |
| `server/_core/index.ts` | ~400 | Express server setup, middleware, routes |
| `server/_core/llm.ts` | — | LLM provider chain (Forge → Gemini → OpenAI) |
| `server/_core/env.ts` | — | All environment variables the app reads |
| `server/stripe-webhook.ts` | ~200 | Stripe payment webhook handler |
| `server/convertkit.ts` | ~150 | ConvertKit email API (keys hardcoded here) |
| `drizzle/schema.ts` | ~520 | All database table definitions |
| `client/src/App.tsx` | ~300 | All frontend routes (40+) |
| `client/src/pages/Products.tsx` | ~500 | Product cards, pricing, Stripe checkout |
| `todo.md` | ~530 | Historical task tracker (Nov 2025 – present) |

---

## 19. Notes for New Sessions

- **Don't read `routers.ts` or `scheduler.ts` in full** — they're massive. Read specific sections as needed.
- **tRPC auto-infers types** from `AppRouter` — new endpoints are automatically available on the frontend.
- **Pre-existing TS error** in `image-proxy.ts` (Map iteration) — doesn't block deploy, ignore it.
- **ConvertKit keys are hardcoded** in `server/convertkit.ts`, not in env vars.
- **Check `server/_core/env.ts`** for the full list of environment variables.
- **Manus platform origin** — some patterns (Forge storage, Manus OAuth) reflect the original build environment.
