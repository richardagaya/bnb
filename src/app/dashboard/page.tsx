"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ListingsSidebar, { Listing } from "../components/ListingsSidebar";
import ListingDashboard from "../components/ListingDashboard";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_LISTINGS: Listing[] = [
  {
    id: "1",
    name: "Downtown Loft",
    address: "42 Oak Street, Nairobi",
    type: "Apartment",
    color: "#E07A5F",
  },
];

/** Safely read a JSON value from localStorage, returning fallback on any error. */
function fromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // ── Persisted state ──
  const [listings, setListings] = useState<Listing[]>(() =>
    fromStorage("bnb_listings", DEMO_LISTINGS)
  );
  const [activeListing, setActiveListing] = useState<string | null>(() =>
    fromStorage("bnb_active", DEMO_LISTINGS[0]?.id ?? null)
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Save to localStorage whenever listings or active selection changes
  useEffect(() => {
    localStorage.setItem("bnb_listings", JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem("bnb_active", JSON.stringify(activeListing));
  }, [activeListing]);

  const addListing = (listing: Omit<Listing, "id">) => {
    const newListing = { ...listing, id: Date.now().toString() };
    setListings((prev) => [...prev, newListing]);
    setActiveListing(newListing.id);
    setSidebarOpen(false);
  };

  const updateListing = (id: string, updates: Partial<Omit<Listing, "id">>) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const deleteListing = (id: string) => {
    // Remove listing-specific data from storage
    localStorage.removeItem(`bnb_fin_${id}`);
    localStorage.removeItem(`bnb_exp_${id}`);
    localStorage.removeItem(`bnb_cal_${id}`);

    setListings((prev) => {
      const remaining = prev.filter((l) => l.id !== id);
      setActiveListing(remaining.length > 0 ? remaining[0].id : null);
      return remaining;
    });
  };

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  const currentListing = listings.find((l) => l.id === activeListing);

  if (!user) return null;

  return (
    <div className="app-root">
      {/* Mobile backdrop — tap to close sidebar */}
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
        {currentListing ? (
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
              <span className="no-listing-icon">⌂</span>
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
        }

        .app-root {
          display: flex;
          min-height: 100vh;
          background: #0c0e14;
          font-family: "DM Sans", sans-serif;
          color: #e8e3d9;
        }
        .app-main {
          margin-left: 260px;
          flex: 1;
          background: #0c0e14;
          min-height: 100vh;
        }

        /* ── NO LISTING STATE ── */
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

        /* Hamburger button in no-listing view (mobile only) */
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

        /* Sidebar backdrop */
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 99;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        /* ── MOBILE: collapse sidebar ── */
        @media (max-width: 767px) {
          .app-main {
            margin-left: 0;
          }
          .nl-menu-btn {
            display: flex;
          }
        }

        /* ── NUMBER INPUT: hide spinners ── */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a4070; }
      `}</style>
    </div>
  );
}
