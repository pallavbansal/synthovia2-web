import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useRef, useState } from "react";
import PageHead from "../Head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import API from "@/utils/api";
import { getAuthHeader } from "@/utils/auth";

import styles from "../settings/SettingsPage.module.css";

const TOOL_TABS = [
  { key: "ad_copy", label: "Ad Copy" },
  { key: "copywriting", label: "Copywriting" },
  { key: "caption_hashtag", label: "Caption & Hashtag" },
  { key: "email_newsletter", label: "Email Newsletter" },
  { key: "seo_keyword", label: "SEO Keyword" },
  { key: "script_writer", label: "Script Writer" },
];

const normalizeDateParam = (s) => {
  const v = String(s || "").trim();
  if (!v) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  return v;
};

const toTitleCase = (s) =>
  String(s || "")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toDisplayValue = (value) => {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() ? value : "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    const sample = value[0];
    if (typeof sample === "string" || typeof sample === "number") {
      return value.join(", ");
    }
    return (
      value
        .map((v) => {
          if (v == null) return "";
          if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
          if (typeof v === "object") return v.value ?? v.label ?? v.name ?? v.title ?? JSON.stringify(v);
          return String(v);
        })
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  if (typeof value === "object") {
    return value.value ?? value.label ?? value.name ?? value.title ?? "—";
  }
  return String(value);
};

const flattenInputs = (obj, prefix = "") => {
  if (!obj || typeof obj !== "object") return [];
  const entries = [];
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value == null) return;
    if (key === "session_request_id") return;

    const normalizedKey = String(key || "").toLowerCase();
    if (
      normalizedKey === "number_of_variants" ||
      normalizedKey === "no_of_variants" ||
      normalizedKey === "no_variants" ||
      normalizedKey === "variant_count" ||
      normalizedKey === "variants_count" ||
      normalizedKey === "variants" ||
      normalizedKey === "count"
    ) {
      return;
    }

    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      entries.push({ key: nextKey, label: toTitleCase(key), value: toDisplayValue(value) });
      return;
    }

    if (typeof value === "object") {
      const hasHuman =
        Object.prototype.hasOwnProperty.call(value, "value") ||
        Object.prototype.hasOwnProperty.call(value, "label") ||
        Object.prototype.hasOwnProperty.call(value, "name") ||
        Object.prototype.hasOwnProperty.call(value, "title");

      if (hasHuman) {
        entries.push({ key: nextKey, label: toTitleCase(key), value: toDisplayValue(value) });
      } else {
        entries.push(...flattenInputs(value, nextKey));
      }
      return;
    }

    entries.push({ key: nextKey, label: toTitleCase(key), value: toDisplayValue(value) });
  });
  return entries;
};

const ToolHistoryPage = () => {
  const [activeToolTab, setActiveToolTab] = useState("ad_copy");

  const [copiedVariantKey, setCopiedVariantKey] = useState("");

  const [historyDateDraft, setHistoryDateDraft] = useState({ from: "", to: "" });
  const [historyDateFilter, setHistoryDateFilter] = useState({ from: "", to: "" });
  const [historyDateError, setHistoryDateError] = useState("");

  const historyFetchSeqRef = useRef(0);

  const [historyState, setHistoryState] = useState({
    loading: false,
    error: "",
    items: [],
    expandedSessionIds: {},
  });

  const [paginationByTool, setPaginationByTool] = useState(() => {
    return TOOL_TABS.reduce((acc, t) => {
      acc[t.key] = {
        page: 1,
        perPage: 100,
        total: null,
        totalPages: null,
      };
      return acc;
    }, {});
  });

  const toolTabs = useMemo(() => TOOL_TABS, []);

  const getHistoryUrlForTool = (toolKey, { page, perPage, from, to } = {}) => {
    switch (toolKey) {
      case "ad_copy":
        return API.AD_COPY_HISTORY({ perPage, page, from, to });
      case "copywriting":
        return API.COPYWRITING_HISTORY({ perPage, page, from, to });
      case "caption_hashtag":
        return API.CAPTION_HASHTAG_HISTORY({ perPage, page, from, to });
      case "email_newsletter":
        return API.EMAIL_NEWSLETTER_HISTORY({ perPage, page, from, to });
      case "seo_keyword":
        return API.SEO_KEYWORD_HISTORY({ perPage, page, from, to });
      case "script_writer":
        return API.SCRIPT_WRITER_HISTORY({ perPage, page, from, to });
      default:
        return "";
    }
  };

  const normalizePaginationFromResponse = ({ json, fallbackPage, fallbackPerPage, itemCount }) => {
    const pag = json?.pagination || json?.meta?.pagination || json?.meta || null;

    const pageRaw = pag?.current_page ?? pag?.page ?? pag?.currentPage ?? fallbackPage;
    const perPageRaw = pag?.per_page ?? pag?.perPage ?? pag?.per_page_count ?? fallbackPerPage;
    const lastPageRaw = pag?.last_page ?? pag?.total_pages ?? pag?.lastPage ?? null;
    const totalRaw = pag?.total ?? pag?.total_items ?? pag?.totalItems ?? null;

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

    const hasNext = totalPages != null ? safePage < totalPages : itemCount === safePerPage;

    return {
      page: safePage,
      perPage: safePerPage,
      total: Number.isFinite(total) ? total : null,
      totalPages,
      hasNext,
    };
  };

  const formatDate = (raw) => {
    if (!raw) return "—";
    const dt = new Date(String(raw).replace(" ", "T"));
    if (Number.isNaN(dt.getTime())) return String(raw);
    return dt.toLocaleString();
  };

  const copyToClipboard = async (text) => {
    const value = String(text || "");
    if (!value.trim()) return false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (e) {}

    try {
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.top = "-1000px";
      el.style.left = "-1000px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return !!ok;
    } catch (e) {
      return false;
    }
  };

  const fetchToolHistory = async (toolKey, overrides = {}) => {
    const current = paginationByTool?.[toolKey] || { page: 1, perPage: 100 };
    const requestedPage = overrides.page ?? current.page ?? 1;
    const requestedPerPage = overrides.perPage ?? current.perPage ?? 100;
    const from = normalizeDateParam(overrides.from ?? historyDateFilter?.from);
    const to = normalizeDateParam(overrides.to ?? historyDateFilter?.to);
    const url = getHistoryUrlForTool(toolKey, { page: requestedPage, perPage: requestedPerPage, from, to });
    if (!url) {
      setHistoryState((prev) => ({
        ...prev,
        loading: false,
        error: "History API not configured.",
        items: [],
      }));
      return;
    }

    setHistoryState((prev) => ({ ...prev, loading: true, error: "", items: [] }));
    const seq = ++historyFetchSeqRef.current;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load history (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load history");

      if (seq !== historyFetchSeqRef.current) return;

      const items = json.history || [];
      const normalized = normalizePaginationFromResponse({
        json,
        fallbackPage: requestedPage,
        fallbackPerPage: requestedPerPage,
        itemCount: Array.isArray(items) ? items.length : 0,
      });

      setPaginationByTool((prev) => ({
        ...prev,
        [toolKey]: {
          ...(prev?.[toolKey] || {}),
          page: normalized.page,
          perPage: normalized.perPage,
          total: normalized.total,
          totalPages: normalized.totalPages,
        },
      }));

      setHistoryState((prev) => ({ ...prev, loading: false, error: "", items }));
    } catch (err) {
      if (seq !== historyFetchSeqRef.current) return;
      setHistoryState((prev) => ({ ...prev, loading: false, error: err?.message || "Failed to load history", items: [] }));
    }
  };

  useEffect(() => {
    fetchToolHistory(activeToolTab);
  }, [activeToolTab]);

  const toggleExpanded = (sessionId) => {
    setHistoryState((prev) => ({
      ...prev,
      expandedSessionIds: {
        ...prev.expandedSessionIds,
        [sessionId]: !prev.expandedSessionIds?.[sessionId],
      },
    }));
  };

  const activeToolLabel = toolTabs.find((t) => t.key === activeToolTab)?.label;
  const retry = () => fetchToolHistory(activeToolTab);
  const paging = paginationByTool?.[activeToolTab] || { page: 1, perPage: 100, totalPages: null, total: null };
  const canPrev = !historyState.loading && (paging.page || 1) > 1;
  const canNext =
    !historyState.loading &&
    (paging.totalPages != null
      ? (paging.page || 1) < paging.totalPages
      : Array.isArray(historyState.items) && historyState.items.length === (paging.perPage || 100));

  const handlePrev = () => {
    if (!canPrev) return;
    const nextPage = Math.max(1, (paging.page || 1) - 1);
    setPaginationByTool((prev) => ({
      ...prev,
      [activeToolTab]: { ...(prev?.[activeToolTab] || {}), page: nextPage },
    }));
    fetchToolHistory(activeToolTab, { page: nextPage, perPage: paging.perPage });
  };

  const handleNext = () => {
    if (!canNext) return;
    const nextPage = (paging.page || 1) + 1;
    setPaginationByTool((prev) => ({
      ...prev,
      [activeToolTab]: { ...(prev?.[activeToolTab] || {}), page: nextPage },
    }));
    fetchToolHistory(activeToolTab, { page: nextPage, perPage: paging.perPage });
  };

  const handlePerPageChange = (e) => {
    const nextPerPage = Number(e.target.value);
    const perPage = Number.isFinite(nextPerPage) && nextPerPage > 0 ? nextPerPage : 100;
    const resetPage = 1;

    setPaginationByTool((prev) => ({
      ...prev,
      [activeToolTab]: {
        ...(prev?.[activeToolTab] || {}),
        page: resetPage,
        perPage,
        totalPages: null,
        total: null,
      },
    }));
    fetchToolHistory(activeToolTab, { page: resetPage, perPage });
  };

  const applyDateFilter = () => {
    const from = normalizeDateParam(historyDateDraft?.from);
    const to = normalizeDateParam(historyDateDraft?.to);
    if (from && to && from > to) {
      setHistoryDateError("From date must be before To date.");
      return;
    }
    setHistoryDateError("");
    setHistoryDateFilter({ from: from || "", to: to || "" });
    setPaginationByTool((prev) => {
      const next = { ...prev };
      TOOL_TABS.forEach((t) => {
        next[t.key] = {
          ...(next?.[t.key] || {}),
          page: 1,
          total: null,
          totalPages: null,
        };
      });
      return next;
    });
    fetchToolHistory(activeToolTab, { page: 1, from, to });
  };

  const clearDateFilter = () => {
    setHistoryDateError("");
    setHistoryDateDraft({ from: "", to: "" });
    setHistoryDateFilter({ from: "", to: "" });
    setPaginationByTool((prev) => {
      const next = { ...prev };
      TOOL_TABS.forEach((t) => {
        next[t.key] = {
          ...(next?.[t.key] || {}),
          page: 1,
          total: null,
          totalPages: null,
        };
      });
      return next;
    });
    fetchToolHistory(activeToolTab, { page: 1, from: "", to: "" });
  };

  return (
    <>
      <PageHead title="Tool History" />
      <DashboardLayout title="Tool History">
        <div className={styles.page}>
          <div className={`${styles.card} ${styles.headerRow}`.trim()}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Tool History</h1>
              <p className={styles.subtitle}>View your past generations for all tools.</p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.historyHeaderRow}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Tool History</div>
                <div className={styles.muted} style={{ marginTop: 4 }}>
                  View your past generations. Use session IDs to correlate frontend submissions.
                </div>
                {historyDateError ? <div className={styles.muted} style={{ marginTop: 6 }}>{historyDateError}</div> : null}
              </div>

              <div className={styles.filters}>
                <label className={styles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  From
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={historyDateDraft.from}
                    onChange={(e) => setHistoryDateDraft((p) => ({ ...p, from: e.target.value }))}
                  />
                </label>
                <label className={styles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  To
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={historyDateDraft.to}
                    onChange={(e) => setHistoryDateDraft((p) => ({ ...p, to: e.target.value }))}
                  />
                </label>
                <button type="button" className={styles.filterBtn} onClick={applyDateFilter}>
                  Apply
                </button>
                <button type="button" className={styles.filterBtn} onClick={clearDateFilter}>
                  Clear
                </button>
              </div>

              <div className={styles.pagination}>
                <span className={styles.pageLabel}>
                  Page {paging.page || 1}
                  {paging.totalPages != null ? ` / ${paging.totalPages}` : ""}
                  {paging.total != null ? ` • ${paging.total} total` : ""}
                </span>

                <label className={styles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Per page
                  <select className={styles.select} value={paging.perPage || 100} onChange={handlePerPageChange}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>

                <button
                  type="button"
                  className={`${styles.smallBtn} ${canPrev ? "" : styles.btnDisabled}`.trim()}
                  onClick={handlePrev}
                  disabled={!canPrev}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className={`${styles.smallBtn} ${canNext ? "" : styles.btnDisabled}`.trim()}
                  onClick={handleNext}
                  disabled={!canNext}
                >
                  Next
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }} className={styles.tabBar}>
              {toolTabs.map((t) => {
                const active = activeToolTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`${styles.tab} ${active ? styles.tabActive : ""}`.trim()}
                    onClick={() => setActiveToolTab(t.key)}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14 }}>
              {historyState.loading ? (
                <div className={styles.muted}>Loading history…</div>
              ) : historyState.error ? (
                <div className={styles.muted}>
                  {historyState.error}
                  <div style={{ marginTop: 10 }}>
                    <button type="button" className={styles.smallBtn} onClick={retry}>
                      Retry
                    </button>
                  </div>
                </div>
              ) : !historyState.items || historyState.items.length === 0 ? (
                <div className={styles.muted}>No history found yet{activeToolLabel ? ` for ${activeToolLabel}` : ""}.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Date</th>
                        <th className={styles.th}>Session</th>
                        <th className={styles.th}>Generated (preview)</th>
                        <th className={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyState.items.map((row) => {
                        const sessionId = row?.session_request_id || "";
                        const createdAt = row?.created_at;
                        const preview =
                          row?.variants?.[0]?.content ||
                          row?.variants?.[1]?.content ||
                          row?.variants?.[2]?.content ||
                          "";
                        const expanded = !!historyState.expandedSessionIds?.[sessionId];

                        return (
                          <React.Fragment key={sessionId || createdAt || Math.random()}>
                            <tr className={styles.tr}>
                              <td className={styles.td}>{formatDate(createdAt)}</td>
                              <td className={styles.td}>
                                <div style={{ fontWeight: 800 }}>{sessionId || "—"}</div>
                                <div className={styles.muted} style={{ marginTop: 4 }}>
                                  {Array.isArray(row?.request_ids) ? `${row.request_ids.length} request(s)` : ""}
                                </div>
                              </td>
                              <td className={styles.td}>
                                <div className={styles.preview}>{String(preview || "").replace(/\s+/g, " ") || "—"}</div>
                              </td>
                              <td className={styles.td}>
                                <button type="button" className={styles.smallBtn} onClick={() => toggleExpanded(sessionId)}>
                                  {expanded ? "Hide" : "View"}
                                </button>
                              </td>
                            </tr>
                            {expanded ? (
                              <tr>
                                <td className={styles.td} colSpan={4} style={{ padding: 0 }}>
                                  <div className={styles.expand}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                      <span className={styles.badge}>Inputs</span>
                                      <span className={styles.badge}>Variants: {Array.isArray(row?.variants) ? row.variants.length : 0}</span>
                                    </div>

                                    <div style={{ marginTop: 10 }}>
                                      <div className={styles.inputsList}>
                                        {flattenInputs(row?.inputs || {}).length === 0 ? (
                                          <div className={styles.muted}>No inputs found.</div>
                                        ) : (
                                          flattenInputs(row?.inputs || {}).map((it) => (
                                            <div key={it.key} className={styles.inputRow}>
                                              <div className={styles.inputName}>{it.label}</div>
                                              <div className={styles.inputValue}>{it.value}</div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>

                                    {Array.isArray(row?.variants) && row.variants.length > 0 ? (
                                      <div style={{ marginTop: 12 }}>
                                        <span className={styles.badge}>Generated</span>
                                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                                          {row.variants.map((v) => (
                                            <div key={v?.id || Math.random()} className={styles.card} style={{ padding: 12 }}>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "space-between",
                                                  gap: 10,
                                                  marginBottom: 8,
                                                }}
                                              >
                                                <div className={styles.muted} style={{ fontWeight: 900 }}>
                                                  Variant #{v?.id || "—"}
                                                </div>
                                                <button
                                                  type="button"
                                                  className={styles.smallBtn}
                                                  onClick={async () => {
                                                    const key = `${sessionId}-${String(v?.id || "")}`;
                                                    const ok = await copyToClipboard(v?.content);
                                                    if (ok) {
                                                      setCopiedVariantKey(key);
                                                      window.setTimeout(() => {
                                                        setCopiedVariantKey((prev) => (prev === key ? "" : prev));
                                                      }, 1200);
                                                    }
                                                  }}
                                                  disabled={!String(v?.content || "").trim()}
                                                >
                                                  {copiedVariantKey === `${sessionId}-${String(v?.id || "")}` ? "Copied" : "Copy"}
                                                </button>
                                              </div>
                                              <pre className={styles.pre}>{String(v?.content || "")}</pre>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(ToolHistoryPage), { ssr: false });
