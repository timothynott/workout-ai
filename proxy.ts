import { auth } from '@/lib/auth/server';

// Redirects unauthenticated users to /sign-in.
// Allowed-email enforcement happens at sign-up time (see app/sign-in/actions.ts).
export default auth.middleware({ loginUrl: '/sign-in' });

export const config = {
  matcher: [
    // Protect everything except static assets, images, and the auth API route.
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
