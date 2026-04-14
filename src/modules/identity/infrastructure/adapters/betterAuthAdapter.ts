import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { cloudflare } from 'better-auth-cloudflare';
import { Resend } from 'resend';
import { db } from '@/shared/infrastructure/db';
import * as schema from '../persistence/schema';

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  plugins: [cloudflare()],
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
