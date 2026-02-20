import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import API from "@/utils/api";
import { getAuthHeader } from "@/utils/auth";

const CreditsContext = createContext(null);

export const CreditsProvider = ({ children }) => {
  const router = useRouter();
  const [trialRemaining, setTrialRemaining] = useState(0);
  const [realRemaining, setRealRemaining] = useState(0);
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);

  // Fetch initial credits
  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch(API.USER_CREDITS, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json) {
        const t = Number(json.trial_remaining ?? json.data?.trial_remaining ?? 0) || 0;
        const r = Number(json.real_remaining ?? json.data?.real_remaining ?? 0) || 0;
        setTrialRemaining(t);
        setRealRemaining(r);
        setIsFreeTrial(t > 0);
      }
    } catch {}
  }, []);

  // Global fetch interceptor to update credits and handle 402 gating
  const originalFetchRef = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (originalFetchRef.current) return; // already patched

    originalFetchRef.current = window.fetch;
    window.fetch = async (...args) => {
      // Extract request info
      const req = args[0];
      const init = args[1] || {};
      const url = typeof req === 'string' ? req : (req?.url || '');
      const method = (req?.method || init?.method || 'GET').toUpperCase();

      const isCreditsEndpoint = typeof url === 'string' && url.includes(API.USER_CREDITS);
      const looksLikeToolAction = () => {
        if (method !== 'POST') return false;
        if (typeof url !== 'string') return false;
        const u = url.toLowerCase();
        return (
          u.includes('/generate') ||
          u.includes('generate-stream') ||
          u.includes('/regenerate')
        );
      };

      // Pre-call refresh on tool submissions/regenerations
      try {
        if (!isCreditsEndpoint && looksLikeToolAction()) {
          // Fire-and-forget
          fetchCredits?.();
        }
      } catch {}

      const res = await originalFetchRef.current(...args);

      try {
        const headerVal = res.headers?.get?.("x-trial-credits-remaining")
          ?? res.headers?.get?.("X-Trial-Credits-Remaining");
        if (headerVal != null) {
          const t = Number(headerVal);
          if (!Number.isNaN(t)) {
            setTrialRemaining(t);
            setIsFreeTrial(t > 0);
          }
        }
      } catch {}

      // Handle subscription gating
      if (res.status === 402) {
        try {
          const cloned = res.clone();
          const data = await cloned.json();
          if (data && (data.code === "subscription_required" || data.error_code === "subscription_required")) {
            setShowGateModal(true);
          }
        } catch {
          // If JSON isn't readable (stream), still show modal on 402
          setShowGateModal(true);
        }
      } else {
        // For non-stream JSON responses, update credits from body if present and detect subscription gating
        try {
          const contentType = String(res.headers.get("content-type") || "").toLowerCase();
          if (contentType.includes("application/json")) {
            const cloned = res.clone();
            cloned.json().then((data) => {
              if (!data) return;
              const t = data.trial_credits_remaining ?? data.trial_remaining ?? data?.data?.trial_remaining;
              const r = data.real_remaining ?? data?.data?.real_remaining;
              if (t != null && !Number.isNaN(Number(t))) {
                setTrialRemaining(Number(t));
                setIsFreeTrial(Number(t) > 0);
              }
              if (r != null && !Number.isNaN(Number(r))) setRealRemaining(Number(r));

              // Detect explicit subscription gating in JSON payloads even if status is not 402
              const code = data.code ?? data.error_code ?? data?.data?.code;
              const type = data.type ?? data?.data?.type;
              if (code === "subscription_required" && (type === undefined || String(type) === "error")) {
                setShowGateModal(true);
              }
            }).catch(() => {});
          }
        } catch {}
      }

      try {
        // Post-call refresh on tool submissions/regenerations
        if (!isCreditsEndpoint && looksLikeToolAction()) {
          fetchCredits?.();
        }
      } catch {}

      return res;
    };

    return () => {
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
      }
    };
  }, []);

  const value = useMemo(() => ({
    trialRemaining,
    realRemaining,
    isFreeTrial,
    setTrialRemaining,
    setRealRemaining,
    fetchCredits,
    showGateModal,
    setShowGateModal,
  }), [trialRemaining, realRemaining, isFreeTrial, fetchCredits, showGateModal]);

  // Auto-fetch on mount if authenticated
  useEffect(() => {
    const auth = getAuthHeader();
    if (auth && auth.startsWith("Bearer ")) {
      fetchCredits();
    }
  }, [fetchCredits]);

  return (
    <CreditsContext.Provider value={value}>
      {children}
      {showGateModal ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div role="dialog" aria-modal="true" style={{ background: "#0f172a", color: "#f8fafc", padding: 24, borderRadius: 12, width: "90%", maxWidth: 420, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>Free trial exhausted</h3>
            <p style={{ margin: 0, marginBottom: 16 }}>Please subscribe to continue using tools.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowGateModal(false); router.push("/subscription-plan"); }} style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#0ea5e9", color: "#fff" }}>View Plans</button>
              <button onClick={() => { setShowGateModal(false); router.push("/subscription-plan"); }} style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#22c55e", color: "#0b1727", fontWeight: 600 }}>Subscribe</button>
            </div>
          </div>
        </div>
      ) : null}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => useContext(CreditsContext);
