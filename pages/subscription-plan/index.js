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
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";

import { getAuthHeader, isAuthenticated } from "@/utils/auth";
import API from "@/utils/api";

const SubscriptionPlanPage = () => {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState(null);
  const [billingMode, setBillingMode] = useState("annual");
  const [useFallbackPlans, setUseFallbackPlans] = useState(false);

  const [countriesState, setCountriesState] = useState({ loading: false, error: "", items: [] });
  const [geoCountryCode, setGeoCountryCode] = useState("");
  const [geoCountryMeta, setGeoCountryMeta] = useState(null);
  const [pendingPaymentPlanId, setPendingPaymentPlanId] = useState(null);

  const autoCheckoutRanRef = useRef(false);

  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptPlanId, setAuthPromptPlanId] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPlanId, setPaymentPlanId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // 'razorpay' | 'paypal'
  const [paymentBusy, setPaymentBusy] = useState(false);

  const [geoIsIndia, setGeoIsIndia] = useState(null); // null = unknown/denied
  const [geoPromptOpen, setGeoPromptOpen] = useState(false);
  const [geoPromptPlanId, setGeoPromptPlanId] = useState(null);
  const [geoBlockReason, setGeoBlockReason] = useState("");

  const GEO_STORAGE_KEY = "subscription_geo_country_v1";
  const GEO_STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

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

  const detectDefaultPayment = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const langs = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
      const hasINLang = (langs || []).some((l) => String(l || "").toUpperCase().endsWith("-IN"));
      const tzLower = String(tz).toLowerCase();
      if (tzLower === "asia/kolkata" || tzLower === "asia/calcutta" || hasINLang) return "razorpay";
    } catch (e) { }
    return "paypal";
  };

  // Collect client geo info for checkout payloads
  const collectClientGeo = async () => {
    const out = { ip: "", country_code: "", country_name: "", region: "", city: "", lat: null, lon: null, source: "client" };
    try {
      // Best-effort: get coordinates
      const coords = await new Promise((resolve) => {
        if (typeof window === "undefined" || !navigator?.geolocation) return resolve(null);
        const handler = (pos) => resolve(pos?.coords || null);
        const fail = () => resolve(null);
        try {
          navigator.geolocation.getCurrentPosition(handler, fail, { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60 * 1000 });
        } catch {
          resolve(null);
        }
      });

      if (coords && Number.isFinite(Number(coords.latitude)) && Number.isFinite(Number(coords.longitude))) {
        out.lat = Number(coords.latitude);
        out.lon = Number(coords.longitude);
        try {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(out.lat))}&longitude=${encodeURIComponent(String(out.lon))}&localityLanguage=en`;
          const rg = await fetch(url, { method: "GET" }).then((r) => r.json()).catch(() => null);
          if (rg) {
            out.country_code = String(rg.countryCode || out.country_code || "").toUpperCase();
            out.country_name = String(rg.countryName || out.country_name || "");
            out.city = String(rg.city || rg.locality || rg.localityInfo?.administrative?.[0]?.name || out.city || "");
            out.region = String(rg.principalSubdivision || rg.localityInfo?.administrative?.[1]?.name || out.region || "");
          }
        } catch { }
      }

      // Fallbacks from known geo selection in UI
      if (!out.country_code && geoCountryCode) out.country_code = String(geoCountryCode).toUpperCase();
      if (!out.country_name && geoCountryMeta?.name) out.country_name = String(geoCountryMeta.name);

      // Get client IP (best-effort)
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json", { method: "GET" });
        const ipJson = await ipRes.json().catch(() => null);
        const ipStr = ipJson?.ip || ipJson?.ipAddress || "";
        if (ipStr) out.ip = String(ipStr);
      } catch { }
    } catch { }

    return out;
  };

  const resolveCountryFromList = (countryCode) => {
    const code = String(countryCode || "").trim().toUpperCase();
    const list = Array.isArray(countriesState.items) ? countriesState.items : [];
    const found = list.find((c) => String(c?.code || "").trim().toUpperCase() === code) || null;
    if (found) return { code: String(found.code).trim().toUpperCase(), meta: found };

    const fallback = list.find((c) => String(c?.code || "").trim().toUpperCase() === "US") || list[0] || null;
    if (!fallback) return { code: code || "", meta: null };
    return { code: String(fallback.code).trim().toUpperCase(), meta: fallback };
  };

  const loadGeoCountryFromStorage = () => {
    try {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(GEO_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const code = String(parsed?.code || "").trim().toUpperCase();
      const ts = Number(parsed?.ts);
      if (!code || !Number.isFinite(ts)) return null;
      if (Date.now() - ts > GEO_STORAGE_TTL_MS) return null;
      return { code, ts };
    } catch (e) {
      return null;
    }
  };

  const saveGeoCountryToStorage = (code) => {
    try {
      if (typeof window === "undefined") return;
      const next = { code: String(code || "").trim().toUpperCase(), ts: Date.now() };
      if (!next.code) return;
      window.localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(next));
    } catch (e) { }
  };

  const isInIndiaByCoords = ({ latitude, longitude }) => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const withinLat = lat >= 6 && lat <= 37;
    const withinLon = lon >= 68 && lon <= 98;
    return withinLat && withinLon;
  };

  const getDefaultPaymentMethod = () => {
    if (geoIsIndia === true) return "razorpay";
    if (geoIsIndia === false) return "paypal";
    return detectDefaultPayment();
  };

  const requestGeoIndia = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(null);
      if (!navigator?.geolocation) return resolve(null);

      const run = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const next = isInIndiaByCoords(pos?.coords || {});
            resolve(next);
          },
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 7000, maximumAge: 5 * 60 * 1000 }
        );
      };

      try {
        if (navigator.permissions?.query) {
          navigator.permissions
            .query({ name: "geolocation" })
            .then(() => run())
            .catch(() => run());
          return;
        }
      } catch (e) { }

      run();
    });
  };

  const requestGeoCountryCode = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(null);
      if (!navigator?.geolocation) return resolve(null);

      const run = () => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const latitude = pos?.coords?.latitude;
              const longitude = pos?.coords?.longitude;

              const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
                String(latitude || "")
              )}&longitude=${encodeURIComponent(String(longitude || ""))}&localityLanguage=en`;

              const res = await fetch(url, { method: "GET" });
              const json = await res.json().catch(() => null);
              const code = String(json?.countryCode || "").trim().toUpperCase();
              resolve(code || null);
            } catch (e) {
              resolve(null);
            }
          },
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 7000, maximumAge: 5 * 60 * 1000 }
        );
      };

      try {
        if (navigator.permissions?.query) {
          navigator.permissions
            .query({ name: "geolocation" })
            .then(() => run())
            .catch(() => run());
          return;
        }
      } catch (e) { }

      run();
    });
  };

  const getCurrencySymbol = (currency) => {
    const c = String(currency || "").toUpperCase();
    if (c === "USD") return "$";
    if (c === "INR") return "₹";
    if (c === "AUD") return "A$";
    if (c === "CAD") return "C$";
    if (c === "EUR") return "€";
    if (c === "RUB") return "₽";
    return c ? `${c} ` : "$";
  };

  const getPlanPreferredPrice = (plan) => {
    const countryCode = String(geoCountryCode || "").trim().toUpperCase();
    const planCountry = String(plan?.price?.country_code || "").trim().toUpperCase();

    if (countryCode === "IN" || planCountry === "IN") {
      const value =
        plan?.price?.amount_inr ??
        plan?.amount_inr ??
        plan?.price_inr ??
        plan?.price?.amount ??
        plan?.price ??
        "";
      return { currency: "INR", symbol: "₹", value };
    }

    const price = plan?.price || null;
    const currency = price?.currency || (plan?.amount_usd != null ? "USD" : "USD");
    const value = price?.amount ?? price?.price ?? plan?.amount_usd ?? plan?.price ?? "";
    return { currency, symbol: getCurrencySymbol(currency), value };
  };

  const fallbackIsIndia = useMemo(() => detectDefaultPayment() === "razorpay", []);
  const isIndia = geoIsIndia != null ? geoIsIndia : fallbackIsIndia;

  useEffect(() => {
    Sal();
  }, []);
  useEffect(() => {
    const stored = loadGeoCountryFromStorage();
    if (stored?.code) {
      setGeoCountryCode(stored.code);
      setGeoIsIndia(stored.code === "IN");
      return;
    }

    // Set a best-effort default country first so guest/unlogged users don't get blocked
    let defaultCode = "US";
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (String(tz).toLowerCase().includes("kolkata") || String(tz).toLowerCase().includes("calcutta")) {
        defaultCode = "IN";
      }
    } catch (e) { }
    setGeoCountryCode(defaultCode);
    setGeoIsIndia(defaultCode === "IN");

    if (typeof window === "undefined") return;
    if (!navigator?.permissions?.query) return;

    navigator.permissions
      .query({ name: "geolocation" })
      .then(async (perm) => {
        if (perm?.state !== "granted") return;
        const detected = await requestGeoCountryCode();
        if (!detected) return;
        const resolved = resolveCountryFromList(detected);
        const code = String(resolved?.code || "").trim().toUpperCase();
        if (!code) return;
        setGeoCountryCode(code);
        setGeoCountryMeta(resolved?.meta || null);
        setGeoIsIndia(code === "IN");
        saveGeoCountryToStorage(code);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!geoCountryCode) return;
    if (geoCountryMeta) return;
    if (!Array.isArray(countriesState.items) || countriesState.items.length === 0) return;
    const resolved = resolveCountryFromList(geoCountryCode);
    if (resolved?.meta) setGeoCountryMeta(resolved.meta);
  }, [geoCountryCode, geoCountryMeta, countriesState.items]);

  useEffect(() => {
    let cancelled = false;

    const fetchCountries = async () => {
      setCountriesState({ loading: true, error: "", items: [] });
      try {
        const res = await fetch(API.COUNTRIES, { method: "GET", headers: { Accept: "application/json" } });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || `Failed to load countries (${res.status})`);
        if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load countries");
        const items = Array.isArray(json?.countries) ? json.countries : [];
        if (!cancelled) setCountriesState({ loading: false, error: "", items });
      } catch (e) {
        if (!cancelled) setCountriesState({ loading: false, error: e?.message || "Failed to load countries", items: [] });
      }
    };

    fetchCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPlansForCountry = async (countryCode) => {
    setIsLoading(true);
    setErrorMessage("");
    setUseFallbackPlans(false);

    try {
      const authHeader = getAuthHeader();
      const res = await fetch(API.SUBSCRIPTION_PLANS_BY_COUNTRY(countryCode), {
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
          setPlans(fallbackPlans);
          setErrorMessage("");
          setUseFallbackPlans(true);
          return;
        }

        throw new Error(json?.message || `Failed to load plans (${res.status})`);
      }

      const nextPlans = Array.isArray(json?.plans) ? json.plans : [];
      setPlans(nextPlans);
    } catch (e) {
      setErrorMessage(e?.message || "Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!geoCountryCode) return;
    fetchPlansForCountry(geoCountryCode);
  }, [geoCountryCode]);

  useEffect(() => {
    if (!pendingPaymentPlanId) return;
    if (isLoading) return;
    const matched = (Array.isArray(plans) ? plans : []).find((p) => String(p?.id) === String(pendingPaymentPlanId));
    if (!matched) return;
    setPendingPaymentPlanId(null);
    openPaymentModalForPlan(matched?.id);
  }, [pendingPaymentPlanId, plans, isLoading]);

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

      if (!geoCountryCode) {
        openGeoPromptForPlan(matched?.id);
        return;
      }

      setPaymentPlanId(matched?.id);
      setPaymentMethod(getDefaultPaymentMethod());
      setPaymentModalOpen(true);
    } catch (e) { }
  }, [plans, isLoading, geoIsIndia, geoCountryCode]);

  const handleCheckout = async (planId) => {
    if (!planId) return;
    if (checkoutLoadingPlanId != null) return;

    setCheckoutLoadingPlanId(planId);
    setErrorMessage("");
    try {
      const authHeader = getAuthHeader();
      const plan = (Array.isArray(plans) ? plans : []).find((p) => String(p?.id) === String(planId)) || {};
      const basePrice = plan?.price || {};
      const amount = basePrice?.amount != null ? String(basePrice.amount) : String(plan?.price ?? "");
      const geo = await collectClientGeo();
      const body = new URLSearchParams();
      body.set("plan_id", String(planId));
      body.set("payment_method", "paypal");
      body.set("amount", amount);
      body.set("currency", String(basePrice?.currency || "USD"));
      if (geoCountryCode) body.set("country_code", String(geoCountryCode));
      body.set("geo", JSON.stringify(geo || {}));
      try {
        if (geo && typeof geo === "object") {
          if (geo.ip) body.set("geo_ip", String(geo.ip));
          if (geo.country_code) body.set("geo_country_code", String(geo.country_code));
          if (geo.country_name) body.set("geo_country_name", String(geo.country_name));
          if (geo.region) body.set("geo_region", String(geo.region));
          if (geo.city) body.set("geo_city", String(geo.city));
          if (Number.isFinite(geo.lat)) body.set("geo_lat", String(geo.lat));
          if (Number.isFinite(geo.lon)) body.set("geo_lon", String(geo.lon));
          if (geo.source) body.set("geo_source", String(geo.source));
        }
      } catch { }
      try { console.log("[checkout] paypal payload:", Object.fromEntries(body)); } catch { }

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
        } catch (e) { }
      }

      if (!redirectUrl) throw new Error("Missing PayPal redirect URL");
      window.location.assign(String(redirectUrl));
    } catch (e) {
      setErrorMessage(e?.message || "Checkout failed");
    } finally {
      setCheckoutLoadingPlanId(null);
    }
  };

  const ensureRazorpayLoaded = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("Window not available"));
      if (window.Razorpay) return resolve(window.Razorpay);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  };

  const handleRazorpayCheckout = async (planId) => {
    if (!planId) return;
    if (paymentBusy) return;
    setPaymentBusy(true);
    setErrorMessage("");
    try {
      const authHeader = getAuthHeader();
      const plan = (Array.isArray(plans) ? plans : []).find((p) => String(p?.id) === String(planId)) || {};
      const pref = getPlanPreferredPrice(plan);
      const currency = String(pref?.currency || "INR");
      if (currency !== "INR") throw new Error("Razorpay is only available for INR pricing.");
      const amount = pref?.value != null ? String(pref.value) : "";
      const geo = await collectClientGeo();
      const body = new URLSearchParams();
      body.set("plan_id", String(planId));
      body.set("payment_method", "razorpay");
      body.set("amount", amount);
      body.set("currency", currency);
      if (geoCountryCode) body.set("country_code", String(geoCountryCode));
      body.set("geo", JSON.stringify(geo || {}));
      try {
        if (geo && typeof geo === "object") {
          if (geo.ip) body.set("geo_ip", String(geo.ip));
          if (geo.country_code) body.set("geo_country_code", String(geo.country_code));
          if (geo.country_name) body.set("geo_country_name", String(geo.country_name));
          if (geo.region) body.set("geo_region", String(geo.region));
          if (geo.city) body.set("geo_city", String(geo.city));
          if (Number.isFinite(geo.lat)) body.set("geo_lat", String(geo.lat));
          if (Number.isFinite(geo.lon)) body.set("geo_lon", String(geo.lon));
          if (geo.source) body.set("geo_source", String(geo.source));
        }
      } catch { }
      try { console.log("[checkout] razorpay payload:", Object.fromEntries(body)); } catch { }

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

      const subscriptionReference = json?.subscription_reference;
      const rz = json?.razorpay || {};
      if (!rz?.key_id || !rz?.order_id || !rz?.amount || !rz?.currency) throw new Error("Invalid Razorpay init response");

      try {
        sessionStorage.setItem("subscription_reference", String(subscriptionReference || ""));
      } catch (e) { }

      await ensureRazorpayLoaded();

      const rzpOptions = {
        key: String(rz.key_id),
        amount: Number(rz.amount),
        currency: String(rz.currency || "INR"),
        name: "Synthovia",
        description: "Subscription Payment",
        order_id: String(rz.order_id),
        notes: rz.notes || {},
        handler: async function (response) {
          try {
            const confirmBody = new URLSearchParams({
              payment_method: "razorpay",
              subscription_reference: String(subscriptionReference || ""),
              order_id: String(response?.razorpay_order_id || rz.order_id || ""),
              payment_id: String(response?.razorpay_payment_id || ""),
              signature: String(response?.razorpay_signature || ""),
            });

            const confirmRes = await fetch(API.SUBSCRIPTION_CONFIRM, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                ...(authHeader ? { Authorization: authHeader } : {}),
              },
              body: confirmBody.toString(),
            });
            const confirmJson = await confirmRes.json().catch(() => null);
            if (!confirmRes.ok) throw new Error(confirmJson?.message || `Confirm failed (${confirmRes.status})`);
            if (!confirmJson || confirmJson.status_code !== 1) throw new Error(confirmJson?.message || "Confirm failed");

            setPaymentModalOpen(false);
            router.push("/dashboard-overview?subscription=active");
          } catch (e) {
            setErrorMessage(e?.message || "Confirmation failed");
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentBusy(false);
          },
        },
        theme: { color: "#7c3aed" },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on && rzp.on("payment.failed", function (resp) {
        setErrorMessage(resp?.error?.description || "Payment failed");
        setPaymentBusy(false);
      });
      rzp.open();
    } catch (e) {
      setErrorMessage(e?.message || "Checkout failed");
      setPaymentBusy(false);
    }
  };

  const openPaymentModalForPlan = (planId) => {
    if (!planId) {
      setErrorMessage("Missing plan");
      return;
    }
    setPaymentPlanId(planId);
    setPaymentMethod(getDefaultPaymentMethod());
    setPaymentModalOpen(true);
  };

  const openGeoPromptForPlan = (planId) => {
    setGeoPromptPlanId(planId || null);
    setGeoBlockReason("");
    setGeoPromptOpen(true);
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
            plan_id: planId,
            name: plan?.name,
            billing_period: plan?.billing_period,
            price: plan?.price,
          })
        );
      } catch (e) { }
      return;
    }

    if (!geoCountryCode) {
      openGeoPromptForPlan(planId);
      return;
    }

    openPaymentModalForPlan(planId);
  };

  const displayPlans = useMemo(() => {
    const list = Array.isArray(plans) && plans.length ? plans : useFallbackPlans ? fallbackPlans : [];

    const byPrice = list
      .map((p) => {
        const pref = getPlanPreferredPrice(p);
        return { ...p, _priceNum: Number(pref?.value) };
      })
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
    return out;
  }, [plans, fallbackPlans, billingMode, geoIsIndia, useFallbackPlans]);

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

  const renderLayout = (children) => {
    return (
      <main className="page-wrapper">
        <Header
          headerTransparent="header-transparent"
          headerSticky="header-sticky"
          btnClass="rainbow-gradient-btn"
        />
        <PopupMobileMenu />
        {children}
        <Footer />
        <Copyright />
      </main>
    );
  };

  return (
    <>
      <PageHead title="Subscription Plans" />

      <Context>
        {renderLayout(
          <>

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

          {geoPromptOpen ? (
            <div
              className="subscription-auth-modal-overlay"
              role="dialog"
              aria-modal="true"
              onClick={(e) => {
                if (e.target === e.currentTarget) return;
              }}
            >
              <div className="subscription-auth-modal payment-modal">
                <div className="subscription-auth-modal-title">Enable location</div>
                <div className="subscription-auth-modal-subtitle">
                  Location is required to continue payment. Please allow location access in your browser.
                </div>

                {geoBlockReason ? (
                  <div style={{ color: "#ef4444", marginTop: 8, fontSize: 13 }}>{geoBlockReason}</div>
                ) : null}

                <div className="payment-actions">
                  <button
                    type="button"
                    className="subscription-auth-modal-btn primary"
                    onClick={async () => {
                      const countryCode = await requestGeoCountryCode();
                      if (!countryCode) {
                        setGeoBlockReason(
                          "Location permission was not granted. Enable it in browser site settings and click 'Retry'."
                        );
                        return;
                      }

                      const resolved = resolveCountryFromList(countryCode);
                      const code = String(resolved?.code || "").trim().toUpperCase();
                      if (!code) {
                        setGeoBlockReason("Could not detect your country from the provided location.");
                        return;
                      }

                      setGeoCountryCode(code);
                      setGeoCountryMeta(resolved?.meta || null);
                      setGeoIsIndia(code === "IN");
                      saveGeoCountryToStorage(code);
                      setGeoPromptOpen(false);

                      if (geoPromptPlanId) {
                        setPendingPaymentPlanId(geoPromptPlanId);
                      }
                    }}
                  >
                    Retry location permission
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {paymentModalOpen ? (
            <div
              className="subscription-auth-modal-overlay"
              role="dialog"
              aria-modal="true"
              onClick={(e) => {
                if (e.target === e.currentTarget) setPaymentModalOpen(false);
              }}
            >
              <div className="subscription-auth-modal payment-modal">
                <div className="subscription-auth-modal-title">Choose payment method</div>
                <div className="subscription-auth-modal-subtitle">Select how you want to pay for your subscription.</div>
                <div className="payment-methods">
                  {isIndia ? (
                    <>
                      <label className={`payment-option ${paymentMethod === "razorpay" ? "selected" : ""}`} onClick={() => setPaymentMethod("razorpay")}>
                        <div className="pm-left">
                          <div className="pm-title">
                            <i className="fa-solid fa-credit-card" style={{ marginRight: 8 }}></i>
                            Razorpay
                            <span className="pm-badge">Default in India</span>
                          </div>
                          <div className="pm-sub">UPI, cards, netbanking</div>
                        </div>
                        <input
                          type="radio"
                          name="payment_method"
                          value="razorpay"
                          checked={paymentMethod === "razorpay"}
                          onChange={() => setPaymentMethod("razorpay")}
                        />
                      </label>
                      <label className={`payment-option ${paymentMethod === "paypal" ? "selected" : ""}`} onClick={() => setPaymentMethod("paypal")}>
                        <div className="pm-left">
                          <div className="pm-title">
                            <i className="fa-brands fa-paypal" style={{ marginRight: 8 }}></i>
                            PayPal
                          </div>
                          <div className="pm-sub">Pay with PayPal account or cards</div>
                        </div>
                        <input
                          type="radio"
                          name="payment_method"
                          value="paypal"
                          checked={paymentMethod === "paypal"}
                          onChange={() => setPaymentMethod("paypal")}
                        />
                      </label>
                    </>
                  ) : (
                    <label className={`payment-option selected`}>
                      <div className="pm-left">
                        <div className="pm-title">
                          <i className="fa-brands fa-paypal" style={{ marginRight: 8 }}></i>
                          PayPal
                        </div>
                        <div className="pm-sub">Pay with PayPal account or cards</div>
                      </div>
                      <input type="radio" name="payment_method" value="paypal" checked readOnly />
                    </label>
                  )}
                </div>

                <div className="payment-actions">
                  <button
                    type="button"
                    className="subscription-auth-modal-btn primary"
                    disabled={paymentBusy || !paymentPlanId}
                    onClick={() => {
                      if (paymentMethod === "razorpay") return handleRazorpayCheckout(paymentPlanId);
                      setPaymentModalOpen(false);
                      return handleCheckout(paymentPlanId);
                    }}
                  >
                    {paymentBusy ? "Processing..." : paymentMethod === "razorpay" ? "Continue with Razorpay" : "Continue with PayPal"}
                  </button>
                  <button type="button" className="subscription-auth-modal-btn ghost" onClick={() => setPaymentModalOpen(false)}>
                    Cancel
                  </button>
                </div>

                {errorMessage ? (
                  <p style={{ color: "#ef4444", marginTop: 8 }}>{errorMessage}</p>
                ) : null}
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
                      <h1 className="subscription-plan-title glasstext">Choose your pricing</h1>
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
                ) : !geoCountryCode && !useFallbackPlans ? (
                  <div className="row">
                    <div className="col-12">
                      <div
                        className="rainbow-card p-4"
                        style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, textAlign: "center" }}
                      >
                        <p className="mb-2" style={{ color: "#cbd5e1" }}>
                          Enable location to see pricing for your country.
                        </p>
                        <button type="button" className="subscription-plan-cta secondary" onClick={() => openGeoPromptForPlan(null)}>
                          Enable location
                        </button>

                        {countriesState.loading ? (
                          <div style={{ marginTop: 10, color: "#94a3b8" }}>Loading countries…</div>
                        ) : countriesState.error ? (
                          <div style={{ marginTop: 10, color: "#ef4444" }}>{countriesState.error}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="subscription-plan-grid">
                    {(displayPlans || []).map((plan, index) => {
                      const name = String(plan?.name || "");
                      const description = String(plan?.description || "");
                      const pref = getPlanPreferredPrice(plan);
                      const displaySymbol = "$";
                      const displayPrice = String(plan?.amount_usd ?? plan?.price?.amount_usd ?? plan?.price?.amount ?? plan?.price ?? "");
                      const price = String((pref?.value != null ? pref.value : plan?.price) || "");
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
                                <span className="subscription-plan-price">{displaySymbol}{displayPrice}</span>
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
                    <h2 className="title glasstext">How Credits Work</h2>
                    <p className="subscription-plan-subtitle">
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
                        <p>Generate upto 5 variants as per your need - credits scale linearly</p>
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
                    <h2 className="title glasstext">Frequently Asked Questions</h2>
                    <p className="subscription-plan-subtitle">
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
                            We accept all major credit/debit cards, UPI, Net Banking, and Wallets via Razorpay (for India), and PayPal for international payments.
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
                            Yes! You can upgrade or downgrade your plan anytime from your dashboard. Changes take effect immediately, and your credits are adjusted accordingly.
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
                            Once your credits are exhausted, you won't be able to generate new content until you top up or your plan renews. You can purchase additional credits or upgrade to a higher plan anytime.
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
                            Synthovia operates on a pay-per-cycle model — there's no long-term contract. Simply don't renew when your billing cycle ends and your subscription will automatically stop. No manual cancellation needed.
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
                            Yes! New users get a set of free credits upon signing up so you can explore Synthovia's tools before committing to a paid plan.
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
                            Credits do not roll over — they reset at the start of each billing cycle. We recommend choosing a plan that matches your monthly usage.
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
                            Yes. We take data privacy seriously. Your inputs and generated content are never shared or used to train models. Synthovia complies with India's DPDP Act 2023 and follows industry-standard security practices.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          </>
        )}
      </Context>
      <BackToTop />
      <style jsx>{`
        .payment-modal {
          max-width: 520px;
          width: min(92vw, 520px);
        }
        .payment-methods {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }
        .payment-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #e5e7eb;
          cursor: pointer;
          user-select: none;
          transition: background .2s ease, border-color .2s ease, box-shadow .2s ease;
        }
        .payment-option:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .payment-option.selected {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.16), rgba(255, 255, 255, 0.04));
          border-color: rgba(139, 92, 246, 0.85) !important;
          box-shadow:
            0 0 0 1px rgba(139, 92, 246, 0.35) inset,
            0 10px 30px rgba(139, 92, 246, 0.12);
        }
        .pm-left { display: flex; flex-direction: column; gap: 4px; }
        .pm-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #f3f4f6; }
        .pm-badge { margin-left: 8px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: rgba(139, 92, 246, 0.18); color: #c4b5fd; }
        .pm-sub { font-size: 12px; color: #94a3b8; }
        .payment-option input[type="radio"] { accent-color: #8b5cf6; width: 18px; height: 18px; }
        .payment-actions { display: flex; gap: 12px; margin-top: 16px; }
        .payment-actions .subscription-auth-modal-btn.primary { flex: 1 1 auto; }
        .payment-actions .subscription-auth-modal-btn.ghost { flex: 1 1 auto; }
      `}</style>
    </>
  );
};

export default dynamic(() => Promise.resolve(SubscriptionPlanPage), { ssr: false });
