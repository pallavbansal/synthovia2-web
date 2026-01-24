import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Script from "next/script";

import logo from "../../public/images/logo/logo.png";
import logoDark from "../../public/images/light/logo/logo-dark.png";
import DarkSwitch from "../Header/dark-switch";
import { useAppContext } from "@/context/Context";
import { googleLogin, login } from "@/utils/auth";

const SignIn = () => {
  const { isLightTheme, toggleTheme } = useAppContext();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [googleBtnReady, setGoogleBtnReady] = useState(false);
  const [googleSdkLoaded, setGoogleSdkLoaded] = useState(false);
  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const googleBtnWidthRef = useRef(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.google &&
      window.google.accounts &&
      window.google.accounts.id
    ) {
      setGoogleSdkLoaded(true);
    }
  }, []);

  const renderGoogleButton = () => {
    if (
      typeof window === "undefined" ||
      !window.google ||
      !window.google.accounts ||
      !window.google.accounts.id ||
      !googleButtonRef.current
    ) {
      return;
    }

    const container = googleButtonRef.current.parentElement || googleButtonRef.current;
    const nextWidth = Math.round(container.getBoundingClientRect().width || 0);
    if (!nextWidth) return;
    if (googleBtnReady && googleBtnWidthRef.current === nextWidth) return;

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: nextWidth,
    });

    googleBtnWidthRef.current = nextWidth;
    setGoogleBtnReady(true);
  };

  const initGoogle = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      setError("Google Client ID is not configured");
      return;
    }

    if (
      typeof window === "undefined" ||
      !window.google ||
      !window.google.accounts ||
      !window.google.accounts.id
    ) {
      setError("Google SDK failed to load");
      return;
    }

    if (!googleButtonRef.current) return;

    if (!googleInitializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        ux_mode: "popup",
        callback: async (credentialResponse) => {
          setError("");
          setSubmitting(true);
          try {
            const id_token = credentialResponse && credentialResponse.credential;
            if (!id_token) {
              throw new Error("Google login failed");
            }
            await googleLogin({ id_token });
            const next = router?.query?.next;
            const safeNext = typeof next === "string" && next.startsWith("/") ? next : "";
            router.replace(safeNext || "/dashboard");
          } catch (err) {
            setError(err?.message || "Google login failed");
          } finally {
            setSubmitting(false);
          }
        },
      });
      googleInitializedRef.current = true;
    }

    renderGoogleButton();
  };

  useEffect(() => {
    if (!googleSdkLoaded || googleBtnReady) return;
    initGoogle();
  }, [googleSdkLoaded, googleBtnReady]);

  useEffect(() => {
    if (!googleSdkLoaded) return;
    const container = googleButtonRef.current?.parentElement;
    if (!container) return;

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        renderGoogleButton();
      });
      ro.observe(container);
    }

    const handleWindowResize = () => {
      renderGoogleButton();
    };
    window.addEventListener("resize", handleWindowResize);

    const t = window.setTimeout(() => {
      initGoogle();
    }, 0);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", handleWindowResize);
      if (ro) ro.disconnect();
    };
  }, [googleSdkLoaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      const next = router?.query?.next;
      const safeNext = typeof next === "string" && next.startsWith("/") ? next : "";
      router.replace(safeNext || "/dashboard");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        async
        defer
        onLoad={() => setGoogleSdkLoaded(true)}
        onReady={() => setGoogleSdkLoaded(true)}
        onError={() => setError("Google SDK failed to load")}
      />
      {/* <DarkSwitch isLight={isLightTheme} switchTheme={toggleTheme} /> */}
      <main className="page-wrapper">
        <div className="signup-area">
          <div className="wrapper">
            <div className="row">
              <div className="col-lg-12 bg-color-blackest left-wrapper">
                <div className="sign-up-box">
                  <div className="signup-box-top">
                    <Link href="/">
                      <Image
                        src={isLightTheme ? logo : logoDark}
                        width={193}
                        height={50}
                        alt="sign-up logo"
                      />
                    </Link>
                  </div>
                  <div className="signup-box-bottom">
                    <div className="signup-box-content">
                      <div style={{ margin: "30px" }}>
                        <div ref={googleButtonRef} style={{ width: "100%" }} />
                      </div>
                      <div className="text-social-area">
                        <hr />
                        <span>Or continue with</span>
                        <hr />
                      </div>
                      <form onSubmit={handleSubmit}>
                        <div className="input-section mail-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-envelope"></i>
                          </div>
                          <input
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="input-section password-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-lock"></i>
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((v) => !v)}
                          >
                            <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                          </button>
                        </div>
                        {error ? <p className="mt--10">{error}</p> : null}
                        {/* <div className="forget-text">
                          <a className="btn-read-more" href="#">
                            <span>Forgot password</span>
                          </a>
                        </div> */}
                        <button
                          type="submit"
                          className="btn-default"
                          disabled={submitting}
                        >
                          {submitting ? "Signing In..." : "Sign In"}
                        </button>
                      </form>
                    </div>
                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        Don't have an account?{" "}
                        <a className="btn-read-more ml--5" href="/signup">
                          <span>Sign Up</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          <Link className="close-button" href="/">
            <i className="fa-sharp fa-regular fa-x"></i>
          </Link>
        </div>
      </main>
    </>
  );
};

export default SignIn;
