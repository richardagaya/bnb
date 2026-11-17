"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authedPost } from "@/lib/authedFetch";

function AcceptInvite() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [listingName, setListingName] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      setError("This invite link is missing a token.");
      return;
    }
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/cohost/accept?token=${encodeURIComponent(token)}`)}`);
      return;
    }

    let cancelled = false;
    authedPost<{ ok: boolean; listingName?: string }>("/api/cohosts/accept", { token })
      .then((result) => {
        if (!cancelled) setListingName(result.listingName || "the property");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't accept the invite.");
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, user, token, router]);

  return (
    <main className="accept-shell">
      <div className="accept-card">
        <p className="accept-kicker">Tracktar</p>
        {error ? (
          <>
            <h1>Invite not accepted</h1>
            <p>{error}</p>
            <Link href="/dashboard">Back to dashboard</Link>
          </>
        ) : listingName ? (
          <>
            <h1>You&apos;re a cohost</h1>
            <p>
              You can manage bookings and expenses for {listingName}. Open the dashboard
              and choose it under Shared with you.
            </p>
            <Link href="/dashboard">Open dashboard</Link>
          </>
        ) : (
          <>
            <h1>Accepting invite…</h1>
            <p>Checking your account against this invitation.</p>
          </>
        )}
      </div>
      <style jsx>{`
        .accept-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0c0e14;
          padding: 24px 16px;
          font-family: "DM Sans", sans-serif;
        }
        .accept-card {
          width: 100%;
          max-width: 460px;
          background: #12151c;
          border: 1px solid #1e2130;
          border-radius: 16px;
          padding: 32px 28px;
        }
        .accept-kicker {
          color: #81b29a;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        h1 {
          color: #e8e3d9;
          font-size: 28px;
          line-height: 1.2;
          margin-bottom: 10px;
        }
        p {
          color: #8a91a8;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        a {
          display: inline-block;
          background: #81b29a;
          color: #0c0e14;
          font-weight: 700;
          text-decoration: none;
          border-radius: 10px;
          padding: 12px 18px;
        }
      `}</style>
    </main>
  );
}

export default function AcceptCohostPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh", background: "#0c0e14" }} />
      }
    >
      <AcceptInvite />
    </Suspense>
  );
}
