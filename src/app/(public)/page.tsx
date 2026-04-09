import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-xl">
          Your AI personal trainer
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          AI-generated workout plans that adapt to your feedback — no gym membership or personal
          trainer required.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/auth/sign-up"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
          </Link>
          <Link
            href="/blog"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            How it&apos;s built →
          </Link>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
        Built in public —{' '}
        <Link href="/blog" className="hover:underline">
          read the build log
        </Link>
      </footer>
    </>
  );
}
