import { createFilePostRepository } from '@/modules/blog/infrastructure/persistence/filePostRepository';
import { createManifestPostRepository } from '@/modules/blog/infrastructure/persistence/manifestPostRepository';
import { createGetAllPosts } from '@/modules/blog/application/queries/getAllPosts';
import { createGetPost } from '@/modules/blog/application/queries/getPost';

// CF_BUILD is set to 'true' in package.json cf:* scripts and baked into the
// bundle by next.config.ts. This lets Next.js tree-shake the unused branch so
// only one repository implementation ends up in the final Worker bundle.
//
// - Local dev (next dev):   CF_BUILD is unset → fs-based repo, edits show on refresh
// - CF Worker build:        CF_BUILD=true     → manifest repo, no filesystem needed
const repository =
  process.env.CF_BUILD === 'true'
    ? createManifestPostRepository()
    : createFilePostRepository();

export const getAllPosts = createGetAllPosts(repository);
export const getPost = createGetPost(repository);
