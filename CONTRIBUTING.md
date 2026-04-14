# Contributing

## Schema Changes

When you change a Drizzle schema file, you **must** generate a migration file and commit it with your PR.

```bash
pnpm db:generate
git add drizzle/
```

The deploy workflow runs `pnpm db:migrate` automatically when a PR merges to `main` or `staging`. If you don't commit the migration file, the schema change will never reach those environments.

**Never use `pnpm db:push` for staging or production.** `db:push` is only used for preview branches (handled automatically by `.github/workflows/neon_branches.yml`) — it bypasses the migration history.

## Branch → Environment Mapping

| Git branch | Neon branch | Cloudflare Worker |
|---|---|---|
| `main` | `production` | `workout-ai` |
| `staging` | `staging` | `workout-ai-staging` |
| any PR branch | `preview/pr-<n>-<branch>` (auto-created) | `workout-ai-<branch>` (auto-created) |
| local | `dev/yourname` (create manually) | n/a |

Preview branches and their Workers are created and torn down automatically by GitHub Actions. Enable **"Automatically delete head branches"** in GitHub repo settings so Workers are cleaned up on merge.

## Blog Posts

Posts live in `content/posts/*.mdx` as standard Markdown (GFM supported — tables, task lists, etc.). MDX-specific JSX syntax is not supported.

In local dev (`pnpm dev`), posts are compiled on each request — edit and refresh.

In CF builds (`pnpm cf:build`), posts are compiled to HTML at build time by `scripts/generate-posts-manifest.mjs`. The generated file (`*.generated.ts`) is gitignored and rebuilt automatically as part of the CF build.
