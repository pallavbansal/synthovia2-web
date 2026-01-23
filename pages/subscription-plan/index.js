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
                              className={`subscription-plan-cta ${isPopular ? "personal-info-button" : "secondary"}`}
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

          {/* Credits Information Section */}
          <div className="subscription-credits-info-area rainbow-section-gap">
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <div
                    className="section-title text-center"
                    data-sal="slide-up"
                    data-sal-duration="400"
                    data-sal-delay="150"
                  >
                    <h2 className="title">How Credits Work</h2>
                    <p className="description" style={{ maxWidth: 700, margin: "0 auto" }}>
                      Credits are simple - each AI tool uses a specific number of credits per generation, 
                      multiplied by the number of variants you create.
                    </p>
                  </div>
                </div>
              </div>

              <div className="row mt--60">
                <div className="col-lg-10 offset-lg-1">
                  {/* Credit Calculation Formula */}
                  <div className="credits-formula-card">
                    <div className="credits-formula-badge">Credit Deduction Formula</div>
                    <div className="credits-formula-content">
                      <div className="credits-formula-text">
                        <span className="formula-label">Credits Deducted</span>
                        <span className="formula-equals">=</span>
                        <span className="formula-value">Credits per Tool</span>
                        <span className="formula-multiply">×</span>
                        <span className="formula-value">Number of Variants</span>
                      </div>
                    </div>
                  </div>

                  {/* Tool Pricing Grid */}
                  <div className="credits-tools-grid">
                    <div className="credits-tool-card">
                      <div className="credits-tool-icon">
                        <i className="fa-solid fa-ad"></i>
                      </div>
                      <h4 className="credits-tool-name">Ad Copy Generator</h4>
                      <div className="credits-tool-cost">
                        <span className="cost-number">2</span>
                        <span className="cost-label">credits/gen</span>
                      </div>
                    </div>

                    <div className="credits-tool-card">
                      <div className="credits-tool-icon">
                        <i className="fa-solid fa-pen-fancy"></i>
                      </div>
                      <h4 className="credits-tool-name">Copywriting Assistant</h4>
                      <div className="credits-tool-cost">
                        <span className="cost-number">3</span>
                        <span className="cost-label">credits/gen</span>
                      </div>
                    </div>

                    <div className="credits-tool-card">
                      <div className="credits-tool-icon">
                        <i className="fa-solid fa-hashtag"></i>
                      </div>
                      <h4 className="credits-tool-name">Caption & Hashtag</h4>
                      <div className="credits-tool-cost">
                        <span className="cost-number">2</span>
                        <span className="cost-label">credits/gen</span>
                      </div>
                    </div>

                    <div className="credits-tool-card">
                      <div className="credits-tool-icon">
                        <i className="fa-solid fa-envelope"></i>
                      </div>
                      <h4 className="credits-tool-name">Email & Newsletter</h4>
                      <div className="credits-tool-cost">
                        <span className="cost-number">2</span>
                        <span className="cost-label">credits/gen</span>
                      </div>
                    </div>

                    <div className="credits-tool-card">
                      <div className="credits-tool-icon">
                        <i className="fa-solid fa-file-lines"></i>
                      </div>
                      <h4 className="credits-tool-name">Script Writer</h4>
                      <div className="credits-tool-cost">
                        <span className="cost-number">3</span>
                        <span className="cost-label">credits/gen</span>
                      </div>
                    </div>

                    <div className="credits-tool-card">
                      <div className="credits-tool-icon">
                        <i className="fa-solid fa-magnifying-glass"></i>
                      </div>
                      <h4 className="credits-tool-name">SEO & Keyword</h4>
                      <div className="credits-tool-cost">
                        <span className="cost-number">2</span>
                        <span className="cost-label">credits/gen</span>
                      </div>
                    </div>
                  </div>

                  {/* Example Calculation */}
                  <div className="credits-example-card">
                    <div className="credits-example-header">
                      <i className="fa-solid fa-lightbulb"></i>
                      <h3>Example Calculation</h3>
                    </div>
                    
                    <div className="credits-example-content">
                      <div className="credits-example-scenario">
                        <div className="scenario-item">
                          <span className="scenario-label">Your Plan:</span>
                          <span className="scenario-value">Starter (1,000 credits)</span>
                        </div>
                        <div className="scenario-item">
                          <span className="scenario-label">Tool Selected:</span>
                          <span className="scenario-value">Script Writer</span>
                        </div>
                        <div className="scenario-item">
                          <span className="scenario-label">Variants Requested:</span>
                          <span className="scenario-value">3 variants</span>
                        </div>
                      </div>

                      <div className="credits-example-calculation">
                        <div className="calculation-step">
                          <div className="step-formula">
                            <span className="step-text">Credits per Tool:</span>
                            <span className="step-value">3 credits</span>
                          </div>
                          <div className="step-formula">
                            <span className="step-text">Number of Variants:</span>
                            <span className="step-value">3 variants</span>
                          </div>
                          <div className="step-divider"></div>
                          <div className="step-formula highlight">
                            <span className="step-text">Total Credits Used:</span>
                            <span className="step-value">3 × 3 = <strong>9 credits</strong></span>
                          </div>
                        </div>

                        <div className="calculation-result">
                          <div className="result-row">
                            <span className="result-label">Starting Balance:</span>
                            <span className="result-value">1,000 credits</span>
                          </div>
                          <div className="result-row deduction">
                            <span className="result-label">Credits Used:</span>
                            <span className="result-value">- 9 credits</span>
                          </div>
                          <div className="result-divider"></div>
                          <div className="result-row final">
                            <span className="result-label">Remaining Balance:</span>
                            <span className="result-value balance">991 credits</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="credits-key-points">
                    <div className="key-point-item">
                      <div className="key-point-icon">
                        <i className="fa-solid fa-check-circle"></i>
                      </div>
                      <div className="key-point-content">
                        <h4>Simple & Transparent</h4>
                        <p>Every tool has a clear, fixed credit cost with no hidden fees</p>
                      </div>
                    </div>

                    <div className="key-point-item">
                      <div className="key-point-icon">
                        <i className="fa-solid fa-infinity"></i>
                      </div>
                      <div className="key-point-content">
                        <h4>Multiple Variants</h4>
                        <p>Generate as many variants as you need - credits scale linearly</p>
                      </div>
                    </div>

                    <div className="key-point-item">
                      <div className="key-point-icon">
                        <i className="fa-solid fa-chart-line"></i>
                      </div>
                      <div className="key-point-content">
                        <h4>Track Usage</h4>
                        <p>Monitor your credit balance in real-time from your dashboard</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="subscription-faq-area rainbow-section-gap">
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <div
                    className="section-title text-center"
                    data-sal="slide-up"
                    data-sal-duration="400"
                    data-sal-delay="150"
                  >
                    <h2 className="title">Frequently Asked Questions</h2>
                    <p className="description" style={{ maxWidth: 600, margin: "0 auto" }}>
                      Get answers to common questions about our pricing plans and subscriptions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="row mt--40">
                <div className="col-lg-10 offset-lg-1">
                  <div className="subscription-faq-accordion">
                    <div className="accordion" id="faqAccordion">
                      {/* FAQ Item 1 */}
                      <div className="accordion-item">
                        <h3 className="accordion-header" id="faqHeading1">
                          <button
                            className="accordion-button"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#faqCollapse1"
                            aria-expanded="true"
                            aria-controls="faqCollapse1"
                          >
                            What payment methods do you accept?
                          </button>
                        </h3>
                        <div
                          id="faqCollapse1"
                          className="accordion-collapse collapse show"
                          aria-labelledby="faqHeading1"
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body">
                            We accept PayPal for secure and convenient payments. All transactions are encrypted and processed securely to protect your financial information.
                          </div>
                        </div>
                      </div>

                      {/* FAQ Item 2 */}
                      <div className="accordion-item">
                        <h3 className="accordion-header" id="faqHeading2">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#faqCollapse2"
                            aria-expanded="false"
                            aria-controls="faqCollapse2"
                          >
                            Can I change my plan later?
                          </button>
                        </h3>
                        <div
                          id="faqCollapse2"
                          className="accordion-collapse collapse"
                          aria-labelledby="faqHeading2"
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body">
                            Yes, you can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged the prorated difference. When you downgrade, the changes will take effect at the start of your next billing cycle.
                          </div>
                        </div>
                      </div>

                      {/* FAQ Item 3 */}
                      <div className="accordion-item">
                        <h3 className="accordion-header" id="faqHeading3">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#faqCollapse3"
                            aria-expanded="false"
                            aria-controls="faqCollapse3"
                          >
                            What happens if I run out of credits?
                          </button>
                        </h3>
                        <div
                          id="faqCollapse3"
                          className="accordion-collapse collapse"
                          aria-labelledby="faqHeading3"
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body">
                            If you run out of credits before your billing cycle ends, you can either upgrade to a higher plan or purchase additional credits separately. Your service will continue uninterrupted once you add more credits.
                          </div>
                        </div>
                      </div>

                      {/* FAQ Item 4 */}
                      <div className="accordion-item">
                        <h3 className="accordion-header" id="faqHeading4">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#faqCollapse4"
                            aria-expanded="false"
                            aria-controls="faqCollapse4"
                          >
                            Can I cancel my subscription anytime?
                          </button>
                        </h3>
                        <div
                          id="faqCollapse4"
                          className="accordion-collapse collapse"
                          aria-labelledby="faqHeading4"
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body">
                            Absolutely! You can cancel your subscription at any time from your account settings. You'll continue to have access to your plan features until the end of your current billing period. No cancellation fees apply.
                          </div>
                        </div>
                      </div>

                      {/* FAQ Item 5 */}
                      <div className="accordion-item">
                        <h3 className="accordion-header" id="faqHeading5">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#faqCollapse5"
                            aria-expanded="false"
                            aria-controls="faqCollapse5"
                          >
                            Do you offer refunds?
                          </button>
                        </h3>
                        <div
                          id="faqCollapse5"
                          className="accordion-collapse collapse"
                          aria-labelledby="faqHeading5"
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body">
                            We offer a 7-day money-back guarantee on all plans. If you're not satisfied with our service within the first 7 days of your subscription, contact our support team for a full refund.
                          </div>
                        </div>
                      </div>

                      {/* FAQ Item 6 */}
                      <div className="accordion-item">
                        <h3 className="accordion-header" id="faqHeading6">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#faqCollapse6"
                            aria-expanded="false"
                            aria-controls="faqCollapse6"
                          >
                            Is there a free trial available?
                          </button>
                        </h3>
                        <div
                          id="faqCollapse6"
                          className="accordion-collapse collapse"
                          aria-labelledby="faqHeading6"
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body">
                            Currently, we don't offer a traditional free trial, but our Starter plan provides an affordable way to explore our platform. Additionally, we offer a 7-day money-back guarantee so you can try our service risk-free.
                          </div>
                        </div>
                      </div>

                      {/* FAQ Item 7 */}
                      <div className="accordion-item">
                        <h3 className="accordion-header" id="faqHeading7">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#faqCollapse7"
                            aria-expanded="false"
                            aria-controls="faqCollapse7"
                          >
                            Do credits roll over to the next month?
                          </button>
                        </h3>
                        <div
                          id="faqCollapse7"
                          className="accordion-collapse collapse"
                          aria-labelledby="faqHeading7"
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body">
                            Credits are renewed at the start of each billing cycle and do not roll over. We recommend choosing a plan that matches your typical monthly usage to get the best value.
                          </div>
                        </div>
                      </div>

                      {/* FAQ Item 8 */}
                      <div className="accordion-item">
                        <h3 className="accordion-header" id="faqHeading8">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#faqCollapse8"
                            aria-expanded="false"
                            aria-controls="faqCollapse8"
                          >
                            Is my data secure?
                          </button>
                        </h3>
                        <div
                          id="faqCollapse8"
                          className="accordion-collapse collapse"
                          aria-labelledby="faqHeading8"
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body">
                            Yes, security is our top priority. We use industry-standard encryption for all data transmission and storage. Your payment information is processed through secure payment gateways and we never store your full payment details on our servers.
                          </div>
                        </div>
                      </div>
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
    </>
  );
};

export default dynamic(() => Promise.resolve(SubscriptionPlanPage), { ssr: false });
