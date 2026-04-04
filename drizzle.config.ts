import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Exclude Neon Auth (BetterAuth) managed tables from migrations.
  tablesFilter: ['!user', '!session', '!account', '!verification'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
