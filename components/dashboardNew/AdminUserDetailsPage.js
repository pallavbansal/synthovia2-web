import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import ReactMarkdown from "react-markdown";
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

const formatAmountOnly = (v) => {
  if (v == null) return "—";
  const asNum = Number(v);
  if (Number.isFinite(asNum)) return String(asNum);
  const s = String(v);
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  return cleaned.trim() ? cleaned : "—";
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

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'history'

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

  const [grantsPage, setGrantsPage] = useState(1);
  const grantsPerPage = 100;
  const grantsFetchSeqRef = useRef(0);
  const [grantsState, setGrantsState] = useState({ loading: false, error: "", items: [], pagination: null });

  const fetchCreditGrants = async ({ userId, nextPage = grantsPage } = {}) => {
    if (!userId) return;

    const auth = getAuthHeader();
    if (!auth) {
      setGrantsState({ loading: false, error: "Not authenticated.", items: [], pagination: null });
      return;
    }

    setGrantsState((p) => ({ ...p, loading: true, error: "" }));
    const seq = ++grantsFetchSeqRef.current;

    try {
      const url = API.ADMIN_USER_CREDIT_GRANTS({ id: userId, perPage: grantsPerPage, page: nextPage });
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: auth,
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load credit grants (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load credit grants");

      if (seq !== grantsFetchSeqRef.current) return;

      const items = Array.isArray(json?.grants)
        ? json.grants
        : Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data?.grants)
            ? json.data.grants
            : Array.isArray(json?.data?.items)
              ? json.data.items
              : [];

      const normalized = normalizePagination({
        pagination: json?.pagination || json?.meta?.pagination || json?.meta || null,
        fallbackPage: nextPage,
        fallbackPerPage: grantsPerPage,
        itemCount: items.length,
      });

      setGrantsState({ loading: false, error: "", items, pagination: normalized });

      if (normalized?.page && normalized.page !== nextPage) {
        setGrantsPage(normalized.page);
      }
    } catch (err) {
      if (seq !== grantsFetchSeqRef.current) return;
      setGrantsState({ loading: false, error: err?.message || "Failed to load credit grants", items: [], pagination: null });
    }
  };

  // ===== Admin Tool History (reused UI from /tool-history) =====
  const TOOL_TABS = useMemo(
    () => [
      { key: "ad_copy", label: "Ad Copy" },
      { key: "copywriting", label: "Copywriting" },
      { key: "caption_hashtag", label: "Caption & Hashtag" },
      { key: "email_newsletter", label: "Email Newsletter" },
      { key: "seo_keyword", label: "SEO Keyword" },
      { key: "script_writer", label: "Script Writer" },
    ],
    []
  );

  const ADMIN_TOOL_NAME_MAP = {
    ad_copy: "ad_copy",
    copywriting: "copy_writing",
    caption_hashtag: "caption",
    email_newsletter: "email_newsletter",
    seo_keyword: "seo_keyword",
    script_writer: "script_writer",
  };

  const [activeToolTab, setActiveToolTab] = useState("ad_copy");
  const [historyDateDraft, setHistoryDateDraft] = useState({ from: "", to: "" });
  const [historyDateFilter, setHistoryDateFilter] = useState({ from: "", to: "" });
  const [historyDateError, setHistoryDateError] = useState("");
  const adminHistoryFetchSeqRef = useRef(0);
  const [adminHistoryState, setAdminHistoryState] = useState({ loading: false, error: "", items: [], expandedSessionIds: {} });
  const [paginationByTool, setPaginationByTool] = useState(() => {
    return TOOL_TABS.reduce((acc, t) => {
      acc[t.key] = { page: 1, perPage: 100, totalPages: null, total: null };
      return acc;
    }, {});
  });

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
      if (typeof sample === "string" || typeof sample === "number") return value.join(", ");
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
    if (typeof value === "object") return value.value ?? value.label ?? value.name ?? value.title ?? "—";
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

  const processCopywritingMarkdown = (content) => {
    if (!content) return "";
    return String(content).replace(/<strong>(.*?)<\/strong>/g, "**$1**").replace(/<b>(.*?)<\/b>/g, "**$1**");
  };
  const processSeoMarkdown = (content) => {
    if (!content) return "";
    const normalized = String(content).replace(/<strong>(.*?)<\/strong>/g, "**$1**").replace(/<b>(.*?)<\/b>/g, "**$1**");
    const toHeadingIfBoldOnly = (line) => {
      const match = String(line || "").match(/^\s*\*\*(.+?)\*\*\s*$/);
      if (!match) return line;
      const title = String(match[1] || "").trim();
      if (!title) return line;
      return `## ${title}`;
    };
    const isHeading = (line) => /^\s*#{1,6}\s+/.test(line);
    const isListLine = (line) => /^\s*([-*+])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line);
    const isFenceOrTableOrQuote = (line) => /^\s*```/.test(line) || /^\s*\|/.test(line) || /^\s*>/.test(line);
    const looksLikeSectionTitle = (line) => {
      const t = String(line || "").trim();
      if (!t) return false;
      if (isHeading(t) || isListLine(t) || isFenceOrTableOrQuote(t)) return false;
      if (t.length > 80) return false;
      return /:\s*$/.test(t);
    };
    const isPlainItemLine = (line) => {
      const t = String(line || "").trim();
      if (!t) return false;
      if (isHeading(t) || isListLine(t) || isFenceOrTableOrQuote(t)) return false;
      return true;
    };
    const lines = normalized.split(/\r?\n/).map(toHeadingIfBoldOnly);
    const out = [];
    const collectPlainItems = (startIndex) => {
      let j = startIndex;
      while (j < lines.length && !String(lines[j] ?? "").trim()) j += 1;
      const items = [];
      let k = j;
      while (k < lines.length) {
        const l = String(lines[k] ?? "");
        const t = l.trim();
        if (!t) {
          k += 1;
          continue;
        }
        if (isHeading(t) || isListLine(t) || isFenceOrTableOrQuote(t) || looksLikeSectionTitle(t)) break;
        if (!isPlainItemLine(t)) break;
        items.push(t);
        k += 1;
      }
      return { items, endIndex: k };
    };
    for (let i = 0; i < lines.length; i += 1) {
      const line = String(lines[i] ?? "");
      const trimmed = line.trim();
      if (looksLikeSectionTitle(trimmed)) {
        out.push(`## ${trimmed}`);
        const { items, endIndex } = collectPlainItems(i + 1);
        if (items.length >= 2) {
          items.forEach((it) => out.push(`- ${it}`));
          i = endIndex - 1;
        }
        continue;
      }
      if (isHeading(trimmed)) {
        out.push(trimmed);
        const { items, endIndex } = collectPlainItems(i + 1);
        if (items.length >= 2) {
          items.forEach((it) => out.push(`- ${it}`));
          i = endIndex - 1;
        }
        continue;
      }
      out.push(line);
    }
    return out
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n\s*\n(?=\s*[-*+]\s)/g, "\n")
      .replace(/\n\s*\n(?=\s*\d+[.)]\s)/g, "\n");
  };

  const normalizeDateParam = (s) => {
    const v = String(s || "").trim();
    if (!v) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    return v;
  };

  const getAdminHistoryUrl = (toolKey, { page, perPage, from, to } = {}) => {
    const toolName = ADMIN_TOOL_NAME_MAP[toolKey] || toolKey;
    return API.ADMIN_TOOLS_HISTORY({ toolName, userId: id, perPage, page, from, to });
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
    const totalPages = Number.isFinite(lastPage) && lastPage > 0 ? lastPage : Number.isFinite(total) && total != null ? Math.max(1, Math.ceil(total / safePerPage)) : null;
    const hasNext = totalPages != null ? safePage < totalPages : itemCount === safePerPage;
    return { page: safePage, perPage: safePerPage, total: Number.isFinite(total) ? total : null, totalPages, hasNext };
  };

  const fetchAdminToolHistory = async (toolKey, overrides = {}) => {
    const current = paginationByTool?.[toolKey] || { page: 1, perPage: 100 };
    const requestedPage = overrides.page ?? current.page ?? 1;
    const requestedPerPage = overrides.perPage ?? current.perPage ?? 100;
    const from = normalizeDateParam(overrides.from ?? historyDateFilter?.from);
    const to = normalizeDateParam(overrides.to ?? historyDateFilter?.to);
    const url = getAdminHistoryUrl(toolKey, { page: requestedPage, perPage: requestedPerPage, from, to });
    if (!url) {
      setAdminHistoryState((prev) => ({ ...prev, loading: false, error: "History API not configured.", items: [] }));
      return;
    }
    setAdminHistoryState((prev) => ({ ...prev, loading: true, error: "", items: [] }));
    const seq = ++adminHistoryFetchSeqRef.current;
    try {
      const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", Authorization: getAuthHeader() } });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to load history (${res.status})`);
      if (!json || json.status_code !== 1) throw new Error(json?.message || "Failed to load history");
      if (seq !== adminHistoryFetchSeqRef.current) return;
      const items = json.history || json.items || json.data?.history || [];
      const normalized = normalizePaginationFromResponse({ json, fallbackPage: requestedPage, fallbackPerPage: requestedPerPage, itemCount: Array.isArray(items) ? items.length : 0 });
      setPaginationByTool((prev) => ({
        ...prev,
        [toolKey]: { ...(prev?.[toolKey] || {}), page: normalized.page, perPage: normalized.perPage, total: normalized.total, totalPages: normalized.totalPages },
      }));
      setAdminHistoryState((prev) => ({ ...prev, loading: false, error: "", items }));
    } catch (err) {
      if (seq !== adminHistoryFetchSeqRef.current) return;
      setAdminHistoryState((prev) => ({ ...prev, loading: false, error: err?.message || "Failed to load history", items: [] }));
    }
  };

  useEffect(() => {
    if (activeTab !== "history") return;
    fetchAdminToolHistory(activeToolTab);
  }, [activeTab, activeToolTab]);

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
        next[t.key] = { ...(next?.[t.key] || {}), page: 1, total: null, totalPages: null };
      });
      return next;
    });
    fetchAdminToolHistory(activeToolTab, { page: 1, from, to });
  };

  const clearDateFilter = () => {
    setHistoryDateError("");
    setHistoryDateDraft({ from: "", to: "" });
    setHistoryDateFilter({ from: "", to: "" });
    setPaginationByTool((prev) => {
      const next = { ...prev };
      TOOL_TABS.forEach((t) => {
        next[t.key] = { ...(next?.[t.key] || {}), page: 1, total: null, totalPages: null };
      });
      return next;
    });
    fetchAdminToolHistory(activeToolTab, { page: 1, from: "", to: "" });
  };

  const toggleExpanded = (sessionId) => {
    setAdminHistoryState((prev) => ({
      ...prev,
      expandedSessionIds: {
        ...prev.expandedSessionIds,
        [sessionId]: !prev.expandedSessionIds?.[sessionId],
      },
    }));
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

  const retryAdminHistory = () => fetchAdminToolHistory(activeToolTab);
  const paging = paginationByTool?.[activeToolTab] || { page: 1, perPage: 100, totalPages: null, total: null };
  const canPrev = !adminHistoryState.loading && (paging.page || 1) > 1;
  const canNext =
    !adminHistoryState.loading && (paging.totalPages != null ? (paging.page || 1) < paging.totalPages : Array.isArray(adminHistoryState.items) && adminHistoryState.items.length === (paging.perPage || 100));

  const handlePrev = () => {
    if (!canPrev) return;
    const nextPage = Math.max(1, (paging.page || 1) - 1);
    setPaginationByTool((prev) => ({ ...prev, [activeToolTab]: { ...(prev?.[activeToolTab] || {}), page: nextPage } }));
    fetchAdminToolHistory(activeToolTab, { page: nextPage, perPage: paging.perPage });
  };

  const handleNext = () => {
    if (!canNext) return;
    const nextPage = (paging.page || 1) + 1;
    setPaginationByTool((prev) => ({ ...prev, [activeToolTab]: { ...(prev?.[activeToolTab] || {}), page: nextPage } }));
    fetchAdminToolHistory(activeToolTab, { page: nextPage, perPage: paging.perPage });
  };

  const handlePerPageChange = (e) => {
    const nextPerPage = Number(e.target.value);
    const perPage = Number.isFinite(nextPerPage) && nextPerPage > 0 ? nextPerPage : 100;
    const resetPage = 1;
    setPaginationByTool((prev) => ({
      ...prev,
      [activeToolTab]: { ...(prev?.[activeToolTab] || {}), page: resetPage, perPage, totalPages: null, total: null },
    }));
    fetchAdminToolHistory(activeToolTab, { page: resetPage, perPage });
  };

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
      setGrantsPage(1);
    } catch (err) {
      setDetailsState({ loading: false, error: err?.message || "Failed to load user", data: null });
      setHistoryState({ loading: false, error: "", items: [], pagination: null });
      setActivityState({ loading: false, error: "", items: [], pagination: null });
      setGrantsState({ loading: false, error: "", items: [], pagination: null });
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

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) return;
    fetchCreditGrants({ userId: id, nextPage: grantsPage });
  }, [router.isReady, id, grantsPage]);

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

  const grantsPaging = grantsState.pagination || {
    page: grantsPage,
    perPage: grantsPerPage,
    totalPages: null,
    total: null,
    hasNext: false,
    hasPrev: false,
  };
  const canGrantsPrev = !grantsState.loading && (grantsPaging.hasPrev || (grantsPaging.page || 1) > 1);
  const canGrantsNext =
    !grantsState.loading &&
    (grantsPaging.hasNext ||
      (grantsPaging.totalPages != null
        ? (grantsPaging.page || 1) < grantsPaging.totalPages
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

      <div className={baseStyles.card}>
        <div className={baseStyles.tabBar}>
          <button
            type="button"
            className={`${baseStyles.tab} ${activeTab === "profile" ? baseStyles.tabActive : ""}`.trim()}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            type="button"
            className={`${baseStyles.tab} ${activeTab === "history" ? baseStyles.tabActive : ""}`.trim()}
            onClick={() => setActiveTab("history")}
          >
            Tool History
          </button>
        </div>
      </div>

      {activeTab === "profile" ? (
        detailsState.loading ? (
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
                      <th className={baseStyles.th}>Provider</th>
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
                        <td className={baseStyles.td}>{safeText(h?.provider)}</td>
                        <td className={baseStyles.td}>{formatAmountOnly(h?.amount)}</td>
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

          <div className={baseStyles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeading}>Credit grants</div>
            </div>

            <div className={baseStyles.pagination} style={{ marginBottom: 10 }}>
              <span className={baseStyles.pageLabel}>
                Page {grantsPaging.page || 1}
                {grantsPaging.totalPages != null ? ` / ${grantsPaging.totalPages}` : ""}
                {grantsPaging.total != null ? ` • ${grantsPaging.total} total` : ""}
              </span>
              <button
                type="button"
                className={`${baseStyles.smallBtn} ${canGrantsPrev ? "" : baseStyles.btnDisabled}`.trim()}
                onClick={() => setGrantsPage(Math.max(1, (grantsPaging.page || 1) - 1))}
                disabled={!canGrantsPrev}
              >
                Prev
              </button>
              <button
                type="button"
                className={`${baseStyles.smallBtn} ${canGrantsNext ? "" : baseStyles.btnDisabled}`.trim()}
                onClick={() => setGrantsPage((grantsPaging.page || 1) + 1)}
                disabled={!canGrantsNext}
              >
                Next
              </button>
            </div>

            {grantsState.loading ? (
              <div className={baseStyles.muted}>Loading grants…</div>
            ) : grantsState.error ? (
              <div className={baseStyles.muted}>
                {grantsState.error}
                <div style={{ marginTop: 10 }}>
                  <button type="button" className={baseStyles.smallBtn} onClick={() => fetchCreditGrants({ userId: id, nextPage: grantsPage })}>
                    Retry
                  </button>
                </div>
              </div>
            ) : !grantsState.items.length ? (
              <div className={baseStyles.muted}>No credit grants found.</div>
            ) : (
              <div className={baseStyles.tableWrap}>
                <table className={baseStyles.table}>
                  <thead>
                    <tr>
                      <th className={baseStyles.th}>Before</th>
                      <th className={baseStyles.th}>Amount</th>
                      <th className={baseStyles.th}>After</th>
                      <th className={baseStyles.th}>Granted at</th>
                      <th className={baseStyles.th}>Admin ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grantsState.items.map((g) => (
                      <tr key={`${g?.granted_at}-${g?.performed_by_admin_id}-${g?.credits_before}-${g?.credit_amount}-${g?.credits_after}` || Math.random()} className={baseStyles.tr}>
                        <td className={baseStyles.td}>{safeText(g?.credits_before)}</td>
                        <td className={baseStyles.td}>{safeText(g?.credit_amount)}</td>
                        <td className={baseStyles.td}>{safeText(g?.credits_after)}</td>
                        <td className={baseStyles.td}>{formatDateTime(g?.granted_at)}</td>
                        <td className={baseStyles.td}>{safeText(g?.performed_by_admin_id)}</td>
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
        )
      ) : (
        <>
          <div className={baseStyles.card}>
            <div className={baseStyles.historyHeaderRow}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Tool history for User #{safeText(id)}</div>
                {historyDateError ? <div className={baseStyles.muted} style={{ marginTop: 6 }}>{historyDateError}</div> : null}
              </div>

              <div className={baseStyles.filters}>
                <label className={baseStyles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  From
                  <input
                    type="date"
                    className={baseStyles.dateInput}
                    value={historyDateDraft.from}
                    onChange={(e) => setHistoryDateDraft((p) => ({ ...p, from: e.target.value }))}
                  />
                </label>
                <label className={baseStyles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  To
                  <input
                    type="date"
                    className={baseStyles.dateInput}
                    value={historyDateDraft.to}
                    onChange={(e) => setHistoryDateDraft((p) => ({ ...p, to: e.target.value }))}
                  />
                </label>
                <button type="button" className={baseStyles.filterBtn} onClick={applyDateFilter}>
                  Apply
                </button>
                <button type="button" className={baseStyles.filterBtn} onClick={clearDateFilter}>
                  Clear
                </button>
              </div>

              <div className={baseStyles.pagination}>
                <span className={baseStyles.pageLabel}>
                  Page {paging.page || 1}
                  {paging.totalPages != null ? ` / ${paging.totalPages}` : ""}
                  {paging.total != null ? ` • ${paging.total} total` : ""}
                </span>

                <label className={baseStyles.muted} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Per page
                  <select className={baseStyles.select} value={paging.perPage || 100} onChange={handlePerPageChange}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>

                <button
                  type="button"
                  className={`${baseStyles.smallBtn} ${canPrev ? "" : baseStyles.btnDisabled}`.trim()}
                  onClick={handlePrev}
                  disabled={!canPrev}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className={`${baseStyles.smallBtn} ${canNext ? "" : baseStyles.btnDisabled}`.trim()}
                  onClick={handleNext}
                  disabled={!canNext}
                >
                  Next
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }} className={baseStyles.tabBar}>
              {TOOL_TABS.map((t) => {
                const active = activeToolTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`${baseStyles.tab} ${active ? baseStyles.tabActive : ""}`.trim()}
                    onClick={() => setActiveToolTab(t.key)}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14 }}>
              {adminHistoryState.loading ? (
                <div className={baseStyles.muted}>Loading history…</div>
              ) : adminHistoryState.error ? (
                <div className={baseStyles.muted}>
                  {adminHistoryState.error}
                  <div style={{ marginTop: 10 }}>
                    <button type="button" className={baseStyles.smallBtn} onClick={retryAdminHistory}>
                      Retry
                    </button>
                  </div>
                </div>
              ) : !adminHistoryState.items || adminHistoryState.items.length === 0 ? (
                <div className={baseStyles.muted}>No history found yet.</div>
              ) : (
                <div className={baseStyles.tableWrap}>
                  <table className={baseStyles.table}>
                    <thead>
                      <tr>
                        <th className={baseStyles.th}>Date</th>
                        <th className={baseStyles.th}>Session</th>
                        <th className={baseStyles.th}>Generated (preview)</th>
                        <th className={baseStyles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminHistoryState.items.map((row) => {
                        const sessionId = row?.session_request_id || "";
                        const createdAt = row?.created_at;
                        const preview = row?.variants?.[0]?.content || row?.variants?.[1]?.content || row?.variants?.[2]?.content || "";
                        const expanded = !!adminHistoryState.expandedSessionIds?.[sessionId];

                        return (
                          <Fragment key={sessionId || createdAt || Math.random()}>
                            <tr className={baseStyles.tr}>
                              <td className={baseStyles.td}>{formatDateTime(createdAt)}</td>
                              <td className={baseStyles.td}>
                                <div style={{ fontWeight: 800 }}>{sessionId || "—"}</div>
                                <div className={baseStyles.muted} style={{ marginTop: 4 }}>
                                  {Array.isArray(row?.request_ids) ? `${row.request_ids.length} request(s)` : ""}
                                </div>
                              </td>
                              <td className={baseStyles.td}>
                                <div className={baseStyles.preview}>{String(preview || "").replace(/\s+/g, " ") || "—"}</div>
                              </td>
                              <td className={baseStyles.td}>
                                <button type="button" className={baseStyles.smallBtn} onClick={() => toggleExpanded(sessionId)}>
                                  {expanded ? "Hide" : "View"}
                                </button>
                              </td>
                            </tr>
                            {expanded ? (
                              <tr>
                                <td className={baseStyles.td} colSpan={4} style={{ padding: 0 }}>
                                  <div className={baseStyles.expand}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                      <span className={baseStyles.badge}>Inputs</span>
                                      <span className={baseStyles.badge}>Variants: {Array.isArray(row?.variants) ? row.variants.length : 0}</span>
                                    </div>

                                    <div style={{ marginTop: 10 }}>
                                      <div className={baseStyles.inputsList}>
                                        {flattenInputs(row?.inputs || {}).length === 0 ? (
                                          <div className={baseStyles.muted}>No inputs found.</div>
                                        ) : (
                                          flattenInputs(row?.inputs || {}).map((it) => (
                                            <div key={it.key} className={baseStyles.inputRow}>
                                              <div className={baseStyles.inputName}>{it.label}</div>
                                              <div className={baseStyles.inputValue}>{it.value}</div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>

                                    {Array.isArray(row?.variants) && row.variants.length > 0 ? (
                                      <div style={{ marginTop: 12 }}>
                                        <span className={baseStyles.badge}>Generated</span>
                                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                                          {row.variants.map((v) => (
                                            <div key={v?.id || Math.random()} className={baseStyles.card} style={{ padding: 12 }}>
                                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                                                <div className={baseStyles.muted} style={{ fontWeight: 900 }}>
                                                  Variant #{v?.id || "—"}
                                                </div>
                                                <button
                                                  type="button"
                                                  className={baseStyles.smallBtn}
                                                  onClick={async () => {
                                                    await copyToClipboard(v?.content);
                                                  }}
                                                  disabled={!String(v?.content || "").trim()}
                                                >
                                                  Copy
                                                </button>
                                              </div>
                                              {activeToolTab === "copywriting" || activeToolTab === "seo_keyword" ? (
                                                <pre className={baseStyles.pre}>
                                                  <ReactMarkdown>
                                                    {activeToolTab === "copywriting"
                                                      ? processCopywritingMarkdown(String(v?.content || ""))
                                                      : processSeoMarkdown(String(v?.content || ""))}
                                                  </ReactMarkdown>
                                                </pre>
                                              ) : (
                                                <pre className={baseStyles.pre}>{String(v?.content || "")}</pre>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

 export default AdminUserDetailsPage;
