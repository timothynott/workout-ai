# Contributing

## Schema Changes

When you change a Drizzle schema file, you **must** generate a migration file and commit it with your PR.

```bash
pnpm db:generate
git add drizzle/
```

The deploy workflow runs `pnpm db:migrate` automatically when a PR merges to `main` or `staging`. If you don't commit the migration file, the schema change will never reach those environments.

**Never use `pnpm db:push`.** All environments (local, preview, staging, production) use `db:migrate`. Always generate a migration file and apply it.

### Bootstrapping an existing database

If your local Neon branch already has tables (created via `db:push` before migrations were introduced) but no migration history, `db:migrate` will fail with `relation already exists`. Fix it by recording the baseline migration as already applied:

```bash
# Get your connection string (non-pooled)
neonctl connection-string dev/yourname --project-id <project-id>

# Mark the baseline migration as applied
node -e "
const { Pool } = require('pg');
const { readMigrationFiles } = require('drizzle-orm/migrator');
const pool = new Pool({ connectionString: '<your-non-pooled-url>?sslmode=verify-full' });
async function run() {
  const client = await pool.connect();
  const [baseline] = readMigrationFiles({ migrationsFolder: './drizzle' });
  await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
  await client.query('CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)');
  await client.query('INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (\$1, \$2)', [baseline.hash, baseline.folderMillis]);
  console.log('done'); client.release(); pool.end();
}
run().catch(console.error);
"

# Now migrate as normal
pnpm db:migrate
```

This is a one-time step for branches created before the migration baseline was introduced.

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
