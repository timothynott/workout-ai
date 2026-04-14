import { getAllPosts, getPost } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <Link
        href="/blog"
        className="text-sm text-muted-foreground hover:underline mb-8 block"
      >
        ← All posts
      </Link>
      <time className="text-sm text-muted-foreground">{post.date}</time>
      <h1 className="text-3xl font-bold mt-2 mb-10">{post.title}</h1>
      {/* Post content is pre-compiled to HTML — by filePostRepository in dev
          and by scripts/generate-posts-manifest.mjs in CF builds. Both use the
          same remark → rehype pipeline so output is identical in both envs. */}
      <article
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </main>
  );
}
