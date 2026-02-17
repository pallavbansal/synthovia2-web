import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import API from "@/utils/api";
import { getAuthHeader, isAdminAuthenticated } from "@/utils/auth";
import baseStyles from "@/pages/settings/SettingsPage.module.css";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";

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

export default function AdminFeedbackPage() {
  const [guardError, setGuardError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFrom, setActiveFrom] = useState("");
  const [activeTo, setActiveTo] = useState("");
  const listFetchSeqRef = useRef(0);
  const [listState, setListState] = useState({ loading: false, error: "", items: [], pagination: null });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      setGuardError("You do not have permission to access Feedback.");
    } else {
      setGuardError("");
    }
  }, []);

  const fetchFeedbacks = async ({ nextPage = page, nextPerPage = perPage, nextFrom = activeFrom, nextTo = activeTo } = {}) => {
    const auth = getAuthHeader();
    if (!auth) {
      setListState({ loading: false, error: "Not authenticated.", items: [], pagination: null });
      return;
    }

    setListState((p) => ({ ...p, loading: true, error: "" }));
    const seq = ++listFetchSeqRef.current;

    try {
      const url = API.ADMIN_FEEDBACK({ perPage: nextPerPage, page: nextPage, from: nextFrom, to: nextTo });
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load feedback (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load feedback");

      if (seq !== listFetchSeqRef.current) return;

      const items = Array.isArray(json?.feedback)
        ? json.feedback
        : Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data?.feedback)
            ? json.data.feedback
            : Array.isArray(json?.data?.items)
              ? json.data.items
              : [];

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
      setListState({ loading: false, error: err?.message || "Failed to load feedback", items: [], pagination: null });
    }
  };

  useEffect(() => {
    if (guardError) return;
    fetchFeedbacks({ nextPage: page, nextPerPage: perPage, nextFrom: activeFrom, nextTo: activeTo });
  }, [guardError, page, perPage, activeFrom, activeTo]);

  const paging = listState.pagination || {
    page,
    perPage,
    totalPages: null,
    total: null,
    hasNext: false,
    hasPrev: false,
  };

  const canPrev = !listState.loading && (paging.hasPrev || (paging.page || 1) > 1);
  const canNext =
    !listState.loading &&
    (paging.hasNext || (paging.totalPages != null ? (paging.page || 1) < paging.totalPages : false));

  if (guardError) {
    return (
      <DashboardLayout title="Admin Feedback">
        <Head>
          <title>Admin Feedback</title>
        </Head>
        <div className={baseStyles.page}>
          <div className={baseStyles.card}>
            <div className={baseStyles.titleBlock}>
              <h1 className={baseStyles.title}>Feedback</h1>
              <p className={baseStyles.subtitle}>{guardError}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Feedback">
      <Head>
        <title>Admin Feedback</title>
      </Head>

      <div className={baseStyles.page}>
        <div className={baseStyles.card}>
          <div className={baseStyles.titleBlock}>
            <h1 className={baseStyles.title}>Feedback</h1>
            <p className={baseStyles.subtitle}>View feedback submitted by authenticated users.</p>
          </div>
        </div>

        <div className={baseStyles.card}>
          <div className={baseStyles.pagination} style={{ marginBottom: 10, rowGap: 8, flexWrap: "wrap" }}>
            <span className={baseStyles.pageLabel}>
              Page {paging.page || 1}
              {paging.totalPages != null ? ` / ${paging.totalPages}` : ""}
              {paging.total != null ? ` • ${paging.total} total` : ""}
            </span>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <label className={baseStyles.muted} htmlFor="fromDate">From</label>
              <input
                id="fromDate"
                type="date"
                className={baseStyles.dateInput}
                name="from"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                }}
                style={{ width: 160 }}
                placeholder="YYYY-MM-DD"
              />
              <label className={baseStyles.muted} htmlFor="toDate">To</label>
              <input
                id="toDate"
                type="date"
                className={baseStyles.dateInput}
                name="to"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                }}
                style={{ width: 160 }}
                placeholder="YYYY-MM-DD"
              />
              <button
                type="button"
                className={baseStyles.filterBtn}
                onClick={() => { setActiveFrom(fromDate); setActiveTo(toDate); setPage(1); }}
                title="Apply date filters"
              >
                Apply
              </button>
              <button
                type="button"
                className={baseStyles.filterBtn}
                onClick={() => { setFromDate(""); setToDate(""); setActiveFrom(""); setActiveTo(""); setPage(1); }}
                title="Reset date filters"
              >
                Reset
              </button>
            </div>

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

          {listState.loading ? (
            <div className={baseStyles.muted}>Loading feedback…</div>
          ) : listState.error ? (
            <div className={baseStyles.muted}>
              {listState.error}
              <div style={{ marginTop: 10 }}>
                <button type="button" className={baseStyles.smallBtn} onClick={() => fetchFeedbacks({ nextPage: paging.page, nextPerPage: perPage })}>
                  Retry
                </button>
              </div>
            </div>
          ) : !listState.items.length ? (
            <div className={baseStyles.muted}>No feedback yet.</div>
          ) : (
            <div className={baseStyles.tableWrap}>
              <table className={baseStyles.table}>
                <thead>
                  <tr>
                    <th className={baseStyles.th}>ID</th>
                    <th className={baseStyles.th}>User</th>
                    <th className={baseStyles.th}>Email</th>
                    <th className={baseStyles.th}>Message</th>
                    <th className={baseStyles.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {listState.items.map((f) => (
                    <tr key={f?.id || Math.random()} className={baseStyles.tr}>
                      <td className={baseStyles.td}>{safeText(f?.id)}</td>
                      <td className={baseStyles.td}>{safeText([f?.user?.first_name, f?.user?.last_name].filter(Boolean).join(" ") || f?.user?.name)}</td>
                      <td className={baseStyles.td}>{safeText(f?.user?.email)}</td>
                      <td className={baseStyles.td} style={{ maxWidth: 520 }}>
                        <div style={{ whiteSpace: "pre-wrap" }}>{safeText(f?.message)}</div>
                      </td>
                      <td className={baseStyles.td}>{formatDateTime(f?.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
