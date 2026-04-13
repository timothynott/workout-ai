import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const OUT = path.join(
  __dirname,
  '..',
  'src/modules/blog/infrastructure/persistence/postsManifest.generated.ts',
);

// Compile Markdown/MDX to an HTML string using a remark → rehype pipeline.
// MDX-specific JSX syntax is not supported — posts should be written in
// standard Markdown (+ GFM). This runs in Node.js at build time so the
// Cloudflare Worker only ever receives pre-compiled HTML strings.
async function compileMdx(content) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content);
  return String(file);
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

const posts = await Promise.all(
  files.map(async (f) => {
    const slug = f.replace(/\.mdx$/, '');
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    const html = await compileMdx(content);
    return { slug, frontmatter, html };
  }),
);

const code = `// AUTO-GENERATED — do not edit. Run \`pnpm generate:posts\` to regenerate.
// MDX files in content/posts/ are compiled to HTML at build time so the
// Cloudflare Worker has no filesystem dependency at runtime.
export const POST_FILES: Array<{
  slug: string;
  frontmatter: Record<string, unknown>;
  html: string;
}> = ${JSON.stringify(posts, null, 2)};
`;

fs.writeFileSync(OUT, code);
console.log(`[generate-posts-manifest] ${posts.length} posts → ${path.relative(process.cwd(), OUT)}`);
