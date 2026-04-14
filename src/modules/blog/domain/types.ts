export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  draft?: boolean;
}

export interface Post extends PostMeta {
  content: string;
}
