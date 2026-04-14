# workout-ai

An AI-powered workout app inspired by Freeletics. Generates personalized workout plans, adapts based on your feedback, and guides you through each session.

## Docs

- [Technical Overview](docs/overview.md) — stack, architecture, domain model
- [Architecture Decisions](docs/decisions.md) — ADRs for key choices
- [Build Checklist](docs/todo.md) — phased implementation plan

## Deployment Guide

### Prerequisites
- [Neon](https://neon.tech) account
- [Cloudflare](https://cloudflare.com) account with Workers enabled
- [Tessl](https://tessl.io) account (free) for agent skill management
- GitHub repository (required for Neon branch automation)

### 1. Tessl Setup

Tessl manages agent skills that give AI coding tools accurate context for the libraries in this project.

```bash
# Authenticate with the Tessl registry
npx tessl auth login

# Init Tessl in the project
# Optionally configure MCP for your agent (claude-code, cursor, copilot, codex, etc.)
npx tessl init --agent <your-agent>

# Install skills (official sources and Tessl Labs only)
npx tessl install github:cloudflare/skills --skill cloudflare --yes
npx tessl install tessl-labs/drizzle-best-practices --yes
npx tessl install tessl-labs/react-patterns --yes
npx tessl install github:vercel/ai --skill ai-sdk --yes
npx tessl install github:shadcn-ui/ui --skill shadcn --yes
```

Tessl skills are for local AI coding tools only — they are not needed in CI.

### 2. Neon Setup

#### Create the project

1. Go to [console.neon.tech](https://console.neon.tech) and click **New project**.
2. Name it (e.g. `workout-ai`). Leave the default Postgres version and region as-is unless you have a preference.
3. The project is created with a default branch named `main` — this is your **production database**. Do not rename it.
4. Once created, open the project and go to **Dashboard → Connection string**. Copy the pooled connection string (it looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`). This is your production `DATABASE_URL`.

#### Store the production DATABASE_URL

Add it as a GitHub Actions secret so the CI/CD deploy workflow can set it on the production Worker:

```bash
echo "<connection-string>" | gh secret set DATABASE_URL --repo <owner>/<repo>
```

Also note the **Project ID** (visible in the URL: `console.neon.tech/app/projects/<project-id>` or under project settings) — you'll need it for the GitHub integration in a later step.

#### Create a local dev branch

Each developer gets their own Neon branch so local work never touches production data.

Install the Neon CLI if you don't have it:
```bash
npm install -g neonctl
neonctl auth
```

Create your branch (replace `yourname`):
```bash
neonctl branch create --name dev/yourname --project-id <project-id>
neonctl connection-string dev/yourname --project-id <project-id>
```

Copy the output connection string into `.env` as `DATABASE_URL`, replacing `sslmode=require` with `sslmode=verify-full` (required for the `pg` driver used by `db:migrate`). See [Local Development](#6-local-development) below.

#### Configure the Neon GitHub integration

The Neon GitHub integration automatically creates a Neon branch for each git branch and tears it down when the branch is deleted.

1. Go to your Neon project → **Settings → Integrations → GitHub**.
2. Click **Install** and authorise Neon to access your GitHub account.
3. Select the repository (`workout-ai` or whatever you named it) and click **Connect**.

Once installed, Neon will create a `preview/<branch-name>` database branch every time a new git branch is pushed. The deploy workflow already handles wiring the matching `DATABASE_URL` to the preview Worker via `neondatabase/create-branch-action` — no extra workflow changes needed.

### 3. BetterAuth Setup

BetterAuth is self-hosted and configured in code — no external dashboard needed.

1. Generate an `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
2. Run the BetterAuth DB migration to create auth tables in your Neon DB:
   ```bash
   pnpm db:migrate
   ```
   This applies the initial migration and creates the `user`, `session`, `account`, and `verification` tables in Neon.

3. Add `AUTH_SECRET` as a GitHub Actions secret and a Cloudflare Worker secret (see steps 5–6):
   ```bash
   gh secret set AUTH_SECRET --app actions
   wrangler secret put AUTH_SECRET --name workout-ai
   ```

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add the authorised redirect URIs:
   ```
   https://workout-ai-staging.<subdomain>.workers.dev/api/auth/callback/google
   https://<custom-domain>/api/auth/callback/google
   ```
4. Copy the **Client ID** and **Client Secret**.
5. Add them as GitHub Actions secrets and Cloudflare Worker secrets (see steps 5–6):
   ```bash
   gh secret set GOOGLE_CLIENT_ID     --app actions
   gh secret set GOOGLE_CLIENT_SECRET --app actions
   wrangler secret put GOOGLE_CLIENT_ID     --name workout-ai
   wrangler secret put GOOGLE_CLIENT_SECRET --name workout-ai
   ```

> **OAuth and preview branches:** Only register redirect URIs for stable, long-lived workers (staging, production). Preview branch workers get a new URL per branch — avoid registering them in GCP.

### 4. Resend Setup

Resend delivers auth emails (signup verification). It is integrated via the BetterAuth `emailVerification` plugin in `lib/auth/index.ts` using Resend's Node SDK — no SMTP configuration needed.

1. Create an account at [resend.com](https://resend.com).
2. Create an API key under **API Keys**. The default `onboarding@resend.dev` sender works for testing.
3. Before going to production, add and verify your sending domain under **Domains** and update `RESEND_FROM_ADDRESS`.
4. Add both as GitHub Actions secrets and Cloudflare Worker secrets (see steps 5–6):
   ```bash
   gh secret set RESEND_API_KEY      --app actions
   gh secret set RESEND_FROM_ADDRESS --app actions   # onboarding@resend.dev for testing
   wrangler secret put RESEND_API_KEY      --name workout-ai
   wrangler secret put RESEND_FROM_ADDRESS --name workout-ai
   ```

> Resend's free tier supports 3,000 emails/month and 100/day — sufficient for a personal app.

### 5. Cloudflare Workers Setup

This app deploys to **Cloudflare Workers** (not Pages) using `@opennextjs/cloudflare`.

> **Note:** `@cloudflare/next-on-pages` is deprecated — do not use it. Workers provides the Node.js compatibility layer required for full Next.js App Router support.

1. Install Wrangler and authenticate:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
2. `wrangler.jsonc` and `open-next.config.ts` are already committed to the repo.
3. Set production secrets on stable workers via Wrangler (the deploy workflow keeps them in sync after this):
   ```bash
   wrangler secret put DATABASE_URL          --name workout-ai
   wrangler secret put AUTH_SECRET           --name workout-ai
   wrangler secret put RESEND_API_KEY        --name workout-ai
   wrangler secret put RESEND_FROM_ADDRESS   --name workout-ai
   wrangler secret put GOOGLE_CLIENT_ID      --name workout-ai
   wrangler secret put GOOGLE_CLIENT_SECRET  --name workout-ai
   wrangler secret put ALLOWED_EMAILS        --name workout-ai
   wrangler secret put ENCRYPTION_KEY        --name workout-ai   # openssl rand -base64 32
   ```
   > AI provider credentials (API key, provider, model) are supplied by the user during onboarding and stored encrypted in the database — no server-side AI secrets needed.
4. Deploy:
   ```bash
   npm run cf:deploy
   ```
6. To preview locally using the Workers runtime:
   ```bash
   npm run cf:preview
   ```

### 6. GitHub Actions CI/CD

The deploy workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) automatically builds and deploys to Cloudflare Workers on every push to any branch.

**Branch deploy behaviour:**

| Branch | Worker name | URL |
|---|---|---|
| `main` | `workout-ai` | `workout-ai.<subdomain>.workers.dev` |
| any other | `workout-ai-<sanitized-branch-name>` | `workout-ai-<branch>.<subdomain>.workers.dev` |

Branch names are lowercased and non-alphanumeric characters replaced with `-`. Worker names are capped at 63 characters. Find the deployed URL for any worker in the [Cloudflare Workers dashboard](https://dash.cloudflare.com).

**Preview worker cleanup:**

The cleanup workflow at [`.github/workflows/cleanup.yml`](.github/workflows/cleanup.yml) automatically deletes the preview worker when a branch is deleted. To have branches deleted automatically after merge, enable **"Automatically delete head branches"** in your GitHub repository settings (`Settings → General → Pull Requests`).

**Required GitHub repository secrets:**

| Secret | How to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → **"Edit Cloudflare Workers"** template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard URL or Workers & Pages sidebar |
| `DATABASE_URL` | Neon console → production `main` branch connection string (pooled) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_ADDRESS` | Your verified sending address (or `onboarding@resend.dev` for testing) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials |
| `ALLOWED_EMAILS` | Comma-separated list of emails allowed to sign up |

Add secrets via the GitHub CLI:
```bash
echo "<token>" | gh secret set CLOUDFLARE_API_TOKEN --repo <owner>/<repo>
echo "<account-id>" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo <owner>/<repo>
```

Or add them manually at: `https://github.com/<owner>/<repo>/settings/secrets/actions`

### 7. Local Development

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

```env
DATABASE_URL=              # your dev/yourname Neon branch connection string (pooled)
AUTH_SECRET=               # openssl rand -base64 32
GOOGLE_CLIENT_ID=          # from Google Cloud Console
GOOGLE_CLIENT_SECRET=      # from Google Cloud Console
RESEND_API_KEY=            # from resend.com → API Keys
RESEND_FROM_ADDRESS=       # onboarding@resend.dev for local testing
ALLOWED_EMAILS=            # comma-separated list of allowed emails
```

> AI provider credentials are entered by the user in the onboarding UI and stored encrypted in the database using `ENCRYPTION_KEY`.

Then:
```bash
pnpm install
git config core.hooksPath .githooks   # one-time: enable commit message linting
pnpm dev
```

**Drizzle commands** (used as tables are added in Phase 2+):

| Command | What it does |
|---|---|
| `pnpm db:generate` | Generate SQL migration files from schema changes |
| `pnpm db:migrate` | Apply pending migrations to the database |
| `pnpm db:studio` | Open Drizzle Studio GUI |
