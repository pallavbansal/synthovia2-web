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
  const [isConfirmed, setIsConfirmed] = useState(false);
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
        try {
          sessionStorage.removeItem("subscription_reference");
        } catch (e) {}

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
    };
  }, [router.isReady, paypalSubscriptionId, subscriptionReference]);

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
                <div className="col-lg-12">
                  <div className="section-title text-center">
                    <h2 className="title w-600 mb--20">Subscription Confirmation</h2>

                    {errorMessage ? (
                      <p style={{ color: "#ef4444" }}>{errorMessage}</p>
                    ) : isConfirmed ? (
                      <p style={{ color: "#22c55e" }}>Subscription confirmed successfully.</p>
                    ) : isConfirming ? (
                      <p style={{ color: "#94a3b8" }}>Confirming your subscription...</p>
                    ) : (
                      <p style={{ color: "#94a3b8" }}>Preparing confirmation...</p>
                    )}

                    {!!paypalSubscriptionId ? (
                      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 12 }}>PayPal Subscription: {paypalSubscriptionId}</p>
                    ) : null}
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

export default dynamic(() => Promise.resolve(PayPalReturnPage), { ssr: false });
