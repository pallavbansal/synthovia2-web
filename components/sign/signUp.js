import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import logo from "../../public/images/logo/logo.png";
import logoDark from "../../public/images/light/logo/logo-dark.png";
import google from "../../public/images/sign-up/google.png";
import facebook from "../../public/images/sign-up/facebook.png";
import { useAppContext } from "@/context/Context";
import DarkSwitch from "../Header/dark-switch";
import { register } from "@/utils/auth";

const SignUp = () => {
  const { isLightTheme, toggleTheme } = useAppContext();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmPassword,
      });
      setSuccess("Registration successful. Redirecting to Dashboard...");
      const next = router?.query?.next;
      const safeNext = typeof next === "string" && next.startsWith("/") ? next : "";
      router.replace(safeNext || "/dashboard");
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
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
                      <div className="social-btn-grp">
                        <a className="btn-default btn-border" href="#">
                          <span className="icon-left">
                            <Image
                              src={google}
                              width={18}
                              height={18}
                              alt="Google Icon"
                            />
                          </span>
                          Login with Google
                        </a>
                        <a className="btn-default btn-border" href="#">
                          <span className="icon-left">
                            <Image
                              src={facebook}
                              width={18}
                              height={18}
                              alt="Facebook Icon"
                            />
                          </span>
                          Login with Facebook
                        </a>
                      </div>
                      <div className="text-social-area">
                        <hr />
                        <span>Or continue with</span>
                        <hr />
                      </div>
                      <form onSubmit={handleSubmit}>
                        <div className="input-section">
                          <div className="icon">
                            <i className="feather-user"></i>
                          </div>
                          <input
                            type="text"
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div className="input-section">
                          <div className="icon">
                            <i className="feather-user"></i>
                          </div>
                          <input
                            type="text"
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
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
                            placeholder="Create Password"
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
                        </div>{" "}
                        <div className="input-section password-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-lock"></i>
                          </div>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowConfirmPassword((v) => !v)}
                          >
                            <i
                              className={
                                showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                              }
                            />
                          </button>
                        </div>
                        {error ? <p className="mt--10">{error}</p> : null}
                        {success ? <p className="mt--10">{success}</p> : null}
                        <div className="forget-text">
                          <a className="btn-read-more" href="#">
                            <span>Forgot password</span>
                          </a>
                        </div>
                        <button
                          type="submit"
                          className="btn-default"
                          disabled={submitting}
                        >
                          {submitting ? "Signing Up..." : "Sign Up"}
                        </button>
                      </form>
                    </div>
                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        Do you have an account?
                        <a className="btn-read-more ml--5" href="/signin">
                          <span>Sign In</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="col-lg-6 right-wrapper">
                <div className="client-feedback-area">
                  <div className="single-feedback">
                    <div className="inner">
                      <div className="meta-img-section">
                        <a className="image" href="#">
                          <Image
                            src={userImg}
                            width={93}
                            height={93}
                            alt="User Image"
                          />
                        </a>
                      </div>
                      <div className="rating">
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star"></i>
                        </a>
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star"></i>
                        </a>
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star"></i>
                        </a>
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star"></i>
                        </a>
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star"></i>
                        </a>
                      </div>
                      <div className="content">
                        <p className="description">
                          Rainbow-Themes is now a crucial component of our work!
                          We made it simple to collaborate across departments by
                          grouping our work
                        </p>
                        <div className="bottom-content">
                          <div className="meta-info-section">
                            <h4 className="title-text mb--0">Guy Hawkins</h4>
                            <p className="desc mb--20">Nursing Assistant</p>
                            <div className="desc-img">
                              <Image
                                src={brandImg}
                                width={83}
                                height={23}
                                alt="Brand Image"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
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

export default SignUp;
