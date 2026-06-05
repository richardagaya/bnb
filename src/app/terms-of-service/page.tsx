import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Tractar",
  description: "Terms of Service for Tractar.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#0b0c10] px-6 py-12 text-[#e8e6df]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-10 inline-flex items-center">
          <img
            src="/logo.png"
            alt="Tractar"
            className="h-16 w-auto brightness-[0.3] contrast-200 saturate-200"
          />
        </Link>

        <article className="rounded-2xl border border-[#2a2d38] bg-[#111318] p-8 shadow-2xl shadow-black/20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#81B29A]">
            Terms of Service
          </p>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight">
            Tractar Terms of Service
          </h1>
          <p className="mb-8 text-sm text-[#9da0ad]">Last updated: April 29, 2026</p>

          <div className="space-y-7 text-sm leading-7 text-[#c8c5bd]">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Using Tractar</h2>
              <p>
                Tractar provides tools for short-term rental hosts to track properties,
                bookings, expenses, referrals, and profitability. You are responsible for the
                accuracy of the information you enter and for how you use the service.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Accounts</h2>
              <p>
                You must provide accurate account information and keep your login credentials
                secure. You are responsible for activity that occurs through your account.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Acceptable Use</h2>
              <p>
                You may not misuse Tractar, attempt to access data that is not yours, interfere
                with the service, reverse engineer the product, or use it for unlawful activity.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Your Data</h2>
              <p>
                You retain ownership of the rental and business data you add to Tractar. You
                grant us permission to process that data only as needed to operate, maintain,
                and improve the service.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">No Financial Advice</h2>
              <p>
                Tractar helps organize and display rental business information, but it does not
                provide legal, tax, accounting, or financial advice. You should consult a
                qualified professional before making business or compliance decisions.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Changes and Availability</h2>
              <p>
                We may update, modify, or discontinue parts of Tractar over time. We aim to keep
                the service reliable, but we do not guarantee uninterrupted availability.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Contact</h2>
              <p>
                If you have questions about these Terms, contact Tractar support through our{" "}
                <Link href="/contact" className="text-[#81B29A] hover:underline">
                  contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
