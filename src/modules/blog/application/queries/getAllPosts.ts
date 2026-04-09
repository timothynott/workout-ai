import type { PostMeta } from '../../domain/types';
import type { PostRepository } from '../../domain/repositories/postRepository';

export type GetAllPosts = () => PostMeta[];

export const createGetAllPosts =
  (repo: PostRepository): GetAllPosts =>
  () =>
    repo.findAll();
