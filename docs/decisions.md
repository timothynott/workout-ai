# Architecture Decision Records

## ADR-011: ORM — Drizzle over Prisma
**Status:** Accepted

Drizzle is a pure TypeScript library with no binary dependencies, making it edge-native and compatible with the Cloudflare Workers runtime out of the box. Prisma requires a query engine binary that cannot run in Cloudflare Workers; while Prisma now offers an edge-compatible driver (`@prisma/adapter-neon`), it is a more complex setup. Drizzle also has a smaller bundle size, requires no code generation step, and works cleanly with Neon's serverless HTTP driver.

---

## ADR-001: Hosting — Cloudflare Workers via OpenNext
**Status:** Accepted

Next.js deployed to **Cloudflare Workers** using [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

**Why Workers over Pages:** Cloudflare now recommends Workers (not Pages) as the deployment target for Next.js. Workers provide the Node.js compatibility layer required for full App Router support (Server Actions, middleware, ISR, Image Optimization). Cloudflare Pages is no longer the recommended path.

**Why OpenNext over `@cloudflare/next-on-pages`:** `@cloudflare/next-on-pages` is deprecated — it only supported the Edge runtime which lacks full Next.js feature support. `@opennextjs/cloudflare` is the current official recommendation.

**Future:** Next.js 16.2 (March 2026) introduced a stable native `adapterPath` Adapter API built in collaboration with the OpenNext maintainers. A first-party Cloudflare adapter built on this API is in development but not yet released. When it ships, migration should be straightforward — OpenNext is the implementation foundation for that adapter.

---

## ADR-002: Authentication — Neon Auth
**Status:** Accepted

[Neon Auth](https://neon.com/docs/auth/overview) (a managed auth service, now built on BetterAuth) for authentication. Signups are restricted to a configurable allowlist of email addresses stored as a Cloudflare secret.

---

## ADR-003: Database — Neon Postgres
**Status:** Accepted

Neon Postgres for all persistent storage. Chosen because Neon Auth already requires a Neon project, so there is no additional infrastructure cost.

---

## ADR-004: AI Abstraction — Vercel AI SDK with User-Supplied Credentials
**Status:** Accepted

The [Vercel AI SDK](https://sdk.vercel.ai) provides a model-agnostic interface over Claude, OpenAI, Google, and others. All AI interactions go through a thin provider abstraction in `/lib/ai/provider.ts`.

Rather than storing AI credentials as server-side environment variables, each user supplies their own provider, model ID, and API key during onboarding. These are stored in the `user_profile` table (API key encrypted at rest — see ADR-012). At request time, the server decrypts the user's key and instantiates the correct Vercel AI SDK provider.

This keeps AI costs attributed to the user's own account and avoids any shared server-side API key.

---

## ADR-012: Encryption at Rest for Sensitive User Data
**Status:** Accepted

Sensitive fields in the database (currently: AI API keys in `user_profile`) are encrypted at rest using AES-256-GCM before being written to Neon. A single app-level encryption key is stored as a Cloudflare secret (`ENCRYPTION_KEY`) and never touches the database.

Encryption and decryption are handled by a thin utility at `/lib/crypto.ts`. All writes to encrypted fields go through this utility — raw plaintext values are never persisted.

---

## ADR-005: Exercise Videos — YouTube Embeds (AI-supplied video IDs)
**Status:** Accepted

The AI supplies a YouTube video ID when it creates a new exercise. Videos are embedded via the standard YouTube iframe embed. Video IDs can be manually corrected in the database if the AI-supplied ID is wrong or becomes unavailable. No YouTube Data API key required.

---

## ADR-006: Mobile — Progressive Web App (PWA)
**Status:** Accepted

A PWA rather than a native app. No offline support required. The UI must be fully usable on a phone.

---

## ADR-010: Agent Context Management — Tessl
**Status:** Accepted

[Tessl](https://tessl.io) manages agent rules and skills for this project. Skills from the [Tessl Registry](https://tessl.io/registry) are installed into the repo and automatically loaded by coding agents (Claude Code, Cursor, etc.), providing accurate context for the libraries and frameworks in use and preventing hallucinated APIs and bad patterns.

Skills are installed via:
```bash
npx tessl install <skill-name>
```

We will install registry skills for each major dependency (Next.js, Cloudflare Workers, Neon, Vercel AI SDK, Drizzle, shadcn/ui, etc.) and may publish private org-level skills to encode Cloudflare Workers constraints and internal patterns as they are discovered.

The Tessl Framework (spec-driven development, currently in beta) may be adopted later to define features in structured specs before coding begins.

---

## ADR-009: UI — Tailwind CSS + shadcn/ui
**Status:** Accepted

[Tailwind CSS](https://tailwindcss.com) for styling and [shadcn/ui](https://ui.shadcn.com) for components. shadcn/ui components are copied directly into the repo (not installed as a package dependency), making them fully customizable. Tailwind is the required styling layer for shadcn/ui.

---

## ADR-008: Neon Database Branching Strategy
**Status:** Accepted

Neon branches map to deployment environments:

| Environment | Neon Branch | Cloudflare Deployment |
|---|---|---|
| Production | `main` | Pages production |
| Preview | `preview/[git-branch]` (auto-created) | Pages preview |
| Local | `dev/[your-name]` (manually created) | n/a |

Preview branches are created and deleted automatically via the [Neon GitHub integration](https://neon.com/docs/guides/neon-github-integration). Each preview deployment on Cloudflare Pages receives its own `DATABASE_URL` pointing to the corresponding Neon branch, set via a GitHub Actions step that calls the Cloudflare API. This ensures preview deployments never touch production data.

---

## ADR-007: Exercise Database — AI-generated at runtime
**Status:** Accepted

There is no pre-seeded exercise library. The AI generates exercises (name, description, YouTube video ID, default parameters) as it builds workout plans. Generated exercises are persisted to Neon so they can be reused and refined.
