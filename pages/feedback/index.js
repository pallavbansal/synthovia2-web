import { useState } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import API from "@/utils/api";
import { getAuthHeader } from "@/utils/auth";
import baseStyles from "@/pages/settings/SettingsPage.module.css";

export default function FeedbackFormPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const auth = getAuthHeader();
    if (!auth) {
      setError("Not authenticated.");
      return;
    }
    if (!String(message || "").trim()) {
      setError("Please enter your feedback message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(API.FEEDBACK_SUBMIT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: auth },
        body: JSON.stringify({ message: String(message).trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to submit feedback");
      setSuccess(json?.message || "Thanks for your feedback!");
      setMessage("");
    } catch (err) {
      setError(err?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Feedback">
      <Head>
        <title>Feedback</title>
      </Head>

      <div className={baseStyles.page}>
        <div className={baseStyles.card}>
          <div className={baseStyles.titleBlock}>
            <h1 className={baseStyles.title}>Feedback</h1>
            <p className={baseStyles.subtitle}>Tell us what’s working well and what we can improve.</p>
          </div>
        </div>

        <div className={baseStyles.card} style={{ maxWidth: 820 }}>
          {error ? <div className={baseStyles.muted} style={{ marginBottom: 10 }}>{error}</div> : null}
          {success ? <div className={baseStyles.muted} style={{ marginBottom: 10 }}>{success}</div> : null}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <div className={baseStyles.muted} style={{ marginBottom: 6, fontWeight: 900 }}>
                Message
              </div>
              <textarea
                className={baseStyles.textarea}
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your experience or suggestions…"
                required
              />
              <div className={baseStyles.muted} style={{ marginTop: 6 }}>
                Keep it short and specific (examples help a lot).
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button type="submit" className={baseStyles.smallBtn} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit feedback"}
              </button>
              <button
                type="button"
                className={baseStyles.smallBtn}
                onClick={() => {
                  if (submitting) return;
                  setMessage("");
                  setError("");
                  setSuccess("");
                }}
                disabled={submitting}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
