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
- [x] Set up Drizzle ORM + schema migrations
- [ ] Configure Vercel AI SDK + provider abstraction
- [ ] Install and configure Tailwind CSS
- [ ] Initialize shadcn/ui (`npx shadcn@latest init`)
- [ ] Configure PWA manifest and service worker (next-pwa or similar)
- [ ] Set up Cloudflare secrets (AI keys, allowed emails)

## Phase 2 — Onboarding
- [ ] Schema: add `user_profile` table (equipment, frequency, preferences, goals, optional goal weight) + migrate
- [ ] Schema: add `exercises` table (AI-generated library) + migrate
- [ ] Schema: add `workout_plans` table (AI-generated plans linked to a user) + migrate
- [ ] Schema: add `sessions` table (individual workout days, scheduled date) + migrate
- [ ] Schema: add `session_exercises` table (ordered exercises within a session) + migrate
- [ ] Multi-step onboarding flow (equipment → frequency → types → exclusions → goals)
- [ ] If weight loss goal selected: prompt for goal weight and current weight
- [ ] Save profile to DB
- [ ] Trigger initial AI plan generation on completion

## Phase 3 — Workout Plan & Session Views
- [ ] Dashboard: upcoming sessions calendar/list view
- [ ] Session detail: warm-up / exercises / cool-down summary
- [ ] Start / Postpone CTA
- [ ] Postpone flow: pick delay → update scheduled date

## Phase 4 — Active Session (Workout Player)
- [ ] Schema: add `session_feedback` table (post-session ratings and completion data) + migrate
- [ ] Schema: add `exercise_feedback` table (per-exercise completion within a session) + migrate
- [ ] Exercise stepper (one exercise at a time)
- [ ] Timed exercise: 10-second countdown → run timer → auto-advance
- [ ] Rep exercise: manual Done button
- [ ] YouTube embed per exercise
- [ ] Post-exercise micro-feedback (completed? how much?)
- [ ] Post-session rating (too easy / just right / too hard)

## Phase 5 — AI Feedback Loop
- [ ] Store all session + exercise feedback
- [ ] Feed feedback history into AI when generating next session
- [ ] AI adjusts sets / reps / duration / exercise selection accordingly

## Phase 6 — Progress Charts
- [ ] Schema: add `weigh_ins` table (user, date, weight — weight-loss goal users only) + migrate
- [ ] Session completion rate over time
- [ ] Per-exercise completion trend
- [ ] Session difficulty ratings over time
- [ ] Volume over time
- [ ] Weekly weigh-in prompt (weight-loss goal users only)
- [ ] Weight over time chart (weight-loss goal users only)

## Phase 7 — Polish & Deploy
- [ ] Mobile-first responsive UI pass
- [ ] PWA install prompt
- [ ] Deploy to Cloudflare Workers (production)
- [ ] Smoke test on real phone
