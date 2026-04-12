"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ListingsSidebar, { Listing } from "../components/ListingsSidebar";
import ListingDashboard from "../components/ListingDashboard";
import { useAuth } from "@/contexts/AuthContext";
import {
  getListings,
  addListing as fsAddListing,
  updateListing as fsUpdateListing,
  deleteListing as fsDeleteListing,
} from "@/lib/firestore";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [activeListing, setActiveListing] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Load listings from Firestore whenever the signed-in user changes ───────
  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;
    setLoadingListings(true);
    setErrorMsg(null);

    getListings(user.uid)
      .then((data) => {
        if (cancelled) return;
        setListings(data);
        // Pick the first listing as active only if nothing is selected yet
        setActiveListing((prev) => prev ?? (data[0]?.id ?? null));
      })
      .catch((err) => {
        console.error("Failed to load listings:", err);
        if (!cancelled) {
          const msg = (err as { code?: string }).code === "permission-denied"
            ? "Permission denied — check your Firestore security rules."
            : `Failed to load properties: ${(err as Error).message}`;
          setErrorMsg(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingListings(false);
      });

    return () => { cancelled = true; };
  }, [user?.uid]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const addListing = async (listing: Omit<Listing, "id">) => {
    if (!user) return;
    try {
      setErrorMsg(null);
      const id = await fsAddListing(user.uid, listing);
      const newListing: Listing = { ...listing, id };
      setListings((prev) => [...prev, newListing]);
      setActiveListing(id);
      setSidebarOpen(false);
    } catch (err) {
      console.error("Failed to add listing:", err);
      const msg = (err as { code?: string }).code === "permission-denied"
        ? "Permission denied — your Firestore rules are blocking writes. See setup instructions."
        : `Failed to save property: ${(err as Error).message}`;
      setErrorMsg(msg);
    }
  };

  const updateListing = async (id: string, updates: Partial<Omit<Listing, "id">>) => {
    if (!user) return;
    try {
      await fsUpdateListing(user.uid, id, updates);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
      );
    } catch (err) {
      console.error("Failed to update listing:", err);
      setErrorMsg(`Failed to update property: ${(err as Error).message}`);
    }
  };

  const deleteListing = async (id: string) => {
    if (!user) return;
    try {
      await fsDeleteListing(user.uid, id);
      setListings((prev) => {
        const remaining = prev.filter((l) => l.id !== id);
        setActiveListing(remaining.length > 0 ? remaining[0].id : null);
        return remaining;
      });
    } catch (err) {
      console.error("Failed to delete listing:", err);
      setErrorMsg(`Failed to delete property: ${(err as Error).message}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const currentListing = listings.find((l) => l.id === activeListing);

  if (!user) return null;

  return (
    <div className="app-root">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ListingsSidebar
        listings={listings}
        activeListing={activeListing}
        onSelectListing={(id) => {
          setActiveListing(id);
          setSidebarOpen(false);
        }}
        onAddListing={addListing}
        userLabel={user.name}
        userEmail={user.email}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="app-main">
        {errorMsg && (
          <div className="error-banner">
            <span>⚠ {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)}>✕</button>
          </div>
        )}
        {loadingListings ? (
          <div className="no-listing">
            <div className="no-listing-content">
              <p style={{ color: "#4a5068", fontSize: 14 }}>Loading your properties…</p>
            </div>
          </div>
        ) : currentListing ? (
          <ListingDashboard
            key={currentListing.id}
            listing={currentListing}
            onOpenSidebar={() => setSidebarOpen(true)}
            onUpdateListing={(updates) => updateListing(currentListing.id, updates)}
            onDeleteListing={() => deleteListing(currentListing.id)}
          />
        ) : (
          <div className="no-listing">
            <button
              className="nl-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div className="no-listing-content">
              <span className="no-listing-icon">🏠</span>
              <h2>Welcome to HostLedger</h2>
              <p>
                Add your first property from the sidebar to start tracking
                revenue, expenses, and profitability.
              </p>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap");

        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html,
        body {
          height: 100%;
          background: #0c0e14;
          overflow-x: hidden;
          max-width: 100%;
        }

        .app-root {
          display: flex;
          min-height: 100vh;
          background: #0c0e14;
          font-family: "DM Sans", sans-serif;
          color: #e8e3d9;
          max-width: 100%;
          overflow-x: hidden;
        }
        .app-main {
          margin-left: 260px;
          flex: 1;
          background: #0c0e14;
          min-height: 100vh;
          min-width: 0;
          max-width: calc(100% - 260px);
          overflow-x: hidden;
        }

        /* ── ERROR BANNER ── */
        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #3a1a1a;
          border: 1px solid #7a2a2a;
          border-radius: 8px;
          color: #f08080;
          font-size: 13px;
          padding: 12px 16px;
          margin: 16px 24px 0;
        }
        .error-banner button {
          background: none;
          border: none;
          color: #f08080;
          cursor: pointer;
          font-size: 14px;
          flex-shrink: 0;
        }

        /* ── NO LISTING / LOADING STATE ── */
        .no-listing {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
          position: relative;
        }
        .no-listing-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #4a5068;
        }
        .no-listing-icon { font-size: 64px; }
        .no-listing-content h2 {
          font-size: 24px;
          font-weight: 700;
          color: #e8e3d9;
        }
        .no-listing-content p {
          font-size: 14px;
          max-width: 320px;
          line-height: 1.6;
        }

        .nl-menu-btn {
          display: none;
          position: absolute;
          top: 16px;
          left: 16px;
          background: #161924;
          border: 1px solid #2a3050;
          border-radius: 8px;
          color: #e8e3d9;
          font-size: 18px;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 99;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        @media (max-width: 767px) {
          .app-main {
            margin-left: 0;
            max-width: 100%;
          }
          .nl-menu-btn {
            display: flex;
          }
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a4070; }
      `}</style>
    </div>
  );
}
