import { type NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export default function middleware(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session) {
    const signIn = new URL('/auth/sign-in', request.url);
    signIn.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all routes except: root, blog, auth pages, static assets, and PWA files.
    // (?!$) excludes the root path "/" itself (empty string after the leading slash).
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|blog|auth|api/auth)(?!$).*)',
  ],
};
