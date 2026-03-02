# CLAUDE.md — Sober Strong Academy / shauncritzer.com

> **Purpose of this file:** Give every future Claude session full context on the project — what it is, what's built, what works, what doesn't, what the goals are, and what to work on next. This is the single source of truth.

---

## 1. What This Project Is

A full-stack platform for **Shaun Critzer's** recovery coaching brand, built around his memoir *"Crooked Lines: Bent, Not Broken"* — a 13-year journey from addiction to sobriety. The platform sells digital products, runs automated social media content, delivers courses, captures email leads, and includes an AI recovery coach.

**Live at:** shauncritzer.com (Railway deployment, auto-deploys from GitHub `main` branch)

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite 7, Tailwind CSS 4, Radix UI (shadcn), wouter routing, Framer Motion |
| Backend | Express + tRPC 11, Drizzle ORM (MySQL), JWT auth (jose), Scrypt passwords |
| Payments | Stripe (checkout sessions, webhooks, subscriptions) |
| Email | ConvertKit (forms, sequences, automation) |
| Social | Twitter/X, Facebook, Instagram, LinkedIn, YouTube (OAuth + API posting) |
| AI/Media | OpenAI/Google AI (content), HeyGen (avatar video), ElevenLabs (voice), DALL-E (images) |
| Storage | AWS S3 (PDFs, images, media) |
| Package Manager | pnpm |
| Database | MySQL via Drizzle ORM |
| Hosting | Railway (auto-deploy from GitHub) |

---

## 3. Commands

```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (Express + Vite)
pnpm run build        # Production build → dist/
pnpm run start        # Run production server
pnpm run check        # TypeScript type checking
pnpm run test         # Run Vitest tests
pnpm run db:push      # Apply database schema changes
pnpm run format       # Prettier formatting
```

---

## 4. Project Structure

```
client/src/               # React frontend
  pages/                  # 30+ route pages
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
  hooks/                  # useAuth, useMobile, useComposition
  lib/                    # trpc client, auth helpers
  App.tsx                 # Router (40+ routes via wouter)

server/                   # Express backend
  _core/                  # Server setup, tRPC config, auth, env, OAuth
    index.ts              # Main entry point (Express app, middleware, port)
    trpc.ts               # Procedure definitions (public/protected/admin)
    sdk.ts                # Session & auth utilities
    oauth.ts              # OAuth callback routes
    env.ts                # Environment variable config
  routers.ts              # Main tRPC router (~3800 lines) — ALL API endpoints
  social/                 # Social media integrations
    scheduler.ts          # Content pipeline scheduler (~24k lines)
    twitter.ts, meta.ts, youtube.ts, linkedin.ts
    content-generator.ts  # AI content generation
    heygen.ts             # AI avatar video
    elevenlabs.ts         # Voice synthesis
    image-generator.ts
  agent/
    mission-control.ts    # Autonomous multi-business agent
  db.ts                   # Database helper functions
  stripe-webhook.ts       # Stripe payment webhook handler
  convertkit.ts           # Email marketing integration
  storage.ts              # S3 file storage

drizzle/                  # Database ORM
  schema.ts               # All table definitions (22+ tables)
  relations.ts            # Table relations
  migrations/             # SQL migrations

shared/                   # Shared TypeScript (types, constants, errors)
manuscript/               # Book manuscript files
lead_magnets/             # Lead magnet content (markdown)
pdf-templates/            # PDF generation templates
page_texts/               # Editable page content
```

---

## 5. Products & Pricing

### Live Products
| Product | Price | Stripe Price ID | Status |
|---------|-------|----------------|--------|
| **7-Day REWIRED Reset** | $47 one-time | `price_1SxAyzC2dOpPzSOOmqjxVQIB` | Live & purchasable |
| **Bent Not Broken Circle** | $29/month | `price_1SYt3iC2dOpPzSOOR7dbuGtY` | Live (monthly subscription) |

### Coming Soon Products
| Product | Price | Stripe Price ID | Status |
|---------|-------|----------------|--------|
| **Crooked Lines memoir** (book) | $19.99 | `price_1SbOUTC2dOpPzSOOOdxient8` | Marked "Coming Soon" |
| **From Broken to Whole** (30-day course) | $97 one-time | `price_1SYt3kC2dOpPzSOOpAokf1UQ` | Marked "Coming Soon" — content outline exists (8 modules), needs full buildout |

### Free Lead Magnets
- **First 3 Chapters** of the memoir (PDF)
- **Recovery Toolkit** — 10 practical worksheets (PDF)
- **Reading Guide** — discussion questions (PDF)

### Revenue Flow
```
Visitor → Lead Magnet (free PDF) → Email Sequence (ConvertKit) → Product Purchase (Stripe)
                                                                         ↓
                                                              Stripe Webhook → ConvertKit Form
                                                              → Purchase record in DB
                                                              → Course access unlocked
```

---

## 6. What's Working (as of March 2026)

### Fully Functional
- **Website** — all public pages live (Home, About, Memoir, Blog, Products, Resources, AI Coach, etc.)
- **Auth** — login/register with JWT cookies, admin/user roles, Scrypt password hashing
- **Blog system** — 12+ posts, blog editor for admin, CRUD via tRPC
- **Lead magnets** — PDF downloads working (First 3 Chapters, Recovery Toolkit, Reading Guide)
- **Email capture** — forms on homepage, blog, resources → ConvertKit integration
- **Stripe checkout** — 7-Day Reset purchasable, webhook fires on completion
- **AI Coach** — 10 free messages with paywall → upgrade prompt to $97 course
- **Social media** — Instagram + Facebook auto-posting via scheduler
- **Admin dashboard** — metrics, blog editor, content pipeline, Mission Control
- **ConvertKit** — API connected, 10 tags created, 7 forms with UIDs, First 3 Chapters welcome series (5 emails)

### Partially Working
- **YouTube** — OAuth integration built, but token refresh has issues
- **LinkedIn** — posting code built, not fully connected/tested
- **Course delivery** — database schema exists (modules, lessons, progress), but UI pages for `/members/7-day-reset` and `/members/from-broken-to-whole` are not built
- **Member portal** — `/members` page exists but doesn't show progress indicators or "Continue Learning" flows
- **Affiliate system** — schema built (affiliates, referrals tables), no frontend

### Not Working / Not Connected
- **X/Twitter** — requires $200/mo API tier (Basic plan) for write access; currently blocked
- **TikTok** — domain verification only, no posting
- **Podcast** — code stub exists, not implemented
- **30-Day Course content** — only has 8-module outline; needs full $97-worth of content
- **Bent Not Broken Circle** — membership product exists but no community features built
- **ConvertKit remaining emails** — 23 of 31 emails still need to be pasted in by Shaun
- **ConvertKit automation rules** — 6 automation rules need to be set up by Shaun

---

## 7. Database Schema (key tables)

| Table | Purpose |
|-------|---------|
| `users` | Auth (id, email, passwordHash, role: admin/user) |
| `blog_posts` | Published articles with view tracking |
| `email_subscribers` | Email list with tags + source tracking |
| `lead_magnets` | Free PDF products (title, S3 URL, download count) |
| `lead_magnet_downloads` | Download tracking per subscriber |
| `purchases` | Stripe payment records (userId, productId, amount, status) |
| `course_modules` | Course structure (productId, moduleNumber, unlockDay) |
| `course_lessons` | Individual lessons (videoUrl, duration, PDFs) |
| `course_progress` | User completion tracking |
| `lessons` | Simplified flat structure for 7-Day Reset |
| `ai_coach_users` | AI coach message counts + unlimited access flag |
| `content_queue` | Social media content pipeline items |
| `cta_offers` | Rotating CTAs for monetization |
| `social_accounts` | Connected social platform credentials |
| `affiliates` | Affiliate referral codes + commission rates |
| `affiliate_referrals` | Click/conversion tracking |
| `content_templates` | AI content generation templates |
| `businesses` | Multi-business agent config (Sober Strong, Critzer's Cabinets, DataDisco, etc.) |
| `agent_actions` | Mission Control agent actions with risk tiers |
| `agent_reports` | Daily/weekly agent briefings |

---

## 8. Architecture Decisions

- **Auth:** Session-based JWT in cookies, 1-year expiry, Scrypt hashing
- **API:** tRPC with `publicProcedure`, `protectedProcedure` (logged-in), `adminProcedure` (role check)
- **TypeScript paths:** `@/*` → `client/src/*`, `@shared/*` → `shared/*`
- **Large files:** `routers.ts` (~3800 lines) contains ALL tRPC endpoints; `scheduler.ts` (~24k lines) contains the full social pipeline. These should eventually be split.
- **Deployment:** Railway auto-deploys from GitHub `main` branch
- **Social automation:** node-cron schedules content generation + posting via platform APIs

---

## 9. Environment Variables

### Required
```
DATABASE_URL              # MySQL connection string
STRIPE_SECRET_KEY         # Stripe API key
STRIPE_WEBHOOK_SECRET     # Stripe webhook signing secret
STRIPE_PUBLISHABLE_KEY    # Stripe client-side key
ADMIN_SECRET              # Admin bootstrap secret
```

### Optional (enable specific features)
```
# Social Media
TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_BEARER_TOKEN
META_PAGE_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID
YOUTUBE_REFRESH_TOKEN
LINKEDIN_ACCESS_TOKEN

# AI / Content
OPENAI_API_KEY (or GOOGLE_API_KEY)
HEYGEN_API_KEY
ELEVENLABS_API_KEY

# Email
CONVERTKIT_API_KEY, CONVERTKIT_API_SECRET

# Storage
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
```

---

## 10. Testing

- **Framework:** Vitest
- **Test files:** `server/auth.logout.test.ts`, `server/leadMagnets.test.ts`, `server/members.test.ts`
- **Run:** `pnpm run test`

---

## 11. Known Issues & Technical Debt

1. **`server/routers.ts`** (~3800 lines) — monolithic, should be split into domain routers
2. **`server/social/scheduler.ts`** (~24k lines) — extremely large, should be modularized
3. **`todo.md`** (~530 lines) — accumulated since Nov 2025, mixes completed/incomplete, needs cleanup
4. **First 3 Chapters PDF** — may still show placeholder text instead of actual memoir content (flagged previously but fix unclear)
5. **Amazon book URL** — still a placeholder link on homepage
6. **Favicon** — `logo-icon.png` exists but hasn't been set as the favicon
7. **X/Twitter** — blocked by $200/mo API cost; need to decide: pay, use alternative, or skip

---

## 12. Immediate Priorities (March 2026)

### Revenue-Critical (do first)
1. **Build the "From Broken to Whole" 30-day course** — Only has an 8-module outline. Needs full content to justify $97 price. This is the biggest revenue driver.
2. **Complete course delivery UI** — Build `/members/7-day-reset` and `/members/from-broken-to-whole` pages with video embedding, progress tracking, drip unlock, PDF workbooks.
3. **Verify Stripe → ConvertKit → product delivery flow** end-to-end. Purchase should create DB record, trigger email, and grant course access.
4. **Polish member portal** — Add progress indicators, "Continue Learning" buttons, purchased product cards.

### Growth-Critical (do second)
5. **Fix YouTube pipeline** — Token refresh issues blocking auto-posting.
6. **Connect LinkedIn** — Code is built, just needs activation + testing.
7. **ConvertKit emails** — Shaun needs to paste 23 remaining emails + set up 6 automation rules. (Manual task, not code.)
8. **Email list growth** — Target 5K+ subscribers. Lead magnets + blog + social are the funnel.

### Nice to Have
9. **X/Twitter decision** — Pay $200/mo or find alternative (e.g., manual posting, scheduling tool).
10. **Affiliate program frontend** — Schema exists, needs UI.
11. **Refactor large files** — Split `routers.ts` and `scheduler.ts`.
12. **Set favicon** — Quick win.
13. **Update Amazon book URL** — When published.

---

## 13. Business Context

### Brand: Sober Strong Academy
- **Founder:** Shaun Critzer — 13+ years sober, recovery coach
- **Audience:** People in recovery from addiction (gender-inclusive, not men-only)
- **Method:** REWIRED — proprietary recovery framework combining neuroscience, somatic healing, inner child work
- **Competitive edge:** Real story (memoir) + AI-powered coaching + automated content engine

### Revenue Streams
1. **7-Day REWIRED Reset** — $47 entry product (live)
2. **From Broken to Whole** — $97 transformation course (coming soon)
3. **Bent Not Broken Circle** — $29/month community membership (coming soon)
4. **Crooked Lines memoir** — $19.99 book (coming soon)
5. **AI Coach** — 10 free messages → upsell to course
6. **Affiliate program** — 30% commission (schema built, no frontend)

### Funnel
```
Social Media (auto-posted) → Website → Lead Magnet (free PDF)
→ Email Nurture Sequence (7 sequences, 31 emails total)
→ Product Purchase ($47 → $97 → $29/month)
```

### Multi-Business Agent (Mission Control)
The platform includes an autonomous agent system that can manage multiple businesses:
- Sober Strong Academy (primary)
- Critzer's Cabinets (contracting business)
- DataDisco (SaaS concept)
- Personal Brand

Risk-tiered actions: Tier 1 = auto-execute, Tier 2 = execute + notify, Tier 3 = ask first, Tier 4 = require approval.

---

## 14. Key Files Reference

| File | Lines | What it does |
|------|-------|-------------|
| `server/routers.ts` | ~3800 | ALL tRPC API endpoints (auth, blog, leads, courses, products, stripe, ai coach, content, admin) |
| `server/social/scheduler.ts` | ~24k | Full social media pipeline (content generation, scheduling, posting, metrics) |
| `server/agent/mission-control.ts` | ~500 | Autonomous multi-business agent |
| `server/_core/index.ts` | ~400 | Express server setup, middleware, routes |
| `server/stripe-webhook.ts` | ~200 | Stripe payment webhook handler |
| `server/convertkit.ts` | ~150 | ConvertKit email API integration |
| `drizzle/schema.ts` | ~520 | All database table definitions |
| `client/src/App.tsx` | ~300 | All frontend routes (40+) |
| `client/src/pages/Products.tsx` | ~500 | Product cards, pricing, Stripe checkout |
| `todo.md` | ~530 | Historical task tracker (Nov 2025 – present) |
