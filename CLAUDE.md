# CLAUDE.md - Sober Strong Academy / shauncritzer.com Project State

> **Last updated:** March 1, 2026
> **Owner:** Shaun Critzer
> **Live site:** https://shauncritzer.com (hosted on Railway)
> **Repo:** github.com/shauncritzer/memoir
> **Primary branch:** `claude/add-user-authentication-y4yjO`

---

## WHAT THIS PROJECT IS

This is a full-stack web application for **Shaun Critzer's personal brand and recovery coaching business** ("Sober Strong Academy"). It's an all-in-one platform that includes:

1. **A public website** (shauncritzer.com) - memoir pitch, blog, resources, product sales
2. **An automated social media content pipeline** - generates, schedules, and posts to 7 platforms
3. **An autonomous AI agent system ("Mission Control")** - manages content, business operations, and strategy
4. **A course/membership delivery platform** - paid products with Stripe checkout
5. **An email marketing system** - ConvertKit integration with lead magnets and sequences
6. **An affiliate program** - referral tracking and commission system

### The Person Behind It

Shaun Critzer is a recovery coach, author of the memoir "Crooked Lines: Bent, Not Broken", former Mr. Teen USA competitor, and founder of the REWIRED methodology. His brand focuses on addiction recovery through trauma-informed, neuroscience-based approaches. His core message: "You're not broken, you're bent — recovery is possible."

He also runs **Critzer's Cabinets** (a cabinet business) and has an affiliate marketing business at **freedomwithshaun.com** (Udimi solo ads). The Mission Control agent system is designed to eventually manage all these businesses.

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + TailwindCSS 4 + Radix UI |
| Backend | Express + tRPC (v11) + Node.js |
| Database | MySQL (Railway) via Drizzle ORM |
| Auth | Custom JWT (jose) + Manus OAuth |
| Payments | Stripe (checkout sessions + webhooks) |
| Email | ConvertKit API |
| AI/LLM | Google Gemini (free tier, primary) → OpenAI (fallback + DALL-E images) |
| Storage | Forge storage proxy (Manus) — intended to move to Cloudflare R2 |
| Hosting | Railway (auto-deploys from GitHub) |
| Routing | wouter (client-side) |
| State | TanStack React Query + tRPC hooks |

### Build & Run

```bash
pnpm install          # Install dependencies
pnpm dev              # Development server (tsx watch)
pnpm build            # Production build (vite + esbuild)
pnpm start            # Production server
pnpm check            # TypeScript check (NOTE: image-proxy.ts has a pre-existing TS error with Map iteration)
pnpm db:push          # Run drizzle migrations
```

---

## ARCHITECTURE OVERVIEW

### Directory Structure

```
memoir/
├── client/src/          # React frontend
│   ├── pages/           # All page components (34 pages)
│   ├── components/      # Shared UI components (AdminRoute, etc.)
│   ├── hooks/           # Custom hooks (useUser, etc.)
│   └── lib/             # tRPC client, utils
├── server/              # Express + tRPC backend
│   ├── _core/           # Core: index.ts (Express), env.ts, llm.ts, auth
│   ├── agent/           # AI Agent system
│   │   ├── mission-control.ts   # Main autonomous agent (cron-based)
│   │   ├── content-feedback.ts  # Content modification agent
│   │   └── research-creator.ts  # Research + product creation agent
│   ├── social/           # Social media integrations
│   │   ├── scheduler.ts         # Cron-based content pipeline
│   │   ├── content-generator.ts # AI content generation (LLM prompts)
│   │   ├── twitter.ts           # X/Twitter API v2
│   │   ├── meta.ts              # Facebook + Instagram Graph API
│   │   ├── linkedin.ts          # LinkedIn API
│   │   ├── youtube.ts           # YouTube Data API v3
│   │   ├── heygen.ts            # HeyGen AI avatar video generation
│   │   ├── elevenlabs.ts        # ElevenLabs text-to-speech
│   │   ├── image-generator.ts   # DALL-E 3 image generation
│   │   └── image-proxy.ts       # Image caching for Instagram
│   ├── routers.ts       # ALL tRPC procedures (massive file ~5000 lines)
│   ├── db.ts            # Database queries
│   ├── convertkit.ts    # Email marketing API
│   ├── storage.ts       # File storage (Forge proxy)
│   └── stripe-webhook.ts # Stripe webhook handler
├── drizzle/
│   └── schema.ts        # Database schema (all tables)
├── products/            # Product content (markdown)
│   ├── rewired_7_day_reset.md
│   ├── from_broken_to_whole_course.md
│   ├── from_broken_to_whole_video_scripts.md
│   ├── rewired_7_day_reset_video_scripts.md
│   ├── 7_day_reset_workbook.md
│   └── rewired_relief_toolkit.md
├── lead_magnets/        # Lead magnet source files
├── page_texts/          # Static page copy
└── upload/              # Uploaded images/assets
```

### Database Schema (MySQL via Drizzle)

**Core Tables:**
- `users` — Auth, roles (admin/user), OAuth + password login
- `blog_posts` — Blog content with slugs, status, view counts
- `email_subscribers` — Email capture with tags/segmentation
- `lead_magnets` — Downloadable resources (PDFs)
- `lead_magnet_downloads` — Download tracking
- `purchases` — Stripe purchase records
- `ai_coach_users` — AI Coach message count tracking (freemium: 10 free messages)

**Course Tables:**
- `course_modules` — Module structure (8 modules per course)
- `course_lessons` — Individual lessons with video URLs
- `course_progress` — User completion tracking
- `lessons` — Simplified flat structure for 7-Day Reset

**Content Pipeline Tables:**
- `content_queue` — The core pipeline: pending → generating → ready → posting → posted/failed
- `cta_offers` — Rotating CTAs with weighted selection
- `content_templates` — Reusable content generation templates
- `social_accounts` — Connected social media accounts

**Business/Agent Tables:**
- `businesses` — Multi-business profiles (Sober Strong, Critzer's Cabinets, DataDisco)
- `agent_actions` — Risk-tiered actions (tiers 1-4)
- `agent_reports` — Daily briefings, weekly summaries, research reports

**Affiliate Tables:**
- `affiliates` — Affiliate partners with referral codes
- `affiliate_referrals` — Click/conversion tracking

---

## PRODUCTS & PRICING

### Currently Selling (Ready)
| Product | Price | Stripe Price ID | Status |
|---------|-------|----------------|--------|
| 7-Day REWIRED Reset | $47 | `price_1SxAyzC2dOpPzSOOmqjxVQIB` | **Active - selling** |

### Built But Needs More Content
| Product | Price | Stripe Price ID | Status |
|---------|-------|----------------|--------|
| From Broken to Whole (30-day course) | $97 | `price_1SYt3kC2dOpPzSOOpAokf1UQ` | Content exists in markdown, **needs to be turned into a robust 30-day course worth $97** |
| Bent Not Broken Circle (monthly membership) | $29/mo | `price_1SYt3iC2dOpPzSOOR7dbuGtY` | Schema built, **needs community features and content** |

### Free Lead Magnets
- First 3 Chapters of memoir (PDF) — ConvertKit form 8815112
- Recovery Toolkit (PDF) — ConvertKit form 8815131
- Reading Guide (PDF) — ConvertKit form 8815140
- AI Coach (10 free messages, then upgrade prompt) — `/ai-coach` page

### The Memoir
- "Crooked Lines: Bent, Not Broken" — full manuscript exists in the repo
- **Not yet published for sale** — needs Amazon listing or direct PDF sales page
- Price planned: $19.99

---

## SOCIAL MEDIA PIPELINE

### How Content Gets Created and Posted

1. **Content Generation** (every 5 min cron): `scheduler.ts:processContentGeneration()`
   - Pulls `pending` items from `content_queue`
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
| **X / Twitter** | `twitter.ts` | **Broken** | Free tier is READ-ONLY. Needs Basic tier ($200/mo) or manual posting |
| **LinkedIn** | `linkedin.ts` | **Built, not connected** | Needs `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` env vars |
| **YouTube** | `youtube.ts` + `heygen.ts` | **Partially working** | HeyGen generates avatar videos → uploads to YouTube. Token refresh issues if Google Cloud project is in "Testing" mode |
| **TikTok** | N/A | **No API** | Content generated but must be posted manually (TikTok has no public posting API) |
| **Podcast** | `elevenlabs.ts` | **Built, needs testing** | Generates audio via ElevenLabs TTS. Needs voice clone setup |

### X/Twitter Specifics
- The X API Free tier ($0) is **read-only** — cannot post tweets at all
- Basic tier: $200/month for 3,000 tweets/month
- Pro tier: $5,000/month (enterprise, irrelevant)
- Alternative: Use Buffer/Hootsuite ($15-30/mo) or post manually
- The code handles this gracefully with `diagnoseTwitter()` and clear error messages

### YouTube/HeyGen Pipeline
- `heygen.ts:scriptToVideo()` → creates AI avatar video from script
- Script must be ≤ 3,000 characters
- Video generation is async (webhook callback or polling)
- After video is ready → `youtube.ts:uploadVideo()` uploads to YouTube
- **Common issue**: Google Cloud project in "Testing" mode causes tokens to expire after 7 days. Fix: publish to "Production" in Google Cloud Console → OAuth consent screen
- `diagnoseYouTube()` function checks all credentials, tokens, and quota

---

## AI/LLM SYSTEM

### Provider Priority (server/_core/llm.ts)
1. **Forge** (Manus dev environment) — `BUILT_IN_FORGE_API_KEY`
2. **Google Gemini** (free tier) — `GOOGLE_API_KEY` → model: `gemini-2.5-flash`
3. **OpenAI** — `OPENAI_API_KEY` → model: `gpt-4o-mini`

All providers use OpenAI-compatible chat completions API format.

Google Gemini free tier is currently the primary provider — **zero cost for text generation**.
OpenAI is only used for DALL-E image generation (requires `OPENAI_API_KEY`).

### Content Generation
- `content-generator.ts` generates platform-specific content with brand voice
- Brand context loaded from `businesses` DB table (falls back to hardcoded Sober Strong context)
- Each platform has specific rules: max length, style, hashtag strategy, CTA placement
- Supports: X threads, IG posts, LinkedIn articles, FB posts, YouTube scripts, TikTok reels, podcast scripts

---

## AGENT SYSTEM

### Mission Control (`server/agent/mission-control.ts`)
The autonomous "brain" that:
- Runs on cron loops
- Monitors all connected businesses
- Takes risk-tiered actions:
  - **Tier 1**: Auto-execute (post content, send scheduled emails)
  - **Tier 2**: Execute + notify (spend < $25, adjust schedule)
  - **Tier 3**: Ask first (spend > $25, new campaigns)
  - **Tier 4**: Must approve (financial decisions > $100, pricing changes)
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

## ENVIRONMENT VARIABLES

All set in Railway dashboard:

### Required
- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — Cookie/auth secret
- `OWNER_OPEN_ID` — Admin user's OAuth ID
- `STRIPE_SECRET_KEY` — Stripe API key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret

### AI/LLM
- `GOOGLE_API_KEY` — Google Gemini (free tier, primary LLM)
- `OPENAI_API_KEY` — OpenAI (for DALL-E image generation)

### Social Media
- `META_PAGE_ACCESS_TOKEN` — Facebook/Instagram Graph API token
- `META_PAGE_ID` — Facebook Page ID
- `META_IG_USER_ID` — Instagram Business Account ID
- `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_BEARER_TOKEN`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` — X API (needs Basic tier $200/mo)
- `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN` — LinkedIn (not yet configured)

### Video/Audio
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`, `YOUTUBE_REFRESH_TOKEN` — YouTube upload
- `HEYGEN_API_KEY` — HeyGen AI avatar video generation
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` — ElevenLabs voice synthesis

### Email
- ConvertKit keys are **hardcoded** in `server/convertkit.ts` (API key: `dZ4CxMb5Zwp-5jy87pwcvQ`)

---

## FRONTEND PAGES

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

## WHAT'S WORKING vs WHAT NEEDS WORK

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
- **X/Twitter**: Needs paid API tier ($200/mo) or alternative approach
- **YouTube**: Token refresh issues — Google Cloud project may need "Production" publishing
- **HeyGen**: API key/credits may be exhausted
- **Pre-existing TypeScript error**: `image-proxy.ts` has a Map iteration issue (doesn't block deploy)

### Needs Building / Completing
- **30-Day Course Content**: The "From Broken to Whole" course at $97 needs a full, robust 30-day curriculum. Current content is an 8-module outline. Needs to be worth the price tag.
- **Bent Not Broken Circle**: Monthly membership ($29/mo) needs community features
- **LinkedIn integration**: Code exists but env vars not configured
- **TikTok**: No posting API — manual only
- **Podcast pipeline**: ElevenLabs integration built but needs voice clone + distribution
- **Affiliate system**: Schema exists, code partially built, needs frontend
- **ConvertKit automation**: Remaining 23 emails need to be pasted into ConvertKit (manual task for Shaun)
- **Memoir publication**: Not yet available for sale

---

## BUSINESS STRATEGY CONTEXT

### Revenue Model
1. **Digital Products** (primary): 7-Day Reset ($47), From Broken to Whole ($97)
2. **Membership** (recurring): Bent Not Broken Circle ($29/mo)
3. **Content Monetization** (long-term): YouTube ad revenue (need 1K subs + 4K watch hours)
4. **Lead Magnets** (top of funnel): Free PDFs → email list → course sales
5. **AI Coach** (upsell): 10 free messages → upgrade to $97 course
6. **Affiliate Revenue**: 30% commission on referred sales

### The Funnel
```
AWARENESS (free)           TRUST (free)            MONEY ($$$)
─────────────────          ──────────────          ──────────────
TikTok (viral reach)   →   Email List          →   7-Day Reset ($47)
X/Twitter (volume)     →   (ConvertKit)        →   From Broken to Whole ($97)
YouTube (SEO)          →   Podcast             →   Circle Membership ($29/mo)
Instagram (emotion)    →   FB Community        →   Affiliate Revenue (30%)
LinkedIn (authority)   →   YouTube (long form)  →   YouTube Ad Revenue
```

### Monetization by Platform
- **Instagram**: Brand building + product sales via CTAs. Need 10K+ followers for shopping.
- **Facebook**: Community building. FB Groups for membership audience.
- **X/Twitter**: Volume-based traffic machine. Even 1 course sale/month covers API cost.
- **LinkedIn**: Authority + high-value leads. No direct monetization but drives $97 course sales.
- **YouTube**: Highest ceiling. YouTube Partner Program needs 1K subs + 4K watch hours. Recovery niche has $8-15 CPM.
- **TikTok**: Viral reach. TikTok Creativity Program needs 10K followers + 100K views/30 days.
- **Podcast**: Deep trust builder. 20-60 min episodes → high conversion to purchases.

### Multi-Business Vision
The Mission Control agent system is designed to manage multiple businesses:
1. **Sober Strong Academy** (shauncritzer.com) — recovery coaching, courses, content
2. **Critzer's Cabinets** (critzerscabinets.com) — cabinet business (separate domain)
3. **DataDisco** (datadisco.ai) — eventual SaaS platform for content automation
4. **Personal Brand** — freedomwithshaun.com (affiliate/traffic selling — being deprioritized)

### Shaun's Other Businesses/Assets
- **freedomwithshaun.com**: Udimi solo ads business (buying at $0.20, selling at $0.40). Thin margins but active income. Plan: keep running but don't associate with personal brand.
- **Critzer's Cabinets**: Cabinet shop — could benefit from AI phone answering (Bland.ai or Retell.ai for inbound calls)
- **Affiliate networks**: Clickbank, Udimi, various MMO offers

---

## IMMEDIATE PRIORITIES (as of March 2026)

1. **Create a solid 30-day "From Broken to Whole" course** — This needs to be worth $97. The current content is an 8-module outline. Use the Research Agent to study competitor courses and build something comprehensive.

2. **Fix YouTube pipeline** — Ensure Google Cloud project is in "Production" mode, refresh tokens work, and HeyGen has credits.

3. **Decide on X/Twitter approach** — Either pay $200/mo for API, use Buffer/Hootsuite, or skip automated X posting.

4. **Build organic + paid marketing strategy** — Need a clear gameplan for:
   - Which organic platforms to prioritize and posting frequency
   - Whether paid ads (Facebook/Instagram ads, X promoted posts) are worth it at this stage
   - Content repurposing strategy (1 piece → all platforms)

5. **Connect LinkedIn** — Set env vars and start posting.

6. **Build the 7-Day Rewired Reset into a premium experience** — This is the only product currently selling. Make sure the delivery is polished.

7. **Grow email list** — Currently the funnel goes: social content → lead magnet → email → course sale. Need to get to 5K+ subscribers.

---

## IMPORTANT NOTES FOR NEW SESSIONS

- The `routers.ts` file is massive (~5000 lines, ~185K). It contains ALL tRPC procedures. Read specific sections as needed, don't try to read the whole thing.
- The tRPC client auto-infers types from `AppRouter`, so new endpoints are automatically available on the frontend.
- There's a pre-existing TypeScript error in `image-proxy.ts` (Map iteration). It doesn't block deployment.
- ConvertKit API keys are **hardcoded** in `server/convertkit.ts` — not in env vars.
- The site was originally built by the Manus AI platform. Some patterns (Forge storage, Manus OAuth) reflect that origin.
- Always check `server/_core/env.ts` for the full list of environment variables the app reads.
- When making changes, commit to `claude/add-user-authentication-y4yjO` branch and push.
- The owner (Shaun) communicates informally and appreciates direct, honest answers. No corporate speak.
