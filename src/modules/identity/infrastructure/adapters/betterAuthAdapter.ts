import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { cloudflare } from 'better-auth-cloudflare';
import { APIError } from 'better-auth/api';
import { Resend } from 'resend';
import { count, gte, sql } from 'drizzle-orm';
import { db } from '@/shared/infrastructure/db';
import { checkSignupQuota } from '@/modules/identity/application/checkSignupQuota';
import {
  QUOTA_ERROR_CODE,
  QUOTA_ERROR_MESSAGE,
} from '@/modules/identity/domain/quota';
import * as schema from '../persistence/schema';

/** Neon-backed adapter for the quota query — thin so the logic stays unit-tested. */
const signupCountPort = {
  async countSinceStartOfDay() {
    const [row] = await db
      .select({ n: count() })
      .from(schema.user)
      .where(gte(schema.user.createdAt, sql`CURRENT_DATE`));
    return row?.n ?? 0;
  },
  async countLastMonth() {
    const [row] = await db
      .select({ n: count() })
      .from(schema.user)
      .where(gte(schema.user.createdAt, sql`NOW() - INTERVAL '31 days'`));
    return row?.n ?? 0;
  },
};

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  plugins: [cloudflare()],
  databaseHooks: {
    user: {
      create: {
        // Enforce signup quota (ADR-014) before any user row is inserted.
        // Applies to both email+password signup and OAuth first-sign-in.
        before: async (user) => {
          const decision = await checkSignupQuota(signupCountPort);
          if (!decision.allowed) {
            throw new APIError('TOO_MANY_REQUESTS', {
              code: QUOTA_ERROR_CODE[decision.reason],
              message: QUOTA_ERROR_MESSAGE[decision.reason],
            });
          }
          return { data: user };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.RESEND_FROM_ADDRESS ?? 'onboarding@resend.dev',
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url }) {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.RESEND_FROM_ADDRESS ?? 'onboarding@resend.dev',
        to: user.email,
        subject: 'Verify your email',
        html: `<p>Click <a href="${url}">here</a> to verify your email address.</p>`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
});
