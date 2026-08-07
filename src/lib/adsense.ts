export const ADSENSE_CLIENT_ID = "ca-pub-2321690972616605";

export function getAdSenseSlot(kind: "blog" | "article"): string | undefined {
  const blogSlot = process.env.NEXT_PUBLIC_ADSENSE_BLOG_SLOT?.trim();
  const articleSlot = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT?.trim();

  if (kind === "blog") return blogSlot || articleSlot;
  return articleSlot || blogSlot;
}
