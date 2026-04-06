import { type NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export const runtime = 'edge';

export default function middleware(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session) {
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sign-in|api/auth).*)',
  ],
};
