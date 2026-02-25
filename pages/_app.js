import { Router } from "next/router";
import { useEffect, useRef, useState } from "react";
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
import { CreditsProvider } from "@/components/CreditsContext";

export default function App({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const loadingTimeoutRef = useRef(null);

  const cleanupOverlays = () => {
    try {
      const doc = document;
      // Remove any lingering Bootstrap/third-party backdrops
      const selectors = [
        ".modal-backdrop",
        ".offcanvas-backdrop",
        ".vbox-overlay",
        ".venobox",
        ".mfp-bg",
        ".mfp-wrap",
      ];
      selectors.forEach((sel) => {
        doc.querySelectorAll(sel).forEach((el) => {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        });
      });

      // Force-close any shown Bootstrap modals/offcanvas that might have been left mounted.
      try {
        doc.querySelectorAll(".modal.show, .offcanvas.show").forEach((el) => {
          el.classList.remove("show");
          el.setAttribute("aria-hidden", "true");
          el.removeAttribute("aria-modal");
          try {
            el.style.display = "none";
          } catch {}
        });
      } catch {}

      // Unlock body scroll if it was locked by a modal/offcanvas
      if (doc.body) {
        doc.body.classList.remove("modal-open", "offcanvas-open");
        try {
          doc.body.style.overflow = "";
          doc.body.style.paddingRight = "";
        } catch {}
      }
    } catch {}
  };

  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");

    const clearLoadingTimeout = () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const handleStart = (url) => {
      if (url !== Router.asPath) {
        setLoading(true);
        clearLoadingTimeout();
        // Fallback: auto-clear loading if Next.js events don't fire as expected
        loadingTimeoutRef.current = setTimeout(() => {
          setLoading(false);
          cleanupOverlays();
        }, 10000);
      }
    };

    const handleComplete = () => {
      clearLoadingTimeout();
      setLoading(false);
      // Ensure any stuck overlays/backdrops are removed after navigation
      cleanupOverlays();
    };

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleComplete);
    Router.events.on("routeChangeError", handleComplete);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleComplete);
      Router.events.off("routeChangeError", handleComplete);
      clearLoadingTimeout();
    };
  }, []);

  // Deterministic recovery: whenever Next.js updates the URL, we should not be stuck behind a loader/backdrop.
  useEffect(() => {
    // Defer to allow the new page to mount first.
    const t = setTimeout(() => {
      setLoading(false);
      cleanupOverlays();
    }, 0);
    return () => clearTimeout(t);
  }, [router.asPath]);

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

  // When returning to the tab, also run an overlay cleanup in case a third-party backdrop got stuck
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setLoading(false);
        cleanupOverlays();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Some browsers/app flows recover only on focus/pageshow; treat those the same as visibility recovery.
  useEffect(() => {
    const onFocus = () => {
      setLoading(false);
      cleanupOverlays();
    };
    const onPageShow = () => {
      setLoading(false);
      cleanupOverlays();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return (
    <CreditsProvider>
      {loading ? <Loading /> : <Component {...pageProps} />}
    </CreditsProvider>
  );
}
