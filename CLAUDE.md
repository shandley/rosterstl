# RosterSTL

Hyper-local St. Louis sports team management app. Direct competitor to TeamSnap with deep local integration.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Hosting**: Vercel
- **Auth/Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript (strict mode)

## Infrastructure

- **GitHub**: shandley/rosterstl
- **Supabase project ref**: bisutbyjjlinjpgmjbry
- **Supabase URL**: https://bisutbyjjlinjpgmjbry.supabase.co
- **Vercel**: connected via Supabase integration (env vars auto-populated)

## Conventions

- Server actions for data mutations (not API routes)
- Supabase RLS on all tables
- Supabase CLI for migrations (`supabase/migrations/`)
- `pnpm` for package management
- Components: small and composable
- Venue seed script: `/scripts/seed-venues.ts`

## Build Phases

See `mvp.md` for full plan. Currently: **Phase 1 — Foundation**.
