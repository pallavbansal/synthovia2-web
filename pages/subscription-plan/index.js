import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Sal from "sal.js";

import PageHead from "../Head";
import Context from "@/context/Context";

import HeaderTop from "@/components/Header/HeaderTop/HeaderTop";
import Header from "@/components/Header/Header";
import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import Footer from "@/components/Footers/Footer";
import Copyright from "@/components/Footers/Copyright";
import BackToTop from "../backToTop";

import { getAuthHeader } from "@/utils/auth";
import API from "@/utils/api";

const SubscriptionPlanPage = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState(null);

  useEffect(() => {
    Sal();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchPlans = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const res = await fetch(API.SUBSCRIPTION_PLANS, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: getAuthHeader(),
          },
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || `Failed to load plans (${res.status})`);
        if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load plans");

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

  const handleCheckout = async (planId) => {
    if (!planId) return;
    if (checkoutLoadingPlanId != null) return;

    setCheckoutLoadingPlanId(planId);
    setErrorMessage("");
    try {
      const body = new URLSearchParams({
        plan_id: String(planId),
        payment_method: "paypal",
      });

      const res = await fetch(API.SUBSCRIPTION_CHECKOUT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: getAuthHeader(),
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

  return (
    <>
      <PageHead title="Subscription Plans" />

      <main className="page-wrapper">
        <Context>
          <HeaderTop />
          <Header
            headerTransparent="header-transparent"
            headerSticky="header-sticky"
            btnClass="rainbow-gradient-btn"
          />
          <PopupMobileMenu />

          <div id="pricing" className="aiwave-pricing-area wrapper rainbow-section-gap-big">
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <div
                    className="section-title text-center"
                    data-sal="slide-up"
                    data-sal-duration="400"
                    data-sal-delay="150"
                  >
                    <h4 className="subtitle">
                      <span className="theme-gradient">Pricing</span>
                    </h4>
                    <h2 className="title w-600 mb--40">Pricing plans for everyone</h2>
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
                <div className="row row--15 mt_dec--40">
                  {(plans || []).map((plan) => {
                    const name = String(plan?.name || "");
                    const description = String(plan?.description || "");
                    const price = String(plan?.price || "");
                    const billing = String(plan?.billing_period || "");
                    const credits = plan?.credits;
                    const planId = plan?.id;
                    const isCheckoutLoading =
                      checkoutLoadingPlanId != null && String(checkoutLoadingPlanId) === String(planId);

                    return (
                      <div className="col-xl-4 col-lg-6 col-md-6 col-12 mt--40" key={plan?.id ?? name}>
                        <div className="rainbow-pricing style-aiwave">
                          <div className="pricing-table-inner">
                            <div className="pricing-top">
                              <div className="pricing-header">
                                <h4 className="title">{name}</h4>
                                <p className="subtitle">{description}</p>
                                <div className="pricing">
                                  <span className="price-text">${price}</span>
                                  <span className="text">/{billing || "month"}</span>
                                </div>
                              </div>
                              <div className="pricing-body">
                                <div className="features-section has-show-more">
                                  <h6>Includes</h6>
                                  <ul className="list-style--1 has-show-more-inner-content">
                                    <li>
                                      <i className="fa-regular fa-circle-check"></i>
                                      {Number.isFinite(Number(credits)) ? `${credits} credits` : "Credits included"}
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            <div className="pricing-footer">
                              <button
                                type="button"
                                className="btn-default btn-border"
                                onClick={() => handleCheckout(planId)}
                                disabled={isCheckoutLoading || isLoading || !planId}
                              >
                                {isCheckoutLoading ? "Redirecting..." : "Subscribe"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
