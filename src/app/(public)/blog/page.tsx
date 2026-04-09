import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const dynamic = 'force-static';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-10">Blog</h1>
      <ul className="space-y-10">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <time className="text-sm text-muted-foreground">{post.date}</time>
              <h2 className="text-xl font-semibold mt-1 group-hover:underline">
                {post.title}
              </h2>
              <p className="text-muted-foreground mt-1">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
