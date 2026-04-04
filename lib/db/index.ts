import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Cloudflare Workers does not support TCP connections, so we use Neon's HTTP
// driver. DATABASE_URL is set as a Cloudflare Worker secret (see deploy.yml).
// Schema tables are imported and passed here as they are added in Phase 2+.
export const db = drizzle(neon(process.env.DATABASE_URL!));
