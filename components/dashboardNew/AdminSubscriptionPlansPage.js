import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import API from "@/utils/api";
import { getAuthHeader, isAdminAuthenticated } from "@/utils/auth";
import baseStyles from "@/pages/settings/SettingsPage.module.css";
import styles from "./AdminSubscriptionPlansPage.module.css";

const safeText = (v) => {
  if (v == null) return "—";
  const s = String(v);
  return s.trim() ? s : "—";
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
  };
};

const asBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  return s === "1" || s === "true" || s === "yes" || s === "active";
};

const normalizePlan = (p) => {
  if (!p || typeof p !== "object") return null;
  return {
    id: p.id ?? p.plan_id ?? null,
    name: p.name ?? "",
    billing_period: p.billing_period ?? "",
    credits: p.credits ?? "",
    description: p.description ?? "",
    is_active: asBool(p.is_active ?? p.active),
    price: typeof p.price === "object" && p.price ? p.price : null,
  };
};

const AdminSubscriptionPlansPage = () => {
  const router = useRouter();
  const [guardError, setGuardError] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [appliedCountry, setAppliedCountry] = useState("");
  const [countriesState, setCountriesState] = useState({ loading: false, error: "", items: [] });

  const [listState, setListState] = useState({ loading: false, error: "", items: [], pagination: null });
  const listFetchSeqRef = useRef(0);

  const [form, setForm] = useState({
    id: null,
    name: "",
    billing_period: "monthly",
    credits: "",
    description: "",
  });

  const [saveState, setSaveState] = useState({ loading: false, error: "", success: "" });
  const [deleteState, setDeleteState] = useState({ loadingId: null, error: "", success: "" });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      setGuardError("You do not have permission to access Subscription Plans.");
    } else {
      setGuardError("");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchCountries = async () => {
      setCountriesState({ loading: true, error: "", items: [] });
      try {
        const res = await fetch(API.COUNTRIES, { method: "GET", headers: { Accept: "application/json" } });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || `Failed to load countries (${res.status})`);
        if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load countries");
        const items = Array.isArray(json?.countries) ? json.countries : [];
        if (!cancelled) setCountriesState({ loading: false, error: "", items });
      } catch (e) {
        if (!cancelled) setCountriesState({ loading: false, error: e?.message || "Failed to load countries", items: [] });
      }
    };

    fetchCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPlans = async ({ nextPage = page, nextPerPage = perPage, nextCountry = appliedCountry } = {}) => {
    const auth = getAuthHeader();

    setListState((p) => ({ ...p, loading: true, error: "" }));
    const seq = ++listFetchSeqRef.current;

    try {
      const url = API.ADMIN_SUBSCRIPTION_PLANS({ perPage: nextPerPage, page: nextPage, countryCode: nextCountry || undefined });
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(auth ? { Authorization: auth } : {}),
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load plans (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load plans");

      if (seq !== listFetchSeqRef.current) return;

      const rawPlans = Array.isArray(json?.plans)
        ? json.plans
        : Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data?.plans)
            ? json.data.plans
            : Array.isArray(json?.data?.items)
              ? json.data.items
              : [];

      const items = rawPlans.map(normalizePlan).filter(Boolean);

      const normalized = normalizePagination({
        pagination: json?.pagination || json?.meta?.pagination || json?.meta || null,
        fallbackPage: nextPage,
        fallbackPerPage: nextPerPage,
        itemCount: items.length,
      });

      setListState({ loading: false, error: "", items, pagination: normalized });
      setPage(normalized.page);
      setPerPage(normalized.perPage);
    } catch (err) {
      if (seq !== listFetchSeqRef.current) return;
      setListState({ loading: false, error: err?.message || "Failed to load plans", items: [], pagination: null });
    }
  };

  useEffect(() => {
    if (guardError) return;
    fetchPlans({ nextPage: page, nextPerPage: perPage, nextCountry: appliedCountry });
  }, [guardError]);

  useEffect(() => {
    if (guardError) return;
    fetchPlans({ nextPage: page, nextPerPage: perPage, nextCountry: appliedCountry });
  }, [page, perPage, appliedCountry]);

  const isEditing = useMemo(() => form.id != null, [form.id]);

  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      billing_period: "monthly",
      credits: "",
      description: "",
    });
    setSaveState({ loading: false, error: "", success: "" });
  };

  const applyPlanToForm = (plan) => {
    setSaveState({ loading: false, error: "", success: "" });
    setForm({
      id: plan?.id ?? null,
      name: plan?.name ?? "",
      billing_period: plan?.billing_period ?? "monthly",
      credits: plan?.credits ?? "",
      description: plan?.description ?? "",
    });
  };

  const validateForm = () => {
    const name = String(form.name || "").trim();
    const billingPeriod = String(form.billing_period || "").trim();
    const creditsNum = Number(form.credits);
    const description = String(form.description || "").trim();

    if (!name) return "Name is required.";
    if (!billingPeriod) return "Billing period is required.";
    if (!Number.isFinite(creditsNum) || creditsNum < 0) return "Credits must be a valid number >= 0.";
    if (!description) return "Description is required.";

    return "";
  };

  const savePlan = async (e) => {
    e?.preventDefault?.();

    if (!isAdminAuthenticated()) {
      setSaveState({ loading: false, error: "You do not have permission.", success: "" });
      return;
    }

    const auth = getAuthHeader();
    if (!auth) {
      setSaveState({ loading: false, error: "Not authenticated.", success: "" });
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setSaveState({ loading: false, error: validationError, success: "" });
      return;
    }

    setSaveState({ loading: true, error: "", success: "" });

    const body = {
      name: String(form.name || "").trim(),
      billing_period: String(form.billing_period || "").trim(),
      credits: Number(form.credits),
      description: String(form.description || "").trim(),
    };

    try {
      const url = isEditing
        ? API.ADMIN_SUBSCRIPTION_PLANS_UPDATE(form.id)
        : API.ADMIN_SUBSCRIPTION_PLANS_CREATE;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to save plan (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to save plan");

      setSaveState({ loading: false, error: "", success: isEditing ? "Plan updated." : "Plan created." });
      await fetchPlans({ nextPage: page, nextPerPage: perPage, nextCountry: appliedCountry });
      resetForm();
    } catch (err) {
      setSaveState({ loading: false, error: err?.message || "Failed to save plan", success: "" });
    }
  };

  const deletePlan = async (planId) => {
    if (!planId) return;
    if (!window.confirm("Delete this plan?")) return;

    if (!isAdminAuthenticated()) {
      setDeleteState({ loadingId: null, error: "You do not have permission.", success: "" });
      return;
    }

    const auth = getAuthHeader();
    if (!auth) {
      setDeleteState({ loadingId: null, error: "Not authenticated.", success: "" });
      return;
    }

    setDeleteState({ loadingId: planId, error: "", success: "" });

    try {
      const res = await fetch(API.ADMIN_SUBSCRIPTION_PLANS_DELETE(planId), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to delete plan (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to delete plan");

      setDeleteState({ loadingId: null, error: "", success: "Plan deleted." });
      await fetchPlans();

      if (String(form.id) === String(planId)) {
        resetForm();
      }
    } catch (err) {
      setDeleteState({ loadingId: null, error: err?.message || "Failed to delete plan", success: "" });
    }
  };

  if (guardError) {
    return (
      <div className={baseStyles.page}>
        <div className={baseStyles.card}>
          <div className={baseStyles.titleBlock}>
            <h1 className={baseStyles.title}>Subscription Plans</h1>
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
          <h1 className={baseStyles.title}>Manage Subscription Plans</h1>
          <p className={baseStyles.subtitle}>Create, edit, and delete subscription plans.</p>
        </div>
      </div>

      <div className={baseStyles.card}>
        <div className={styles.tableControls}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{isEditing ? "Edit plan" : "Create plan"}</div>
            <div className={baseStyles.muted} style={{ marginTop: 4 }}>
              {isEditing ? `Editing plan #${safeText(form.id)}` : "Fill the form and click Save."}
            </div>
          </div>
        </div>

        <form onSubmit={savePlan} style={{ marginTop: 12 }}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={baseStyles.muted}>Name</span>
              <input
                className={baseStyles.input}
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Starter"
              />
            </label>

            <label className={styles.field}>
              <span className={baseStyles.muted}>Billing period</span>
              <select
                className={baseStyles.select}
                required
                value={form.billing_period}
                onChange={(e) => setForm((p) => ({ ...p, billing_period: e.target.value }))}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={baseStyles.muted}>Credits</span>
              <input
                className={baseStyles.input}
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                required
                value={form.credits}
                onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))}
                placeholder="200"
              />
            </label>

            <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
              <span className={baseStyles.muted}>Description</span>
              <textarea
                className={baseStyles.textarea}
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description of the plan"
              />
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button type="submit" className={baseStyles.smallBtn} disabled={saveState.loading}>
              {saveState.loading ? "Saving…" : "Save"}
            </button>
            <button type="button" className={baseStyles.smallBtn} onClick={resetForm} disabled={saveState.loading}>
              {isEditing ? "Cancel edit" : "Reset"}
            </button>
            <button type="button" className={baseStyles.smallBtn} onClick={fetchPlans} disabled={listState.loading}>
              Refresh
            </button>

            {!!saveState.error && <span className={baseStyles.muted}>{saveState.error}</span>}
            {!!saveState.success && <span className={baseStyles.muted}>{saveState.success}</span>}
          </div>
        </form>
      </div>

      <div className={baseStyles.card}>
        <div className={styles.tableControls}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14 }}>Plans</div>
            <div className={baseStyles.muted} style={{ marginTop: 4 }}>
              {listState.loading
                ? "Loading plans…"
                : listState.error
                  ? listState.error
                  : `${listState.items.length} plans`}
            </div>
          </div>

          <div className={styles.actionsRow} style={{ marginTop: 0 }}>
            <label className={baseStyles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              Country
              <select
                className={baseStyles.select}
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="">All</option>
                {(Array.isArray(countriesState.items) ? countriesState.items : []).map((c) => (
                  <option key={String(c?.code || "")} value={String(c?.code || "")}>
                    {String(c?.code || "").toUpperCase()} - {safeText(c?.name)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={baseStyles.filterBtn}
                onClick={() => {
                  setAppliedCountry(selectedCountry);
                  setPage(1);
                }}
                title="Apply country filter"
              >
                Apply
              </button>
              <button
                type="button"
                className={baseStyles.filterBtn}
                onClick={() => {
                  setSelectedCountry("");
                  setAppliedCountry("");
                  setPage(1);
                }}
                title="Reset country filter"
              >
                Reset
              </button>
            </label>

            <label className={baseStyles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              Per page
              <select
                className={baseStyles.select}
                value={perPage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  const safe = Number.isFinite(next) && next > 0 ? next : 15;
                  setPage(1);
                  setPerPage(safe);
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>

            <button
              type="button"
              className={`${baseStyles.smallBtn} ${listState.loading ? baseStyles.btnDisabled : ""}`.trim()}
              onClick={() => fetchPlans({ nextPage: page, nextPerPage: perPage, nextCountry: appliedCountry })}
              disabled={listState.loading}
            >
              Refresh
            </button>

            {!!deleteState.error && <span className={baseStyles.muted}>{deleteState.error}</span>}
            {!!deleteState.success && <span className={baseStyles.muted}>{deleteState.success}</span>}
          </div>
        </div>

        <div style={{ marginTop: 12 }} className={baseStyles.tableWrap}>
          <table className={baseStyles.table}>
            <thead>
              <tr>
                <th className={baseStyles.th}>Plan</th>
                <th className={baseStyles.th}>Credits</th>
                <th className={baseStyles.th}>Billing</th>
                {appliedCountry ? <th className={baseStyles.th}>Price</th> : null}
                <th className={baseStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listState.loading ? (
                <tr>
                  <td className={baseStyles.td} colSpan={4 + (appliedCountry ? 1 : 0)}>
                    <span className={baseStyles.muted}>Loading…</span>
                  </td>
                </tr>
              ) : listState.error ? (
                <tr>
                  <td className={baseStyles.td} colSpan={4 + (appliedCountry ? 1 : 0)}>
                    <span className={baseStyles.muted}>{listState.error}</span>
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className={baseStyles.smallBtn} onClick={fetchPlans}>
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : !listState.items.length ? (
                <tr>
                  <td className={baseStyles.td} colSpan={4 + (appliedCountry ? 1 : 0)}>
                    <span className={baseStyles.muted}>No plans found.</span>
                  </td>
                </tr>
              ) : (
                listState.items.map((p) => (
                  <tr key={p.id ?? `${p.name}-${p.billing_period}`} className={`${baseStyles.tr}`.trim()}>
                    <td className={baseStyles.td}>
                      <div className={styles.planName}>{safeText(p.name)}</div>
                      <div className={styles.muted} style={{ marginTop: 4 }}>
                        {safeText(p.description)}
                      </div>
                    </td>
                    <td className={baseStyles.td}>{safeText(p.credits)}</td>
                    <td className={baseStyles.td}>{safeText(p.billing_period)}</td>
                    {appliedCountry ? (
                      <td className={baseStyles.td}>
                        {(() => {
                          const price = p.price || null;
                          const isIN = String(appliedCountry || "").trim().toUpperCase() === "IN";
                          const val = price ? (isIN ? price.amount_inr : price.amount) : null;
                          return safeText(val);
                        })()}
                      </td>
                    ) : null}
                    <td className={baseStyles.td}>
                      <div className={styles.actionsRow} style={{ marginTop: 0 }}>
                        <button type="button" className={baseStyles.smallBtn} onClick={() => router.push(`/admin/subscriptions/plans/${p.id}`)}>
                          View
                        </button>
                        <button type="button" className={baseStyles.smallBtn} onClick={() => applyPlanToForm(p)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className={baseStyles.smallBtn}
                          onClick={() => deletePlan(p.id)}
                          disabled={deleteState.loadingId != null}
                        >
                          {deleteState.loadingId != null && String(deleteState.loadingId) === String(p.id)
                            ? "Deleting…"
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(() => {
          const paging = listState.pagination || { page, perPage, totalPages: null, total: null, hasNext: false, hasPrev: false };
          const canPrev = !listState.loading && (paging.hasPrev || (paging.page || 1) > 1);
          const canNext =
            !listState.loading && (paging.hasNext || (paging.totalPages != null ? (paging.page || 1) < paging.totalPages : false));

          return (
            <div className={baseStyles.pagination} style={{ marginTop: 12 }}>
              <span className={baseStyles.pageLabel}>
                Page {paging.page || 1}
                {paging.totalPages != null ? ` / ${paging.totalPages}` : ""}
                {paging.total != null ? ` • ${paging.total} total` : ""}
              </span>

              <button
                type="button"
                className={`${baseStyles.smallBtn} ${canPrev ? "" : baseStyles.btnDisabled}`.trim()}
                onClick={() => setPage(Math.max(1, (paging.page || 1) - 1))}
                disabled={!canPrev}
              >
                Prev
              </button>
              <button
                type="button"
                className={`${baseStyles.smallBtn} ${canNext ? "" : baseStyles.btnDisabled}`.trim()}
                onClick={() => setPage((paging.page || 1) + 1)}
                disabled={!canNext}
              >
                Next
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default AdminSubscriptionPlansPage;
