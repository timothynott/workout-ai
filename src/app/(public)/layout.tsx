import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="font-semibold tracking-tight hover:underline">
          Workout AI
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Blog
          </Link>
          <Link href="/auth/sign-in" className="text-sm font-medium hover:underline">
            Sign in
          </Link>
        </nav>
      </header>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
