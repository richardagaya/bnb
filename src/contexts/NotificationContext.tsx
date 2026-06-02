"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface PersistOptions {
  /** Message shown as an error toast if the write fails. */
  error?: string;
  /** When true, success won't flip the save pill to "saved". */
  silent?: boolean;
}

interface NotificationApi {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  /**
   * Wrap a Firestore (or any) write so the UI reflects saving / saved / error
   * state and surfaces failures as a toast. Resolves to the work's value, or
   * `undefined` if it rejected (so callers can fall back gracefully).
   */
  persist: <T>(work: Promise<T>, options?: PersistOptions) => Promise<T | undefined>;
}

const NotificationContext = createContext<NotificationApi | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

let nextId = 1;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [online, setOnline] = useState(true);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Track connectivity.
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      const ttl = type === "error" ? 6000 : 3200;
      setTimeout(() => dismiss(id), ttl);
    },
    [dismiss]
  );

  const flashSaved = useCallback(() => {
    setSaveStatus("saved");
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus("idle"), 1600);
  }, []);

  const persist = useCallback(
    async <T,>(work: Promise<T>, options?: PersistOptions): Promise<T | undefined> => {
      setSaveStatus("saving");
      clearTimeout(savedTimer.current);
      try {
        const result = await work;
        if (options?.silent) {
          setSaveStatus("idle");
        } else {
          flashSaved();
        }
        return result;
      } catch {
        setSaveStatus("error");
        push("error", options?.error ?? "Couldn't save your changes. They're kept on this device and will retry.");
        clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaveStatus("idle"), 4000);
        return undefined;
      }
    },
    [flashSaved, push]
  );

  const api: NotificationApi = {
    toast: {
      success: useCallback((m: string) => push("success", m), [push]),
      error: useCallback((m: string) => push("error", m), [push]),
      info: useCallback((m: string) => push("info", m), [push]),
    },
    persist,
  };

  const pill =
    !online
      ? { label: "Offline — saved on this device", cls: "offline" }
      : saveStatus === "saving"
      ? { label: "Saving…", cls: "saving" }
      : saveStatus === "saved"
      ? { label: "Saved", cls: "saved" }
      : saveStatus === "error"
      ? { label: "Save failed — will retry", cls: "failed" }
      : null;

  return (
    <NotificationContext.Provider value={api}>
      {children}

      {/* Save / connectivity pill */}
      {pill && (
        <div className={`nf-pill nf-pill-${pill.cls}`} role="status" aria-live="polite">
          <span className="nf-pill-dot" />
          {pill.label}
        </div>
      )}

      {/* Toast stack */}
      <div className="nf-toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`nf-toast nf-toast-${t.type}`} role={t.type === "error" ? "alert" : "status"}>
            <span className="nf-toast-icon" aria-hidden="true">
              {t.type === "success" ? "✓" : t.type === "error" ? "!" : "i"}
            </span>
            <span className="nf-toast-msg">{t.message}</span>
            <button className="nf-toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              ✕
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .nf-pill {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 1200;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 20px;
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
          animation: nf-pill-in 0.2s ease both;
        }
        .nf-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }
        .nf-pill-saving { background: #161924; border-color: #2a3050; color: #8a91a8; }
        .nf-pill-saving .nf-pill-dot { animation: nf-blink 1s ease-in-out infinite; }
        .nf-pill-saved { background: #0c1610; border-color: #81b29a44; color: #81b29a; }
        .nf-pill-failed { background: #1a0e0c; border-color: #e07a5f55; color: #e07a5f; }
        .nf-pill-offline { background: #1a160c; border-color: #f2cc8f55; color: #f2cc8f; }

        .nf-toasts {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1200;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: min(380px, calc(100vw - 40px));
        }
        .nf-toast {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid;
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 13px;
          line-height: 1.45;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
          background: #161924;
          color: #e8e3d9;
          animation: nf-toast-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .nf-toast-success { border-color: #81b29a55; }
        .nf-toast-error { border-color: #e07a5f66; }
        .nf-toast-info { border-color: #2a3050; }
        .nf-toast-icon {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          margin-top: 1px;
        }
        .nf-toast-success .nf-toast-icon { background: #81b29a22; color: #81b29a; }
        .nf-toast-error .nf-toast-icon { background: #e07a5f22; color: #e07a5f; }
        .nf-toast-info .nf-toast-icon { background: #2a3050; color: #8a91a8; }
        .nf-toast-msg { flex: 1; min-width: 0; }
        .nf-toast-close {
          flex-shrink: 0;
          background: none;
          border: none;
          color: #5a6080;
          font-size: 12px;
          cursor: pointer;
          padding: 0 2px;
          transition: color 0.15s;
        }
        .nf-toast-close:hover { color: #e8e3d9; }
        .nf-toast-close:focus-visible { outline: 2px solid #81b29a; outline-offset: 2px; border-radius: 3px; }

        @keyframes nf-toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nf-pill-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nf-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nf-toast, .nf-pill { animation: none; }
          .nf-pill-saving .nf-pill-dot { animation: none; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): NotificationApi {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}
