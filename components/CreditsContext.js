import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/router";

import API from "@/utils/api";

import { getAuthHeader } from "@/utils/auth";



const CreditsContext = createContext(null);



export const CreditsProvider = ({ children }) => {

  const router = useRouter();

  const [trialRemaining, setTrialRemaining] = useState(() => {

    if (typeof window === "undefined") return 0;

    const v = localStorage.getItem("synthovia_trial_remaining");

    const n = Number(v);

    return Number.isNaN(n) ? 0 : n;

  });

  const [realRemaining, setRealRemaining] = useState(() => {

    if (typeof window === "undefined") return 0;

    const v = localStorage.getItem("synthovia_real_remaining");

    const n = Number(v);

    return Number.isNaN(n) ? 0 : n;

  });

  const [isFreeTrial, setIsFreeTrial] = useState(() => {

    if (typeof window === "undefined") return false;

    const v = localStorage.getItem("synthovia_is_free_trial");

    return v != null ? v === "true" : false;

  });

  const [showGateModal, setShowGateModal] = useState(false);
  const [gateTitle, setGateTitle] = useState("Free trial exhausted");
  const [gateMessage, setGateMessage] = useState("Free trial exhausted. Please subscribe to continue.");

  const [showQuotaExhaustedModal, setShowQuotaExhaustedModal] = useState(false);
  const [quotaExhaustedMessage, setQuotaExhaustedMessage] = useState("");




  const setGateFromPayload = useCallback((payload) => {

    console.log("payload:",payload);

    if (!payload) return false;

    const dataPayload = payload?.data || payload;

    const code = dataPayload.code ?? dataPayload.error_code ?? payload?.code ?? payload?.error_code;

    const message = dataPayload.message ?? payload?.message;

    const title = dataPayload.title ?? payload?.title;

    const statusCode = dataPayload.status_code ?? payload?.status_code;

    const type = dataPayload.type ?? payload?.type;

    const userCurrentStatus = String(dataPayload.user_current_status ?? payload?.user_current_status ?? "").toLowerCase();



    if (code === "insufficient_credits") {

      setGateTitle(title || "Insufficient credits");

      setGateMessage(message || "You do not have enough credits to run this generation.");

      setShowGateModal(true);

      return true;

    }



    const showCreditsExhaustedGate = () => {

      if (userCurrentStatus === "subscription") {

        setGateTitle("Subscription plan expired");

        setGateMessage(message || "Subscription plan expired as credits exhausted");

        setShowGateModal(true);

        return true;

      }



      if (userCurrentStatus === "free") {

        setGateTitle("Free trial exhausted");

        setGateMessage(message || "Free trial exhausted. Please subscribe to continue.");

        setShowGateModal(true);

        return true;

      }



      return false;

    };

    if (code === "trial_exhausted") {

      setGateTitle("Free trial exhausted");

      setGateMessage(message || "Free trial exhausted. Please subscribe to continue.");

      setShowGateModal(true);

      return true;

    }

    if (code === "subscription_required") {

      return showCreditsExhaustedGate() || (() => {

        setGateTitle("Subscription required");

        setGateMessage(message || "Subscription required. Please subscribe to continue.");

        setShowGateModal(true);

        return true;

      })();

    }

    if (statusCode === 2 && (type === undefined || String(type) === "error")) {

      if (showCreditsExhaustedGate()) return true;

      const msg = message || "Subscription required. Please subscribe to continue.";

      const isTrial = /trial/i.test(msg);

      setGateTitle(isTrial ? "Free trial exhausted" : "Subscription required");

      setGateMessage(msg);

      setShowGateModal(true);

      return true;

    }

    return false;

  }, []);



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

        try {

          localStorage.setItem("synthovia_trial_remaining", String(t));

          localStorage.setItem("synthovia_real_remaining", String(r));

        } catch {}

      }



      try {

        const res2 = await fetch(API.USER_TRIAL_STATUS, {

          method: "GET",

          headers: {

            Accept: "application/json",

            Authorization: getAuthHeader(),

          },

        });

        const json2 = await res2.json().catch(() => null);

        if (res2.ok && json2) {

          const inFT = json2.in_free_trial ?? json2.data?.in_free_trial;

          if (inFT != null) {

            setIsFreeTrial(Boolean(inFT));

            try { localStorage.setItem("synthovia_is_free_trial", String(Boolean(inFT))); } catch {}

          }

          const t2 = json2.trial_remaining ?? json2.data?.trial_remaining;

          const r2 = json2.real_remaining ?? json2.data?.real_remaining;

          if (t2 != null && !Number.isNaN(Number(t2))) {

            const n = Number(t2);

            setTrialRemaining(n);

            try { localStorage.setItem("synthovia_trial_remaining", String(n)); } catch {}

          }

          if (r2 != null && !Number.isNaN(Number(r2))) {

            const n = Number(r2);

            setRealRemaining(n);

            try { localStorage.setItem("synthovia_real_remaining", String(n)); } catch {}

          }

        }

      } catch {}

    } catch {}

  }, []);



  const checkClaudeStatus = useCallback(async () => {

    try {

      const res = await fetch(API.ADMIN_CLAUDE_STATUS, {

        method: "GET",

        headers: {

          Accept: "application/json",

          Authorization: getAuthHeader(),

        },

      });

      const json = await res.json().catch(() => null);

      if (json && (json.status_code === 1 || json.status === "quota_exhausted")) {

        setQuotaExhaustedMessage("Our AI processing system has reached its credit limit. Administrators have already been notified to restore service. We apologize for the interruption.");

        setShowQuotaExhaustedModal(true);

      } else {

        setShowQuotaExhaustedModal(false);

      }

    } catch (err) {

      console.error("Failed to check Claude status:", err);

    }

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



      const res = await originalFetchRef.current.call(window, ...args);



      try {

        const headerVal = res.headers?.get?.("x-trial-credits-remaining")

          ?? res.headers?.get?.("X-Trial-Credits-Remaining");

        if (headerVal != null) {

          const t = Number(headerVal);

          if (!Number.isNaN(t)) {

            setTrialRemaining(t);

            try {

              localStorage.setItem("synthovia_trial_remaining", String(t));

            } catch {}

          }

        }

      } catch {}



      // Handle subscription gating

      if (res.status === 402) {

        try {

          const cloned = res.clone();

          const data = await cloned.json();

          if (setGateFromPayload(data)) return res;

        } catch {

          // If JSON isn't readable (stream), still show modal on 402

          setGateTitle("Subscription required");

          setGateMessage("Subscription required. Please subscribe to continue.");

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

                const tn = Number(t);

                setTrialRemaining(tn);

                try {

                  localStorage.setItem("synthovia_trial_remaining", String(tn));

                } catch {}

              }

              if (r != null && !Number.isNaN(Number(r))) {

                const rn = Number(r);

                setRealRemaining(rn);

                try { localStorage.setItem("synthovia_real_remaining", String(rn)); } catch {}

              }



              const inFT = data.in_free_trial ?? data?.data?.in_free_trial;

              if (inFT != null) {

                setIsFreeTrial(Boolean(inFT));

                try { localStorage.setItem("synthovia_is_free_trial", String(Boolean(inFT))); } catch {}

              }



              // Detect explicit gating in JSON payloads even if status is not 402

              const type = data.type ?? data?.data?.type;

              if (type === undefined || String(type) === "error") {

                setGateFromPayload(data);

              }

            }).catch(() => {});

          } else if (res.status >= 400 && !contentType.includes("text/event-stream")) {

            const cloned = res.clone();

            cloned.text().then((text) => {

              if (!text) return;

              try {

                const data = JSON.parse(text);

                setGateFromPayload(data);

              } catch {}

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

    setGateFromPayload,

    checkClaudeStatus,

  }), [trialRemaining, realRemaining, isFreeTrial, fetchCredits, showGateModal, setGateFromPayload, checkClaudeStatus]);



  useEffect(() => {

    const toolPrefixes = [

      "/ad-copy-generator",

      "/caption-and-hastag-generator",

      "/code-generator",

      "/copywriting-assistant",

      "/email-generator",

      "/image-editor",

      "/image-generator",

      "/seo-keyword-meta-tag-generator",

      "/script-story-writer-tool",

      "/script-writing-generator",

      "/text-generator",

      "/vedio-generator",

    ];

    const isToolPage = toolPrefixes.some(

      (prefix) => router.pathname === prefix || router.pathname.startsWith(`${prefix}/`)

    );

    if (isToolPage) {

      checkClaudeStatus();

    } else {

      setShowQuotaExhaustedModal(false);

    }

  }, [router.pathname, checkClaudeStatus]);



  // Auto-fetch on mount if authenticated

  useEffect(() => {

    const auth = getAuthHeader();

    if (auth && auth.startsWith("Bearer ")) {

      fetchCredits();

    }

  }, [fetchCredits]);



  // Refresh credits/trial immediately when auth token changes (e.g., after login)

  useEffect(() => {

    const onAuthChanged = () => {

      try {

        const auth = getAuthHeader();

        if (auth && auth.startsWith("Bearer ")) {

          fetchCredits();

        }

      } catch {}

    };

    if (typeof window !== "undefined") {

      window.addEventListener("synthovia-auth-changed", onAuthChanged);

    }

    return () => {

      if (typeof window !== "undefined") {

        window.removeEventListener("synthovia-auth-changed", onAuthChanged);

      }

    };

  }, [fetchCredits]);



  return (

    <CreditsContext.Provider value={value}>

      {children}

      {showGateModal ? (

        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center" }}>

          <div role="dialog" aria-modal="true" style={{ background: "#0f172a", color: "#f8fafc", padding: 24, borderRadius: 12, width: "90%", maxWidth: 420, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", position: "relative" }}>

            <button

              type="button"

              aria-label="Close"

              onClick={() => setShowGateModal(false)}

              style={{

                position: "absolute",

                top: 10,

                right: 10,

                width: 28,

                height: 28,

                borderRadius: "50%",

                border: 0,

                background: "rgba(148,163,184,0.2)",

                color: "#e2e8f0",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                cursor: "pointer",

              }}

            >

              <i className="fa-sharp fa-regular fa-x" />

            </button>

            <h3 style={{ margin: 0, marginBottom: 8 }}>{gateTitle}</h3>

            <p style={{ margin: 0, marginBottom: 16 }}>{gateMessage}</p>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>

              <button onClick={() => { setShowGateModal(false); }} style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "rgba(148,163,184,0.2)", color: "#e2e8f0" }}>Cancel</button>

              <button onClick={() => { setShowGateModal(false); router.push("/subscription-plan"); }} style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#0ea5e9", color: "#fff" }}>View Plans</button>

              <button onClick={() => { setShowGateModal(false); router.push("/subscription-plan"); }} style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#22c55e", color: "#0b1727", fontWeight: 600 }}>Subscribe</button>

            </div>

          </div>

        </div>

      ) : null}



      {showQuotaExhaustedModal ? (

        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center" }}>

          <div role="dialog" aria-modal="true" style={{ background: "#0f172a", color: "#f8fafc", padding: 32, borderRadius: 16, width: "90%", maxWidth: 450, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", textAlign: "center" }}>

            <div style={{ marginBottom: 20 }}>

              <i className="fa-sharp fa-solid fa-circle-exclamation" style={{ fontSize: 48, color: "#ef4444" }} />

            </div>

            <h3 style={{ margin: 0, marginBottom: 12, fontSize: 24, fontWeight: 700 }}>Service Unavailable</h3>

            <p style={{ margin: 0, marginBottom: 24, color: "#94a3b8", lineHeight: 1.6 }}>{quotaExhaustedMessage}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>

               <button 

                onClick={() => router.push("/dashboard-overview")} 

                style={{ cursor: "pointer", padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#f8fafc" }}

              >

                Go to Dashboard

              </button>

            </div>

          </div>

        </div>

      ) : null}

    </CreditsContext.Provider>

  );

};



export const useCredits = () => useContext(CreditsContext);

