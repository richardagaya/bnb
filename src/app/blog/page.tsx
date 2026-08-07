import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AdSense } from "@/components/AdSense";
import { getAdSenseSlot } from "@/lib/adsense";
import { getAllPosts, type Post } from "@/lib/contentful";

export const metadata: Metadata = {
  title:       "Blog — Tractar",
  description: "Guides, tips and product updates for short-term rental hosts.",
};

export const revalidate = 60; // ISR — rebuild pages every 60 seconds

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

/* ── Post card ───────────────────────────────────────────────────────────── */
function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`post-card ${featured ? "post-card--featured" : ""}`}>
      {post.coverImageUrl && (
        <div className="post-card-img-wrap">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="post-card-img"
            sizes={featured ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
          />
          <div className="post-card-img-overlay" />
        </div>
      )}
      <div className="post-card-body">
        <div className="post-card-meta">
          <span className="post-card-date">{formatDate(post.publishedAt)}</span>
          <span className="post-card-dot">·</span>
          <span className="post-card-read">{post.readingTime} min read</span>
        </div>
        <h2 className="post-card-title">{post.title}</h2>
        <p className="post-card-excerpt">{post.excerpt}</p>
        <span className="post-card-cta">Read article →</span>
      </div>
    </Link>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default async function BlogIndex() {
  const posts = await getAllPosts();
  const [hero, ...rest] = posts;
  const adSlot = getAdSenseSlot("blog");

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
            <Link href="/">Home</Link>
            <Link href="/tools">Tools</Link>
            <Link href="/login" className="blog-nav-cta">Get started free →</Link>
          </nav>
        </div>
      </header>

      <main className="blog-main">
        {/* Hero */}
        <section className="blog-hero">
          <div className="blog-hero-inner">
            <span className="blog-tag">The Tractar Blog</span>
            <h1 className="blog-hero-title">
              Insights for hosts who<br />
              <em>mean business.</em>
            </h1>
            <p className="blog-hero-sub">
              Guides, tips, and product updates to help you run your short-term
              rental like a real business.
            </p>
          </div>
        </section>

        {adSlot && (
          <div className="blog-ad-wrap">
            <AdSense slot={adSlot} className="blog-ad" />
          </div>
        )}

        <div className="blog-content">
          {posts.length === 0 ? (
            <div className="blog-empty">
              <p>No posts yet — check back soon.</p>
            </div>
          ) : (
            <>
              {/* Featured / hero post */}
              {hero && (
                <section className="blog-featured">
                  <p className="blog-section-label">Latest post</p>
                  <PostCard post={hero} featured />
                </section>
              )}

              {/* Rest of posts grid */}
              {rest.length > 0 && (
                <section className="blog-grid-section">
                  <p className="blog-section-label">All posts</p>
                  <div className="blog-grid">
                    {rest.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
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

  /* ── Hero ── */
  .blog-hero {
    padding: 80px 48px 60px;
    border-bottom: 1px solid var(--bd);
    background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(129,178,154,0.07) 0%, transparent 70%);
  }
  .blog-hero-inner { max-width: 700px; margin: 0 auto; text-align: center; }
  .blog-tag {
    display: inline-flex; align-items: center;
    font-size: 11px; font-weight: 600; letter-spacing: 1.3px;
    text-transform: uppercase; color: var(--sage);
    background: rgba(129,178,154,0.08); border: 1px solid rgba(129,178,154,0.2);
    padding: 4px 12px; border-radius: 4px; margin-bottom: 24px;
  }
  .blog-hero-title {
    font-family: var(--serif);
    font-size: clamp(36px, 5vw, 60px);
    line-height: 1.08; color: var(--text);
    margin-bottom: 16px; letter-spacing: -0.3px;
  }
  .blog-hero-title em { color: var(--sage); font-style: normal; }
  .blog-hero-sub { font-size: 16px; color: var(--muted); line-height: 1.7; }

  /* ── Ads ── */
  .blog-ad-wrap {
    max-width: 1100px; margin: 0 auto; padding: 0 48px;
  }
  .blog-ad {
    min-height: 90px; margin: 0 auto;
    overflow: hidden; border-radius: 10px;
    border: 1px solid var(--bd); background: var(--bg2);
  }

  /* ── Content ── */
  .blog-main { min-height: 100vh; }
  .blog-content { max-width: 1100px; margin: 0 auto; padding: 60px 48px 100px; }
  .blog-section-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 20px;
  }
  .blog-featured { margin-bottom: 60px; }
  .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
  .blog-empty { text-align: center; padding: 80px 0; color: var(--muted); font-size: 15px; }

  /* ── Post card ── */
  .post-card {
    display: flex; flex-direction: column;
    background: var(--bg2); border: 1px solid var(--bd);
    border-radius: 14px; overflow: hidden;
    transition: border-color 0.2s, transform 0.18s;
    cursor: pointer;
  }
  .post-card:hover { border-color: var(--bd2); transform: translateY(-3px); }
  .post-card--featured { flex-direction: row; align-items: stretch; }
  .post-card-img-wrap {
    position: relative; overflow: hidden; flex-shrink: 0;
    height: 200px;
  }
  .post-card--featured .post-card-img-wrap {
    width: 45%; height: auto; min-height: 320px;
  }
  .post-card-img { object-fit: cover; transition: transform 0.4s; }
  .post-card:hover .post-card-img { transform: scale(1.03); }
  .post-card-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(11,12,16,0.5) 0%, transparent 60%);
  }
  .post-card-body {
    padding: 24px 28px; display: flex; flex-direction: column; gap: 10px; flex: 1;
  }
  .post-card-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
  .post-card-dot { color: var(--faint); }
  .post-card-title {
    font-family: var(--serif);
    font-size: clamp(18px, 2.2vw, 26px);
    line-height: 1.2; color: var(--text);
    letter-spacing: -0.2px;
  }
  .post-card--featured .post-card-title { font-size: clamp(22px, 2.8vw, 34px); }
  .post-card-excerpt { font-size: 14px; color: var(--muted); line-height: 1.65; flex: 1; }
  .post-card-cta { font-size: 13px; color: var(--sage); font-weight: 500; margin-top: 4px; }

  /* ── Footer ── */
  .blog-footer {
    border-top: 1px solid var(--bd);
    background: var(--bg2); padding: 28px 48px;
  }
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
    .blog-nav a:not(.blog-nav-cta) { display: none; }
    .blog-hero { padding: 60px 20px 40px; }
    .blog-ad-wrap { padding: 0 20px; }
    .blog-content { padding: 40px 20px 60px; }
    .post-card--featured { flex-direction: column; }
    .post-card--featured .post-card-img-wrap { width: 100%; min-height: 200px; }
    .blog-grid { grid-template-columns: 1fr; }
    .blog-footer { padding: 24px 20px; }
  }
`;
