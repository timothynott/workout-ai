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

**GitHub Actions:** Add a `TESSL_TOKEN` secret to the repository (obtained via `npx tessl auth token`) and include the following step in CI workflows so agents running in CI have the same skill context:

```yaml
- name: Install Tessl skills
  run: npx tessl install --yes
  env:
    TESSL_TOKEN: ${{ secrets.TESSL_TOKEN }}
```

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
neonctl connection-string dev/yourname --project-id <project-id> --pooled
```

Copy the output connection string into `.env.local` as `DATABASE_URL` (see [Local Development](#6-local-development) below).

#### Configure the Neon GitHub integration

The Neon GitHub integration automatically creates a Neon branch for each git branch and tears it down when the branch is deleted.

1. Go to your Neon project → **Settings → Integrations → GitHub**.
2. Click **Install** and authorise Neon to access your GitHub account.
3. Select the repository (`workout-ai` or whatever you named it) and click **Connect**.

Once installed, Neon will create a `preview/<branch-name>` database branch every time a new git branch is pushed. The deploy workflow already handles wiring the matching `DATABASE_URL` to the preview Worker via `neondatabase/create-branch-action` — no extra workflow changes needed.

### 3. Neon Auth Setup

1. In the Neon console, go to your project → **Auth** tab.
2. Under **Project Info**, copy the **Auth URL** — this is `NEON_AUTH_BASE_URL`.
3. Generate a cookie secret:
   ```bash
   openssl rand -base64 32
   ```
4. Add both as Wrangler secrets (see step 4):
   - `NEON_AUTH_BASE_URL` — the Auth URL from the console
   - `NEON_AUTH_COOKIE_SECRET` — the generated secret

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add the authorised redirect URI:
   ```
   https://<your-worker-domain>/api/auth/callback/google
   ```
4. Copy the **Client ID** and **Client Secret**.
5. In the Neon console → **Auth** tab → **OAuth Providers**, enable Google and paste the credentials.

No code changes or Cloudflare secrets needed — credentials are managed entirely within Neon Auth.

### 4. Cloudflare Workers Setup

This app deploys to **Cloudflare Workers** (not Pages) using `@opennextjs/cloudflare`.

> **Note:** `@cloudflare/next-on-pages` is deprecated — do not use it. Workers provides the Node.js compatibility layer required for full Next.js App Router support.

1. Install Wrangler and authenticate:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
2. `wrangler.jsonc` and `open-next.config.ts` are already committed to the repo.
3. Set production secrets via the Cloudflare dashboard or Wrangler:
   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put NEON_AUTH_BASE_URL
   wrangler secret put NEON_AUTH_COOKIE_SECRET
   wrangler secret put ALLOWED_EMAILS
   wrangler secret put ENCRYPTION_KEY   # openssl rand -base64 32
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

### 5. GitHub Actions CI/CD

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
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Use the **"Edit Cloudflare Workers"** template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard URL: `dash.cloudflare.com/<account-id>`, or Workers & Pages sidebar |
| `TESSL_TOKEN` | `npx tessl auth token` |
Add secrets via the GitHub CLI:
```bash
echo "<token>" | gh secret set CLOUDFLARE_API_TOKEN --repo <owner>/<repo>
echo "<account-id>" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo <owner>/<repo>
npx tessl auth token | gh secret set TESSL_TOKEN --repo <owner>/<repo>
```

Or add them manually at: `https://github.com/<owner>/<repo>/settings/secrets/actions`

### 6. Local Development

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=              # your dev/yourname Neon branch connection string
NEON_AUTH_BASE_URL=        # Auth URL from Neon console → Auth tab → Configuration
NEON_AUTH_COOKIE_SECRET=   # openssl rand -base64 32
ALLOWED_EMAILS=you@example.com
ENCRYPTION_KEY=            # openssl rand -base64 32
```

> AI provider credentials are entered by the user in the onboarding UI and stored encrypted in the database using `ENCRYPTION_KEY`.

Then:
```bash
npm install
git config core.hooksPath .githooks   # one-time: enable commit message linting
npm run dev
```

**Drizzle commands** (used as tables are added in Phase 2+):

| Command | What it does |
|---|---|
| `npm run db:generate` | Generate SQL migration files from schema changes |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:push` | Prototype mode: push schema directly (no migration files) |
| `npm run db:studio` | Open Drizzle Studio GUI |
