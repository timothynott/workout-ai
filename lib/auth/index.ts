import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { cloudflare } from 'better-auth-cloudflare';
import { db } from '@/lib/db';

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg' }),
  plugins: [cloudflare()],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
