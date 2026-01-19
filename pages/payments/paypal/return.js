import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import PageHead from "../../Head";
import Context from "@/context/Context";

import HeaderTop from "@/components/Header/HeaderTop/HeaderTop";
import Header from "@/components/Header/Header";
import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import Footer from "@/components/Footers/Footer";
import Copyright from "@/components/Footers/Copyright";
import BackToTop from "../../backToTop";

import API from "@/utils/api";
import { getAuthHeader } from "@/utils/auth";

const PayPalReturnPage = () => {
  const router = useRouter();

  const [isConfirming, setIsConfirming] = useState(false);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(3);
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const paypalSubscriptionId = useMemo(() => {
    const raw = router?.query?.subscription_id;
    if (!raw) return "";
    return String(Array.isArray(raw) ? raw[0] : raw);
  }, [router?.query?.subscription_id]);

  const subscriptionReference = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      return String(sessionStorage.getItem("subscription_reference") || "");
    } catch (e) {
      return "";
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    if (!paypalSubscriptionId) {
      setErrorMessage("Missing PayPal subscription id in return URL");
      return;
    }

    if (!subscriptionReference) {
      setErrorMessage("Missing subscription reference. Please retry checkout.");
      return;
    }

    let cancelled = false;
    let intervalId = null;

    const clearPoll = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const checkStatus = async () => {
      try {
        const statusUrl = API.SUBSCRIPTION_STATUS(subscriptionReference);
        const res = await fetch(statusUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: getAuthHeader(),
          },
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || `Status check failed (${res.status})`);

        const data = json?.data ?? json;
        const completed = Boolean(data?.completed);
        const status = String(data?.status || "").toLowerCase();

        if (cancelled) return;

        setStatusText(String(data?.status || data?.message || "pending"));

        if (completed || status === "active") {
          setIsActivated(true);
          setIsPollingStatus(false);
          clearPoll();
          try {
            sessionStorage.removeItem("subscription_reference");
          } catch (e) {}
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e?.message || "Status check failed");
          setIsPollingStatus(false);
          clearPoll();
        }
      }
    };

    const startPolling = () => {
      if (cancelled) return;
      setIsPollingStatus(true);
      checkStatus();
      intervalId = setInterval(checkStatus, 3000);
    };

    const confirmSubscription = async () => {
      setIsConfirming(true);
      setErrorMessage("");

      try {
        const res = await fetch(API.SUBSCRIPTION_CONFIRM, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: getAuthHeader(),
          },
          body: JSON.stringify({
            subscription_reference: subscriptionReference,
            paypal_subscription_id: paypalSubscriptionId,
          }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || `Confirm failed (${res.status})`);
        if (!json || json.status_code !== 1) throw new Error(json?.message || "Confirm failed");

        if (cancelled) return;

        setIsConfirmed(true);
        setStatusText("pending");
        startPolling();

        // Optional: redirect to dashboard/subscription page
        // router.replace("/dashboard");
      } catch (e) {
        if (!cancelled) setErrorMessage(e?.message || "Confirm failed");
      } finally {
        if (!cancelled) setIsConfirming(false);
      }
    };

    confirmSubscription();

    return () => {
      cancelled = true;
      clearPoll();
    };
  }, [router.isReady, paypalSubscriptionId, subscriptionReference]);

  useEffect(() => {
    if (!isActivated) return;
    if (errorMessage) return;

    let cancelled = false;
    setRedirectSeconds(3);

    const id = setInterval(() => {
      if (cancelled) return;
      setRedirectSeconds((s) => {
        const next = Number(s) - 1;
        return next;
      });
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isActivated, errorMessage]);

  useEffect(() => {
    if (!isActivated) return;
    if (errorMessage) return;
    if (redirectSeconds > 0) return;
    if (!router?.replace) return;
    router.replace("/settings");
  }, [isActivated, errorMessage, redirectSeconds, router]);

  return (
    <>
      <PageHead title="Confirming Subscription" />

      <main className="page-wrapper">
        <Context>
          <HeaderTop />
          <Header headerTransparent="header-transparent" headerSticky="header-sticky" btnClass="rainbow-gradient-btn" />
          <PopupMobileMenu />

          <div className="rainbow-section-gap-big">
            <div className="container">
              <div className="row">
                <div className="col-lg-8 offset-lg-2">
                  <div className="paypal-status-card">
                    <div className="paypal-status-header">
                      <div className="paypal-status-badge">PayPal</div>
                      <h2 className="paypal-status-title">Processing your subscription</h2>
                      <p className="paypal-status-subtitle">
                        Don’t close this page. We’re confirming your payment and activating your plan.
                      </p>
                    </div>

                    {errorMessage ? (
                      <div className="paypal-status-alert paypal-status-alert--error">
                        <div className="paypal-status-alert-title">Something went wrong</div>
                        <div className="paypal-status-alert-message">{errorMessage}</div>
                      </div>
                    ) : null}

                    {!errorMessage ? (
                      <div className="paypal-status-steps">
                        <div className={`paypal-step ${isConfirmed ? "paypal-step--done" : isConfirming ? "paypal-step--active" : ""}`}>
                          <div className="paypal-step-indicator">
                            <span className="paypal-step-dot" />
                            <span className="paypal-step-line" />
                          </div>
                          <div className="paypal-step-content">
                            <div className="paypal-step-title">Confirming payment</div>
                            <div className="paypal-step-desc">
                              {isConfirmed ? "Payment confirmed." : isConfirming ? "Confirming with server…" : "Preparing…"}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`paypal-step ${
                            isActivated
                              ? "paypal-step--done"
                              : isPollingStatus
                                ? "paypal-step--active"
                                : isConfirmed
                                  ? ""
                                  : "paypal-step--disabled"
                          }`}
                        >
                          <div className="paypal-step-indicator">
                            <span className="paypal-step-dot" />
                            <span className="paypal-step-line" />
                          </div>
                          <div className="paypal-step-content">
                            <div className="paypal-step-title">Activating subscription</div>
                            <div className="paypal-step-desc">
                              {isActivated
                                ? "Subscription is active."
                                : isPollingStatus
                                  ? `Waiting for activation…${statusText ? ` (${statusText})` : ""}`
                                  : isConfirmed
                                    ? "Waiting for final confirmation…"
                                    : "Pending"}
                            </div>
                          </div>
                        </div>

                        <div className={`paypal-step ${isActivated ? "paypal-step--done" : "paypal-step--disabled"}`}>
                          <div className="paypal-step-indicator">
                            <span className="paypal-step-dot" />
                          </div>
                          <div className="paypal-step-content">
                            <div className="paypal-step-title">All set</div>
                            <div className="paypal-step-desc">
                              {isActivated ? "You can safely close this tab." : "Finishing up"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="paypal-status-footer">
                      {!errorMessage && !isActivated ? (
                        <div className="paypal-status-loader">
                          <span className="paypal-spinner" />
                          <span>Working…</span>
                        </div>
                      ) : null}

                      {!errorMessage && isActivated ? (
                        <>
                          <div className="paypal-status-success">
                            <div className="paypal-status-success-icon">✓</div>
                            <div>
                              <div className="paypal-status-success-title">Subscription activated</div>
                              <div className="paypal-status-success-subtitle">Enjoy your plan benefits now.</div>
                            </div>
                          </div>

                          <div className="paypal-redirect-pill" aria-live="polite">
                            Redirecting to Settings in <strong>{Math.max(0, Number(redirectSeconds) || 0)}s</strong>
                          </div>
                        </>
                      ) : null}

                      {!!paypalSubscriptionId ? (
                        <div className="paypal-status-meta">PayPal Subscription ID: {paypalSubscriptionId}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Footer />
          <Copyright />
        </Context>
      </main>
      <BackToTop />

      <style jsx>{`
        .paypal-status-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 28px 22px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(10px);
        }

        .paypal-status-header {
          text-align: center;
          margin-bottom: 18px;
        }

        .paypal-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 12px;
          color: #dbeafe;
          background: rgba(59, 130, 246, 0.16);
          border: 1px solid rgba(59, 130, 246, 0.28);
          margin-bottom: 10px;
          letter-spacing: 0.2px;
        }

        .paypal-status-title {
          margin: 0;
          font-size: 26px;
          line-height: 1.2;
          color: #ffffff;
        }

        .paypal-status-subtitle {
          margin: 10px 0 0;
          color: rgba(148, 163, 184, 0.95);
          font-size: 14px;
        }

        .paypal-status-alert {
          border-radius: 14px;
          padding: 14px 14px;
          margin: 16px 0 0;
        }

        .paypal-status-alert--error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.22);
        }

        .paypal-status-alert-title {
          color: #fecaca;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .paypal-status-alert-message {
          color: rgba(254, 202, 202, 0.92);
          font-size: 13px;
          line-height: 1.4;
          word-break: break-word;
        }

        .paypal-status-steps {
          margin-top: 18px;
          padding: 14px 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .paypal-step {
          display: flex;
          gap: 12px;
          padding: 10px 6px;
        }

        .paypal-step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 18px;
          padding-top: 3px;
        }

        .paypal-step-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.6);
        }

        .paypal-step-line {
          width: 2px;
          flex: 1;
          background: rgba(148, 163, 184, 0.25);
          margin-top: 8px;
          border-radius: 2px;
        }

        .paypal-step-title {
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .paypal-step-desc {
          color: rgba(148, 163, 184, 0.95);
          font-size: 13px;
          line-height: 1.4;
        }

        .paypal-step--active .paypal-step-dot {
          background: rgba(59, 130, 246, 0.7);
          border-color: rgba(59, 130, 246, 0.9);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }

        .paypal-step--done .paypal-step-dot {
          background: rgba(34, 197, 94, 0.7);
          border-color: rgba(34, 197, 94, 0.9);
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
        }

        .paypal-step--disabled {
          opacity: 0.6;
        }

        .paypal-status-footer {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .paypal-status-loader {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: rgba(148, 163, 184, 0.95);
          font-size: 13px;
        }

        .paypal-spinner {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 2px solid rgba(148, 163, 184, 0.25);
          border-top-color: rgba(59, 130, 246, 0.95);
          animation: paypalspin 0.85s linear infinite;
        }

        @keyframes paypalspin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .paypal-status-success {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          border-radius: 14px;
          padding: 12px 12px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.22);
        }

        .paypal-status-success-icon {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(34, 197, 94, 0.18);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #bbf7d0;
          font-weight: 900;
        }

        .paypal-status-success-title {
          color: #bbf7d0;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .paypal-status-success-subtitle {
          color: rgba(187, 247, 208, 0.85);
          font-size: 13px;
        }

        .paypal-status-meta {
          color: rgba(148, 163, 184, 0.85);
          font-size: 12px;
          text-align: center;
          word-break: break-word;
        }

        .paypal-redirect-pill {
          width: 100%;
          border-radius: 14px;
          padding: 10px 12px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.22);
          color: rgba(219, 234, 254, 0.92);
          font-size: 13px;
          text-align: center;
        }

        @media (min-width: 992px) {
          .paypal-status-card {
            padding: 34px 30px;
          }
          .paypal-status-title {
            font-size: 30px;
          }
        }
      `}</style>
    </>
  );
};

export default dynamic(() => Promise.resolve(PayPalReturnPage), { ssr: false });
