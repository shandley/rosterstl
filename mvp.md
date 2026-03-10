# STL Sports App — Project Brief for Claude Code

## Project Overview

A hyper-local sports team management web app focused exclusively on the St. Louis metro sporting community. Direct competitor to TeamSnap, differentiated by deep local integration, St. Louis venue data, and a focused user experience for St. Louis families, coaches, and league managers.

Built as a father-sons project. Sons (ages 16 and 18) are active in local St. Louis sports and will serve as beta testers, UX critics, and grassroots outreach leads.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Hosting | Vercel |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS + shadcn/ui |
| Language | TypeScript |

**Mobile strategy:** Responsive web-first. PWA support (home screen install) as a later enhancement.

---

## User Roles

- **Player** — can view schedule, RSVP to events, view roster
- **Parent** — manages player child accounts, receives notifications, RSVPs on behalf of child
- **Coach** — manages roster, creates events, sends announcements
- **Team Manager** — admin for a team, manages coaches and roster
- **League/Club Admin** — manages multiple teams under an organization (post-MVP)

---

## Core MVP Features

### 1. Teams
- Create a team (sport type, age group, season)
- Join a team via invite code or link
- Roster management (add/remove players, assign roles)
- Team profile with basic info

### 2. Schedule
- Create games and practices
- St. Louis venues/fields pre-loaded (parks, rec centers, school fields)
- Google Maps integration for directions
- Edit and cancel events
- Recurring event support (weekly practice)

### 3. Availability / RSVP
- Yes / No / Maybe per event per player
- Coaches see availability summary per event
- Parents RSVP on behalf of child players
- Reminder notifications before events

### 4. Announcements & Messaging
- Coach/Manager can send team-wide announcements
- Push notifications + email notifications
- Message history per team

### 5. St. Louis Venue Directory
- Pre-seeded database of St. Louis parks, fields, and rec centers
- Field name, address, parking notes, field number
- Linked to events automatically when venue is selected

---

## Database Schema (Initial Draft)

```sql
-- Users
users (id, email, full_name, avatar_url, created_at)

-- Teams
teams (id, name, sport, age_group, season, created_by, created_at)

-- Team Members
team_members (id, team_id, user_id, role, jersey_number, joined_at)

-- Venues (St. Louis pre-seeded)
venues (id, name, address, city, zip, lat, lng, parking_notes, field_count)

-- Events
events (id, team_id, venue_id, title, type [game|practice|other], 
        start_time, end_time, notes, created_by, created_at)

-- Availability
availability (id, event_id, user_id, status [yes|no|maybe], updated_at)

-- Announcements
announcements (id, team_id, author_id, body, created_at)

-- Notifications
notifications (id, user_id, type, payload, read, created_at)
```

---

## Project Structure (Next.js App Router)

```
/app
  /dashboard              — home after login
  /teams
    /[teamId]
      /schedule
      /roster
      /announcements
  /events
    /[eventId]
  /venues                 — St. Louis venue directory
  /onboarding             — create or join a team

/components
  /ui                     — shadcn/ui components
  /teams
  /events
  /availability

/lib
  /supabase               — client + server clients
  /actions                — Next.js server actions

/types                    — TypeScript types
```

---

## Auth Flow

- Supabase Auth (email/password + magic link)
- Middleware-based route protection
- Role-based access control enforced at the server action level
- Invite links tied to team_id with expiry

---

## St. Louis Local Integrations (Differentiators)

- **Venue directory** pre-seeded with St. Louis County and City parks and rec fields
- **Weather alerts** via a weather API tied to venue coordinates (show alert banner on event detail if rain/storm expected)
- **Local sports** — support for soccer, baseball, softball, basketball, volleyball, hockey, lacrosse from day one
- Future: integration with major St. Louis youth leagues (SLASA, Gateway Baseball, etc.)

---

## Business Model (Post-MVP)

- Free tier: individual teams (up to X players)
- Paid tier: clubs/organizations managing multiple teams
- Local business sponsorships / advertising
- Tournament management tools (premium)

---

## Build Order / Suggested Phases

### Phase 1 — Foundation
- [ ] Supabase project setup (auth + schema)
- [ ] Next.js scaffold with Tailwind + shadcn/ui
- [ ] Auth flow (sign up, login, magic link, protected routes)
- [ ] Basic team creation and join flow

### Phase 2 — Core Features
- [ ] Roster management
- [ ] Event creation with venue selection
- [ ] Availability / RSVP system
- [ ] Team announcements

### Phase 3 — St. Louis Data + Polish
- [ ] Seed venue database with St. Louis fields and parks
- [ ] Weather alert integration
- [ ] Push + email notifications
- [ ] Mobile-responsive polish

### Phase 4 — Growth
- [ ] League/club admin tier
- [ ] Tournament bracket management
- [ ] PWA / home screen install
- [ ] Analytics for coaches

---

## Notes for Claude Code

- Always use **server actions** for data mutations (not API routes)
- Use **Supabase RLS (Row Level Security)** — never expose data without policy enforcement
- Keep components small and composable
- Use **TypeScript strictly** throughout
- Seed script for St. Louis venues should be a standalone `/scripts/seed-venues.ts`
- Start with Phase 1 and confirm schema before building UI
