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

## Design System

Reference: `original_design.html` — static mockup of the dashboard.

- **Theme**: Dark mode, navy/midnight backgrounds
- **Colors**: Blue `#003B8E`, Gold `#FFB81C`, Red `#C8102E`, Dark `#0A0F1E`, Mid `#141B2D`, Surface `#1C2438`, Text `#E8EDF5`, Muted `#7A8BA8`, Success `#22C55E`
- **Fonts**: Barlow Condensed (headings, stats, logo), Barlow (body)
- **Layout**: Fixed 220px sidebar, sticky top bar, responsive main content
- **Key patterns**: Team selector pill, stat cards with colored borders, event cards with date badges + RSVP buttons, announcement cards with author avatars

## Build Phases

See `mvp.md` for full plan. Currently: **Phase 1 — Foundation**.
