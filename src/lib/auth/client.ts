'use client';

import { createAuthClient } from 'better-auth/react';
import { cloudflareClient } from 'better-auth-cloudflare';

export const authClient = createAuthClient({
  plugins: [cloudflareClient()],
});
