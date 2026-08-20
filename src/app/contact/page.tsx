import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | Tracktar",
  description: "Get in touch with Tracktar support, feedback, and general inquiries.",
};

const SUPPORT_EMAIL = "support@tracktar.com";
const FEEDBACK_FORM_URL = "https://forms.gle/AtsJdJV4RC4Co6HG6";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0b0c10] px-6 py-12 text-[#e8e6df]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-10 inline-flex items-center">
          <img
            src="/logo.png"
            alt="Tracktar"
            className="h-16 w-auto brightness-[0.3] contrast-200 saturate-200"
          />
        </Link>

        <article className="rounded-2xl border border-[#2a2d38] bg-[#111318] p-8 shadow-2xl shadow-black/20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#81B29A]">
            Contact
          </p>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight">Get in touch</h1>
          <p className="mb-8 text-sm leading-7 text-[#c8c5bd]">
            Questions about Tracktar, your account, or how we handle your data? We&apos;re here to
            help. Reach out by email or share product feedback through our form.
          </p>

          <div className="space-y-7 text-sm leading-7 text-[#c8c5bd]">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Email support</h2>
              <p className="mb-3">
                For account help, billing questions, or anything else about Tracktar, email us and
                we&apos;ll get back to you as soon as we can.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[#2a2d38] bg-[#0b0c10] px-4 py-2.5 font-medium text-[#81B29A] transition-colors hover:border-[#81B29A]/40 hover:bg-[#81B29A]/5"
              >
                {SUPPORT_EMAIL}
              </a>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Product feedback</h2>
              <p className="mb-3">
                Have an idea, bug report, or feature request? We read every submission and use it
                to shape what we build next.
              </p>
              <a
                href={FEEDBACK_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#2a2d38] bg-[#0b0c10] px-4 py-2.5 font-medium text-[#81B29A] transition-colors hover:border-[#81B29A]/40 hover:bg-[#81B29A]/5"
              >
                Share feedback
                <span aria-hidden="true">↗</span>
              </a>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Privacy &amp; legal</h2>
              <p>
                For questions about how we collect and use your data, see our{" "}
                <Link href="/privacy-policy" className="text-[#81B29A] hover:underline">
                  Privacy Policy
                </Link>
                . For terms of use, see our{" "}
                <Link href="/terms-of-service" className="text-[#81B29A] hover:underline">
                  Terms of Service
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
