import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const OUT = path.join(
  __dirname,
  '..',
  'src/modules/blog/infrastructure/persistence/postsManifest.generated.ts',
);

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
const posts = files.map((f) => {
  const slug = f.replace(/\.mdx$/, '');
  const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
  return { slug, raw };
});

const code = `// AUTO-GENERATED — do not edit. Run \`pnpm generate:posts\` to regenerate.
export const POST_FILES: Array<{ slug: string; raw: string }> = ${JSON.stringify(posts, null, 2)};
`;

fs.writeFileSync(OUT, code);
console.log(`[generate-posts-manifest] ${posts.length} posts → ${path.relative(process.cwd(), OUT)}`);
