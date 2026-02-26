import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import API from "@/utils/api";
import { getAuthHeader, isAdminAuthenticated } from "@/utils/auth";
import baseStyles from "@/pages/settings/SettingsPage.module.css";
import planStyles from "./AdminSubscriptionPlansPage.module.css";
import detailStyles from "./AdminUserDetailsPage.module.css";

const safeText = (v) => {
  if (v == null) return "—";
  const s = String(v);
  return s.trim() ? s : "—";
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return safeText(value);
  return d.toLocaleString();
};

const normalizePlanResponse = (json) => {
  const plan = json?.plan || json?.data?.plan || json?.data || json?.item || null;
  if (!plan) return null;
  return {
    id: plan.id ?? null,
    name: plan.name ?? "",
    billing_period: plan.billing_period ?? "",
    credits: plan.credits ?? null,
    description: plan.description ?? "",
    is_active: !!plan.is_active,
    created_at: plan.created_at ?? null,
    updated_at: plan.updated_at ?? null,
    prices: Array.isArray(plan.prices) ? plan.prices : [],
  };
};

const AdminSubscriptionPlanViewPage = () => {
  const router = useRouter();
  const { id } = router.query || {};

  const [guardError, setGuardError] = useState("");

  const [planState, setPlanState] = useState({ loading: false, error: "", plan: null });
  const planFetchSeqRef = useRef(0);

  const [countriesState, setCountriesState] = useState({ loading: false, error: "", items: [] });

  const [syncForm, setSyncForm] = useState({ countryCodes: [], price: "" });
  const [syncState, setSyncState] = useState({ loading: false, error: "", success: "" });
  const [countryToAdd, setCountryToAdd] = useState("");
  const countrySelectTouchedRef = useRef(false);

  const countryLabelByCode = (code) => {
    const raw = String(code || "").trim();
    if (!raw) return "—";
    const hit = (countriesState.items || []).find((c) => String(c?.code || "").toUpperCase() === raw.toUpperCase());
    const name = hit?.name ? safeText(hit.name) : "";
    const cc = hit?.code ? safeText(hit.code) : safeText(raw);
    return name ? `${name} (${cc})` : cc;
  };

  const toggleCountryCode = (code) => {
    if (!code) return;
    countrySelectTouchedRef.current = true;
    setSyncForm((p) => {
      const exists = (p.countryCodes || []).includes(code);
      return {
        ...p,
        countryCodes: exists ? p.countryCodes.filter((c) => c !== code) : [...(p.countryCodes || []), code],
      };
    });
  };

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      setGuardError("You do not have permission to access Subscription Plans.");
    } else {
      setGuardError("");
    }
  }, []);

  const fetchPlanDetails = async (planId) => {
    if (!planId) return;
    const auth = getAuthHeader();
    setPlanState((p) => ({ ...p, loading: true, error: "" }));
    const seq = ++planFetchSeqRef.current;
    try {
      const res = await fetch(API.ADMIN_SUBSCRIPTION_PLAN_DETAILS(planId), {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(auth ? { Authorization: auth } : {}),
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load plan (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load plan");
      if (seq !== planFetchSeqRef.current) return;
      const plan = normalizePlanResponse(json);
      setPlanState({ loading: false, error: "", plan });
    } catch (err) {
      if (seq !== planFetchSeqRef.current) return;
      setPlanState({ loading: false, error: err?.message || "Failed to load plan", plan: null });
    }
  };

  const fetchCountries = async () => {
    const auth = getAuthHeader();
    setCountriesState((p) => ({ ...p, loading: true, error: "" }));
    try {
      const res = await fetch(API.COUNTRIES, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(auth ? { Authorization: auth } : {}),
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load countries (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load countries");
      const raw = Array.isArray(json?.countries) ? json.countries : Array.isArray(json?.data?.countries) ? json.data.countries : [];
      setCountriesState({ loading: false, error: "", items: raw });
    } catch (err) {
      setCountriesState({ loading: false, error: err?.message || "Failed to load countries", items: [] });
    }
  };

  const isActive = (v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (v == null) return false;
    const s = String(v).trim().toLowerCase();
    if (!s) return false;
    return s === "1" || s === "true" || s === "yes" || s === "active";
  };

  useEffect(() => {
    if (guardError) return;
    if (!router.isReady || !id) return;
    fetchPlanDetails(id);
    fetchCountries();
  }, [guardError, router.isReady, id]);

  useEffect(() => {
    if (!planState.plan) return;
    if (countrySelectTouchedRef.current) return;
    const existingCodes = (planState.plan.prices || [])
      .filter((p) => isActive(p?.is_active))
      .map((p) => p?.country_code)
      .filter(Boolean);
    if (!existingCodes.length) return;
    setSyncForm((p) => ({ ...p, countryCodes: existingCodes }));
  }, [planState.plan]);

  const onSubmitSync = async (e) => {
    e?.preventDefault?.();
    setSyncState({ loading: false, error: "", success: "" });

    const codes = Array.isArray(syncForm.countryCodes) ? syncForm.countryCodes.filter(Boolean) : [];
    const priceNum = Number(syncForm.price);
    if (!codes.length) {
      setSyncState({ loading: false, error: "Select at least one country.", success: "" });
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setSyncState({ loading: false, error: "Price must be greater than 0.", success: "" });
      return;
    }

    const auth = getAuthHeader();
    if (!auth) {
      setSyncState({ loading: false, error: "Not authenticated.", success: "" });
      return;
    }

    setSyncState({ loading: true, error: "", success: "" });
    try {
      const res = await fetch(API.ADMIN_SUBSCRIPTION_PLAN_SYNC_PRICES(id), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country_codes: codes, price: priceNum }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to sync prices (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to sync prices");

      setSyncState({ loading: false, error: "", success: "Plan prices synced." });
      countrySelectTouchedRef.current = false;
      setSyncForm({ countryCodes: [], price: "" });
      await fetchPlanDetails(id);
    } catch (err) {
      setSyncState({ loading: false, error: err?.message || "Failed to sync prices", success: "" });
    }
  };

  if (guardError) {
    return (
      <div className={baseStyles.page}>
        <div className={baseStyles.card}>
          <div className={baseStyles.titleBlock}>
            <h1 className={baseStyles.title}>Plan Details</h1>
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
          <h1 className={baseStyles.title}>Plan Details</h1>
          <p className={baseStyles.subtitle}>View plan information and manage country-specific prices.</p>
        </div>
      </div>

      <div className={baseStyles.card}>
        <div className={detailStyles.sectionHeader}>
          <div>
            <div className={detailStyles.sectionHeading}>Overview</div>
            <div className={baseStyles.muted} style={{ marginTop: 4 }}>
              {planState.loading
                ? "Loading plan…"
                : planState.error
                  ? planState.error
                  : planState.plan
                    ? `#${safeText(planState.plan.id)} • ${safeText(planState.plan.name)}`
                    : "—"}
            </div>
          </div>

          <div className={detailStyles.actionsRow}>
            {planState.plan ? (
              <span
                className={`${baseStyles.badge} ${planState.plan.is_active ? baseStyles.badgeGreen : baseStyles.badgeRed}`.trim()}
              >
                {planState.plan.is_active ? "Active" : "Inactive"}
              </span>
            ) : null}
            <button type="button" className={baseStyles.smallBtn} onClick={() => router.push("/admin/subscriptions/plans")}>
              Back
            </button>
            <button type="button" className={baseStyles.smallBtn} onClick={() => fetchPlanDetails(id)} disabled={planState.loading}>
              Refresh
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {planState.loading ? (
            <div className={baseStyles.muted}>Loading…</div>
          ) : planState.error ? (
            <div className={baseStyles.muted}>{planState.error}</div>
          ) : !planState.plan ? (
            <div className={baseStyles.muted}>No data.</div>
          ) : (
            <div className={detailStyles.split2}>
              <div className={detailStyles.subBlock}>
                <div className={detailStyles.subTitle}>Plan</div>
                <div className={detailStyles.kv}>
                  <div className={detailStyles.k}>Name</div>
                  <div className={detailStyles.v}>{safeText(planState.plan.name)}</div>
                </div>
                <div className={detailStyles.kv}>
                  <div className={detailStyles.k}>Billing period</div>
                  <div className={detailStyles.v}>{safeText(planState.plan.billing_period)}</div>
                </div>
                <div className={detailStyles.kv}>
                  <div className={detailStyles.k}>Credits</div>
                  <div className={detailStyles.v}>{safeText(planState.plan.credits)}</div>
                </div>
                <div className={detailStyles.kv}>
                  <div className={detailStyles.k}>Created</div>
                  <div className={detailStyles.v}>{formatDateTime(planState.plan.created_at)}</div>
                </div>
                <div className={detailStyles.kv}>
                  <div className={detailStyles.k}>Updated</div>
                  <div className={detailStyles.v}>{formatDateTime(planState.plan.updated_at)}</div>
                </div>
              </div>
              <div className={detailStyles.subBlock}>
                <div className={detailStyles.subTitle}>Description</div>
                <div className={baseStyles.muted}>{safeText(planState.plan.description)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={baseStyles.card}>
        <div className={detailStyles.sectionHeader}>
          <div>
            <div className={detailStyles.sectionHeading}>Manage Plan Prices by Country</div>
            <div className={baseStyles.muted} style={{ marginTop: 4 }}>
              {countriesState.loading ? "Loading countries…" : countriesState.error ? countriesState.error : `${countriesState.items.length} countries`}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmitSync} style={{ marginTop: 12 }}>
          <div className={planStyles.formGrid}>
            <label className={planStyles.field}>
              <span className={baseStyles.muted}>Countries</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
                <select
                  className={baseStyles.select}
                  value={countryToAdd}
                  onChange={(e) => setCountryToAdd(e.target.value)}
                  disabled={countriesState.loading}
                >
                  <option value="">Select a country…</option>
                  {countriesState.items.map((c) => (
                    <option
                      key={c.code}
                      value={c.code}
                      disabled={(syncForm.countryCodes || []).includes(c.code)}
                    >
                      {`${(syncForm.countryCodes || []).includes(c.code) ? "✓ " : ""}${safeText(c.name)} (${safeText(c.code)} - ${safeText(c.currency)})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={baseStyles.smallBtn}
                  onClick={() => {
                    if (!countryToAdd) return;
                    toggleCountryCode(countryToAdd);
                    setCountryToAdd("");
                  }}
                  disabled={!countryToAdd || countriesState.loading || (syncForm.countryCodes || []).includes(countryToAdd)}
                >
                  Add
                </button>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(Array.isArray(syncForm.countryCodes) ? syncForm.countryCodes : []).length ? (
                  (syncForm.countryCodes || []).map((code) => (
                    <button
                      key={code}
                      type="button"
                      className={baseStyles.badge}
                      onClick={() => toggleCountryCode(code)}
                      title="Remove"
                      style={{ cursor: "pointer" }}
                    >
                      {countryLabelByCode(code)} ×
                    </button>
                  ))
                ) : (
                  <span className={baseStyles.muted}>No countries selected.</span>
                )}
              </div>
            </label>

            <label className={planStyles.field}>
              <span className={baseStyles.muted}>Price</span>
              <input
                className={baseStyles.input}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                value={syncForm.price}
                onChange={(e) => setSyncForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="600"
              />
            </label>
          </div>

          <div className={planStyles.actionsRow}>
            <button type="submit" className={baseStyles.smallBtn} disabled={syncState.loading}>
              {syncState.loading ? "Saving…" : "Save"}
            </button>
            {!!syncState.error && <span className={baseStyles.muted}>{syncState.error}</span>}
            {!!syncState.success && <span className={baseStyles.muted}>{syncState.success}</span>}
          </div>
        </form>
      </div>

      <div className={baseStyles.card}>
        <div className={detailStyles.sectionHeader}>
          <div>
            <div className={detailStyles.sectionHeading}>Existing Prices</div>
            <div className={baseStyles.muted} style={{ marginTop: 4 }}>
              {planState.loading
                ? "Loading…"
                : planState.error
                  ? planState.error
                  : planState.plan
                    ? `${((planState.plan.prices || []).filter((pr) => isActive(pr?.is_active)).length)} price records`
                    : "—"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }} className={baseStyles.tableWrap}>
          <table className={baseStyles.table}>
            <thead>
              <tr>
                <th className={baseStyles.th}>Country Code</th>
                <th className={baseStyles.th}>Currency</th>
                <th className={baseStyles.th}>Price</th>
                <th className={baseStyles.th}>PayPal Plan ID</th>
                <th className={baseStyles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!planState.plan || !((planState.plan.prices || []).some((pr) => isActive(pr?.is_active))) ? (
                <tr>
                  <td className={baseStyles.td} colSpan={5}>
                    <span className={baseStyles.muted}>No prices yet.</span>
                  </td>
                </tr>
              ) : (
                planState.plan.prices.filter((pr) => isActive(pr?.is_active)).map((pr) => (
                  <tr key={pr.id ?? `${pr.country_code}-${pr.currency}`} className={baseStyles.tr}>
                    <td className={baseStyles.td}>{safeText(pr.country_code)}</td>
                    <td className={baseStyles.td}>{safeText(pr.currency)}</td>
                    <td className={baseStyles.td}>{safeText(pr.price)}</td>
                    <td className={baseStyles.td}>{safeText(pr.paypal_plan_id)}</td>
                    <td className={baseStyles.td}>{isActive(pr?.is_active) ? "Active" : "Inactive"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionPlanViewPage;
