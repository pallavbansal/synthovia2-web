import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import PageHead from "../Head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import API from "@/utils/api";
import { getAuthHeader, setUser } from "@/utils/auth";

import styles from "./SettingsPage.module.css";

const SettingsPage = () => {
  const [profileState, setProfileState] = useState({
    loading: false,
    error: "",
    data: null,
  });

  const [profileEditMode, setProfileEditMode] = useState(false);
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [lastNameDraft, setLastNameDraft] = useState("");
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");

  const formatMoney = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
  };

  const getSubscriptionBadgeClass = (sub) => {
    if (!sub || !sub.active) return styles.badgeRed;
    const status = String(sub.status || "").toLowerCase();
    if (status.includes("cancel")) return styles.badgeYellow;
    return styles.badgeGreen;
  };

  const fetchProfile = async () => {
    setProfileState({ loading: true, error: "", data: null });
    try {
      const res = await fetch(API.PROFILE, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load profile (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load profile");
      setProfileState({ loading: false, error: "", data: json });
    } catch (err) {
      setProfileState({ loading: false, error: err?.message || "Failed to load profile", data: null });
    }
  };

  const syncDraftFromProfile = (profile) => {
    const first = profile?.first_name ?? profile?.firstName ?? "";
    const last = profile?.last_name ?? profile?.lastName ?? "";
    setFirstNameDraft(String(first || ""));
    setLastNameDraft(String(last || ""));
  };

  const updateProfile = async () => {
    setProfileSaveLoading(true);
    setProfileSaveError("");
    try {
      const response = await fetch(API.PROFILE, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({
          first_name: firstNameDraft,
          last_name: lastNameDraft,
        }),
      });

      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.message || `Failed to update profile (${response.status})`);
      }
      if (!json || json.status_code !== 1) {
        throw new Error(json?.message || "Failed to update profile");
      }

      const updatedUser = json?.user || json?.profile || json?.data?.user || null;
      if (updatedUser) {
        setUser(updatedUser);
      }

      setProfileEditMode(false);
      await fetchProfile();
    } catch (err) {
      setProfileSaveError(err?.message || "Failed to update profile");
    } finally {
      setProfileSaveLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profileEditMode) return;
    const p = profileState.data?.profile;
    if (!p) return;
    syncDraftFromProfile(p);
  }, [profileState.data, profileEditMode]);

  const renderProfileTab = () => {
    if (profileState.loading) {
      return <div className={styles.muted}>Loading profile…</div>;
    }

    if (profileState.error) {
      return (
        <div className={styles.muted}>
          {profileState.error}
          <div style={{ marginTop: 10 }}>
            <button type="button" className={styles.smallBtn} onClick={fetchProfile}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    const data = profileState.data;
    const p = data?.profile;
    const credits = data?.credits;
    const sub = data?.subscription;
    const plan = sub?.plan;

    const firstNameValue = p?.first_name ?? p?.firstName ?? "";
    const lastNameValue = p?.last_name ?? p?.lastName ?? "";

    return (
      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.profileCard}`.trim()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>Profile</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {profileSaveError ? <span className={styles.muted}>{profileSaveError}</span> : null}
              <span className={styles.badge}>Account</span>
              {!profileEditMode ? (
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => {
                    setProfileSaveError("");
                    syncDraftFromProfile(p);
                    setProfileEditMode(true);
                  }}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    disabled={profileSaveLoading}
                    onClick={() => {
                      setProfileSaveError("");
                      syncDraftFromProfile(p);
                      setProfileEditMode(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    disabled={profileSaveLoading}
                    onClick={updateProfile}
                  >
                    {profileSaveLoading ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className={styles.kv}>
              <div className={styles.k}>First Name</div>
              <div className={styles.v}>
                {profileEditMode ? (
                  <input
                    className={styles.dateInput}
                    style={{ width: "100%" }}
                    value={firstNameDraft}
                    onChange={(e) => setFirstNameDraft(e.target.value)}
                  />
                ) : (
                  String(firstNameValue || "—")
                )}
              </div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Last Name</div>
              <div className={styles.v}>
                {profileEditMode ? (
                  <input
                    className={styles.dateInput}
                    style={{ width: "100%" }}
                    value={lastNameDraft}
                    onChange={(e) => setLastNameDraft(e.target.value)}
                  />
                ) : (
                  String(lastNameValue || "—")
                )}
              </div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Email</div>
              <div className={styles.v}>{p?.email || "—"}</div>
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.creditsCard}`.trim()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>Credits</div>
            <span className={styles.badge}>Usage</span>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className={styles.kv}>
              <div className={styles.k}>Remaining</div>
              <div className={styles.v}>{credits?.credits_remaining ?? "—"}</div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Used (current cycle)</div>
              <div className={styles.v}>{credits?.credits_used_current_cycle ?? "—"}</div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Used (all time)</div>
              <div className={styles.v}>{credits?.credits_used_all_time ?? "—"}</div>
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.subscriptionCard}`.trim()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>Subscription</div>
            <span className={`${styles.badge} ${getSubscriptionBadgeClass(sub)}`.trim()}>
              {sub?.active ? "Active" : "Inactive"}
              {sub?.status ? ` • ${sub.status}` : ""}
            </span>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className={styles.kv}>
              <div className={styles.k}>Plan</div>
              <div className={styles.v}>{plan?.name || "—"}</div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Price</div>
              <div className={styles.v}>
                {plan?.price != null ? formatMoney(plan.price) : "—"}
                {plan?.billing_period ? ` / ${plan.billing_period}` : ""}
              </div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Plan credits</div>
              <div className={styles.v}>{plan?.credits ?? "—"}</div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Started</div>
              <div className={styles.v}>{sub?.started_at || "—"}</div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Expires</div>
              <div className={styles.v}>{sub?.expires_at || "—"}</div>
            </div>
            <div className={styles.kv}>
              <div className={styles.k}>Next billing</div>
              <div className={styles.v}>{sub?.next_billing_at || "—"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHead title="Settings" />
      <DashboardLayout title="Settings">
        <div className={styles.page}>
          <div className={`${styles.card} ${styles.headerRow}`.trim()}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Settings</h1>
              <p className={styles.subtitle}>Manage your profile, credits, and subscription.</p>
            </div>
          </div>

          <div className={styles.card}>
            {renderProfileTab()}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(SettingsPage), { ssr: false });
