# Auth Migration Plan: Neon Auth → Self-Hosted BetterAuth

## Context

Neon Auth (Stack Auth) is being replaced with self-hosted BetterAuth backed by Neon Postgres.
Reasons:
- Neon Auth's middleware has Node.js crypto dependency → not edge-compatible
- `proxy.ts` (Next.js 16) is not supported by `@opennextjs/cloudflare` (issue #962)
- `middleware.ts` with edge runtime still works in Next.js 16 and supports `better-auth-cloudflare`
- Self-hosted BetterAuth stores auth tables in our Neon DB → branch-level isolation comes for free

OAuth testing strategy: only run Google OAuth on stable, long-lived branches (staging, production)
to avoid registering a new redirect URI in GCP per preview branch.

---

## Step 1 — GitHub Branch Strategy

- [x] Create `staging` branch from `main`
- [x] Set `staging` as the default base branch for new PRs
- [x] Add branch protection rule on `main`:
  - Restrict merges to `staging` branch and branches matching `hotfix-*`
  - Require PR before merging
- [x] Add branch protection rule on `staging`:
  - Require PR before merging
  - Require status checks (CI) to pass
- [x] Update deploy workflow so `staging` deploys to stable worker `workout-ai-staging`

## Step 2 — Remove Neon Auth

- [x] `pnpm remove @neondatabase/auth`
- [x] Delete `lib/auth/client.ts`
- [x] Delete `proxy.ts`
- [x] Remove Neon Auth placeholder env vars from `.github/workflows/deploy.yml` (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`)
- [x] Remove `NEON_AUTH_COOKIE_SECRET` + `NEON_AUTH_BASE_URL` from Cloudflare Worker secrets (confirmed not present)
- [x] Remove Neon Auth sign-in logic from `app/sign-in/page.tsx`

## Step 3 — Install BetterAuth

- [x] `pnpm add better-auth better-auth-cloudflare`
- [x] Create `lib/auth/index.ts` — BetterAuth server config with:
  - Neon Postgres adapter (using existing `DATABASE_URL`)
  - Google OAuth social provider
  - `cloudflare()` plugin for edge compatibility
- [x] Create `lib/auth/client.ts` — `createAuthClient()` for use in client components
- [x] Create `app/api/auth/[...all]/route.ts` — BetterAuth catch-all route handler
- [x] Create `middleware.ts` (edge runtime) — session check using BetterAuth session cookie
- [x] Run BetterAuth DB migration to create auth tables in Neon (used `pnpm dlx @better-auth/cli generate` + `drizzle-kit push`)
- [x] Update `app/sign-in/page.tsx` — replace Neon Auth client calls with BetterAuth client

## Step 4 — Better Auth UI Components

- [x] Install `@daveyplate/better-auth-ui` and peer dependencies (lucide-react, sonner, radix-ui/*,  react-hook-form, zod, clsx, tailwind-merge, class-variance-authority, input-otp)
- [x] Add shadcn CSS variables + `@import "@daveyplate/better-auth-ui/css"` to `app/globals.css`
- [x] Create `app/providers.tsx` with `AuthUIProvider` wrapping `authClient`
- [x] Wrap layout in `Providers`, add `<Toaster />` from sonner
- [x] Create `app/auth/[path]/page.tsx` as a fully dynamic route with `AuthView`
- [x] Update `middleware.ts`: redirect to `/auth/sign-in`, exclude `/auth` in matcher
- [x] Delete `app/sign-in/page.tsx` (replaced by `app/auth/[path]`)
- [x] Add `social={{ providers: ['google'] }}` to `AuthUIProvider` so the Google button renders
- [x] Verify sign-in/sign-up form and sign-up toggle render correctly (confirmed on preview worker)

## Step 5 — Email Verification via Resend

- [ ] Create Resend account and verify sending domain *(manual — can defer until pre-production)*
- [ ] Populate secrets — see Step 5.5
- [x] `pnpm add resend`
- [x] Add BetterAuth `emailVerification` plugin to `lib/auth/index.ts` with `sendVerificationEmail` via Resend and `sendOnSignUp: true`
- [x] Add `RESEND_API_KEY` and `RESEND_FROM_ADDRESS` to `.env.example` and `.dev.vars`
- [x] Add `.dev.vars` to `.gitignore`

## Step 5.5 — Populate Secrets (prerequisite for Steps 6–7)

All secrets must be in GitHub Actions **before** the next deploy so the
`Set Worker secrets` workflow step can push them to every worker automatically.
Stable workers also need them set manually once (they don't get a PR-triggered
Neon branch event like preview workers do).

### GitHub Actions secrets
Add each secret at: **repo → Settings → Secrets and variables → Actions**

```bash
gh secret set AUTH_SECRET          --app actions
gh secret set RESEND_API_KEY       --app actions
gh secret set RESEND_FROM_ADDRESS  --app actions   # onboarding@resend.dev for now
gh secret set ALLOWED_EMAILS       --app actions
```

- [ ] `AUTH_SECRET` added to GitHub Actions secrets
- [ ] `RESEND_API_KEY` added to GitHub Actions secrets
- [ ] `RESEND_FROM_ADDRESS` added to GitHub Actions secrets
- [ ] `ALLOWED_EMAILS` added to GitHub Actions secrets

### Stable Cloudflare Worker secrets
Set once manually (deploy workflow will keep them in sync after this):

```bash
# workout-ai-staging
wrangler secret put AUTH_SECRET          --name workout-ai-staging
wrangler secret put RESEND_API_KEY       --name workout-ai-staging
wrangler secret put RESEND_FROM_ADDRESS  --name workout-ai-staging
wrangler secret put ALLOWED_EMAILS       --name workout-ai-staging

# workout-ai (production)
wrangler secret put AUTH_SECRET          --name workout-ai
wrangler secret put RESEND_API_KEY       --name workout-ai
wrangler secret put RESEND_FROM_ADDRESS  --name workout-ai
wrangler secret put ALLOWED_EMAILS       --name workout-ai
```

- [ ] Secrets set on `workout-ai-staging`
- [ ] Secrets set on `workout-ai` (production)

### Local dev
- [ ] Fill `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `ALLOWED_EMAILS` in `.env.local` and `.dev.vars`
- [ ] Verify end-to-end auth flow on preview worker: sign-up, sign-in, email verification email received

## Step 6 — Google OAuth

- [ ] Update authorized redirect URI in Google Cloud Console from Neon Auth callback → `<app-url>/api/auth/callback/google`
  - Staging: `https://workout-staging.<account>.workers.dev/api/auth/callback/google`
  - Production: `https://<custom-domain>/api/auth/callback/google`
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as Cloudflare Worker secrets on `workout-ai-staging` and `workout-ai`
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.dev.vars` and `.env.local`
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to GitHub Actions secrets

## Step 7 — Documentation Updates

- [ ] `docs/decisions.md` — record auth migration decision and rationale
- [ ] `docs/overview.md` — update auth architecture section
- [ ] `docs/todo.md` — uncheck Neon Auth items, add BetterAuth items, update Phase 2 webhook to use BetterAuth user table
- [ ] `README.md` — update local dev setup (new env vars, migration step)

---

## Notes

- `ALLOWED_EMAILS` gate (previously in `app/api/sign-up/route.ts`) needs to be re-implemented as a BetterAuth `before` hook on user creation. Temporary gap until Phase 2 quota gating is built.

- `middleware.ts` with `export const runtime = 'edge'` is intentionally kept working in Next.js 16 during transition. Migrate to `proxy.ts` once opennextjs/opennextjs-cloudflare#962 is resolved.
- Phase 2 (signup quota gating) webhook references `neon_auth.users` — this will need updating to query BetterAuth's `user` table instead.
- Resend setup (email verification) moves to BetterAuth email config, not Neon Auth dashboard. Keep the Resend todo but update the approach.
- Branch-level auth isolation is automatic: BetterAuth tables are in Neon Postgres, so Neon branch = isolated auth users.
