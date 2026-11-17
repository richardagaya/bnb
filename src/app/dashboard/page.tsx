"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ListingsSidebar, { Listing } from "../components/ListingsSidebar";
import ListingDashboard from "../components/ListingDashboard";
import { useAuth } from "@/contexts/AuthContext";
import {
  getListings,
  getListing,
  getSharedListings,
  addListing as fsAddListing,
  updateListing as fsUpdateListing,
  deleteListing as fsDeleteListing,
  type Listing as FsListing,
} from "@/lib/firestore";

function selectionKey(ownerUid: string, listingId: string) {
  return `${ownerUid}:${listingId}`;
}

function toListing(
  listing: FsListing,
  extra: Pick<Listing, "role" | "ownerUid" | "hostName">
): Listing {
  return {
    id: listing.id,
    name: listing.name,
    address: listing.address ?? "",
    type: listing.type ?? "",
    color: listing.color || "#81B29A",
    selectionKey: selectionKey(extra.ownerUid ?? "", listing.id),
    role: extra.role,
    ownerUid: extra.ownerUid,
    hostName: extra.hostName,
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [sharedListings, setSharedListings] = useState<Listing[]>([]);
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

    Promise.all([getListings(user.uid), getSharedListings(user.uid)])
      .then(async ([owned, shared]) => {
        if (cancelled) return;
        const ownedListings = owned.map((listing) =>
          toListing(listing, { role: "host", ownerUid: user.uid })
        );
        let sharedReadBlocked = false;
        const sharedRows = await Promise.all(
          shared
            .filter((row) => row.status === "active" && row.hostUid && row.listingId)
            .map(async (row) => {
              const access = {
                role: "cohost" as const,
                ownerUid: row.hostUid,
                hostName: row.hostName,
              };
              try {
                const listing = await getListing(row.hostUid, row.listingId);
                if (!listing) return null;
                return toListing(listing, access);
              } catch (err) {
                console.error("Failed to load shared listing:", err);
                const denied = (err as { code?: string }).code === "permission-denied";
                if (!denied) return null;
                sharedReadBlocked = true;
                return toListing(
                  {
                    id: row.listingId,
                    name: row.listingName || "Shared property",
                    address: "",
                    type: "Cohost",
                    color: "#81B29A",
                  },
                  access
                );
              }
            })
        );
        if (cancelled) return;
        const visibleShared = sharedRows.filter((row): row is Listing => row !== null);
        if (sharedReadBlocked) {
          setErrorMsg(
            "Your cohost invite is active, but Firestore is still blocking the host's bookings and expenses. Deploy the latest rules, then refresh this page."
          );
        }
        setListings(ownedListings);
        setSharedListings(visibleShared);
        setActiveListing((prev) => {
          if (prev && [...ownedListings, ...visibleShared].some((l) => l.selectionKey === prev)) {
            return prev;
          }
          return ownedListings[0]?.selectionKey ?? visibleShared[0]?.selectionKey ?? null;
        });
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
      const id = await fsAddListing(user.uid, {
        name: listing.name,
        address: listing.address,
        type: listing.type,
        color: listing.color,
      });
      const newListing: Listing = {
        ...listing,
        id,
        role: "host",
        ownerUid: user.uid,
        selectionKey: selectionKey(user.uid, id),
      };
      setListings((prev) => [...prev, newListing]);
      setActiveListing(newListing.selectionKey ?? id);
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
      const { name, address, type, color } = updates;
      const payload = Object.fromEntries(
        Object.entries({ name, address, type, color }).filter(([, value]) => value !== undefined)
      );
      await fsUpdateListing(
        user.uid,
        id,
        payload as Partial<Omit<FsListing, "id" | "createdAt">>
      );
      setListings((prev) =>
        prev.map((l) => (l.id === id && l.role !== "cohost" ? { ...l, ...updates } : l))
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
        const remaining = prev.filter((l) => !(l.id === id && l.role !== "cohost"));
        setActiveListing(
          remaining[0]?.selectionKey ?? sharedListings[0]?.selectionKey ?? null
        );
        return remaining;
      });
    } catch (err) {
      console.error("Failed to delete listing:", err);
      setErrorMsg(`Failed to delete property: ${(err as Error).message}`);
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const currentListing = [...listings, ...sharedListings].find(
    (l) => (l.selectionKey ?? l.id) === activeListing
  );
  const isCohostView = currentListing?.role === "cohost";

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
        sharedListings={sharedListings}
        activeListing={activeListing}
        onSelectListing={(id) => {
          setActiveListing(id);
          setSidebarOpen(false);
        }}
        onAddListing={addListing}
        userLabel={user.name}
        userEmail={user.email}
        onSignOut={handleGoHome}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="app-main">
        {errorMsg && (
          <div className="error-banner">
            <span>{errorMsg}</span>
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
            key={currentListing.selectionKey ?? currentListing.id}
            listing={currentListing}
            uid={currentListing.ownerUid ?? user.uid}
            role={isCohostView ? "cohost" : "host"}
            onOpenSidebar={() => setSidebarOpen(true)}
            onUpdateListing={
              isCohostView ? undefined : (updates) => updateListing(currentListing.id, updates)
            }
            onDeleteListing={isCohostView ? undefined : () => deleteListing(currentListing.id)}
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
              <h2>Welcome to Tracktar</h2>
              <p>
                Add a property from the sidebar, or accept a cohost invite, to start
                tracking revenue, expenses, and profitability.
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
