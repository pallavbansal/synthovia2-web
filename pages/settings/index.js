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

  const [subscriptionHistoryState, setSubscriptionHistoryState] = useState({
    loading: false,
    error: "",
    items: [],
    pagination: null,
    page: 1,
    perPage: 15,
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

  const showBuyPlanCta = Boolean(profileState.data) && !Boolean(profileState.data?.subscription?.active);

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
    let cancelled = false;

    const fetchHistory = async () => {
      setSubscriptionHistoryState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const res = await fetch(
          API.SUBSCRIPTION_HISTORY({ perPage: subscriptionHistoryState.perPage, page: subscriptionHistoryState.page }),
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: getAuthHeader(),
            },
          }
        );

        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || `Failed to load subscription history (${res.status})`);
        if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load subscription history");

        const history = Array.isArray(json?.history) ? json.history : [];
        const pagination = json?.pagination || null;

        if (cancelled) return;
        setSubscriptionHistoryState((s) => ({ ...s, loading: false, items: history, pagination }));
      } catch (err) {
        if (cancelled) return;
        setSubscriptionHistoryState((s) => ({ ...s, loading: false, error: err?.message || "Failed to load subscription history" }));
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [subscriptionHistoryState.page, subscriptionHistoryState.perPage]);

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

            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <a href="/subscription-plan" className={styles.smallBtn}>
                Buy Plan
              </a>
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.transactionsCard}`.trim()}>
          <div className={styles.historyHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>Subscription Transactions</div>
              <span className={styles.badge}>History</span>
            </div>

            <div className={styles.pagination}>
              <span className={styles.pageLabel}>
                Page {subscriptionHistoryState.pagination?.current_page ?? subscriptionHistoryState.page} of{" "}
                {subscriptionHistoryState.pagination?.last_page ?? "—"}
              </span>

              <button
                type="button"
                className={`${styles.smallBtn} ${
                  subscriptionHistoryState.loading || (subscriptionHistoryState.pagination?.current_page ?? subscriptionHistoryState.page) <= 1
                    ? styles.btnDisabled
                    : ""
                }`.trim()}
                disabled={
                  subscriptionHistoryState.loading ||
                  (subscriptionHistoryState.pagination?.current_page ?? subscriptionHistoryState.page) <= 1
                }
                onClick={() => setSubscriptionHistoryState((s) => ({ ...s, page: Math.max(1, (s.page || 1) - 1) }))}
              >
                Prev
              </button>

              <button
                type="button"
                className={`${styles.smallBtn} ${
                  subscriptionHistoryState.loading ||
                  (subscriptionHistoryState.pagination?.last_page != null &&
                    (subscriptionHistoryState.pagination?.current_page ?? subscriptionHistoryState.page) >=
                      subscriptionHistoryState.pagination?.last_page)
                    ? styles.btnDisabled
                    : ""
                }`.trim()}
                disabled={
                  subscriptionHistoryState.loading ||
                  (subscriptionHistoryState.pagination?.last_page != null &&
                    (subscriptionHistoryState.pagination?.current_page ?? subscriptionHistoryState.page) >=
                      subscriptionHistoryState.pagination?.last_page)
                }
                onClick={() => setSubscriptionHistoryState((s) => ({ ...s, page: (s.page || 1) + 1 }))}
              >
                Next
              </button>

              <select
                className={styles.select}
                value={subscriptionHistoryState.perPage}
                disabled={subscriptionHistoryState.loading}
                onChange={(e) =>
                  setSubscriptionHistoryState((s) => ({
                    ...s,
                    perPage: Number(e.target.value) || 15,
                    page: 1,
                  }))
                }
              >
                <option value={15}>15 / page</option>
                <option value={30}>30 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {subscriptionHistoryState.loading ? <div className={styles.muted}>Loading transactions…</div> : null}
            {subscriptionHistoryState.error ? <div className={styles.muted}>{subscriptionHistoryState.error}</div> : null}
            {!subscriptionHistoryState.loading && !subscriptionHistoryState.error && subscriptionHistoryState.items.length === 0 ? (
              <div className={styles.muted}>No transactions found.</div>
            ) : null}

            {!subscriptionHistoryState.error && subscriptionHistoryState.items.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Transaction ID</th>
                      <th className={styles.th}>Amount</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Date</th>
                      <th className={styles.th}>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionHistoryState.items.map((tx, idx) => (
                      <tr className={styles.tr} key={`${tx?.transaction_id || "tx"}-${idx}`}>
                        <td className={styles.td}>{tx?.transaction_id || "—"}</td>
                        <td className={styles.td}>{tx?.amount != null ? formatMoney(tx.amount) : "—"}</td>
                        <td className={styles.td}>{tx?.status || "—"}</td>
                        <td className={styles.td}>{tx?.date || "—"}</td>
                        <td className={styles.td}>
                          {tx?.invoice_pdf_url ? (
                            tx?.invoice_pdf_ready === false ? (
                              <span className={styles.muted}>Preparing</span>
                            ) : (
                              <a
                                href={tx.invoice_pdf_url}
                                className={styles.smallBtn}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                            )
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
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

          {showBuyPlanCta ? (
            <div className={`${styles.card} ${styles.ctaCard}`.trim()}>
              <div className={styles.ctaInner}>
                <div className={styles.ctaLeft}>
                  <h3 className={styles.ctaTitle}>Unlock more credits and premium features</h3>
                  <p className={styles.ctaSubtitle}>Buy a subscription plan to boost your productivity.</p>
                </div>
                <a href="/subscription-plan" className={styles.ctaBtn}>
                  <i className="fa-solid fa-bolt" />
                  Buy
                </a>
              </div>
            </div>
          ) : null}

          <div className={styles.card}>
            {renderProfileTab()}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(SettingsPage), { ssr: false });
