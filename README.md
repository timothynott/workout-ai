# workout-ai

An AI-powered workout app inspired by Freeletics. Generates personalized workout plans, adapts based on your feedback, and guides you through each session.

## Docs

- [Technical Overview](docs/overview.md) — stack, architecture, domain model
- [Architecture Decisions](docs/decisions.md) — ADRs for key choices
- [Build Checklist](docs/todo.md) — phased implementation plan

## Deployment Guide

### Prerequisites
- [Neon](https://neon.tech) account
- [Cloudflare](https://cloudflare.com) account with Pages enabled
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

1. Create a new Neon project at [console.neon.tech](https://console.neon.tech).
2. The default branch (`main`) is your production database.
3. Note the connection string — this becomes `DATABASE_URL` in production.

**Local development branch:**
```bash
neonctl branch create --name dev/yourname
neonctl connection-string dev/yourname
```
Add the output as `DATABASE_URL` in `.env.local`.

**Preview branch automation:**

Install the [Neon GitHub integration](https://neon.com/docs/guides/neon-github-integration) on your repository. This automatically creates a Neon branch for each git branch and exposes `DATABASE_URL` as a GitHub Actions secret per branch.

Add the following GitHub Actions step to your preview deployment workflow to forward the branch-specific `DATABASE_URL` to the Cloudflare Pages preview environment:

```yaml
- name: Set Neon branch DATABASE_URL on Cloudflare Pages preview
  run: |
    curl -X PATCH \
      "https://api.cloudflare.com/client/v4/accounts/${{ secrets.CLOUDFLARE_ACCOUNT_ID }}/pages/projects/${{ secrets.CLOUDFLARE_PROJECT_NAME }}/deployments/${{ steps.deploy.outputs.deployment-id }}/env" \
      -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
      -H "Content-Type: application/json" \
      --data '{"DATABASE_URL": "${{ env.DATABASE_URL }}"}'
```

### 3. Neon Auth Setup

1. In the Neon console, enable **Auth** for your project.
2. Note the Auth URL and API keys.
3. Add the following to your Cloudflare Pages environment variables (production and preview):
   - `NEON_AUTH_URL`
   - `NEON_AUTH_SECRET`

### 4. Cloudflare Pages Setup

1. Connect your GitHub repository to Cloudflare Pages.
2. Set the build command: `npm run build` (OpenNext handles the Cloudflare adapter).
3. Set the output directory as required by OpenNext.
4. Add the following **production** environment variables in the Cloudflare dashboard:
   - `DATABASE_URL` — Neon `main` branch connection string
   - `NEON_AUTH_URL`
   - `NEON_AUTH_SECRET`
   - `AI_PROVIDER` — e.g. `anthropic`
   - `AI_MODEL` — e.g. `claude-sonnet-4-6`
   - `AI_API_KEY` — API key for the chosen provider
   - `ALLOWED_EMAILS` — comma-separated list of permitted signup emails

### 5. Local Development

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=           # your dev/yourname Neon branch connection string
NEON_AUTH_URL=
NEON_AUTH_SECRET=
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-6
AI_API_KEY=
ALLOWED_EMAILS=you@example.com
```

Then:
```bash
npm install
npm run db:migrate
npm run dev
```
