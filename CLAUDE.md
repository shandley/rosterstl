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
- **Vercel project**: rosterstl (framework preset: Next.js)
- **Domain**: rosterstl.app
- **Vercel URL**: rosterstl.vercel.app
- **Env vars**: auto-populated via Supabase-Vercel integration

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

See `mvp.md` for full plan. Currently: **Phase 3 — St. Louis Data + Polish** (in progress).

## Key Patterns

- **Team layout**: `src/app/teams/[teamId]/layout.tsx` wraps all team pages with sidebar + topbar
- **Team auth utility**: `src/lib/utils/team-auth.ts` — `getTeamMembership(teamId)` for auth + role checking
- **Server actions**: `src/lib/actions/{teams,players,events,availability,announcements}.ts`
- **Dialog pattern**: shadcn Dialog with `useActionState` or manual `useState` for forms
- **RSVP**: `useOptimistic` + `useTransition` for instant feedback
- **Base UI Select**: `onValueChange` passes `string | null` (not just `string`)
- **Venue picker**: `src/components/venue-picker.tsx` — searchable with city grouping, replaces flat Select for venues
- **Directions links**: Venue names on event cards/dashboard link to Google Maps directions (no API key needed)
- **Safari date/time bug**: Never use `<input type="date|time|datetime-local">` — Safari shows ghost values. Use Select dropdowns for time, text inputs for dates.
