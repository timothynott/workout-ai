'use client';

import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { authClient } from '@/modules/identity/client';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    // Signup quota errors (DAILY_LIMIT / MONTHLY_LIMIT, see ADR-014) are
    // surfaced by the SignUpForm via getLocalizedError, which falls back to
    // error.error.message — the BetterAuth hook already provides friendly
    // copy, so no localization override is needed here.
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
      social={{ providers: ['google'] }}
    >
      {children}
    </AuthUIProvider>
  );
}
