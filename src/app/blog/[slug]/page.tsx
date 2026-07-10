import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types";
import { getPostBySlug, getAllPosts, type Post } from "@/lib/contentful";

export const revalidate = 60;

/* ── Static params ───────────────────────────────────────────────────────── */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(p => ({ slug: p.slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

/* ── Metadata ────────────────────────────────────────────────────────────── */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found — Tractar" };
  return {
    title:       `${post.seoTitle} — Tractar Blog`,
    description: post.seoDescription,
    openGraph: {
      title:       post.seoTitle,
      description: post.seoDescription,
      images:      post.coverImageUrl ? [post.coverImageUrl] : [],
      type:        "article",
      publishedTime: post.publishedAt,
    },
  };
}

/* ── Rich text renderer options ─────────────────────────────────────────── */
const richTextOptions = {
  renderMark: {
    [MARKS.BOLD]:   (text: React.ReactNode) => <strong>{text}</strong>,
    [MARKS.ITALIC]: (text: React.ReactNode) => <em>{text}</em>,
    [MARKS.CODE]:   (text: React.ReactNode) => <code className="inline-code">{text}</code>,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]:   (_: any, children: React.ReactNode) => <p>{children}</p>,
    [BLOCKS.HEADING_1]:   (_: any, children: React.ReactNode) => <h1>{children}</h1>,
    [BLOCKS.HEADING_2]:   (_: any, children: React.ReactNode) => <h2>{children}</h2>,
    [BLOCKS.HEADING_3]:   (_: any, children: React.ReactNode) => <h3>{children}</h3>,
    [BLOCKS.HEADING_4]:   (_: any, children: React.ReactNode) => <h4>{children}</h4>,
    [BLOCKS.UL_LIST]:     (_: any, children: React.ReactNode) => <ul>{children}</ul>,
    [BLOCKS.OL_LIST]:     (_: any, children: React.ReactNode) => <ol>{children}</ol>,
    [BLOCKS.LIST_ITEM]:   (_: any, children: React.ReactNode) => <li>{children}</li>,
    [BLOCKS.QUOTE]:       (_: any, children: React.ReactNode) => <blockquote>{children}</blockquote>,
    [BLOCKS.HR]:          () => <hr />,
    [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
      const { file, title } = node.data.target.fields;
      const url = file?.url?.startsWith("//") ? `https:${file.url}` : file?.url;
      if (!url) return null;
      return (
        <figure className="post-figure">
          <img src={url} alt={title || ""} className="post-img" />
          {title && <figcaption>{title}</figcaption>}
        </figure>
      );
    },
    [INLINES.HYPERLINK]: (node: any, children: React.ReactNode) => (
      <a href={node.data.uri} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <style>{CSS}</style>

      {/* Header */}
      <header className="blog-header">
        <div className="blog-header-inner">
          <Link href="/" className="blog-logo">
            <img src="/logo.png" alt="Tractar" className="blog-logo-img" />
          </Link>
          <nav className="blog-nav">
            <Link href="/blog">← All posts</Link>
            <Link href="/login" className="blog-nav-cta">Get started free →</Link>
          </nav>
        </div>
      </header>

      <main className="post-main">
        {/* Post hero */}
        <div className="post-hero">
          <div className="post-hero-inner">
            <div className="post-meta">
              <Link href="/blog" className="post-back">Blog</Link>
              <span className="post-meta-dot">·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span className="post-meta-dot">·</span>
              <span>{post.readingTime} min read</span>
            </div>
            <h1 className="post-title">{post.title}</h1>
            <p className="post-excerpt">{post.excerpt}</p>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="post-cover-wrap">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              width={1200}
              height={600}
              className="post-cover"
              priority
            />
          </div>
        )}

        {/* Body */}
        <article className="post-body">
          <div className="post-body-inner rich-text">
            {documentToReactComponents(post.body, richTextOptions)}
          </div>
        </article>

        {/* CTA */}
        <div className="post-cta-wrap">
          <div className="post-cta-card">
            <div className="post-cta-icon">⌂</div>
            <div>
              <h3 className="post-cta-title">Track your rental like a business</h3>
              <p className="post-cta-sub">
                Tractar gives you P&amp;L, booking tracking, expense management and
                calendar sync — all in one place. Free to start.
              </p>
            </div>
            <Link href="/login" className="post-cta-btn">Get started free →</Link>
          </div>
        </div>

        {/* Back link */}
        <div className="post-back-wrap">
          <Link href="/blog" className="post-back-link">← Back to all posts</Link>
        </div>
      </main>

      <footer className="blog-footer">
        <div className="blog-footer-inner">
          <Link href="/" className="blog-footer-brand">
            <img src="/logo.png" alt="Tractar" className="blog-logo-img" />
          </Link>
          <nav className="blog-footer-links">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <p className="blog-footer-copy">© 2026 Tractar. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:    #0b0c10;
    --bg2:   #111318;
    --bg3:   #181a21;
    --bd:    rgba(255,255,255,0.07);
    --bd2:   rgba(255,255,255,0.13);
    --text:  #e8e6df;
    --muted: #7a7d8a;
    --faint: #3a3d4a;
    --sage:  #81B29A;
    --amber: #F2CC8F;
    --coral: #E07A5F;
    --serif: 'Instrument Serif', Georgia, serif;
    --sans:  'Geist', system-ui, sans-serif;
  }

  body { font-family: var(--sans); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
  a { text-decoration: none; color: inherit; }

  /* ── Header ── */
  .blog-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(11,12,16,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--bd);
    padding: 0 48px; height: 68px;
    display: flex; align-items: center;
  }
  .blog-header-inner {
    max-width: 1100px; margin: 0 auto; width: 100%;
    display: flex; align-items: center; justify-content: space-between;
  }
  .blog-logo { display: flex; align-items: center; }
  .blog-logo-img { height: 48px; width: auto; filter: brightness(0.9) saturate(0.8); }
  .blog-nav { display: flex; align-items: center; gap: 28px; }
  .blog-nav a { font-size: 13px; color: var(--muted); transition: color 0.15s; }
  .blog-nav a:hover { color: var(--text); }
  .blog-nav-cta {
    font-size: 13px; font-weight: 600;
    background: var(--sage); color: #0b0c10;
    padding: 8px 18px; border-radius: 8px;
    transition: opacity 0.15s;
  }
  .blog-nav-cta:hover { opacity: 0.88; color: #0b0c10; }

  /* ── Post hero ── */
  .post-main { min-height: 100vh; }
  .post-hero {
    padding: 72px 48px 48px;
    border-bottom: 1px solid var(--bd);
    background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(129,178,154,0.06) 0%, transparent 70%);
  }
  .post-hero-inner { max-width: 740px; margin: 0 auto; }
  .post-meta {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--muted); margin-bottom: 20px;
  }
  .post-back { color: var(--sage); transition: opacity 0.15s; }
  .post-back:hover { opacity: 0.8; }
  .post-meta-dot { color: var(--faint); }
  .post-title {
    font-family: var(--serif);
    font-size: clamp(32px, 4.5vw, 54px);
    line-height: 1.1; color: var(--text);
    margin-bottom: 20px; letter-spacing: -0.3px;
  }
  .post-excerpt {
    font-size: 17px; color: var(--muted); line-height: 1.7;
  }

  /* ── Cover image ── */
  .post-cover-wrap {
    max-width: 900px; margin: 0 auto;
    padding: 0 48px;
  }
  .post-cover {
    width: 100%; height: auto; border-radius: 12px;
    margin-top: 40px; display: block;
    border: 1px solid var(--bd);
  }

  /* ── Body / Rich text ── */
  .post-body { padding: 60px 48px; }
  .post-body-inner { max-width: 700px; margin: 0 auto; }

  .rich-text { font-size: 17px; line-height: 1.8; color: #ccc9c0; }
  .rich-text p { margin-bottom: 1.5em; }
  .rich-text h1, .rich-text h2, .rich-text h3, .rich-text h4 {
    font-family: var(--serif); color: var(--text);
    margin: 2em 0 0.6em; line-height: 1.2; letter-spacing: -0.2px;
  }
  .rich-text h2 { font-size: clamp(22px, 2.5vw, 30px); }
  .rich-text h3 { font-size: clamp(18px, 2vw, 24px); }
  .rich-text h4 { font-size: 18px; }
  .rich-text ul, .rich-text ol {
    margin: 0 0 1.5em 1.4em; display: flex; flex-direction: column; gap: 6px;
  }
  .rich-text li { line-height: 1.7; }
  .rich-text blockquote {
    border-left: 3px solid var(--sage); margin: 2em 0;
    padding: 12px 0 12px 24px; color: var(--muted);
    font-style: italic; font-size: 18px;
  }
  .rich-text hr {
    border: none; border-top: 1px solid var(--bd);
    margin: 3em 0;
  }
  .rich-text a { color: var(--sage); border-bottom: 1px solid rgba(129,178,154,0.3); transition: border-color 0.15s; }
  .rich-text a:hover { border-color: var(--sage); }
  .rich-text strong { color: var(--text); font-weight: 600; }
  .inline-code {
    font-family: 'Geist Mono', monospace; font-size: 14px;
    background: var(--bg3); border: 1px solid var(--bd);
    padding: 2px 7px; border-radius: 5px; color: var(--amber);
  }
  .post-figure { margin: 2em 0; }
  .post-img { width: 100%; border-radius: 10px; border: 1px solid var(--bd); }
  .post-figure figcaption { font-size: 13px; color: var(--muted); text-align: center; margin-top: 10px; }

  /* ── CTA block ── */
  .post-cta-wrap { padding: 0 48px 60px; }
  .post-cta-card {
    max-width: 700px; margin: 0 auto;
    background: var(--bg2); border: 1px solid rgba(129,178,154,0.2);
    border-radius: 14px; padding: 28px 32px;
    display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  }
  .post-cta-icon { font-size: 28px; flex-shrink: 0; }
  .post-cta-title { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .post-cta-sub { font-size: 13px; color: var(--muted); line-height: 1.6; flex: 1; }
  .post-cta-btn {
    padding: 10px 20px; background: var(--sage); color: #0b0c10;
    border-radius: 8px; font-size: 13px; font-weight: 600;
    white-space: nowrap; flex-shrink: 0; transition: opacity 0.15s;
  }
  .post-cta-btn:hover { opacity: 0.88; }

  /* ── Back link ── */
  .post-back-wrap { padding: 0 48px 80px; max-width: 700px; margin: 0 auto; }
  .post-back-link { font-size: 13px; color: var(--muted); transition: color 0.15s; }
  .post-back-link:hover { color: var(--text); }

  /* ── Footer ── */
  .blog-footer { border-top: 1px solid var(--bd); background: var(--bg2); padding: 28px 48px; }
  .blog-footer-inner {
    max-width: 1100px; margin: 0 auto;
    display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
  }
  .blog-footer-brand { margin-right: auto; }
  .blog-footer-links { display: flex; gap: 24px; }
  .blog-footer-links a { font-size: 12px; color: var(--muted); transition: color 0.15s; }
  .blog-footer-links a:hover { color: var(--text); }
  .blog-footer-copy { font-size: 12px; color: var(--faint); }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .blog-header { padding: 0 20px; }
    .post-hero { padding: 48px 20px 32px; }
    .post-cover-wrap { padding: 0 20px; }
    .post-body { padding: 40px 20px; }
    .post-cta-wrap { padding: 0 20px 40px; }
    .post-back-wrap { padding: 0 20px 48px; }
    .post-cta-card { flex-direction: column; align-items: flex-start; }
    .blog-footer { padding: 24px 20px; }
    .rich-text { font-size: 16px; }
  }
`;
