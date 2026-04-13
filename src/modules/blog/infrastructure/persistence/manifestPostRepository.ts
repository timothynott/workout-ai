// Used in Cloudflare Worker builds (CF_BUILD=true) where the Workers runtime
// has no real filesystem. Post content is pre-compiled to HTML at build time by
// running `scripts/generate-posts-manifest.mjs`, which reads content/posts/*.mdx,
// compiles each file through a remark → rehype pipeline, and outputs
// postsManifest.generated.ts. That file is bundled directly into the Worker,
// so no filesystem access or runtime MDX compilation is needed.
//
// NOT used in local dev — see filePostRepository.ts instead.
import matter from 'gray-matter';
import type { Post, PostMeta } from '../../domain/types';
import type { PostRepository } from '../../domain/repositories/postRepository';
import { POST_FILES } from './postsManifest.generated';

export const createManifestPostRepository = (): PostRepository => ({
  findAll(): PostMeta[] {
    // Frontmatter is still read from the raw manifest entry for list metadata.
    // HTML is not needed here — the list page only shows title/date/description.
    return POST_FILES
      .map(({ slug, frontmatter }) => ({
        slug,
        title: frontmatter.title as string,
        date: frontmatter.date as string,
        description: frontmatter.description as string,
        draft: frontmatter.draft as boolean | undefined,
      }))
      .filter((p) => !p.draft)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  findBySlug(slug: string): Post | null {
    const file = POST_FILES.find((f) => f.slug === slug);
    if (!file) return null;
    return {
      slug,
      title: file.frontmatter.title as string,
      date: file.frontmatter.date as string,
      description: file.frontmatter.description as string,
      content: file.html,
    };
  },
});
