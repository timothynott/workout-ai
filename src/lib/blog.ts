import { createFilePostRepository } from '@/modules/blog/infrastructure/persistence/filePostRepository';
import { createGetAllPosts } from '@/modules/blog/application/queries/getAllPosts';
import { createGetPost } from '@/modules/blog/application/queries/getPost';

const repository = createFilePostRepository();

export const getAllPosts = createGetAllPosts(repository);
export const getPost = createGetPost(repository);
