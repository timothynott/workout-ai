# Technical Design — Signup Quota Gating (Phase 2)

**Branch:** `claude/phase-2-signup-quota-4sR6r` (off `staging`)
**Relevant ADR:** [ADR-014 — Signup Quota Gating — BetterAuth `before` Hook](../decisions.md)
**Relevant checklist items:** see Phase 2 in [`docs/todo.md`](../todo.md)

## Goal

Protect Resend's free-tier email quota (100/day, 3,000/month) by rejecting
user-creation attempts that would exceed a configurable per-day or per-month
signup threshold. Surface a user-friendly message in the signup UI when the
quota is exhausted so the visitor knows to try again later rather than
encountering a generic failure.

## Scope

Applies to **email+password signups only**. Google OAuth first-time sign-ins
also insert a `user` row, but BetterAuth trusts Google's email verification and
never calls `sendVerificationEmail` for OAuth users — they don't consume Resend
quota. The `before` hook exits early when `user.emailVerified` is `true`
(the OAuth signal), and the count queries are filtered to
`account.provider_id = 'credential'` so historical OAuth rows don't inflate
the tally.

## Out of scope

- Waitlist / queued signups
- Per-IP or per-email rate limits (BetterAuth already protects sessions)
- Changing Resend plan tier — quota constants are the lever

## Architecture

```
POST /api/auth/sign-up/email
        │
        ▼
BetterAuth `databaseHooks.user.create.before`
        │
        ├─ user.emailVerified = true (OAuth) → pass through immediately
        │
        ▼
checkSignupQuota(db)   ──► SELECT COUNT(*) FROM user
                           JOIN account ON account.user_id = user.id
                           WHERE account.provider_id = 'credential'
                           AND user.created_at ≥ …
        │
        ├─ allowed  → return { data: user } (hook passes user through unchanged)
        └─ blocked  → throw APIError("TOO_MANY_REQUESTS",
                                     { code: "DAILY_LIMIT"  | "MONTHLY_LIMIT",
                                       message: <friendly copy> })
                         │
                         ▼
               BetterAuth rejects request
                         │
                         ▼
               @daveyplate/better-auth-ui SignUpForm
               surfaces error via getLocalizedError(…)
```

BetterAuth's `databaseHooks.user.create.before` runs **before** the insert,
receives the user row, and may return `{ data }` or throw. Throwing an
`APIError` from `@better-auth/core/error` short-circuits the request with the
given status + code + message. The client library's
`getLocalizedError` helper reads `error.error.code` and prefers a matching key
from the `AuthUIProvider` `localization` prop, falling back to
`error.error.message`. Either path yields a user-friendly string — we will
set both a code (for i18n hook points) and a message (for the fallback).

## Module layout

Following the existing DDD structure (`src/modules/<name>/{domain,application,infrastructure}/`),
the quota gate lives inside the `identity` module:

| File | Purpose |
|---|---|
| `src/modules/identity/domain/quota.ts` | Pure constants: `QUOTA.daily`, `QUOTA.monthly`, error-code enum, friendly messages. No side effects, no imports from infra. |
| `src/modules/identity/application/checkSignupQuota.ts` | `checkSignupQuota(db)` async function → `{ allowed: true } \| { allowed: false, reason: "daily_limit" \| "monthly_limit" }`. Pure, takes its dependency (the DB) as an argument. |
| `src/modules/identity/application/checkSignupQuota.test.ts` | Unit tests: mocked db returns zero/at-daily-cap/at-monthly-cap; asserts decisions. |
| `src/modules/identity/infrastructure/adapters/betterAuthAdapter.ts` | Adds `databaseHooks.user.create.before` that calls `checkSignupQuota(db)` and throws `APIError` on block. |
| `src/app/providers.tsx` | Adds `localization` entries for `DAILY_LIMIT` / `MONTHLY_LIMIT` to the `AuthUIProvider` so the UI message is project-owned copy. |

> **Deviation from the Phase 2 checklist paths** (`lib/quota.ts`,
> `lib/quota-check.ts`): the DDD migration in Phase 1 moved cross-cutting
> auth code under `src/modules/identity/…` and reserved `src/lib/` for the
> framework-facing composition root (`src/lib/identity.ts`). Placing the
> quota module inside `identity` keeps it colocated with the only hook
> that calls it. The checklist wording predates the DDD migration.

## Query design

BetterAuth's Drizzle adapter exposes a `count()` API, but we already have
direct Drizzle access via `@/shared/infrastructure/db`. Using Drizzle directly
keeps the hook dependency narrow (just the schema's `user` table) and avoids
coupling the quota logic to BetterAuth internals.

Both queries join `user` with `account` on `userId` and filter to
`account.provider_id = 'credential'` so only email+password signups — the ones
that actually send a verification email — are counted against the quota.

- **Daily (rolling 24 hours):** `count(*) … WHERE created_at >= NOW() - INTERVAL '24 hours'`.
  Avoids a dependency on Postgres `CURRENT_DATE`, which resolves against the
  session's `timezone` setting rather than UTC.
- **Monthly (rolling 31 days):** `count(*) … WHERE created_at >= NOW() - INTERVAL '31 days'`.
  A rolling window is safer than a calendar month — it prevents a burst on the
  1st from blowing the budget before Resend's counter rolls over.

Both counts run in a single transaction-less pair of serverless HTTP queries.
Neon's HTTP driver is stateless, so parallelism via `Promise.all` is fine.

## Error shape

```ts
throw new APIError("TOO_MANY_REQUESTS", {
  code: "DAILY_LIMIT",   // or "MONTHLY_LIMIT"
  message: "We've hit today's signup limit. Please try again tomorrow.",
});
```

- HTTP 429 keeps the signal semantically correct for any future monitoring.
- `code` is a stable machine-readable key for the client's localization map.
- `message` is the human-readable fallback; good enough on its own for v1.

## Client UX

`AuthUIProvider` in `src/app/providers.tsx` already wraps the signup view. Its
`getLocalizedError` helper reads `error.error.code`, looks the code up in the
`localization` prop (typed as `Partial<AuthLocalization>`, a closed set of
library-known keys), and falls back to `error.error.message` when there's no
match. Since custom project codes like `DAILY_LIMIT` aren't in that union, a
`localization` override doesn't type-check — but the fallback path does
exactly what we want: render the friendly `message` the hook already
supplies. No client component change is needed; the copy lives server-side
in `domain/quota.ts` and flows through the fallback automatically.

## Testing strategy

1. **Unit (Vitest, node env — existing setup):**
   `checkSignupQuota` with a stub db returning each of:
   - `{ daily: 0,  monthly: 0  }` → `{ allowed: true }`
   - `{ daily: 100, monthly: 500 }` → `{ allowed: false, reason: "daily_limit" }`
   - `{ daily: 50, monthly: 3000 }` → `{ allowed: false, reason: "monthly_limit" }`
   - Daily cap takes precedence when both are exceeded (more urgent user-facing signal).

2. **Manual smoke (local dev):** temporarily set `QUOTA.daily = 0`, attempt
   email signup, confirm the SignUpForm surfaces our copy.

3. **CI:** the existing `pnpm test` step in `.github/workflows/deploy.yml`
   runs the unit tests on every push.

## Rollout

1. Ship to staging via this PR → preview Worker + preview Neon branch.
2. Exercise signup on the preview Worker to confirm the hook fires and the
   UI shows the correct copy for blocked attempts.
3. Merge to `main` once verified.

## Implementation checklist (commit plan)

Each bullet below is one focused commit.

- [x] **docs(tdd):** write this design note.
- [x] **feat(identity):** add `domain/quota.ts` constants + error codes.
- [x] **feat(identity):** add `application/checkSignupQuota.ts` with unit tests.
- [x] **feat(identity):** wire `databaseHooks.user.create.before` in `betterAuthAdapter.ts`.
- [x] **feat(ui):** add quota-error localization to `AuthUIProvider` in `providers.tsx`.
- [x] **docs(blog):** publish Phase 2 blog post.
- [x] **chore(todo):** mark Phase 2 items complete in `docs/todo.md`.
- [ ] **PR:** push branch, open PR to `staging`, assign reviewer.

## Progress log

- 2026-04-15 — Plan drafted. Starting implementation.
- 2026-04-15 — Review feedback addressed: switched the daily window from
  `CURRENT_DATE` to a rolling 24-hour interval (symmetric with the monthly
  window, avoids Postgres session-timezone dependency) and added an inline
  note in the hook acknowledging the check-then-insert race.
