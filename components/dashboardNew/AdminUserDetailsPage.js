import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import API from "@/utils/api";
import { getAuthHeader, isAdminAuthenticated } from "@/utils/auth";
import baseStyles from "@/pages/settings/SettingsPage.module.css";
import styles from "./AdminUserDetailsPage.module.css";

const safeText = (v) => {
  if (v == null) return "—";
  const s = String(v);
  return s.trim() ? s : "—";
};

const formatDateTime = (raw) => {
  if (!raw) return "—";
  const dt = new Date(String(raw).replace(" ", "T"));
  if (Number.isNaN(dt.getTime())) return String(raw);
  return dt.toLocaleString();
};

const normalizePagination = ({ pagination, fallbackPage, fallbackPerPage, itemCount }) => {
  const pageRaw = pagination?.current_page ?? pagination?.page ?? fallbackPage;
  const perPageRaw = pagination?.per_page ?? pagination?.perPage ?? fallbackPerPage;
  const lastPageRaw = pagination?.last_page ?? pagination?.total_pages ?? null;
  const totalRaw = pagination?.total ?? pagination?.total_items ?? null;
  const nextPageUrl = pagination?.next_page_url ?? pagination?.nextPageUrl ?? null;
  const prevPageUrl = pagination?.prev_page_url ?? pagination?.prevPageUrl ?? null;

  const page = Number(pageRaw);
  const perPage = Number(perPageRaw);
  const total = totalRaw == null ? null : Number(totalRaw);
  const lastPage = lastPageRaw == null ? null : Number(lastPageRaw);

  const safePage = Number.isFinite(page) && page > 0 ? page : fallbackPage;
  const safePerPage = Number.isFinite(perPage) && perPage > 0 ? perPage : fallbackPerPage;
  const totalPages =
    Number.isFinite(lastPage) && lastPage > 0
      ? lastPage
      : Number.isFinite(total) && total != null
        ? Math.max(1, Math.ceil(total / safePerPage))
        : null;

  const hasNext =
    typeof nextPageUrl === "string"
      ? Boolean(nextPageUrl)
      : totalPages != null
        ? safePage < totalPages
        : itemCount === safePerPage;

  const hasPrev = typeof prevPageUrl === "string" ? Boolean(prevPageUrl) : safePage > 1;

  return {
    page: safePage,
    perPage: safePerPage,
    total: Number.isFinite(total) ? total : null,
    totalPages,
    hasNext,
    hasPrev,
    nextPageUrl: typeof nextPageUrl === "string" ? nextPageUrl : null,
    prevPageUrl: typeof prevPageUrl === "string" ? prevPageUrl : null,
  };
};

const AdminUserDetailsPage = () => {
  const router = useRouter();
  const id = router?.query?.id;

  const [guardError, setGuardError] = useState("");

  const [detailsState, setDetailsState] = useState({ loading: false, error: "", data: null });

  const [updateForm, setUpdateForm] = useState({ first_name: "", last_name: "" });
  const [updateState, setUpdateState] = useState({ loading: false, error: "", success: "" });

  const [grantForm, setGrantForm] = useState({ amount: "" });
  const [grantState, setGrantState] = useState({ loading: false, error: "", success: "" });
  const [grantModalOpen, setGrantModalOpen] = useState(false);

  const [userActionState, setUserActionState] = useState({ deactivating: false, deleting: false, error: "", success: "" });

  const [activityPage, setActivityPage] = useState(1);
  const activityPerPage = 5;
  const activityFetchSeqRef = useRef(0);
  const [activityState, setActivityState] = useState({ loading: false, error: "", items: [], pagination: null });

  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 15;
  const historyFetchSeqRef = useRef(0);
  const [historyState, setHistoryState] = useState({ loading: false, error: "", items: [], pagination: null });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      setGuardError("You do not have permission to access Admin Users.");
    } else {
      setGuardError("");
    }
  }, []);

  const fetchUserDetails = async (userId) => {
    if (!userId) return;

    const auth = getAuthHeader();
    if (!auth) {
      setDetailsState({ loading: false, error: "Not authenticated.", data: null });
      return;
    }

    setDetailsState({ loading: true, error: "", data: null });
    setUpdateState({ loading: false, error: "", success: "" });
    setGrantState({ loading: false, error: "", success: "" });
    setUserActionState({ deactivating: false, deleting: false, error: "", success: "" });

    try {
      const res = await fetch(API.ADMIN_USER_DETAILS(userId), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load user (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load user");

      setDetailsState({ loading: false, error: "", data: json });

      const u = json?.user || json?.data?.user || json?.data?.profile || null;
      setUpdateForm({
        first_name: u?.first_name || "",
        last_name: u?.last_name || "",
      });

      setHistoryPage(1);
      setActivityPage(1);
    } catch (err) {
      setDetailsState({ loading: false, error: err?.message || "Failed to load user", data: null });
      setHistoryState({ loading: false, error: "", items: [], pagination: null });
      setActivityState({ loading: false, error: "", items: [], pagination: null });
    }
  };

  const fetchUserActivities = async ({ userId, nextPage = activityPage } = {}) => {
    if (!userId) return;

    const auth = getAuthHeader();
    if (!auth) {
      setActivityState({ loading: false, error: "Not authenticated.", items: [], pagination: null });
      return;
    }

    setActivityState((p) => ({ ...p, loading: true, error: "" }));
    const seq = ++activityFetchSeqRef.current;

    try {
      const url = API.ADMIN_USER_ACTIVITIES({ id: userId, perPage: activityPerPage, page: nextPage });
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load activities (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load activities");

      if (seq !== activityFetchSeqRef.current) return;

      const items = Array.isArray(json?.activities)
        ? json.activities
        : Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data?.activities)
            ? json.data.activities
            : Array.isArray(json?.data?.items)
              ? json.data.items
              : [];

      const normalized = normalizePagination({
        pagination: json?.pagination || json?.meta?.pagination || json?.meta || null,
        fallbackPage: nextPage,
        fallbackPerPage: activityPerPage,
        itemCount: items.length,
      });

      setActivityState({ loading: false, error: "", items, pagination: normalized });

      if (normalized?.page && normalized.page !== nextPage) {
        setActivityPage(normalized.page);
      }
    } catch (err) {
      if (seq !== activityFetchSeqRef.current) return;
      setActivityState({ loading: false, error: err?.message || "Failed to load activities", items: [], pagination: null });
    }
  };

  const fetchSubscriptionHistory = async ({ userId, nextPage = historyPage } = {}) => {
    if (!userId) return;

    const auth = getAuthHeader();
    if (!auth) {
      setHistoryState({ loading: false, error: "Not authenticated.", items: [], pagination: null });
      return;
    }

    setHistoryState((p) => ({ ...p, loading: true, error: "" }));
    const seq = ++historyFetchSeqRef.current;

    try {
      const url = API.ADMIN_USER_SUBSCRIPTION_HISTORY({ id: userId, perPage: historyPerPage, page: nextPage });
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load subscription history (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load subscription history");

      if (seq !== historyFetchSeqRef.current) return;

      const items = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.history)
          ? json.history
          : Array.isArray(json?.data?.items)
            ? json.data.items
            : Array.isArray(json?.data?.history)
              ? json.data.history
              : [];

      const normalized = normalizePagination({
        pagination: json?.pagination || json?.meta?.pagination || json?.meta || null,
        fallbackPage: nextPage,
        fallbackPerPage: historyPerPage,
        itemCount: items.length,
      });

      setHistoryState({ loading: false, error: "", items, pagination: normalized });

      if (normalized?.page && normalized.page !== nextPage) {
        setHistoryPage(normalized.page);
      }
    } catch (err) {
      if (seq !== historyFetchSeqRef.current) return;
      setHistoryState({ loading: false, error: err?.message || "Failed to load subscription history", items: [], pagination: null });
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) return;
    fetchUserDetails(id);
  }, [router.isReady, id]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) return;
    fetchSubscriptionHistory({ userId: id, nextPage: historyPage });
  }, [router.isReady, id, historyPage]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) return;
    fetchUserActivities({ userId: id, nextPage: activityPage });
  }, [router.isReady, id, activityPage]);

  const detailsUser = detailsState.data?.user || detailsState.data?.data?.user || null;
  const credits = detailsState.data?.credits || detailsState.data?.data?.credits || null;
  const subscription = detailsState.data?.subscription || detailsState.data?.data?.subscription || null;

  const historyPaging = historyState.pagination || {
    page: historyPage,
    perPage: historyPerPage,
    totalPages: null,
    total: null,
    hasNext: false,
    hasPrev: false,
  };
  const canHistoryPrev = !historyState.loading && (historyPaging.hasPrev || (historyPaging.page || 1) > 1);
  const canHistoryNext =
    !historyState.loading &&
    (historyPaging.hasNext ||
      (historyPaging.totalPages != null
        ? (historyPaging.page || 1) < historyPaging.totalPages
        : false));

  const activityPaging = activityState.pagination || {
    page: activityPage,
    perPage: activityPerPage,
    totalPages: null,
    total: null,
    hasNext: false,
    hasPrev: false,
  };
  const canActivityPrev = !activityState.loading && (activityPaging.hasPrev || (activityPaging.page || 1) > 1);
  const canActivityNext =
    !activityState.loading &&
    (activityPaging.hasNext ||
      (activityPaging.totalPages != null
        ? (activityPaging.page || 1) < activityPaging.totalPages
        : false));

  const pageTitle = useMemo(() => {
    if (!detailsUser) return "Admin User Details";
    const name = [detailsUser?.first_name, detailsUser?.last_name].filter(Boolean).join(" ");
    return name || detailsUser?.email || "Admin User Details";
  }, [detailsUser]);

  const statusMessage =
    updateState.error ||
    updateState.success ||
    grantState.error ||
    grantState.success ||
    userActionState.error ||
    userActionState.success ||
    "";

  const doUpdateUser = async () => {
    if (!id) return;
    const auth = getAuthHeader();
    if (!auth) {
      setUpdateState({ loading: false, error: "Not authenticated.", success: "" });
      return;
    }

    setUpdateState({ loading: true, error: "", success: "" });

    try {
      const body = {};
      if (String(updateForm.first_name || "").trim()) body.first_name = String(updateForm.first_name).trim();
      if (String(updateForm.last_name || "").trim()) body.last_name = String(updateForm.last_name).trim();

      const res = await fetch(API.ADMIN_USER_UPDATE(id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: auth,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to update user (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to update user");

      setUpdateState({ loading: false, error: "", success: "User updated." });
      await fetchUserDetails(id);
    } catch (err) {
      setUpdateState({ loading: false, error: err?.message || "Failed to update user", success: "" });
    }
  };

  const doGrantCredits = async () => {
    if (!id) return;
    const auth = getAuthHeader();
    if (!auth) {
      setGrantState({ loading: false, error: "Not authenticated.", success: "" });
      return;
    }

    const amountNum = Number(grantForm.amount);
    if (!Number.isFinite(amountNum) || amountNum < 1) {
      setGrantState({ loading: false, error: "Amount must be >= 1.", success: "" });
      return;
    }

    const body = { amount: amountNum };

    setGrantState({ loading: true, error: "", success: "" });

    try {
      const res = await fetch(API.ADMIN_USER_GRANT_CREDITS(id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: auth,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to grant credits (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to grant credits");

      setGrantState({ loading: false, error: "", success: "Credits granted." });
      setGrantForm({ amount: "" });
      setGrantModalOpen(false);
      await fetchUserDetails(id);
    } catch (err) {
      setGrantState({ loading: false, error: err?.message || "Failed to grant credits", success: "" });
    }
  };

  const openGrantModal = () => {
    setGrantState({ loading: false, error: "", success: "" });
    setGrantForm({ amount: "" });
    setGrantModalOpen(true);
  };

  const closeGrantModal = () => {
    if (grantState.loading) return;
    setGrantModalOpen(false);
  };

  useEffect(() => {
    if (!grantModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeGrantModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [grantModalOpen, grantState.loading]);

  const doDeactivate = async () => {
    if (!id) return;
    if (!window.confirm("Deactivate this user?")) return;

    const auth = getAuthHeader();
    if (!auth) {
      setUserActionState((p) => ({ ...p, error: "Not authenticated.", success: "" }));
      return;
    }

    setUserActionState({ deactivating: true, deleting: false, error: "", success: "" });

    try {
      const res = await fetch(API.ADMIN_USER_DEACTIVATE(id), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to deactivate user (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to deactivate user");

      setUserActionState({ deactivating: false, deleting: false, error: "", success: "User deactivated." });
      await fetchUserDetails(id);
    } catch (err) {
      setUserActionState({ deactivating: false, deleting: false, error: err?.message || "Failed to deactivate user", success: "" });
    }
  };

  const doDelete = async () => {
    if (!id) return;
    if (!window.confirm("Delete this user? This cannot be undone.")) return;

    const auth = getAuthHeader();
    if (!auth) {
      setUserActionState((p) => ({ ...p, error: "Not authenticated.", success: "" }));
      return;
    }

    setUserActionState({ deactivating: false, deleting: true, error: "", success: "" });

    try {
      const res = await fetch(API.ADMIN_USER_DELETE(id), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to delete user (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to delete user");

      router.replace("/admin/users/dashboard");
    } catch (err) {
      setUserActionState({ deactivating: false, deleting: false, error: err?.message || "Failed to delete user", success: "" });
    }
  };

  if (guardError) {
    return (
      <div className={baseStyles.page}>
        <div className={baseStyles.card}>
          <div className={baseStyles.titleBlock}>
            <h1 className={baseStyles.title}>Admin User Details</h1>
            <p className={baseStyles.subtitle}>{guardError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={baseStyles.page}>
      <div className={`${baseStyles.card} ${styles.topRow}`.trim()}>
        <div className={baseStyles.titleBlock}>
          <h1 className={baseStyles.title}>{pageTitle}</h1>
          <div className={styles.breadcrumb}>
            <Link href="/admin/users/dashboard" className={styles.link}>
              Admin Users Dashboard
            </Link>
            <span className={baseStyles.muted}>/</span>
            <span className={baseStyles.muted}>User #{safeText(id)}</span>
          </div>
        </div>
      </div>

      {detailsState.loading ? (
        <div className={baseStyles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeading}>Loading user…</div>
          </div>
          <div className={baseStyles.muted}>Loading…</div>
        </div>
      ) : detailsState.error ? (
        <div className={baseStyles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeading}>Failed to load user</div>
          </div>
          <div className={baseStyles.muted}>
            {detailsState.error}
            <div style={{ marginTop: 10 }}>
              <button type="button" className={baseStyles.smallBtn} onClick={() => fetchUserDetails(id)}>
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={baseStyles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeading}>Profile & Credits</div>
              <div className={styles.actionsRow}>
                <button type="button" className={baseStyles.smallBtn} onClick={openGrantModal}>
                  Grant credits
                </button>
              </div>
            </div>

            <div className={styles.split2}>
              <div className={styles.subBlock}>
                <div className={styles.subTitle}>Profile</div>

                <div className={styles.kv}>
                  <div className={styles.k}>Name</div>
                  <div className={styles.v}>{safeText([detailsUser?.first_name, detailsUser?.last_name].filter(Boolean).join(" ") || detailsUser?.email)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Email</div>
                  <div className={styles.v}>{safeText(detailsUser?.email)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Role</div>
                  <div className={styles.v}>{safeText(detailsUser?.role)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Status</div>
                  <div className={styles.v}>{safeText(detailsUser?.status)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Registered</div>
                  <div className={styles.v}>{formatDateTime(detailsUser?.registered_at)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Email verified</div>
                  <div className={styles.v}>{detailsUser?.email_verified ? "Yes" : "No"}</div>
                </div>
              </div>

              <div className={styles.subBlock}>
                <div className={styles.subTitle}>Credits</div>

                <div className={styles.kv}>
                  <div className={styles.k}>Remaining</div>
                  <div className={styles.v}>{safeText(credits?.credits_remaining)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Used (cycle)</div>
                  <div className={styles.v}>{safeText(credits?.used_current_cycle)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Used (all-time)</div>
                  <div className={styles.v}>{safeText(credits?.used_all_time)}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }} className={styles.subBlock}>
              <div className={styles.subTitle}>Admin actions</div>
              {statusMessage ? <div className={baseStyles.muted} style={{ marginBottom: 10 }}>{statusMessage}</div> : null}

              <div className={styles.formGrid}>
                <div className={styles.formCol6}>
                  <div className={baseStyles.muted} style={{ marginBottom: 6, fontWeight: 900 }}>
                    First name
                  </div>
                  <input className={styles.input} value={updateForm.first_name} onChange={(e) => setUpdateForm((p) => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div className={styles.formCol6}>
                  <div className={baseStyles.muted} style={{ marginBottom: 6, fontWeight: 900 }}>
                    Last name
                  </div>
                  <input className={styles.input} value={updateForm.last_name} onChange={(e) => setUpdateForm((p) => ({ ...p, last_name: e.target.value }))} />
                </div>
                <div className={styles.formCol12}>
                  <div className={styles.actionsRow}>
                    <button type="button" className={baseStyles.smallBtn} onClick={doUpdateUser} disabled={updateState.loading || detailsState.loading}>
                      {updateState.loading ? "Saving…" : "Update user"}
                    </button>
                    <button type="button" className={baseStyles.smallBtn} onClick={openGrantModal} disabled={detailsState.loading}>
                      Grant credits
                    </button>
                    <button type="button" className={styles.dangerBtn} onClick={doDeactivate} disabled={userActionState.deactivating || userActionState.deleting || detailsState.loading}>
                      {userActionState.deactivating ? "Deactivating…" : "Deactivate"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={baseStyles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeading}>Subscription & Recent activities</div>
            </div>

            <div className={styles.split2}>
              <div className={styles.subBlock}>
                <div className={styles.subTitle}>Subscription</div>

                <div className={styles.kv}>
                  <div className={styles.k}>Active</div>
                  <div className={styles.v}>{subscription?.active ? "Yes" : "No"}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Status</div>
                  <div className={styles.v}>{safeText(subscription?.status)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Plan</div>
                  <div className={styles.v}>
                    {typeof subscription?.plan === "object" && subscription?.plan
                      ? safeText(subscription?.plan?.name ?? subscription?.plan?.title)
                      : safeText(subscription?.plan)}
                  </div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Started</div>
                  <div className={styles.v}>{formatDateTime(subscription?.started_at)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Expires</div>
                  <div className={styles.v}>{formatDateTime(subscription?.expires_at)}</div>
                </div>
                <div className={styles.kv}>
                  <div className={styles.k}>Next billing</div>
                  <div className={styles.v}>{formatDateTime(subscription?.next_billing_at)}</div>
                </div>
              </div>

              <div className={styles.subBlock}>
                <div className={styles.subTitle}>Recent activities</div>
                <div className={baseStyles.pagination} style={{ marginBottom: 10 }}>
                  <span className={baseStyles.pageLabel}>
                    Page {activityPaging.page || 1}
                    {activityPaging.totalPages != null ? ` / ${activityPaging.totalPages}` : ""}
                    {activityPaging.total != null ? ` • ${activityPaging.total} total` : ""}
                  </span>
                  <button
                    type="button"
                    className={`${baseStyles.smallBtn} ${canActivityPrev ? "" : baseStyles.btnDisabled}`.trim()}
                    onClick={() => setActivityPage(Math.max(1, (activityPaging.page || 1) - 1))}
                    disabled={!canActivityPrev}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className={`${baseStyles.smallBtn} ${canActivityNext ? "" : baseStyles.btnDisabled}`.trim()}
                    onClick={() => setActivityPage((activityPaging.page || 1) + 1)}
                    disabled={!canActivityNext}
                  >
                    Next
                  </button>
                </div>

                {activityState.loading ? (
                  <div className={baseStyles.muted}>Loading activities…</div>
                ) : activityState.error ? (
                  <div className={baseStyles.muted}>
                    {activityState.error}
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className={baseStyles.smallBtn} onClick={() => fetchUserActivities({ userId: id, nextPage: activityPage })}>
                        Retry
                      </button>
                    </div>
                  </div>
                ) : !activityState.items.length ? (
                  <div className={baseStyles.muted}>No recent activities.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {activityState.items.map((a, idx) => (
                      <div key={`${a?.occurred_at}-${idx}`} className={styles.activityCard}>
                        <div style={{ fontWeight: 900 }}>{safeText(a?.tool_name || a?.tool_key)}</div>
                        <div className={baseStyles.muted} style={{ marginTop: 4 }}>
                          {formatDateTime(a?.occurred_at)} • Credits spent: {safeText(a?.credits_spent)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={baseStyles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeading}>Subscription history</div>
            </div>

            <div className={baseStyles.pagination} style={{ marginBottom: 10 }}>
              <span className={baseStyles.pageLabel}>
                Page {historyPaging.page || 1}
                {historyPaging.totalPages != null ? ` / ${historyPaging.totalPages}` : ""}
                {historyPaging.total != null ? ` • ${historyPaging.total} total` : ""}
              </span>
              <button
                type="button"
                className={`${baseStyles.smallBtn} ${canHistoryPrev ? "" : baseStyles.btnDisabled}`.trim()}
                onClick={() => setHistoryPage(Math.max(1, (historyPaging.page || 1) - 1))}
                disabled={!canHistoryPrev}
              >
                Prev
              </button>
              <button
                type="button"
                className={`${baseStyles.smallBtn} ${canHistoryNext ? "" : baseStyles.btnDisabled}`.trim()}
                onClick={() => setHistoryPage((historyPaging.page || 1) + 1)}
                disabled={!canHistoryNext}
              >
                Next
              </button>
            </div>

            {historyState.loading ? (
              <div className={baseStyles.muted}>Loading history…</div>
            ) : historyState.error ? (
              <div className={baseStyles.muted}>
                {historyState.error}
                <div style={{ marginTop: 10 }}>
                  <button type="button" className={baseStyles.smallBtn} onClick={() => fetchSubscriptionHistory({ userId: id, nextPage: historyPage })}>
                    Retry
                  </button>
                </div>
              </div>
            ) : !historyState.items.length ? (
              <div className={baseStyles.muted}>No subscription history.</div>
            ) : (
              <div className={baseStyles.tableWrap}>
                <table className={baseStyles.table}>
                  <thead>
                    <tr>
                      <th className={baseStyles.th}>Invoice</th>
                      <th className={baseStyles.th}>Date</th>
                      <th className={baseStyles.th}>Amount</th>
                      <th className={baseStyles.th}>Status</th>
                      <th className={baseStyles.th}>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyState.items.map((h) => (
                      <tr key={h?.transaction_id || `${h?.invoice_number}-${h?.date}` || Math.random()} className={baseStyles.tr}>
                        <td className={baseStyles.td}>{safeText(h?.invoice_number)}</td>
                        <td className={baseStyles.td}>{formatDateTime(h?.date)}</td>
                        <td className={baseStyles.td}>{safeText(h?.amount)}</td>
                        <td className={baseStyles.td}>{safeText(h?.status)}</td>
                        <td className={baseStyles.td}>
                          {h?.invoice_pdf_url ? (
                            <a className={styles.link} href={h.invoice_pdf_url} target="_blank" rel="noreferrer">
                              Open
                            </a>
                          ) : (
                            <span className={baseStyles.muted}>{h?.invoice_pdf_ready ? "Preparing" : "—"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {grantModalOpen ? (
            <div className={styles.modalOverlay} onClick={closeGrantModal}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalTitle}>Grant credits</div>
                  <button type="button" className={styles.closeBtn} onClick={closeGrantModal} disabled={grantState.loading}>
                    Close
                  </button>
                </div>
                <div className={styles.modalBody}>
                  {grantState.error ? <div className={baseStyles.muted} style={{ marginBottom: 10 }}>{grantState.error}</div> : null}
                  {grantState.success ? <div className={baseStyles.muted} style={{ marginBottom: 10 }}>{grantState.success}</div> : null}

                  <div className={styles.formGrid}>
                    <div className={styles.formCol6}>
                      <div className={baseStyles.muted} style={{ marginBottom: 6, fontWeight: 900 }}>
                        Amount
                      </div>
                      <input
                        className={styles.input}
                        type="number"
                        min={1}
                        value={grantForm.amount}
                        onChange={(e) => setGrantForm((p) => ({ ...p, amount: e.target.value }))}
                        placeholder="e.g. 100"
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.closeBtn} onClick={closeGrantModal} disabled={grantState.loading}>
                    Cancel
                  </button>
                  <button type="button" className={baseStyles.smallBtn} onClick={doGrantCredits} disabled={grantState.loading || detailsState.loading}>
                    {grantState.loading ? "Granting…" : "Grant credits"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

 export default AdminUserDetailsPage;
