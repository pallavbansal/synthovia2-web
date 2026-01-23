import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import Sal from "sal.js";

import PageHead from "../Head";
import Context from "@/context/Context";

import HeaderTop from "@/components/Header/HeaderTop/HeaderTop";
import Header from "@/components/Header/Header";
import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import Footer from "@/components/Footers/Footer";
import Copyright from "@/components/Footers/Copyright";
import BackToTop from "../backToTop";

import { getAuthHeader, isAuthenticated } from "@/utils/auth";
import API from "@/utils/api";

const SubscriptionPlanPage = () => {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState(null);
  const [billingMode, setBillingMode] = useState("annual");

  const autoCheckoutRanRef = useRef(false);

  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptPlanId, setAuthPromptPlanId] = useState(null);

  const fallbackPlans = useMemo(
    () => [
      {
        id: null,
        name: "Starter",
        description: "Perfect for getting started.",
        price: "9",
        billing_period: "month",
        credits: 1000,
        features: ["1,000 credits", "Core tools access", "Email support"],
      },
      {
        id: null,
        name: "Pro",
        description: "Best for growing teams and creators.",
        price: "29",
        billing_period: "month",
        credits: 5000,
        features: ["5,000 credits", "All tools access", "Priority support"],
      },
      {
        id: null,
        name: "Business",
        description: "For businesses that need more scale.",
        price: "99",
        billing_period: "month",
        credits: 20000,
        features: ["20,000 credits", "Advanced tools", "Dedicated support"],
      },
    ],
    []
  );

  useEffect(() => {
    Sal();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchPlans = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const authHeader = getAuthHeader();
        const res = await fetch(API.SUBSCRIPTION_PLANS, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json || json.status_code !== 1) {
          const isUnauth =
            res.status === 401 ||
            String(json?.message || "")
              .toLowerCase()
              .includes("unauth");

          if (isUnauth) {
            if (!cancelled) {
              setPlans(fallbackPlans);
              setErrorMessage("");
            }
            return;
          }

          throw new Error(json?.message || `Failed to load plans (${res.status})`);
        }

        const nextPlans = Array.isArray(json?.plans) ? json.plans : [];
        if (!cancelled) setPlans(nextPlans);
      } catch (e) {
        if (!cancelled) setErrorMessage(e?.message || "Failed to load plans");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (autoCheckoutRanRef.current) return;
    if (!isAuthenticated()) return;
    if (isLoading) return;
    if (!Array.isArray(plans) || plans.length === 0) return;

    try {
      const raw = sessionStorage.getItem("pending_subscription_plan_selection");
      if (!raw) return;

      const selection = JSON.parse(raw);
      if (!selection) return;

      let matched = null;

      if (selection.plan_id != null) {
        matched = plans.find((p) => String(p?.id) === String(selection.plan_id));
      }

      if (!matched && selection.name) {
        matched = plans.find((p) => {
          const sameName = String(p?.name || "").toLowerCase() === String(selection.name || "").toLowerCase();
          const samePeriod = String(p?.billing_period || "").toLowerCase() === String(selection.billing_period || "").toLowerCase();
          const samePrice = String(p?.price || "") === String(selection.price || "");
          return sameName && (samePeriod || samePrice);
        });
      }

      if (!matched) return;

      autoCheckoutRanRef.current = true;
      sessionStorage.removeItem("pending_subscription_plan_selection");
      handleCheckout(matched?.id);
    } catch (e) {}
  }, [plans, isLoading]);

  const handleCheckout = async (planId) => {
    if (!planId) return;
    if (checkoutLoadingPlanId != null) return;

    setCheckoutLoadingPlanId(planId);
    setErrorMessage("");
    try {
      const authHeader = getAuthHeader();
      const body = new URLSearchParams({
        plan_id: String(planId),
        payment_method: "paypal",
      });

      const res = await fetch(API.SUBSCRIPTION_CHECKOUT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: body.toString(),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Checkout failed (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Checkout failed");

      const redirectUrl = json?.redirect_url;
      const subscriptionReference = json?.subscription_reference;
      if (subscriptionReference) {
        try {
          sessionStorage.setItem("subscription_reference", String(subscriptionReference));
        } catch (e) {}
      }

      if (!redirectUrl) throw new Error("Missing PayPal redirect URL");
      window.location.assign(String(redirectUrl));
    } catch (e) {
      setErrorMessage(e?.message || "Checkout failed");
    } finally {
      setCheckoutLoadingPlanId(null);
    }
  };

  const handleBuyClick = (plan) => {
    const planId = plan?.id;
    if (!isAuthenticated()) {
      setAuthPromptPlanId(planId || plan?.name || "");
      setAuthPromptOpen(true);

      try {
        sessionStorage.setItem(
          "pending_subscription_plan_selection",
          JSON.stringify({
            plan_id: planId != null ? String(planId) : null,
            name: plan?.name || "",
            billing_period: plan?.billing_period || "",
            price: plan?.price != null ? String(plan.price) : "",
          })
        );
      } catch (e) {}

      return;
    }
    handleCheckout(planId);
  };

  const displayPlans = useMemo(() => {
    const list = Array.isArray(plans) ? [...plans] : [];

    const byPrice = list
      .map((p) => ({
        ...p,
        _priceNum: Number(p?.price),
      }))
      .sort((a, b) => {
        const ap = Number.isFinite(a._priceNum) ? a._priceNum : Number.POSITIVE_INFINITY;
        const bp = Number.isFinite(b._priceNum) ? b._priceNum : Number.POSITIVE_INFINITY;
        return ap - bp;
      });

    const mode = String(billingMode || "").toLowerCase();
    const filtered = byPrice.filter((p) => {
      const period = String(p?.billing_period || "").toLowerCase();
      if (!period) return false;
      if (mode === "annual") return period.includes("year") || period.includes("annual") || period.includes("yr");
      if (mode === "monthly") return period.includes("month") || period.includes("monthly");
      return true;
    });

    const out = filtered.length ? filtered : byPrice;
    return out.slice(0, 3);
  }, [plans, billingMode]);

  const authed = useMemo(() => isAuthenticated(), []);

  const getPlanFeatures = (plan) => {
    if (Array.isArray(plan?.features) && plan.features.length) {
      return plan.features.map((f) => String(f)).filter(Boolean).slice(0, 6);
    }

    const description = String(plan?.description || "").trim();
    if (description) {
      const fromNewLines = description
        .split(/\r?\n/)
        .map((t) => t.trim())
        .filter(Boolean);
      if (fromNewLines.length >= 2) return fromNewLines.slice(0, 6);

      const fromSentences = description
        .split(".")
        .map((t) => t.trim())
        .filter(Boolean);
      if (fromSentences.length >= 2) return fromSentences.slice(0, 6);
    }

    const credits = plan?.credits;
    const creditsLine = Number.isFinite(Number(credits)) ? `${credits} credits` : "Credits included";
    return [creditsLine, "Advanced tools access", "Cancel anytime", "Secure payments"];
  };

  return (
    <>
      <PageHead title="Subscription Plans" />

      <main className="page-wrapper">
        <Context>
          {/* <HeaderTop /> */}
          <Header
            headerTransparent="header-transparent"
            headerSticky="header-sticky"
            btnClass="rainbow-gradient-btn"
          />
          <PopupMobileMenu />

          {authPromptOpen ? (
            <div
              className="subscription-auth-modal-overlay"
              role="dialog"
              aria-modal="true"
              onClick={(e) => {
                if (e.target === e.currentTarget) setAuthPromptOpen(false);
              }}
            >
              <div className="subscription-auth-modal">
              

                <div className="subscription-auth-modal-title">Sign in to buy a plan</div>
                <div className="subscription-auth-modal-subtitle">
                  Create an account or log in to continue checkout securely.
                </div>

                <div className="subscription-auth-modal-actions">
                  <Link
                    className="subscription-auth-modal-btn primary"
                    href={{ pathname: "/signin", query: { next: router?.asPath || "/subscription-plan" } }}
                  >
                    Sign in
                  </Link>
                  <Link
                    className="subscription-auth-modal-btn secondary"
                    href={{ pathname: "/signup", query: { next: router?.asPath || "/subscription-plan" } }}
                  >
                    Create account
                  </Link>
                </div>

                <button
                  type="button"
                  className="subscription-auth-modal-btn ghost"
                  onClick={() => setAuthPromptOpen(false)}
                >
                  Continue browsing
                </button>
              </div>
            </div>
          ) : null}

          <div id="pricing" className="subscription-plan-area rainbow-section-gap-big">
            <div className="subscription-plan-area-inner">
              <div className="container">
                <div className="row">
                  <div className="col-lg-12">
                    <div
                      className="subscription-plan-hero"
                      data-sal="slide-up"
                      data-sal-duration="400"
                      data-sal-delay="150"
                    >
                      <div className="subscription-plan-hero-sparkle sparkle-left" />
                      <div className="subscription-plan-hero-sparkle sparkle-right" />
                      <h1 className="subscription-plan-title">Choose your pricing</h1>
                      <p className="subscription-plan-subtitle">
                        Find the perfect plan to your business needs. We provide flexible solutions for startups,
                        growing businesses, and enterprises.
                      </p>

                    </div>
                  </div>
                </div>

              {errorMessage ? (
                <div className="row">
                  <div className="col-12">
                    <div className="rainbow-card p-4" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                      <p className="mb-0" style={{ color: "#ef4444" }}>
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {isLoading ? (
                <div className="row">
                  <div className="col-12">
                    <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 24 }}>Loading plans...</p>
                  </div>
                </div>
              ) : (
                <div className="subscription-plan-grid">
                  {(displayPlans || []).map((plan, index) => {
                    const name = String(plan?.name || "");
                    const description = String(plan?.description || "");
                    const price = String(plan?.price || "");
                    const billing = String(plan?.billing_period || "");
                    const planId = plan?.id;
                    const isCheckoutLoading =
                      checkoutLoadingPlanId != null && String(checkoutLoadingPlanId) === String(planId);

                    const isPopular = index === 1;
                    const features = getPlanFeatures(plan);

                    const billingLabel = billing || (billingMode === "annual" ? "year" : "month");

                    return (
                      <div
                        className={`subscription-plan-card ${isPopular ? "is-popular" : ""}`}
                        key={plan?.id ?? name ?? index}
                      >
                        <div className="subscription-plan-card-inner">
                          <div className="subscription-plan-card-head">
                            <div className="subscription-plan-card-title-row">
                              <h3 className="subscription-plan-card-title">{name || "Plan"}</h3>
                              {isPopular ? <span className="subscription-plan-badge">Popular</span> : null}
                            </div>

                            <div className="subscription-plan-price-row">
                              <span className="subscription-plan-price">${price}</span>
                              <span className="subscription-plan-period">/ {billingLabel}</span>
                            </div>

                            <p className="subscription-plan-card-desc">{description}</p>

                            <button
                              type="button"
                              className={`subscription-plan-cta ${isPopular ? "primary" : "secondary"}`}
                              onClick={() => handleBuyClick(plan)}
                              disabled={isCheckoutLoading || isLoading || (authed && !planId)}
                            >
                              {isCheckoutLoading ? "Redirecting..." : "Get Started"}
                            </button>
                          </div>

                          <div className="subscription-plan-features">
                            <ul className="subscription-plan-feature-list">
                              {(features || []).map((item, i) => (
                                <li key={`${planId}-${i}`}>
                                  <i className="fa-regular fa-circle-check"></i>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </div>

          <Footer />
          <Copyright />
        </Context>
      </main>
      <BackToTop />
    </>
  );
};

export default dynamic(() => Promise.resolve(SubscriptionPlanPage), { ssr: false });
