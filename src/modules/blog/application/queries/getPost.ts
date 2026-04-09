import type { Post } from '../../domain/types';
import type { PostRepository } from '../../domain/repositories/postRepository';

export type GetPost = (slug: string) => Post | null;

export const createGetPost =
  (repo: PostRepository): GetPost =>
  (slug) =>
    repo.findBySlug(slug);
