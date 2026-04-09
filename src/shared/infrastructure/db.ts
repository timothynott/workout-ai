import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Cloudflare Workers does not support TCP connections, so we use Neon's HTTP
// driver. DATABASE_URL is set as a Cloudflare Worker secret (see deploy.yml).
// Lazy initialisation: defer neon() until first request so the build doesn't
// require DATABASE_URL at compile time.
let _db: ReturnType<typeof drizzle> | undefined;
export function getDb() {
  if (!_db) _db = drizzle(neon(process.env.DATABASE_URL!));
  return _db;
}
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
