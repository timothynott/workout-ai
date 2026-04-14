import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/modules/**/infrastructure/persistence/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',

  // Use the standard pg driver for CLI operations (generate, migrate, studio).
  // The app itself uses @neondatabase/serverless at runtime for edge compatibility.
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
