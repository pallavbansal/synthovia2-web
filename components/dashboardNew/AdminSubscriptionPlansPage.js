import { useEffect, useMemo, useRef, useState } from "react";
import API from "@/utils/api";
import { getAuthHeader, isAdminAuthenticated } from "@/utils/auth";
import baseStyles from "@/pages/settings/SettingsPage.module.css";
import styles from "./AdminSubscriptionPlansPage.module.css";

const safeText = (v) => {
  if (v == null) return "—";
  const s = String(v);
  return s.trim() ? s : "—";
};

const normalizePlan = (p) => {
  if (!p || typeof p !== "object") return null;
  const priceUsd = p.price_usd ?? p.usd_price ?? p.priceUSD ?? null;
  const priceInr = p.price_inr ?? p.inr_price ?? p.priceINR ?? null;
  const fallbackPrice = p.price ?? null;
  return {
    id: p.id ?? p.plan_id ?? null,
    name: p.name ?? "",
    price_usd: priceUsd != null ? priceUsd : fallbackPrice,
    price_inr: priceInr != null ? priceInr : fallbackPrice,
    billing_period: p.billing_period ?? "",
    credits: p.credits ?? "",
    description: p.description ?? "",
    paypal_plan_id: p.paypal_plan_id ?? p.paypalPlanId ?? "",
  };
};

const AdminSubscriptionPlansPage = () => {
  const [guardError, setGuardError] = useState("");

  const [listState, setListState] = useState({ loading: false, error: "", items: [] });
  const listFetchSeqRef = useRef(0);

  const [form, setForm] = useState({
    id: null,
    name: "",
    price_usd: "",
    price_inr: "",
    billing_period: "monthly",
    credits: "",
    description: "",
    paypal_plan_id: "",
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

  const fetchPlans = async () => {
    const auth = getAuthHeader();

    setListState((p) => ({ ...p, loading: true, error: "" }));
    const seq = ++listFetchSeqRef.current;

    try {
      const res = await fetch(API.SUBSCRIPTION_PLANS, {
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
      setListState({ loading: false, error: "", items });
    } catch (err) {
      if (seq !== listFetchSeqRef.current) return;
      setListState({ loading: false, error: err?.message || "Failed to load plans", items: [] });
    }
  };

  useEffect(() => {
    if (guardError) return;
    fetchPlans();
  }, [guardError]);

  const isEditing = useMemo(() => form.id != null, [form.id]);

  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      price_usd: "",
      price_inr: "",
      billing_period: "monthly",
      credits: "",
      description: "",
      paypal_plan_id: "",
    });
    setSaveState({ loading: false, error: "", success: "" });
  };

  const applyPlanToForm = (plan) => {
    setSaveState({ loading: false, error: "", success: "" });
    setForm({
      id: plan?.id ?? null,
      name: plan?.name ?? "",
      price_usd: plan?.price_usd ?? "",
      price_inr: plan?.price_inr ?? "",
      billing_period: plan?.billing_period ?? "monthly",
      credits: plan?.credits ?? "",
      description: plan?.description ?? "",
      paypal_plan_id: plan?.paypal_plan_id ?? "",
    });
  };

  const validateForm = () => {
    const name = String(form.name || "").trim();
    const billingPeriod = String(form.billing_period || "").trim();
    const priceUsdNum = Number(form.price_usd);
    const priceInrNum = Number(form.price_inr);
    const creditsNum = Number(form.credits);

    if (!name) return "Name is required.";
    if (!billingPeriod) return "Billing period is required.";
    if (!Number.isFinite(priceUsdNum) || priceUsdNum < 0) return "USD price must be a valid number >= 0.";
    if (!Number.isFinite(priceInrNum) || priceInrNum < 0) return "INR price must be a valid number >= 0.";
    if (!Number.isFinite(creditsNum) || creditsNum < 0) return "Credits must be a valid number >= 0.";

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
      price_usd: Number(form.price_usd),
      price_inr: Number(form.price_inr),
      billing_period: String(form.billing_period || "").trim(),
      credits: Number(form.credits),
      description: String(form.description || "").trim(),
      paypal_plan_id: String(form.paypal_plan_id || "").trim(),
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
      await fetchPlans();
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
              <span className={baseStyles.muted}>Price (USD)</span>
              <input
                className={baseStyles.input}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={form.price_usd}
                onChange={(e) => setForm((p) => ({ ...p, price_usd: e.target.value }))}
                placeholder="9.99"
              />
            </label>

            <label className={styles.field}>
              <span className={baseStyles.muted}>Price (INR)</span>
              <input
                className={baseStyles.input}
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                required
                value={form.price_inr}
                onChange={(e) => setForm((p) => ({ ...p, price_inr: e.target.value }))}
                placeholder="499"
              />
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
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description of the plan"
              />
            </label>

            <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
              <span className={baseStyles.muted}>PayPal plan id</span>
              <input
                className={baseStyles.input}
                type="text"
                value={form.paypal_plan_id}
                onChange={(e) => setForm((p) => ({ ...p, paypal_plan_id: e.target.value }))}
                placeholder="P-XXXXXXXX"
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
              {listState.loading ? "Loading plans…" : listState.error ? listState.error : `${listState.items.length} plans`}
            </div>
          </div>

          <div className={styles.actionsRow} style={{ marginTop: 0 }}>
            {!!deleteState.error && <span className={baseStyles.muted}>{deleteState.error}</span>}
            {!!deleteState.success && <span className={baseStyles.muted}>{deleteState.success}</span>}
          </div>
        </div>

        <div style={{ marginTop: 12 }} className={baseStyles.tableWrap}>
          <table className={baseStyles.table}>
            <thead>
              <tr>
                <th className={baseStyles.th}>Plan</th>
                <th className={baseStyles.th}>Price (USD)</th>
                <th className={baseStyles.th}>Price (INR)</th>
                <th className={baseStyles.th}>Credits</th>
                <th className={baseStyles.th}>Billing</th>
                <th className={baseStyles.th}>PayPal</th>
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
                      <button type="button" className={baseStyles.smallBtn} onClick={fetchPlans}>
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : !listState.items.length ? (
                <tr>
                  <td className={baseStyles.td} colSpan={7}>
                    <span className={baseStyles.muted}>No plans found.</span>
                  </td>
                </tr>
              ) : (
                listState.items.map((p) => (
                  <tr key={p.id ?? `${p.name}-${p.billing_period}`} className={baseStyles.tr}>
                    <td className={baseStyles.td}>
                      <div className={styles.planName}>{safeText(p.name)}</div>
                      <div className={styles.muted} style={{ marginTop: 4 }}>
                        {safeText(p.description)}
                      </div>
                    </td>
                    <td className={baseStyles.td}>{safeText(p.price_usd)}</td>
                    <td className={baseStyles.td}>{safeText(p.price_inr)}</td>
                    <td className={baseStyles.td}>{safeText(p.credits)}</td>
                    <td className={baseStyles.td}>{safeText(p.billing_period)}</td>
                    <td className={baseStyles.td}>{safeText(p.paypal_plan_id)}</td>
                    <td className={baseStyles.td}>
                      <div className={styles.actionsRow} style={{ marginTop: 0 }}>
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
      </div>
    </div>
  );
};

export default AdminSubscriptionPlansPage;
