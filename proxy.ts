// =============================================================================
// WORKAROUND: Manual session cookie check instead of Neon Auth middleware
//
// @opennextjs/cloudflare v1.18.0 does not support Next.js 16's proxy.ts when
// it imports Node.js-only modules (like @neondatabase/auth/next/server).
// See: https://github.com/opennextjs/opennextjs-cloudflare/issues/962
//
// TODO: Check each new @opennextjs/cloudflare release for Next.js 16 proxy
// support. When it lands, replace this file with:
//
//   import { createNeonAuth } from '@neondatabase/auth/next/server';
//   export default createNeonAuth({
//     baseUrl: process.env.NEON_AUTH_BASE_URL!,
//     cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
//   }).middleware({ loginUrl: '/sign-in' });
//
// Also worth investigating: submitting a fix upstream to OpenNext that allows
// proxy.ts to import server-side modules in the Cloudflare Workers runtime.
// Relevant issue: https://github.com/opennextjs/opennextjs-cloudflare/issues/962
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';

// Neon Auth's primary session cookie name (from @neondatabase/auth internals).
// If this ever changes, update to match: NEON_AUTH_SESSION_COOKIE_NAME in
// node_modules/@neondatabase/auth/dist/next/server/index.mjs
const SESSION_COOKIE = '__Secure-neon-auth.session_token';

export default function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session) {
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect everything except static assets, the sign-in page, and auth-related API routes.
    '/((?!_next/static|_next/image|favicon.ico|sign-in|api/auth|api/sign-in|api/sign-up).*)',
  ],
};
