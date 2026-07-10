import { createClient } from "contentful";
import type { EntrySkeletonType } from "contentful";

/* ── Client ─────────────────────────────────────────────────────────────── */
export const client = createClient({
  space:       process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});

/* ── Types ──────────────────────────────────────────────────────────────── */
export type PostFields = {
  title:          string;
  slug:           string;
  excerpt:        string;
  body:           any;           // Contentful rich text document
  coverImage:     any;           // Contentful asset
  publishedAt:    string;
  seoTitle?:      string;
  seoDescription?: string;
};

export type Post = {
  id:             string;
  title:          string;
  slug:           string;
  excerpt:        string;
  body:           any;
  coverImageUrl:  string | null;
  publishedAt:    string;
  seoTitle:       string;
  seoDescription: string;
  readingTime:    number;
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
function getImageUrl(asset: any): string | null {
  const url = asset?.fields?.file?.url;
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

function estimateReadingTime(body: any): number {
  // Count words in rich text nodes
  let wordCount = 0;
  const walk = (node: any) => {
    if (node?.nodeType === "text") wordCount += (node.value || "").split(/\s+/).filter(Boolean).length;
    (node?.content || []).forEach(walk);
  };
  walk(body);
  return Math.max(1, Math.ceil(wordCount / 200));
}

function normalisePost(entry: any): Post {
  const f = entry.fields as PostFields;
  return {
    id:             entry.sys.id,
    title:          f.title,
    slug:           f.slug,
    excerpt:        f.excerpt,
    body:           f.body,
    coverImageUrl:  getImageUrl(f.coverImage),
    publishedAt:    f.publishedAt,
    seoTitle:       f.seoTitle || f.title,
    seoDescription: f.seoDescription || f.excerpt,
    readingTime:    estimateReadingTime(f.body),
  };
}

/* ── Fetch functions ─────────────────────────────────────────────────────── */
export async function getAllPosts(): Promise<Post[]> {
  const res = await client.getEntries({
    content_type: "post",
    order:        ["-fields.publishedAt"] as any,
    limit:        100,
  });
  return res.items.map(normalisePost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!slug) return null;
  const res = await client.getEntries({
    content_type:   "post",
    "fields.slug":  slug,
    limit:          1,
  });
  if (!res.items.length) return null;
  return normalisePost(res.items[0]);
}

export async function getFeaturedPosts(limit = 3): Promise<Post[]> {
  const res = await client.getEntries({
    content_type: "post",
    order:        ["-fields.publishedAt"] as any,
    limit,
  });
  return res.items.map(normalisePost);
}
