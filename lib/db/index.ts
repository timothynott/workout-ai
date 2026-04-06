import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Cloudflare Workers does not support TCP connections, so we use Neon's HTTP
// driver. DATABASE_URL is set as a Cloudflare Worker secret (see deploy.yml).
export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
