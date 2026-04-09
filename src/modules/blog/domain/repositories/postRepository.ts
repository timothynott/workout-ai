import type { Post, PostMeta } from '../types';

export interface PostRepository {
  findAll(): PostMeta[];
  findBySlug(slug: string): Post | null;
}
