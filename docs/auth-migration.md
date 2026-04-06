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

- [ ] Create `staging` branch from `main`
- [ ] Set `staging` as the default base branch for new PRs (GitHub Settings → General → Default branch... or via branch protection)
- [ ] Add branch protection rule on `main`:
  - Restrict merges to `staging` branch and branches matching `hotfix-*`
  - Require PR before merging
- [ ] Add branch protection rule on `staging`:
  - Require PR before merging
  - Require status checks (CI) to pass
- [ ] Update deploy workflow if needed so `staging` deploys to a stable staging worker

## Step 2 — Remove Neon Auth

- [ ] `pnpm remove @neondatabase/auth`
- [ ] Delete `lib/auth/client.ts`
- [ ] Delete `proxy.ts`
- [ ] Remove Neon Auth placeholder env vars from `.github/workflows/deploy.yml` (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`)
- [ ] Remove `NEON_AUTH_COOKIE_SECRET` from Cloudflare Worker secrets (wrangler dashboard or CLI)
- [ ] Remove Neon Auth sign-in logic from `app/sign-in/page.tsx`

## Step 3 — Install BetterAuth

- [ ] `pnpm add better-auth better-auth-cloudflare`
- [ ] Create `lib/auth/index.ts` — BetterAuth server config with:
  - Neon Postgres adapter (using existing `DATABASE_URL`)
  - Google OAuth social provider
  - `betterAuthCloudflare()` plugin for edge compatibility
- [ ] Create `lib/auth/client.ts` — `createAuthClient()` for use in client components
- [ ] Create `app/api/auth/[...all]/route.ts` — BetterAuth catch-all route handler
- [ ] Create `middleware.ts` (edge runtime) — session check using BetterAuth session cookie
- [ ] Run BetterAuth DB migration to create auth tables in Neon (`npx better-auth migrate` or generate Drizzle migration)
- [ ] Update `app/sign-in/page.tsx` — replace Neon Auth client calls with BetterAuth client

## Step 4 — Google OAuth

- [ ] Update authorized redirect URI in Google Cloud Console from Neon Auth callback → `<app-url>/api/auth/callback/google`
  - Staging: `https://workout-staging.<account>.workers.dev/api/auth/callback/google`
  - Production: `https://<custom-domain>/api/auth/callback/google`
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as Cloudflare Worker secrets
- [ ] Add `AUTH_SECRET` (random 32+ char string) as a Cloudflare Worker secret
- [ ] Add all three to `.dev.vars` and `.env.local` for local development (do not commit)
- [ ] Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` to GitHub Actions secrets (needed at runtime, verify if build-time placeholder required)

## Step 5 — Documentation Updates

- [ ] `docs/decisions.md` — record auth migration decision and rationale
- [ ] `docs/overview.md` — update auth architecture section
- [ ] `docs/todo.md` — uncheck Neon Auth items, add BetterAuth items, update Phase 2 webhook to use BetterAuth user table
- [ ] `README.md` — update local dev setup (new env vars, migration step)

---

## Notes

- `middleware.ts` with `export const runtime = 'edge'` is intentionally kept working in Next.js 16 during transition. Migrate to `proxy.ts` once opennextjs/opennextjs-cloudflare#962 is resolved.
- Phase 2 (signup quota gating) webhook references `neon_auth.users` — this will need updating to query BetterAuth's `user` table instead.
- Resend setup (email verification) moves to BetterAuth email config, not Neon Auth dashboard. Keep the Resend todo but update the approach.
- Branch-level auth isolation is automatic: BetterAuth tables are in Neon Postgres, so Neon branch = isolated auth users.
