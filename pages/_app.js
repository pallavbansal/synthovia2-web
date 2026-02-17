import { Router } from "next/router";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Loading from "./loading";

import { getToken, isAdminAuthenticated } from "@/utils/auth";

import "bootstrap/scss/bootstrap.scss";

// ========= Plugins CSS START =========
import "../public/css/plugins/feature.css";
import "../public/css/plugins/fontawesome-all.min.css";
import "../public/css/plugins/animation.css";
import "../node_modules/sal.js/dist/sal.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-tooltip/dist/react-tooltip.css";
// ========= Plugins CSS END =========

import "../public/scss/style.scss";

export default function App({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");

    const handleStart = (url) => url !== Router.asPath && setLoading(true);
    const handleComplete = () => setLoading(false);

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleComplete);
    Router.events.on("routeChangeError", handleComplete);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleComplete);
      Router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const token = getToken();
    const isAuthed = !!token;

    const protectedPrefixes = [
      "/dashboard",
      "/dashboard-overview",
      "/admin",
      "/feedback",
      "/application",
      "/ad-copy-generator",
      "/caption-and-hastag-generator",
      "/code-generator",
      "/copywriting-assistant",
      "/email-generator",
      "/image-editor",
      "/image-generator",
      "/seo-keyword-meta-tag-generator",
      "/script-story-writer-tool",
      "/text-generator",
      "/vedio-generator",
      "/chat-export",
      "/appearance",
      "/notification",
      "/plans-billing",
      "/profile-details",
      "/sessions",
      "/settings",
      "/utilize",
    ];

    const isProtectedRoute = protectedPrefixes.some(
      (prefix) => router.pathname === prefix || router.pathname.startsWith(`${prefix}/`)
    );

    if (!isAuthed && isProtectedRoute) {
      router.replace("/signin");
      return;
    }

    const isAdminRoute = router.pathname === "/admin" || router.pathname.startsWith("/admin/");
    if (isAuthed && isAdminRoute && !isAdminAuthenticated()) {
      router.replace("/dashboard-overview");
      return;
    }

    if (isAuthed && router.pathname === "/signin") {
      router.replace(isAdminAuthenticated() ? "/admin/users/dashboard" : "/dashboard-overview");
    }
  }, [router.isReady, router.pathname]);

  return <>{loading ? <Loading /> : <Component {...pageProps} />}</>;
}
