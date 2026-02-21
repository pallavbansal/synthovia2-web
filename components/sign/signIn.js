import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Script from "next/script";

import logo from "../../public/images/logo/logo.png";
import logoDark from "../../public/images/light/logo/logo-dark.png";
import { useAppContext } from "@/context/Context";
import { googleLogin, isAdminAuthenticated, login } from "@/utils/auth";

const SignIn = () => {
  const { isLightTheme } = useAppContext();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [googleSdkLoaded, setGoogleSdkLoaded] = useState(false);

  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const googleBtnWidthRef = useRef(0);

  /* ---------------- GOOGLE BUTTON RENDER ---------------- */

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

    const container =
      googleButtonRef.current.parentElement || googleButtonRef.current;

    const nextWidth = Math.round(
      container.getBoundingClientRect().width || 0
    );

    if (!nextWidth) return;
    if (googleBtnWidthRef.current === nextWidth) return;

    googleButtonRef.current.innerHTML = "";

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: nextWidth,
    });

    googleBtnWidthRef.current = nextWidth;
  };

  /* ---------------- GOOGLE INIT (RUN ONLY ONCE) ---------------- */

  const initGoogle = () => {
    if (googleInitializedRef.current) return;

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
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      ux_mode: "popup",
      callback: async (credentialResponse) => {
        setError("");
        setSubmitting(true);
        try {
          const id_token = credentialResponse?.credential;
          if (!id_token) throw new Error("Google login failed");

          await googleLogin({ id_token });

          const next = router?.query?.next;
          const safeNext =
            typeof next === "string" && next.startsWith("/") ? next : "";

          if (safeNext) {
            router.replace(safeNext);
          } else {
            router.replace(
              isAdminAuthenticated()
                ? "/admin/users/dashboard"
                : "/dashboard"
            );
          }
        } catch (err) {
          setError(err?.message || "Google login failed");
        } finally {
          setSubmitting(false);
        }
      },
    });

    googleInitializedRef.current = true;
    renderGoogleButton();
  };

  /* ---------------- LOAD SDK EFFECT ---------------- */

  useEffect(() => {
    if (!googleSdkLoaded) return;
    initGoogle();
  }, [googleSdkLoaded]);

  /* ---------------- RESIZE HANDLER ---------------- */

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

    const handleResize = () => {
      renderGoogleButton();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (ro) ro.disconnect();
    };
  }, [googleSdkLoaded]);

  /* ---------------- EMAIL LOGIN ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ email, password });

      const next = router?.query?.next;
      const safeNext =
        typeof next === "string" && next.startsWith("/") ? next : "";

      if (safeNext) {
        router.replace(safeNext);
      } else {
        router.replace(
          isAdminAuthenticated()
            ? "/admin/users/dashboard"
            : "/dashboard"
        );
      }
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
        strategy="afterInteractive"
        onLoad={() => setGoogleSdkLoaded(true)}
        onError={() => setError("Google SDK failed to load")}
      />

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
                        <div
                          ref={googleButtonRef}
                          style={{ width: "100%" }}
                        />
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
                            onChange={(e) =>
                              setPassword(e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() =>
                              setShowPassword((v) => !v)
                            }
                          >
                            <i
                              className={
                                showPassword
                                  ? "fa-solid fa-eye-slash"
                                  : "fa-solid fa-eye"
                              }
                            />
                          </button>
                        </div>

                        {error && <p className="mt--10">{error}</p>}

                        <div
                          className="forget-text"
                          style={{ marginTop: 10 }}
                        >
                          <Link
                            className="btn-read-more"
                            href="/auth/reset-password"
                          >
                            <span>Forgot password?</span>
                          </Link>
                        </div>

                        <button
                          type="submit"
                          className="btn-default"
                          disabled={submitting}
                        >
                          {submitting
                            ? "Signing In..."
                            : "Sign In"}
                        </button>
                      </form>
                    </div>

                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        Don't have an account?{" "}
                        <Link
                          className="btn-read-more ml--5"
                          href="/signup"
                        >
                          <span>Sign Up</span>
                        </Link>
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