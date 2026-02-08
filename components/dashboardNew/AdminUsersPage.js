import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import API from "@/utils/api";
import { getAuthHeader, isAdminAuthenticated } from "@/utils/auth";
import baseStyles from "@/pages/settings/SettingsPage.module.css";
import styles from "./AdminUsersPage.module.css";

const SORT_BY_OPTIONS = [
  { value: "id", label: "ID" },
  { value: "email", label: "Email" },
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "role", label: "Role" },
  { value: "status", label: "Status" },
  { value: "created_at", label: "Created at" },
];

const toInitials = (nameOrEmail) => {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[1]?.[0] : "";
  return `${a}${b}`.toUpperCase();
};

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

  const hasPrev =
    typeof prevPageUrl === "string" ? Boolean(prevPageUrl) : safePage > 1;

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

const AdminUsersPage = () => {
  const router = useRouter();
  const [guardError, setGuardError] = useState("");

  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");

  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("desc");

  const [page, setPage] = useState(1);
  const perPage = 5;

  const listFetchSeqRef = useRef(0);
  const [listState, setListState] = useState({ loading: false, error: "", items: [], pagination: null });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      setGuardError("You do not have permission to access Admin Users.");
    } else {
      setGuardError("");
    }
  }, []);

  const fetchUsers = async ({ nextPage = page, nextQuery = query, nextSortBy = sortBy, nextSortDir = sortDir } = {}) => {
    const auth = getAuthHeader();
    if (!auth) {
      setListState({ loading: false, error: "Not authenticated.", items: [], pagination: null });
      return;
    }

    setListState((p) => ({ ...p, loading: true, error: "" }));
    const seq = ++listFetchSeqRef.current;

    try {
      const url = API.ADMIN_USERS({
        perPage,
        page: nextPage,
        sortBy: nextSortBy,
        sortDir: nextSortDir,
        q: nextQuery || undefined,
      });

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load users (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load users");

      if (seq !== listFetchSeqRef.current) return;

      const items = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.users)
          ? json.users
          : Array.isArray(json?.data?.items)
            ? json.data.items
            : Array.isArray(json?.data?.users)
              ? json.data.users
              : [];
      const normalized = normalizePagination({
        pagination: json?.pagination || json?.meta?.pagination || json?.meta || null,
        fallbackPage: nextPage,
        fallbackPerPage: perPage,
        itemCount: items.length,
      });

      setListState({ loading: false, error: "", items, pagination: normalized });

      if (normalized?.page && normalized.page !== nextPage) {
        setPage(normalized.page);
      }
    } catch (err) {
      if (seq !== listFetchSeqRef.current) return;
      setListState((p) => ({ ...p, loading: false, error: err?.message || "Failed to load users", items: [] }));
    }
  };

  useEffect(() => {
    fetchUsers({ nextPage: page });
  }, [page, sortBy, sortDir, query]);

  const listPaging = listState.pagination || {
    page,
    perPage,
    totalPages: null,
    total: null,
    hasNext: false,
    hasPrev: false,
    nextPageUrl: null,
    prevPageUrl: null,
  };
  const canListPrev = !listState.loading && (listPaging.hasPrev || (listPaging.page || 1) > 1);
  const canListNext =
    !listState.loading &&
    (listPaging.hasNext ||
      (listPaging.totalPages != null
        ? (listPaging.page || 1) < listPaging.totalPages
        : false));

  const handleApplySearch = () => {
    setPage(1);
    setQuery(queryDraft);
  };

  const handleClearSearch = () => {
    setQueryDraft("");
    setPage(1);
    setQuery("");
  };

  const doUpdateUser = async () => {
    if (!selectedUserId) return;
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

      const res = await fetch(API.ADMIN_USER_UPDATE(selectedUserId), {
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
      await fetchUserDetails(selectedUserId);
      await fetchUsers({ nextPage: page });
    } catch (err) {
      setUpdateState({ loading: false, error: err?.message || "Failed to update user", success: "" });
    }
  };

  const doGrantCredits = async () => {
    if (!selectedUserId) return;
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
      const res = await fetch(API.ADMIN_USER_GRANT_CREDITS(selectedUserId), {
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
      await fetchUserDetails(selectedUserId);
      await fetchUsers({ nextPage: page });
    } catch (err) {
      setGrantState({ loading: false, error: err?.message || "Failed to grant credits", success: "" });
    }
  };

  const doDeactivate = async () => {
    if (!selectedUserId) return;
    if (!window.confirm("Deactivate this user?")) return;

    const auth = getAuthHeader();
    if (!auth) {
      setUserActionState((p) => ({ ...p, error: "Not authenticated.", success: "" }));
      return;
    }

    setUserActionState({ deactivating: true, deleting: false, error: "", success: "" });

    try {
      const res = await fetch(API.ADMIN_USER_DEACTIVATE(selectedUserId), {
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
      await fetchUserDetails(selectedUserId);
      await fetchUsers({ nextPage: page });
    } catch (err) {
      setUserActionState({ deactivating: false, deleting: false, error: err?.message || "Failed to deactivate user", success: "" });
    }
  };

  const doDelete = async () => {
    if (!selectedUserId) return;
    if (!window.confirm("Delete this user? This cannot be undone.")) return;

    const auth = getAuthHeader();
    if (!auth) {
      setUserActionState((p) => ({ ...p, error: "Not authenticated.", success: "" }));
      return;
    }

    setUserActionState({ deactivating: false, deleting: true, error: "", success: "" });

    try {
      const res = await fetch(API.ADMIN_USER_DELETE(selectedUserId), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to delete user (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to delete user");

      setUserActionState({ deactivating: false, deleting: false, error: "", success: "User deleted." });

      setSelectedUserId(null);
      setDetailsState({ loading: false, error: "", data: null });
      setHistoryState({ loading: false, error: "", items: [], pagination: null });

      await fetchUsers({ nextPage: 1 });
      setPage(1);
    } catch (err) {
      setUserActionState({ deactivating: false, deleting: false, error: err?.message || "Failed to delete user", success: "" });
    }
  };

  if (guardError) {
    return (
      <div className={baseStyles.page}>
        <div className={baseStyles.card}>
          <div className={baseStyles.titleBlock}>
            <h1 className={baseStyles.title}>Admin Users</h1>
            <p className={baseStyles.subtitle}>{guardError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={baseStyles.page}>
      <div className={`${baseStyles.card} ${baseStyles.headerRow}`.trim()}>
        <div className={baseStyles.titleBlock}>
          <h1 className={baseStyles.title}>Admin Users Dashboard</h1>
          <p className={baseStyles.subtitle}>Search and manage users.</p>
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className={baseStyles.smallBtn}
              onClick={() => router.push("/admin/subscriptions/plans")}
            >
              Manage Subscription Plans
            </button>
          </div>
        </div>
      </div>

      <div className={baseStyles.card}>
          <div className={styles.tableControls}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>Users</div>
              <div className={baseStyles.muted} style={{ marginTop: 4 }}>
                {listState.loading
                  ? "Loading users…"
                  : listState.error
                    ? listState.error
                    : listPaging.total != null
                      ? `${listPaging.total} total users`
                      : ""}
              </div>
            </div>

            <div className={styles.filters}>
              <div className={styles.searchRow}>
                <input
                  className={styles.searchInput}
                  placeholder="Search by name/email/business…"
                  value={queryDraft}
                  onChange={(e) => setQueryDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplySearch();
                  }}
                />
                <button type="button" className={baseStyles.smallBtn} onClick={handleApplySearch} disabled={listState.loading}>
                  Search
                </button>
                <button type="button" className={baseStyles.smallBtn} onClick={handleClearSearch} disabled={listState.loading && !query}>
                  Clear
                </button>
              </div>

              <label className={baseStyles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                Sort
                <select className={baseStyles.select} value={sortBy} onChange={(e) => {
                  setPage(1);
                  setSortBy(e.target.value);
                }}>
                  {SORT_BY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={baseStyles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                Dir
                <select className={baseStyles.select} value={sortDir} onChange={(e) => {
                  setPage(1);
                  setSortDir(e.target.value);
                }}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </label>
            </div>

            <div className={baseStyles.pagination}>
              <span className={baseStyles.pageLabel}>
                Page {listPaging.page || 1}
                {listPaging.totalPages != null ? ` / ${listPaging.totalPages}` : ""}
                {listPaging.total != null ? ` • ${listPaging.total} total` : ""}
              </span>
              <button
                type="button"
                className={`${baseStyles.smallBtn} ${canListPrev ? "" : baseStyles.btnDisabled}`.trim()}
                onClick={() => setPage(Math.max(1, (listPaging.page || 1) - 1))}
                disabled={!canListPrev}
              >
                Prev
              </button>
              <button
                type="button"
                className={`${baseStyles.smallBtn} ${canListNext ? "" : baseStyles.btnDisabled}`.trim()}
                onClick={() => setPage((listPaging.page || 1) + 1)}
                disabled={!canListNext}
              >
                Next
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12 }} className={baseStyles.tableWrap}>
            <table className={baseStyles.table}>
              <thead>
                <tr>
                  <th className={baseStyles.th}>User</th>
                  <th className={baseStyles.th}>Role</th>
                  <th className={baseStyles.th}>Status</th>
                  <th className={baseStyles.th}>Credits</th>
                  <th className={baseStyles.th}>Subscription</th>
                  <th className={baseStyles.th}>Last activity</th>
                  <th className={baseStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listState.loading ? (
                  <tr>
                    <td className={baseStyles.td} colSpan={7}>
                      <span className={baseStyles.muted}>Loading…</span>
                    </td>
                  </tr>
                ) : listState.error ? (
                  <tr>
                    <td className={baseStyles.td} colSpan={7}>
                      <span className={baseStyles.muted}>{listState.error}</span>
                      <div style={{ marginTop: 10 }}>
                        <button type="button" className={baseStyles.smallBtn} onClick={() => fetchUsers({ nextPage: page })}>
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : !listState.items.length ? (
                  <tr>
                    <td className={baseStyles.td} colSpan={7}>
                      <span className={baseStyles.muted}>No users found.</span>
                    </td>
                  </tr>
                ) : (
                  listState.items.map((u) => {
                    const name = [u?.first_name, u?.last_name].filter(Boolean).join(" ") || u?.business_name || u?.email || "User";
                    const creditsRemaining = u?.credits?.credits_remaining ?? "—";
                    const planRaw = u?.subscription?.plan;
                    const plan =
                      typeof planRaw === "object" && planRaw
                        ? planRaw?.name ?? planRaw?.title ?? "—"
                        : planRaw || "—";
                    const lastAct = u?.last_activity;

                    return (
                      <tr key={u?.id} className={baseStyles.tr}>
                        <td className={baseStyles.td}>
                          <div className={styles.userCell}>
                            <div className={styles.avatar}>
                              {u?.profile_picture ? (
                                <img src={u.profile_picture} alt={name} />
                              ) : (
                                <span style={{ fontWeight: 950, color: "rgba(255,255,255,0.85)" }}>{toInitials(name)}</span>
                              )}
                            </div>
                            <div className={styles.userMain}>
                              <div className={styles.userName} title={name}>
                                {name}
                              </div>
                              <div className={styles.userEmail} title={u?.email}>
                                {safeText(u?.email)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={baseStyles.td}>{safeText(u?.role)}</td>
                        <td className={baseStyles.td}>{safeText(u?.status)}</td>
                        <td className={baseStyles.td}>{safeText(creditsRemaining)}</td>
                        <td className={baseStyles.td}>
                          <div style={{ fontWeight: 900 }}>{safeText(plan)}</div>
                          <div className={baseStyles.muted} style={{ marginTop: 4 }}>
                            {u?.subscription?.active ? "Active" : "Inactive"}
                          </div>
                        </td>
                        <td className={baseStyles.td}>
                          {lastAct ? (
                            <div>
                              <div style={{ fontWeight: 900 }}>{safeText(lastAct?.tool_name || lastAct?.tool_key)}</div>
                              <div className={baseStyles.muted} style={{ marginTop: 4 }}>
                                {formatDateTime(lastAct?.occurred_at)}
                              </div>
                            </div>
                          ) : (
                            <span className={baseStyles.muted}>—</span>
                          )}
                        </td>
                        <td className={baseStyles.td}>
                          <button
                            type="button"
                            className={baseStyles.smallBtn}
                            onClick={() => {
                              router.push(`/admin/users/${u?.id}/dashboard`);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
