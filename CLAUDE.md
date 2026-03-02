# CLAUDE.md - Shaun Critzer Recovery Platform

## Project Overview
Full-stack TypeScript platform for Shaun Critzer's memoir "Crooked Lines: Bent, Not Broken" — a recovery coaching brand with digital products, courses, blog, AI coach, social media automation, and email marketing.

## Tech Stack
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, Radix UI (shadcn), wouter routing, Framer Motion
- **Backend:** Express + tRPC 11, Drizzle ORM (MySQL), Stripe payments, JWT auth (jose)
- **Integrations:** ConvertKit (email), Twitter/Meta/YouTube/LinkedIn (social), OpenAI (AI content), HeyGen (avatar video), ElevenLabs (voice), AWS S3 (storage)
- **Package Manager:** pnpm

## Commands
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

## Project Structure
```
client/src/           # React frontend
  pages/              # 30+ route pages (Home, Admin, Blog, Products, Course, MissionControl, etc.)
  components/         # Shared components + ui/ (Radix/shadcn)
  hooks/              # useAuth, useMobile, useComposition
  lib/                # trpc client, auth helpers
  App.tsx             # Router (40+ routes via wouter)

server/               # Express backend
  _core/              # Server setup (index.ts), tRPC config, auth, env, OAuth
  routers.ts          # Main tRPC router (~3800 lines) — all API endpoints
  social/             # Social media integrations (Twitter, Meta, YouTube, scheduler)
  agent/              # Mission Control autonomous agent
  db.ts               # Database helper functions
  stripe-webhook.ts   # Stripe payment webhook
  convertkit.ts       # Email marketing integration
  storage.ts          # S3 file storage

drizzle/              # Database ORM
  schema.ts           # Table definitions (users, blog_posts, purchases, courses, etc.)
  relations.ts        # Table relations
  migrations/         # SQL migrations

shared/               # Shared code (types, constants, errors)

manuscript/           # Book manuscript files
products/             # Digital product content (markdown)
lead_magnets/         # Lead magnet content (first 3 chapters, recovery toolkit, reading guide)
pdf-templates/        # PDF generation templates
```

## Key Architecture Decisions
- **Auth:** Session-based JWT in cookies, Scrypt password hashing, role-based (admin/user)
- **API:** tRPC with public, protected (logged-in), and admin procedure types
- **TypeScript paths:** `@/*` → `client/src/*`, `@shared/*` → `shared/*`
- **Database:** MySQL via Drizzle ORM, schema in `drizzle/schema.ts`
- **Deployment:** Railway (auto-deploys from GitHub)

## Environment Variables
Required: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, `ADMIN_SECRET`
Optional: Twitter API keys, Meta tokens, YouTube refresh token, OpenAI/Google API key, ConvertKit API keys, HeyGen/ElevenLabs keys, AWS S3 credentials

## Testing
- Vitest for unit tests (`server/**/*.test.ts`)
- Test files: `auth.logout.test.ts`, `leadMagnets.test.ts`, `members.test.ts`

## Important Notes
- `server/routers.ts` is the largest file (~3800 lines) — contains all tRPC endpoints
- `server/social/scheduler.ts` is very large (~24k+ lines) — social media pipeline
- The social posting system uses node-cron for scheduled content
- Mission Control (`server/agent/mission-control.ts`) is an autonomous multi-business agent
- Products use Stripe Price IDs configured in both `Products.tsx` and `stripe-webhook.ts`
