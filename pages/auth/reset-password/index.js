import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import API from "@/utils/api";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ email: "", old_password: "", new_password: "", confirm_password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.new_password !== form.confirm_password) {
      setError("New passwords do not match.");
      return;
    }

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
      if (!res.ok) throw new Error(json?.message || `Error: ${res.status}`);
      if (json?.status_code !== 1) throw new Error(json?.message || "Failed to reset password");

      setSuccess(json?.message || "Your password has been updated successfully.");
      setForm({ email: "", old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password | YourBrand</title>
      </Head>

      <main className="reset-password-main">
        <div className="auth-container">
          <div className="auth-card">
            {/* Header */}
            <div className="auth-header">
              <h2>Reset Password</h2>
              <p>Please enter your details to update your security credentials.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email Field */}
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <i className="fa-regular fa-envelope field-icon"></i>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Current Password Field */}
              <div className="form-group">
                <label>Current Password</label>
                <div className="input-wrapper">
                  <i className="fa-regular fa-lock field-icon"></i>
                  <input
                    type={showOldPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.old_password}
                    onChange={(e) => setForm((p) => ({ ...p, old_password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    <i className={showOldPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                  </button>
                </div>
              </div>

              <hr className="form-divider" />

              {/* New Password Field */}
              <div className="form-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <i className="fa-regular fa-shield-keyhole field-icon"></i>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={form.new_password}
                    onChange={(e) => setForm((p) => ({ ...p, new_password: e.target.value }))}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <i className={showNewPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="input-wrapper">
                  <i className="fa-regular fa-check-double field-icon"></i>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={form.confirm_password}
                    onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Alerts */}
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {/* Action Button */}
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? (
                  <span className="loader-box">
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Remembered your password? <Link href="/signin">Sign In</Link>
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .reset-password-main {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #0a0a0a; /* Match your blackest theme */
            padding: 20px;
          }
          .auth-container {
            width: 100%;
            max-width: 450px;
          }
          .auth-card {
            background: #141414;
            border: 1px solid #262626;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .auth-header {
            margin-bottom: 32px;
            text-align: center;
          }
          .auth-header h2 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .auth-header p {
            color: #888;
            font-size: 14px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            color: #ccc;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 8px;
          }
          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }
          .field-icon {
            position: absolute;
            left: 16px;
            color: #555;
          }
          .input-wrapper input {
            width: 100%;
            background: #1f1f1f;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 12px 16px 12px 45px;
            color: white;
            font-size: 15px;
            transition: all 0.2s ease;
          }
          .input-wrapper input:focus {
            outline: none;
            border-color: #3b82f6; /* Modern Blue */
            background: #252525;
          }
          .eye-toggle {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: #555;
            cursor: pointer;
            padding: 4px;
          }
          .eye-toggle:hover { color: #fff; }
          .form-divider {
            border: 0;
            border-top: 1px solid #262626;
            margin: 25px 0;
          }
          .alert {
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .alert-danger { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.2); }
          .alert-success { background: rgba(76, 209, 55, 0.1); color: #4cd137; border: 1px solid rgba(76, 209, 55, 0.2); }
          .submit-btn {
            width: 100%;
            background: #ffffff;
            color: #000;
            border: none;
            padding: 14px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.1s ease, opacity 0.2s ease;
          }
          .submit-btn:hover { opacity: 0.9; }
          .submit-btn:active { transform: scale(0.98); }
          .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .auth-footer {
            margin-top: 24px;
            text-align: center;
            font-size: 14px;
            color: #888;
          }
          .auth-footer a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
            margin-left: 5px;
          }
          .auth-footer a:hover { text-decoration: underline; }
          .loader-box { display: flex; align-items: center; justify-content: center; gap: 8px; }
        `}</style>
      </main>
    </>
  );
}