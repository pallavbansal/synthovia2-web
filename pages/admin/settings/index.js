import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import API from "@/utils/api";
import { useRouter } from "next/router";
import { getUser, isAdminAuthenticated, logout } from "@/utils/auth";
import baseStyles from "@/pages/settings/SettingsPage.module.css";

function AdminSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [guardError, setGuardError] = useState("");

  // Toggle states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // 1. Check Authentication
    if (!isAdminAuthenticated()) {
      setGuardError("You do not have permission to access Admin Settings.");
      return;
    }

    // 2. Clear errors and populate user data
    setGuardError("");
    const u = getUser();
    const email = u?.email || u?.user?.email || "";
    setForm((p) => ({ ...p, email: String(email || "") }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardError) return;

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
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: String(form.email || "").trim(),
          old_password: String(form.old_password || ""),
          new_password: String(form.new_password || ""),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Error: ${res.status}`);
      if (json?.status_code !== 1)
        throw new Error(json?.message || "Failed to reset password");

      setSuccess(json?.message || "Your password has been updated successfully.");
      setForm((p) => ({
        ...p,
        old_password: "",
        new_password: "",
        confirm_password: "",
      }));

      // Redirect after success
      window.setTimeout(() => {
        logout();
        router.replace("/signin");
      }, 1500);
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper component for Password Input with Icon
  const PasswordField = ({
    label,
    value,
    setter,
    showState,
    setShowState,
    placeholder,
    required = true,
    minLength,
  }) => (
    <div className={baseStyles.kv}>
      <div className={baseStyles.k}>{label}</div>
      <div className={baseStyles.v}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            maxWidth: "400px",
          }}
        >
          <input
            className={baseStyles.input}
            type={showState ? "text" : "password"}
            value={value}
            onChange={(e) => setter(e.target.value)}
            required={required}
            minLength={minLength}
            placeholder={placeholder}
            style={{ paddingRight: "40px", width: "100%" }}
          />
          <button
            type="button"
            onClick={() => setShowState(!showState)}
            style={{
              position: "absolute",
              right: "12px",
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={showState ? `Hide ${label}` : `Show ${label}`}
          >
            <i
              className={`fa-solid ${showState ? "fa-eye-slash" : "fa-eye"}`}
              style={{ fontSize: "14px" }}
            ></i>
          </button>
        </div>
        {minLength && (
          <div className={baseStyles.muted} style={{ marginTop: 6 }}>
            Minimum {minLength} characters
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Settings">
      <Head>
        <title>Admin Settings</title>
      </Head>

      <div className={baseStyles.page}>
        <div className={`${baseStyles.card} ${baseStyles.headerRow}`.trim()}>
          <div className={baseStyles.titleBlock}>
            <h1 className={baseStyles.title}>Settings</h1>
            <p className={baseStyles.subtitle}>Manage your security credentials</p>
          </div>
        </div>

        <div className={baseStyles.card}>
          {guardError ? (
            <div className={baseStyles.muted} style={{ color: "#ef4444" }}>
              {guardError}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={baseStyles.kv}>
                <div className={baseStyles.k}>Email Address</div>
                <div className={baseStyles.v}>
                  <input
                    className={baseStyles.input}
                    type="email"
                    value={form.email}
                    disabled
                    readOnly
                    style={{
                      maxWidth: "400px",
                      opacity: 0.7,
                      cursor: "not-allowed",
                    }}
                  />
                </div>
              </div>

              <PasswordField
                label="Current Password"
                value={form.old_password}
                setter={(val) => setForm((p) => ({ ...p, old_password: val }))}
                showState={showOldPassword}
                setShowState={setShowOldPassword}
                placeholder="Enter current password"
              />

              <div style={{ margin: "24px 0", borderTop: "1px solid #2d2d2d" }} />

              <PasswordField
                label="New Password"
                value={form.new_password}
                setter={(val) => setForm((p) => ({ ...p, new_password: val }))}
                showState={showNewPassword}
                setShowState={setShowNewPassword}
                placeholder="Create new password"
                minLength={8}
              />

              <PasswordField
                label="Confirm New Password"
                value={form.confirm_password}
                setter={(val) => setForm((p) => ({ ...p, confirm_password: val }))}
                showState={showConfirmPassword}
                setShowState={setShowConfirmPassword}
                placeholder="Repeat new password"
              />

              {error && (
                <div
                  className={baseStyles.muted}
                  style={{ color: "#ef4444", marginTop: 15, fontWeight: "500" }}
                >
                  <i className="fa-solid fa-circle-exclamation mr--5"></i> {error}
                </div>
              )}

              {success && (
                <div
                  className={baseStyles.muted}
                  style={{ color: "#22c55e", marginTop: 15, fontWeight: "500" }}
                >
                  <i className="fa-solid fa-circle-check mr--5"></i> {success}
                  <p style={{ fontSize: "12px", opacity: 0.8 }}>
                    Logging you out...
                  </p>
                </div>
              )}

              <div
                style={{
                  marginTop: 30,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="submit"
                  className={baseStyles.smallBtn}
                  disabled={submitting}
                  style={{ minWidth: "140px" }}
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr--5"></i>{" "}
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Final Export: Wrapped with Dynamic and SSR Disabled
export default dynamic(() => Promise.resolve(AdminSettingsPage), {
  ssr: false,
});