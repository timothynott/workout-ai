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
- [x] Install and configure Neon Auth (BetterAuth)
- [x] Add Google as an identity provider (OAuth via Neon Auth)
  - [x] Add `authClient.signIn.social` + Google button to sign-in page
  - [x] Register app in Google Cloud Console, create OAuth 2.0 Client ID, add redirect URI (`/api/auth/callback/google`)
  - [x] Publish app in Google Cloud Console OAuth consent screen (moves out of testing mode)
  - [x] Paste Client ID + Secret into Neon Auth dashboard → OAuth Providers
- [ ] Create Resend account, configure domain, and configure as custom SMTP in Neon Auth dashboard
- [x] Enable email verification in Neon Auth dashboard (Auth → Configuration → Email verification)
- [x] Set up Drizzle ORM + schema migrations
- [ ] Configure Vercel AI SDK + provider abstraction
- [ ] Install and configure Tailwind CSS
- [ ] Initialize shadcn/ui (`npx shadcn@latest init`)
- [ ] Configure PWA manifest and service worker (next-pwa or similar)
- [ ] Set up Cloudflare secrets (`ALLOWED_EMAILS`, `ENCRYPTION_KEY`)
- [ ] Set up public `/blog` route: MDX-based posts, index page, per-post pages
- [ ] Write Phase 1 blog post: scaffold decisions, blockers encountered, and how they were resolved

## Phase 2 — Signup Quota Gating
- [ ] Create `lib/quota.ts` with `QUOTA` constants: `daily` (100) and `monthly` (3000) — update here when upgrading Resend plan
- [ ] Create `lib/quota-check.ts` with `checkSignupQuota`: queries `neon_auth.users` for counts since `CURRENT_DATE` (daily) and `NOW() - INTERVAL '31 days'` (monthly), returns `{ allowed, reason }`
- [ ] Create `user.before_create` webhook handler at `app/webhooks/neon-auth/route.ts`: verify Neon Auth webhook signature, call `checkSignupQuota`, return `{ allowed: true/false }` with `error_code` and `error_message`
- [ ] Register webhook with Neon Auth API, subscribing to `user.before_create` pointing at deployed webhook URL
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
