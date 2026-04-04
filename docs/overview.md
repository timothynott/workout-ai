# Technical Overview

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Deployment | Cloudflare Workers via `@opennextjs/cloudflare` |
| Auth | Neon Auth (BetterAuth) |
| Email | Resend (transactional — OTP, password reset) |
| Database | Neon Postgres |
| AI | Vercel AI SDK (model-agnostic) |
| Exercise videos | YouTube iframe embeds |
| Agent context | Tessl Registry |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Mobile | PWA |

## High-Level Architecture

```
Browser (PWA)
    │
    ▼
Next.js App (Cloudflare Workers / OpenNext)
    ├── /app                  Next.js App Router pages & layouts
    │   └── /api              Route handlers (AI calls, workout ops)
    │        │
    │        ├── AI Provider (Claude / OpenAI / etc.)
    │        └── Neon Postgres
    ├── /components           UI components
    └── /lib
        ├── /ai               Vercel AI SDK provider abstraction
        ├── /db               Neon Postgres client (via drizzle or postgres.js)
        └── /auth             Neon Auth helpers
```

## Core Domain Concepts

### User Profile
Captured during onboarding; drives all AI plan generation.
- Available equipment
- Workout frequency (days/week)
- Preferred workout types (strength, cardio, HIIT, etc.)
- Excluded exercises (injury, preference)
- Goals (weight loss, muscle gain, endurance, etc.)
- **If weight loss is a goal:** goal weight (lbs/kg)
- AI provider (anthropic, openai, google, etc.)
- AI model ID
- AI API key (encrypted at rest)

### Exercise
AI-generated and persisted. Fields:
- `name`, `description`
- `youtube_video_id`
- `category` (warm_up | exercise | cool_down)
- `type` (timed | reps)
- Default duration or rep range

### Workout Plan
An AI-generated weekly schedule of sessions assigned to specific dates.

### Session
A single workout day. Structure:
1. Warm-up block
2. Exercise block
3. Cool-down block

Each block is an ordered list of `SessionExercise` records with target sets/reps/duration.

### Session Execution Flow
1. User sees session summary → **Start** or **Postpone**
2. Postpone → user specifies delay in days → scheduled date shifts
3. Start → step through exercises one by one
   - **Timed exercise:** 10-second countdown → timer runs → auto-advance
   - **Rep exercise:** user taps Done when finished
4. After each exercise: "Did you complete it? If not, how much?" (0–100%)
5. After all exercises: overall session rating (too easy / just right / too hard)

### Feedback Loop
Post-session data (completion rates, session rating) is stored and fed back to the AI when generating future sessions. The AI uses this to adjust volume, intensity, and exercise selection.

## Agent Context (Tessl)

[Tessl Registry](https://tessl.io/registry) skills are installed into the repo and automatically loaded by coding agents. Each skill teaches the agent how to use a specific library or API correctly — preventing hallucinated APIs, version mismatches, and bad patterns.

Skills to install for this stack:

| Skill | Purpose |
|---|---|
| `nextjs` | Next.js App Router patterns |
| `cloudflare-workers` | Cloudflare Workers / Pages constraints |
| `neon` | Neon Postgres client usage |
| `drizzle` | Drizzle ORM schema and query patterns |
| `vercel-ai-sdk` | Vercel AI SDK usage |
| `shadcn-ui` | shadcn/ui component patterns |
| `tailwindcss` | Tailwind utility patterns |

Private org-level skills will be added to encode project-specific Cloudflare constraints and internal patterns as they emerge.

## Database Branching

Neon branches isolate data across environments so preview and local work never touches production.

```
Neon: main branch          ← production (Cloudflare Pages production deployment)
Neon: preview/[branch]     ← auto-created per git branch (Cloudflare Pages preview)
Neon: dev/[your-name]      ← manually created for local development
```

**How it works:**
- The [Neon GitHub integration](https://neon.com/docs/guides/neon-github-integration) automatically creates and deletes a Neon branch for each PR/git branch.
- A GitHub Actions step sets the `DATABASE_URL` environment variable for the matching Cloudflare Pages preview deployment via the Cloudflare API.
- Locally, each developer creates their own branch (`neon branch create --name dev/yourname`) and sets `DATABASE_URL` in `.env.local`.

## Auth & Access Control

- Neon Auth handles signup/login flows
- Allowed email addresses are stored as a Cloudflare secret (`ALLOWED_EMAILS`, comma-separated)
- Middleware checks the authenticated user's email against the allowlist on every request

## AI Provider Abstraction

All AI calls go through `/lib/ai/provider.ts`. The user's provider, model ID, and API key are stored in their `user_profile` (API key encrypted at rest using AES-256-GCM — see ADR-012). At request time, the server decrypts the key and instantiates the correct Vercel AI SDK provider.

The abstraction exposes two main operations:
- `generateWorkoutPlan(profile, history)` → structured workout plan
- `adaptNextSession(session, feedback, history)` → adjusted session

## Weekly Weigh-In

Only presented to users whose goal includes weight loss. Once per week, the app prompts the user to log their current weight. This data is:
- Stored in a `weigh_ins` table (user, date, weight)
- Surfaced as a weight-over-time chart in the progress view
- Optionally passed to the AI as context when adapting future sessions

## Progress & Charts

Stored metrics surfaced in a progress view:
- Session completion rate over time
- Per-exercise completion trend
- Session difficulty ratings over time
- Volume (total reps/duration) over time
- **Weight over time** (weight-loss goal users only)
