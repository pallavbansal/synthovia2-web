import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import API from "@/utils/api";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ email: "", old_password: "", new_password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch(API.AUTH_RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: String(form.email || "").trim(),
          old_password: String(form.old_password || ""),
          new_password: String(form.new_password || ""),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to reset password");
      setSuccess(json?.message || "Password updated successfully.");
      setForm({ email: "", old_password: "", new_password: "" });
    } catch (err) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password</title>
      </Head>
      <main className="page-wrapper">
        <div className="signup-area">
          <div className="wrapper">
            <div className="row">
              <div className="col-lg-12 bg-color-blackest left-wrapper">
                <div className="sign-up-box">
                  <div className="signup-box-top" style={{ padding: 24 }}>
                    <h2 style={{ margin: 0, color: "#fff" }}>Reset Password</h2>
                  </div>
                  <div className="signup-box-bottom">
                    <div className="signup-box-content">
                      <form onSubmit={handleSubmit}>
                        <div className="input-section mail-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-envelope"></i>
                          </div>
                          <input
                            type="email"
                            placeholder="Enter email address"
                            value={form.email}
                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="input-section password-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-lock"></i>
                          </div>
                          <input
                            type={showOldPassword ? "text" : "password"}
                            placeholder="Current password"
                            value={form.old_password}
                            onChange={(e) => setForm((p) => ({ ...p, old_password: e.target.value }))}
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            aria-label={showOldPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowOldPassword((v) => !v)}
                          >
                            <i className={showOldPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                          </button>
                        </div>
                        <div className="input-section password-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-lock"></i>
                          </div>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="New password"
                            value={form.new_password}
                            onChange={(e) => setForm((p) => ({ ...p, new_password: e.target.value }))}
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowNewPassword((v) => !v)}
                          >
                            <i className={showNewPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                          </button>
                        </div>
                        {error ? <p className="mt--10" style={{ color: "#ff6b6b" }}>{error}</p> : null}
                        {success ? <p className="mt--10" style={{ color: "#4cd137" }}>{success}</p> : null}
                        <button type="submit" className="btn-default" disabled={submitting}>
                          {submitting ? "Submitting…" : "Reset Password"}
                        </button>
                      </form>
                      <div className="signup-box-footer" style={{ marginTop: 20 }}>
                        <div className="bottom-text">
                          Remembered it?{" "}
                          <Link className="btn-read-more ml--5" href="/signin">
                            <span>Back to Sign In</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
