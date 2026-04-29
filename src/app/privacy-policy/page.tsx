import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Tractar",
  description: "Privacy Policy for Tractar.",
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </p>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight">
            Tractar Privacy Policy
          </h1>
          <p className="mb-8 text-sm text-[#9da0ad]">Last updated: April 29, 2026</p>

          <div className="space-y-7 text-sm leading-7 text-[#c8c5bd]">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Information We Collect</h2>
              <p>
                Tractar collects the information you provide when creating an account,
                managing properties, tracking bookings, expenses, referrals, and
                communicating with us. This may include your name, email address,
                property details, booking records, expense records, and related business data.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">How We Use Information</h2>
              <p>
                We use your information to provide and improve Tractar, authenticate your
                account, store your rental management data, send service messages, respond to
                support requests, and understand how the product is used.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share limited information with
                service providers that help us operate Tractar, such as hosting, analytics,
                authentication, email delivery, and database services.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Data Security</h2>
              <p>
                We use reasonable technical and organizational measures to protect your data.
                No online service is completely secure, so you should use a strong password and
                keep your login credentials private.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Your Choices</h2>
              <p>
                You may request access, correction, or deletion of your personal information by
                contacting us. Some information may be retained where required for legal,
                security, or operational reasons.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-[#f7f4ec]">Contact</h2>
              <p>
                If you have questions about this Privacy Policy, contact Tractar support through
                the contact details provided on the site.
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
