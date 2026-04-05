import { createNeonAuth } from '@neondatabase/auth/next/server';

// Redirects unauthenticated users to /sign-in.
// Allowed-email enforcement happens at sign-up time (see app/api/sign-up/route.ts).
export default createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
}).middleware({ loginUrl: '/sign-in' });

export const config = {
  matcher: [
    // Protect everything except static assets, the sign-in page, and auth-related API routes.
    '/((?!_next/static|_next/image|favicon.ico|sign-in|api/auth|api/sign-in|api/sign-up).*)',
  ],
};
