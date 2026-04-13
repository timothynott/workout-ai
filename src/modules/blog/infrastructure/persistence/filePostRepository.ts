// Used in local dev (next dev) where the real Node.js filesystem is available.
// MDX files are read directly on each request, so edits show on browser refresh
// without needing a server restart.
//
// NOT used in Cloudflare Worker builds — the Workers runtime has no real filesystem.
// See manifestPostRepository.ts for the CF build implementation.
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Post, PostMeta } from '../../domain/types';
import type { PostRepository } from '../../domain/repositories/postRepository';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

export const createFilePostRepository = (): PostRepository => ({
  findAll(): PostMeta[] {
    return fs
      .readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => {
        const slug = f.replace(/\.mdx$/, '');
        const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
        const { data } = matter(raw);
        return {
          slug,
          title: data.title as string,
          date: data.date as string,
          description: data.description as string,
          draft: data.draft as boolean | undefined,
        };
      })
      .filter((p) => !p.draft)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  findBySlug(slug: string): Post | null {
    const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      description: data.description as string,
      content,
    };
  },
});
