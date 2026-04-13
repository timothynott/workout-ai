// Used in Cloudflare Worker builds (CF_BUILD=true) where the Workers runtime
// has no real filesystem. Post content is inlined at build time by running
// `scripts/generate-posts-manifest.mjs`, which reads content/posts/*.mdx and
// outputs postsManifest.generated.ts. That file is bundled directly into the
// Worker, so no filesystem access is needed at runtime.
//
// NOT used in local dev — see filePostRepository.ts instead.
import matter from 'gray-matter';
import type { Post, PostMeta } from '../../domain/types';
import type { PostRepository } from '../../domain/repositories/postRepository';
import { POST_FILES } from './postsManifest.generated';

export const createManifestPostRepository = (): PostRepository => ({
  findAll(): PostMeta[] {
    return POST_FILES
      .map(({ slug, raw }) => {
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
    const file = POST_FILES.find((f) => f.slug === slug);
    if (!file) return null;
    const { data, content } = matter(file.raw);
    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      description: data.description as string,
      content,
    };
  },
});
