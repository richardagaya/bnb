import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav } from "@/app/components/SiteChrome";
import { siteFont } from "@/app/components/siteFont";
import "../contact/contact.css";
import "./about.css";

export const metadata: Metadata = {
  title: "About | Tracktar",
  description:
    "Tracktar helps independent short-term rental hosts track bookings, expenses and real monthly profit for every property they run.",
};

const PRINCIPLES = [
  {
    title: "Profit, not just revenue",
    body: "A full calendar can still lose money. Tracktar puts rent, cleaning, utilities and platform fees next to every booking so the number you see at the end of the month is what you actually kept.",
  },
  {
    title: "Read-only by design",
    body: "We import reservations from the iCal link your booking platform already gives you. Tracktar never edits your listings, prices or availability on Airbnb, Booking.com, Vrbo or anywhere else.",
  },
  {
    title: "Your data stays yours",
    body: "Your bookings, expenses and profit figures are private to your account and the co-hosts you invite. You can ask us to review, update or delete your data at any time, and our privacy policy explains what we store and why.",
  },
  {
    title: "Built for small operators",
    body: "Most property software is made for agencies with hundreds of units. Tracktar is for the host with one apartment, or five, who wants clear numbers without a setup project.",
  },
];

const FEATURES = [
  "Bookings from every platform in one calendar, including direct and WhatsApp bookings added by hand",
  "Fixed and one-off expenses logged per property",
  "A monthly profit and loss summary for each listing",
  "Co-host access per property, with your financial settings kept private",
  "14 currencies, including Kenyan Shilling, US Dollar, Euro and Nigerian Naira",
];

export default function AboutPage() {
  return (
    <div className={`lp ct ab ${siteFont.variable}`}>
      <a href="#main" className="lp-skip">Skip to content</a>
      <SiteNav current="/about" />

      <main id="main">
        <section className="ab-hero">
          <div className="lp-wrap">
            <p className="lp-kicker">About Tracktar</p>
            <h1 className="ct-title">
              Hosting is a business. <em>Most hosts just don&apos;t have the numbers.</em>
            </h1>
            <p className="lp-lead ab-lead">
              Bookings arrive from different platforms, costs are scattered across receipts and
              messages, and at the end of the month it&apos;s hard to say whether a property actually
              made money. Tracktar exists to fix that: one place that turns bookings and expenses
              into a clear monthly profit for every property you run.
            </p>
          </div>
        </section>

        <section className="ct-section">
          <div className="lp-wrap ab-split">
            <div>
              <h2 className="ct-h2">What Tracktar does</h2>
              <p className="ct-muted">
                Tracktar is a dashboard for independent short-term rental hosts. It brings together
                everything that decides whether a property is worth running.
              </p>
            </div>
            <ul className="ab-list">
              {FEATURES.map((f) => (
                <li key={f}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ct-section">
          <div className="lp-wrap">
            <h2 className="ct-h2">How we think about it</h2>
            <div className="ab-grid">
              {PRINCIPLES.map((p) => (
                <article key={p.title} className="ab-card">
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ct-section ct-section--split">
          <div className="lp-wrap ab-split">
            <div>
              <h2 className="ct-h2">Free resources</h2>
              <p className="ct-muted">
                Not every host needs software. Our <Link href="/tools">Host hub</Link> has a free ROI
                calculator and checklists, and <Link href="/blog">the blog</Link> covers pricing,
                expenses and working out real profit.
              </p>
            </div>
            <div className="ct-legal">
              <h2 className="ct-h2">Get in touch</h2>
              <p className="ct-muted">
                Questions, feedback or partnership ideas go straight to the people building Tracktar.
              </p>
              <div className="ct-legal-links">
                <Link href="/contact">Contact us</Link>
                <Link href="/privacy-policy">Privacy policy</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
