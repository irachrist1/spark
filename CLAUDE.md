# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## What This Is

Spark — career discovery platform for Rwandan students. RIASEC + Big Five personality assessment, career matching (150+ careers), reality quizzes, mentor marketplace, school recommendations. Largest codebase in Christian's projects.

## Commands

```bash
npm run dev           # Next.js dev server (localhost:3000)
npm run build         # Production build
npm start             # Start production server
npm run lint          # ESLint
npm run typecheck     # TypeScript type checking
npm run seed          # Seed database
```

## Architecture

### Tech Stack
- Next.js 14 (App Router), React 18, TypeScript 5
- Convex 1.16 (real-time database + server functions)
- Clerk 5 (JWT-based auth with middleware)
- Tailwind CSS 3 + Radix UI components
- React Hook Form + Zod (validation)
- TipTap (rich text editor)
- TanStack React Query
- Resend (email), Stripe (payments planned)

### Route Structure
```
app/
├── assessment/              # Assessment intro
│   ├── questions/           # 25-question flow
│   └── results/             # Career matches + RIASEC profile
├── dashboard/
│   ├── student/             # Student dashboard
│   ├── mentor/              # Mentor dashboard
│   ├── educator/            # Educator dashboard
│   └── admin/               # Admin panel
├── careers/                 # Career browsing
│   ├── [id]/                # Career detail
│   └── compare/             # Career comparison
├── mentors/                 # Mentor discovery & booking
├── admin/                   # Analytics, users, schools, articles, bookings
├── blog/                    # Mentor articles
├── schools/                 # School browser
├── onboarding/              # Role setup
└── api/emails/              # Email integration
```

### Key Database Tables (`convex/schema.ts`)
- `users` — Clerk-synced, roles: student, mentor, educator, company, partner, admin
- `studentProfiles` — Grade level, school, assessment count, readiness scores
- `careers` — Full career data with RIASEC profiles, cost analysis, reality quizzes
- `assessmentResults` — Student answers + RIASEC/values/bigFive scores + career matches
- `quizResults` — Reality quiz attempts (6-dimensional scoring)
- `professionals` — Mentor profiles with approval workflow, earnings, availability
- `careerChats` — Booking workflow (pending → confirmed → completed)
- `availabilitySlots` — Recurring mentor availability
- `schools` — Educational institutions with programs, partnership tiers
- `analyticsEvents` — Funnel tracking
- `notifications` — Booking, messages, reviews, system notifications

### RIASEC Assessment System (`lib/assessment-algorithm.ts`)
- **25 questions**: RIASEC interests (Q1-12), values (Q13-18), Big Five personality (Q19-24), work environment (Q25)
- **Scoring**: Cosine similarity between student profile and career RIASEC/values profiles
- **Weights**: Interest 40% + Values 30% + Personality 20% + Environment 10%
- **Output**: Top 25 career matches with percentage scores + reasoning
- **Functions**: `calculateProfileFromAnswers()`, `matchStudentToCareers()`

### Reality Quiz System
- Career-specific scenario quizzes (7 questions each)
- 6 dimensions: technical, pressure, collaboration, creativity, independence, work-life balance
- Readiness tier: high/medium/low with insights

## Key Patterns

- **Clerk auth**: Middleware protects `/dashboard`, `/admin`, `/onboarding`, `/assessment/results`. `ClerkProvider` + `ConvexProviderWithClerk` in app wrapper.
- **Convex data access**: `getCurrentUser()` / `getCurrentUserOrThrow()` helpers. All queries/mutations in `convex/*.ts`. Real-time subscriptions via `useQuery(api.module.function)`.
- **Role-based dashboards**: User role determines which dashboard they see
- **Mentor workflow**: Application → admin review → approval → availability slots → booking
- **Rwanda-specific**: RWF salary ranges, local school partnerships, sector-relevant careers
- **Design**: "Brutal" aesthetic — bold borders, shadows, high contrast

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CONVEX_WEBHOOK_SECRET=
ADMIN_EMAIL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Current State

**Working**: Full RIASEC assessment (25 questions, scoring, career matching), career exploration (150+ careers), mentor marketplace (booking workflow, availability, earnings), reality quizzes, school recommendations, admin dashboard (user management, analytics, mentor approvals), notifications, articles/blog system.

**Design**: Mobile-responsive throughout. Rwanda-focused career data with RWF salary ranges.
