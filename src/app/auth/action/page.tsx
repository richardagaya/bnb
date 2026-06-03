"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Firebase may send users to /auth/action or /__/auth/action (rewritten here)
 * with ?mode=resetPassword&oobCode=... — forward to our custom reset UI.
 */
function AuthActionRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const target = `/reset-password${qs ? `?${qs}` : ""}${hash}`;
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0c0e14",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: "2.5px solid #1e2130",
          borderTopColor: "#81b29a",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={null}>
      <AuthActionRedirect />
    </Suspense>
  );
}
