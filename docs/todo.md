# Build Checklist

## Phase 1 — Project Scaffold
- [x] Authenticate with Tessl (`npx tessl auth login`)
- [x] Init Tessl in project (`npx tessl init --agent <your-agent>`)
- [x] Install Tessl skills for the full stack (Next.js, Cloudflare Workers, Neon, Drizzle, Vercel AI SDK, Tailwind+shadcn)
- [x] Add `TESSL_TOKEN` secret to GitHub repository for CI
- [x] Initialize Next.js app (`create-next-app`, App Router, TypeScript)
- [x] Configure `@opennextjs/cloudflare` for Cloudflare Workers deployment
- [x] Add GitHub Actions deploy workflow with dynamic per-branch worker names (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` secrets set)
- [x] Add GitHub Actions cleanup workflow to delete preview workers on branch delete
- [x] Enable "Automatically delete head branches" in GitHub repo settings (`Settings → General → Pull Requests`)
- [x] Set up Neon Postgres project and `main` branch (production)
- [x] Create local dev Neon branch (`neon branch create --name dev/yourname`)
- [x] Configure Neon GitHub integration for automatic preview branch creation
- [x] Add GitHub Actions workflow to set `DATABASE_URL` on Cloudflare Workers preview deployments
- [x] Install and configure BetterAuth (self-hosted, Neon Postgres adapter, edge-compatible via `better-auth-cloudflare`)
- [x] Add Google as an identity provider (Google OAuth via BetterAuth `socialProviders`)
  - [x] Add `authClient.signIn.social` + Google button via `AuthUIProvider` social prop
  - [x] Register app in Google Cloud Console, create OAuth 2.0 Client ID, add redirect URI (`/api/auth/callback/google`)
  - [x] Publish app in Google Cloud Console OAuth consent screen (moves out of testing mode)
  - [x] Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` as Cloudflare secrets and GitHub Actions secrets
- [x] Create Resend account
- [x] Enable email verification via BetterAuth `emailVerification` plugin + Resend SDK
- [x] Set up Drizzle ORM + schema migrations
- [x] Configure Vercel AI SDK + provider abstraction
- [x] Install and configure Tailwind CSS
- [x] Initialize shadcn/ui (`npx shadcn@latest init`)
- [x] Migrate codebase to DDD structure
  - [x] Add `src/shared/domain/` primitives: `Result.ts`, `identity.ts`, `DomainEvent.ts`, `guards.ts`
  - [x] Move DB connection: `src/lib/db/index.ts` → `src/shared/infrastructure/db.ts`; update all imports
  - [x] Create identity module skeleton: `src/modules/identity/domain/types.ts` (Session, User), `src/modules/identity/index.ts` (public exports)
  - [x] Move auth server adapter: `src/lib/auth/index.ts` → `src/modules/identity/infrastructure/adapters/betterAuthAdapter.ts`
  - [x] Move auth client adapter: `src/lib/auth/client.ts` → `src/modules/identity/infrastructure/adapters/authClientAdapter.ts`
  - [x] Move auth schema: `src/lib/db/auth-schema.ts` → `src/modules/identity/infrastructure/persistence/schema.ts`
  - [x] Create composition root: `src/lib/identity.ts`
  - [x] Move AI provider: `src/lib/ai/provider.ts` → `src/shared/infrastructure/ai.ts` (to be moved into `modules/workout-generation` in Phase 3)
  - [x] Update `drizzle.config.ts` schema path to glob `src/modules/**/infrastructure/persistence/schema.ts`
  - [x] Delete `src/lib/db/schema.ts` barrel, `src/lib/auth/`, `src/lib/db/`, `src/lib/ai/` once all imports are updated
  - [x] Update all import paths in `src/app/` (route handlers, providers, middleware)
  - **DDD-exempt (framework-required locations):** `src/middleware.ts`, all `src/app/**` files (Next.js App Router constraint); `drizzle.config.ts` (tooling). These are intentionally outside the module system.
- [x] Configure PWA manifest and service worker (next-pwa or similar)
- [x] Set up Cloudflare secrets (`ALLOWED_EMAILS`, `ENCRYPTION_KEY`)
- [x] Set up public `/blog` route: MDX-based posts, index page, per-post pages
- [x] Add `actions/cache` to deploy workflow to cache `.next/cache` between CI runs for faster builds
- [x] Add test framework: install Vitest, configure for Next.js + Cloudflare Workers environment, add `pnpm test` script, add test step to GitHub Actions deploy workflow
- [ ] Write Phase 1 blog posts
  - [x] Project overview (`content/posts/project-overview.mdx`)
  - [ ] Phase 1 overview (`content/posts/phase-1-scaffold.mdx`)
  - [ ] Next.js on Cloudflare Workers + OpenNext (`content/posts/cloudflare-workers-opennext.mdx`)
  - [ ] Why I left Neon Auth for BetterAuth (`content/posts/neon-auth-to-betterauth.mdx`)
  - [ ] DDD in a Next.js app (`content/posts/ddd-nextjs.mdx`)
  - [ ] AI without server-side keys (`content/posts/ai-user-supplied-keys.mdx`)

## Phase 2 — Signup Quota Gating
- [ ] Create `lib/quota.ts` with `QUOTA` constants: `daily` (100) and `monthly` (3000) — update here when upgrading Resend plan
- [ ] Create `lib/quota-check.ts` with `checkSignupQuota`: queries BetterAuth `user` table for counts since `CURRENT_DATE` (daily) and `NOW() - INTERVAL '31 days'` (monthly), returns `{ allowed, reason }`
- [ ] Add BetterAuth `before` hook on user creation in `lib/auth/index.ts`: call `checkSignupQuota`, throw if limit exceeded with `error_code` and `error_message`
- [ ] Update signup UI to surface quota error codes (`daily_limit`, `monthly_limit`) with user-friendly messaging
- [ ] Write Phase 2 blog post: quota gating design, webhook approach, and lessons learned

## Phase 3 — Onboarding
- [ ] Add encryption/decryption utility for sensitive fields (`/lib/crypto.ts`, AES-256-GCM, key from `ENCRYPTION_KEY` secret)
- [ ] Schema: add `user_profile` table (equipment, frequency, preferences, goals, optional goal weight, encrypted AI provider credentials) + migrate
- [ ] Schema: add `exercises` table (AI-generated library) + migrate
- [ ] Schema: add `workout_plans` table (AI-generated plans linked to a user) + migrate
- [ ] Schema: add `sessions` table (individual workout days, scheduled date) + migrate
- [ ] Schema: add `session_exercises` table (ordered exercises within a session) + migrate
- [ ] Multi-step onboarding flow (equipment → frequency → types → exclusions → goals → AI provider)
- [ ] Onboarding step: AI provider selection (provider, model ID, API key — key encrypted before save)
- [ ] If weight loss goal selected: prompt for goal weight and current weight
- [ ] Save profile to DB
- [ ] Trigger initial AI plan generation on completion
- [ ] Write Phase 3 blog post: onboarding UX decisions, schema evolution, and lessons learned

## Phase 4 — Workout Plan & Session Views
- [ ] Dashboard: upcoming sessions calendar/list view
- [ ] Session detail: warm-up / exercises / cool-down summary
- [ ] Start / Postpone CTA
- [ ] Postpone flow: pick delay → update scheduled date
- [ ] Write Phase 4 blog post: plan and session view design, component decisions, and lessons learned

## Phase 5 — Active Session (Workout Player)
- [ ] Schema: add `session_feedback` table (post-session ratings and completion data) + migrate
- [ ] Schema: add `exercise_feedback` table (per-exercise completion within a session) + migrate
- [ ] Exercise stepper (one exercise at a time)
- [ ] Timed exercise: 10-second countdown → run timer → auto-advance
- [ ] Rep exercise: manual Done button
- [ ] YouTube embed per exercise
- [ ] Post-exercise micro-feedback (completed? how much?)
- [ ] Post-session rating (too easy / just right / too hard)
- [ ] Write Phase 5 blog post: workout player architecture, timer/stepper mechanics, and lessons learned

## Phase 6 — AI Feedback Loop
- [ ] Store all session + exercise feedback
- [ ] Feed feedback history into AI when generating next session
- [ ] AI adjusts sets / reps / duration / exercise selection accordingly
- [ ] Write Phase 6 blog post: AI feedback loop design, prompt engineering decisions, and lessons learned

## Phase 7 — Progress Charts
- [ ] Schema: add `weigh_ins` table (user, date, weight — weight-loss goal users only) + migrate
- [ ] Session completion rate over time
- [ ] Per-exercise completion trend
- [ ] Session difficulty ratings over time
- [ ] Volume over time
- [ ] Weekly weigh-in prompt (weight-loss goal users only)
- [ ] Weight over time chart (weight-loss goal users only)
- [ ] Write Phase 7 blog post: charting library choices, data modeling for progress, and lessons learned

## Phase 8 — Polish & Deploy
- [ ] Mobile-first responsive UI pass
- [ ] PWA install prompt
- [ ] Move to permanent domain
  - [ ] Verify sending domain in Resend and update `RESEND_FROM_ADDRESS` secret away from `onboarding@resend.dev`
  - [ ] Add production domain redirect URIs in Google Cloud Console (`/api/auth/callback/google`)
  - [ ] Update `workout-ai-staging` and `workout-ai` Worker secrets with new `RESEND_FROM_ADDRESS`
- [ ] Deploy to Cloudflare Workers (production)
- [ ] Smoke test on real phone
- [ ] Write Phase 8 blog post: PWA setup, production deploy experience, and lessons learned

## Phase 9 — Google OAuth Verification & Branding
- [ ] Decide on a final app name
- [ ] Design and add app logo
- [ ] Build a public homepage (can be a simple landing page on the production domain)
- [ ] Write and publish a Privacy Policy page
- [ ] Write and publish a Terms of Service page
- [ ] Update Google Cloud Console OAuth consent screen with final name, logo, homepage, privacy policy, and ToS URLs
- [ ] Submit app for Google OAuth verification
- [ ] Mark consent screen verification sub-task complete in Phase 1 once approved
- [ ] Write Phase 9 blog post: branding process, OAuth verification journey, and lessons learned
