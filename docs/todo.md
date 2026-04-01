# Build Checklist

## Phase 1 — Project Scaffold
- [x] Authenticate with Tessl (`npx tessl auth login`)
- [x] Init Tessl in project (`npx tessl init --agent <your-agent>`)
- [x] Install Tessl skills for the full stack (Next.js, Cloudflare Workers, Neon, Drizzle, Vercel AI SDK, Tailwind+shadcn)
- [x] Add `TESSL_TOKEN` secret to GitHub repository for CI
- [x] Initialize Next.js app (`create-next-app`, App Router, TypeScript)
- [x] Configure `@opennextjs/cloudflare` for Cloudflare Workers deployment
- [ ] Set up Neon Postgres project and `main` branch (production)
- [ ] Create local dev Neon branch (`neon branch create --name dev/yourname`)
- [ ] Configure Neon GitHub integration for automatic preview branch creation
- [ ] Add GitHub Actions workflow to set `DATABASE_URL` on Cloudflare Workers preview deployments
- [ ] Install and configure Neon Auth (Stack Auth)
- [ ] Set up Drizzle ORM + schema migrations
- [ ] Configure Vercel AI SDK + provider abstraction
- [ ] Install and configure Tailwind CSS
- [ ] Initialize shadcn/ui (`npx shadcn@latest init`)
- [ ] Configure PWA manifest and service worker (next-pwa or similar)
- [ ] Set up Cloudflare secrets (AI keys, allowed emails)

## Phase 2 — Database Schema
- [ ] `users` (managed by Neon Auth, extended with profile data)
- [ ] `user_profile` (equipment, frequency, preferences, goals, optional goal weight)
- [ ] `weigh_ins` (user, date, weight — only for weight-loss goal users)
- [ ] `exercises` (AI-generated library)
- [ ] `workout_plans` (AI-generated plans linked to a user)
- [ ] `sessions` (individual workout days, scheduled date)
- [ ] `session_exercises` (ordered exercises within a session)
- [ ] `session_feedback` (post-session ratings and completion data)
- [ ] `exercise_feedback` (per-exercise completion within a session)

## Phase 3 — Onboarding
- [ ] Multi-step onboarding flow (equipment → frequency → types → exclusions → goals)
- [ ] If weight loss goal selected: prompt for goal weight and current weight
- [ ] Save profile to DB
- [ ] Trigger initial AI plan generation on completion

## Phase 4 — Workout Plan & Session Views
- [ ] Dashboard: upcoming sessions calendar/list view
- [ ] Session detail: warm-up / exercises / cool-down summary
- [ ] Start / Postpone CTA
- [ ] Postpone flow: pick delay → update scheduled date

## Phase 5 — Active Session (Workout Player)
- [ ] Exercise stepper (one exercise at a time)
- [ ] Timed exercise: 10-second countdown → run timer → auto-advance
- [ ] Rep exercise: manual Done button
- [ ] YouTube embed per exercise
- [ ] Post-exercise micro-feedback (completed? how much?)
- [ ] Post-session rating (too easy / just right / too hard)

## Phase 6 — AI Feedback Loop
- [ ] Store all session + exercise feedback
- [ ] Feed feedback history into AI when generating next session
- [ ] AI adjusts sets / reps / duration / exercise selection accordingly

## Phase 7 — Progress Charts
- [ ] Session completion rate over time
- [ ] Per-exercise completion trend
- [ ] Session difficulty ratings over time
- [ ] Volume over time
- [ ] Weekly weigh-in prompt (weight-loss goal users only)
- [ ] Weight over time chart (weight-loss goal users only)

## Phase 8 — Polish & Deploy
- [ ] Mobile-first responsive UI pass
- [ ] PWA install prompt
- [ ] Deploy to Cloudflare Pages
- [ ] Smoke test on real phone
