import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DashboardOverviewPage.module.css";
import API from "@/utils/api";
import { getAuthHeader, getUser } from "@/utils/auth";

const TIMELINES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom" },
];

const normalizeToolName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const toNumberSafe = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const niceCeil = (value) => {
  const v = toNumberSafe(value);
  if (v <= 0) return 1;

  const exp = Math.floor(Math.log10(v));
  const base = 10 ** exp;
  const frac = v / base;

  if (frac <= 1) return 1 * base;
  if (frac <= 2) return 2 * base;
  if (frac <= 5) return 5 * base;
  return 10 * base;
};

const CHART_TOOLS = [
  {
    label: "Ad Copy Generator",
    displayLines: ["Ad Copy", "Generator"],
    matches: ["Ad Copy Generator"],
  },
  {
    label: "Copywriting Assistant",
    displayLines: ["Copywriting", "Assistant"],
    matches: ["Copywriting Assistant"],
  },
  {
    label: "Caption & Hashtag Generator",
    displayLines: ["Caption &", "Hashtag", "Generator"],
    matches: ["Caption & Hashtag Generator"],
  },
  {
    label: "Email & Newsletter Writer",
    displayLines: ["Email &", "Newsletter", "Writer"],
    matches: ["Email & Newsletter Writer", "Email & Newsletter Generator"],
  },
  {
    label: "Script & Story Writer",
    displayLines: ["Script &", "Story", "Writer"],
    matches: ["Script & Story Writer", "Script Writer", "Script & Story Writer Tool"],
  },
  {
    label: "SEO Keyword & Meta Tag Generator",
    displayLines: ["SEO", "Keyword &", "Meta Tag", "Generator"],
    matches: [
      "SEO Keyword & Meta Tag Generator",
      "SEO Keyword & Meta Tag Generator Tool",
      "SEO & Keyword Generator",
    ],
  },
];

const pad2 = (n) => String(n).padStart(2, "0");

const toDateInputValue = (d) => {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${year}-${month}-${day}`;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const getRangeForTimeline = (timeline, now, dataMinDate) => {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (timeline === "today") {
    return { start: todayStart, end: todayEnd };
  }

  if (timeline === "week") {
    const start = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    return { start, end: todayEnd };
  }

  if (timeline === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { start, end: todayEnd };
  }

  const start = dataMinDate ? startOfDay(dataMinDate) : todayStart;
  return { start, end: todayEnd };
};

const formatRelative = (ts) => {
  const diff = Date.now() - ts.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 45) return "Just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;

  return ts.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const parseBackendTime = (value) => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();

  const m = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+([+-])(\d{2})(\d{2})$/
  );

  if (m) {
    const datePart = m[1];
    const timePart = m[2];
    const sign = m[3];
    const hh = m[4];
    const mm = m[5];
    const iso = `${datePart}T${timePart}${sign}${hh}:${mm}`;
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date(trimmed);
  if (!Number.isNaN(fallback.getTime())) return fallback;
  return null;
};

const DashboardOverviewPage = () => {
  const user = getUser();
  const name =
    (user &&
      (user.name ||
        user.full_name ||
        user.fullName ||
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.email)) ||
    "User";

  const now = useMemo(() => new Date(), []);
  const [timelineSelection, setTimelineSelection] = useState("month");
  const [timeline, setTimeline] = useState("month");
  const initialRange = useMemo(() => getRangeForTimeline("month", now, null), [now]);
  const [startDate, setStartDate] = useState(toDateInputValue(initialRange.start));
  const [endDate, setEndDate] = useState(toDateInputValue(initialRange.end));

  const [timelineDropdownOpen, setTimelineDropdownOpen] = useState(false);
  const timelineDropdownRef = useRef(null);

  const RECENT_LOGS_PER_PAGE = 5;
  const [recentLogsPage, setRecentLogsPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      setLoading(true);
      setError("");

      try {
        const url = new URL(API.DASHBOARD_STATS);
        if (timelineSelection === "custom") {
          url.searchParams.set("start_date", startDate);
          url.searchParams.set("end_date", endDate);
        } else {
          url.searchParams.set("timeline", timeline);
        }

        url.searchParams.set("per_page", String(RECENT_LOGS_PER_PAGE));
        url.searchParams.set("page", String(recentLogsPage));

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: getAuthHeader(),
          },
        });

        let data;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error((data && data.message) || "Failed to load dashboard stats");
        }

        if (!data || data.status_code !== 1) {
          throw new Error((data && data.message) || "Failed to load dashboard stats");
        }

        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load dashboard stats");
          setStats(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const canFetch =
      timelineSelection === "custom"
        ? Boolean(startDate) && Boolean(endDate)
        : Boolean(timeline);

    if (canFetch) {
      fetchStats();
    }

    return () => {
      cancelled = true;
    };
  }, [timeline, timelineSelection, startDate, endDate, recentLogsPage]);

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (!timelineDropdownRef.current) return;
      if (!timelineDropdownRef.current.contains(event.target)) {
        setTimelineDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setTimelineDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const creditsUsed = stats?.credits_usage?.credits_used ?? 0;
  const creditsRemaining = stats?.credits_usage?.credits_remaining ?? 0;
  const creditsTotal = creditsUsed + creditsRemaining;
  const creditsUsedPct = creditsTotal ? Math.round((creditsUsed / creditsTotal) * 100) : 0;
  const creditsRemainingPct = creditsTotal ? 100 - creditsUsedPct : 0;
  const mostUsedToolLabel = stats?.most_used_tool?.label || "Most Used Tool";
  const mostUsedToolName = stats?.most_used_tool?.tool_name || "—";
  const mostUsedToolCount = stats?.most_used_tool?.generation_count ?? 0;

  const toolsGenerationItems = useMemo(() => {
    const items = stats?.tools_generation_count?.items || [];
    return [...items].sort(
      (a, b) => toNumberSafe(b?.generation_count) - toNumberSafe(a?.generation_count)
    );
  }, [stats]);

  const toolCounts = useMemo(() => {
    const items = stats?.tools_generation_count?.items || [];
    const map = new Map();

    items.forEach((it) => {
      const c = toNumberSafe(it?.generation_count);
      const label = it?.label;
      const toolName = it?.tool_name;
      if (label) map.set(normalizeToolName(label), c);
      if (toolName) map.set(normalizeToolName(toolName), c);
    });

    return CHART_TOOLS.map((t) => {
      const raw =
        t.matches.map((m) => map.get(normalizeToolName(m))).find((v) => v != null) ?? 0;
      const count = toNumberSafe(raw);
      return { label: t.label, displayLines: t.displayLines, count };
    });
  }, [stats]);

  const toolsMaxCount = useMemo(() => {
    if (!toolsGenerationItems.length) return 0;
    return toolsGenerationItems.reduce(
      (max, item) => Math.max(max, toNumberSafe(item?.generation_count)),
      0
    );
  }, [toolsGenerationItems]);

  const chartMax = useMemo(() => {
    const max = toolCounts.reduce((m, t) => Math.max(m, toNumberSafe(t.count)), 0);

    const MULTIPLIER = 1.25;
    const TICK_COUNT = 5;

    const scaledMax = Math.max(1, max * MULTIPLIER);
    const step = niceCeil(scaledMax / (TICK_COUNT - 1));
    return step * (TICK_COUNT - 1);
  }, [toolCounts]);

  const chartTicks = useMemo(() => {
    const TICK_COUNT = 5;
    const step = chartMax / (TICK_COUNT - 1);
    return Array.from({ length: TICK_COUNT }, (_, idx) => Math.round(chartMax - idx * step));
  }, [chartMax]);

  const hasToolUsage = useMemo(() => {
    return toolCounts.some((t) => toNumberSafe(t.count) > 0);
  }, [toolCounts]);

  const recentLogs = useMemo(() => {
    const items = stats?.recent_logs?.items || [];
    return items;
  }, [stats]);

  const recentLogsPagination = stats?.recent_logs?.pagination || null;
  const recentLogsCurrentPage = Number(recentLogsPagination?.current_page) || recentLogsPage;
  const recentLogsLastPage = Number(recentLogsPagination?.last_page) || recentLogsCurrentPage;
  const canGoPrev = Boolean(recentLogsPagination?.prev_page_url) || recentLogsCurrentPage > 1;
  const canGoNext = Boolean(recentLogsPagination?.next_page_url) || recentLogsCurrentPage < recentLogsLastPage;

  const onTimelineChange = (value) => {
    setRecentLogsPage(1);
    setTimelineSelection(value);
    if (value === "custom") {
      setTimeline("all");
      return;
    }
    setTimeline(value);
    const range = getRangeForTimeline(value, new Date(), null);
    setStartDate(toDateInputValue(range.start));
    setEndDate(toDateInputValue(range.end));
  };

  const timelineSelectedLabel =
    TIMELINES.find((t) => t.value === timelineSelection)?.label || "Select an option";

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.greeting}>
          <div className={styles.greetingTitle}>Welcome Back, {name}!</div>
          <div className={styles.greetingSub}>
            Here’s your credits usage and recent generation activity.
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filters}>
          <div className={styles.control}>
            <div className={styles.label}>Timeline</div>
            <div className={styles.timelineDropdown} ref={timelineDropdownRef}>
              <button
                type="button"
                className={`${styles.timelineDropdownBtn} ${timelineDropdownOpen ? styles.timelineDropdownBtnOpen : ""}`.trim()}
                aria-haspopup="listbox"
                aria-expanded={timelineDropdownOpen}
                onClick={() => setTimelineDropdownOpen((v) => !v)}
              >
                <span className={styles.timelineDropdownBtnLabel}>{timelineSelectedLabel}</span>
                <span
                  className={`${styles.timelineDropdownCaret} ${timelineDropdownOpen ? styles.timelineDropdownCaretOpen : ""}`.trim()}
                  aria-hidden="true"
                />
              </button>

              {timelineDropdownOpen ? (
                <div className={styles.timelineDropdownMenu} role="listbox" aria-label="Timeline">
                  {TIMELINES.map((t) => {
                    const active = timelineSelection === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`${styles.timelineDropdownOption} ${active ? styles.timelineDropdownOptionActive : ""}`.trim()}
                        onClick={() => {
                          onTimelineChange(t.value);
                          setTimelineDropdownOpen(false);
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {timelineSelection === "custom" ? (
            <>
              <div className={styles.control}>
                <div className={styles.label}>Start date</div>
                <input
                  className={styles.input}
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setRecentLogsPage(1);
                    setStartDate(e.target.value);
                  }}
                />
              </div>

              <div className={styles.control}>
                <div className={styles.label}>End date</div>
                <input
                  className={styles.input}
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setRecentLogsPage(1);
                    setEndDate(e.target.value);
                  }}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.creditCards}>
        <div className={`${styles.creditCard} ${styles.creditCardUsed}`}>
          <div className={styles.creditCardHeader}>
            <div className={styles.creditIcon} aria-hidden="true">
              <i className="fa-solid fa-bolt" />
            </div>
            <div>
              <div className={styles.creditLabel}>Credit Used</div>
              <div className={styles.creditSub}>
                {loading ? "Loading..." : creditsTotal ? `${creditsUsedPct}% used` : "—"}
              </div>
            </div>
          </div>
          <div className={styles.creditValue}>{loading ? "..." : creditsUsed}</div>
          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${creditsUsedPct}%` }} />
          </div>
        </div>

        <div className={`${styles.creditCard} ${styles.creditCardRemaining}`}>
          <div className={styles.creditCardHeader}>
            <div className={styles.creditIcon} aria-hidden="true">
              <i className="fa-solid fa-battery-three-quarters" />
            </div>
            <div>
              <div className={styles.creditLabel}>Credit Remaining</div>
              <div className={styles.creditSub}>
                {loading ? "Loading..." : creditsTotal ? `${creditsRemainingPct}% remaining` : "—"}
              </div>
            </div>
          </div>
          <div className={styles.creditValue}>{loading ? "..." : creditsRemaining}</div>
          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${creditsRemainingPct}%` }} />
          </div>
        </div>

        <div className={`${styles.creditCard} ${styles.creditCardTopTool}`}>
          <div className={styles.creditCardHeader}>
            <div className={styles.creditIcon} aria-hidden="true">
              <i className="fa-solid fa-chart-simple" />
            </div>
            <div>
              <div className={styles.creditLabel}>{mostUsedToolLabel}</div>
              <div className={styles.creditSub}>
                {loading ? "Loading..." : mostUsedToolName}
              </div>
            </div>
          </div>
          <div className={styles.creditValue}>{loading ? "..." : mostUsedToolCount}</div>
          <div className={styles.muted}>Generations</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>AI Tools Usage</div>
            </div>

            {loading ? (
              <div className={styles.muted}>Loading...</div>
            ) : error ? (
              <div className={styles.muted}>{error}</div>
            ) : hasToolUsage ? (
              <div className={styles.columnChart}>
                <div className={styles.yAxis} aria-hidden="true">
                  {chartTicks.map((t) => (
                    <div key={t} className={styles.yTick}>
                      {t}
                    </div>
                  ))}
                </div>

                <div className={styles.plotArea}>
                  <div className={styles.plotCanvas}>
                    <div className={styles.axisLines} aria-hidden="true">
                      <div className={styles.yAxisLine} />
                      <div className={styles.xAxisLine} />
                    </div>

                    <div className={styles.gridLines} aria-hidden="true">
                      {chartTicks.slice(0, 4).map((t) => (
                        <div key={t} className={styles.gridLine} />
                      ))}
                    </div>

                    <div className={styles.bars}>
                      {toolCounts.map((t) => {
                        const count = toNumberSafe(t.count);
                        const clamped = Math.max(0, count);
                        const rawPct = chartMax ? (clamped / chartMax) * 100 : 0;
                        const heightPct =
                          clamped > 0 ? Math.min(100, Math.max(2, Math.round(rawPct))) : 0;
                        return (
                          <div className={styles.barColPlot} key={t.label}>
                            <div className={styles.barValue}>{t.count}</div>
                            <div className={styles.barTrack} aria-hidden="true">
                              <div className={styles.barFill} style={{ height: `${heightPct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.xLabels}>
                    {toolCounts.map((t) => (
                      <div className={styles.barLabel} key={`${t.label}-label`} title={t.label}>
                        {t.displayLines && t.displayLines.length
                          ? t.displayLines.map((line, idx) => (
                              <span key={`${t.label}-line-${idx}`}>
                                {line}
                                {idx < t.displayLines.length - 1 ? <br /> : null}
                              </span>
                            ))
                          : t.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.muted}>No tool usage in this range.</div>
            )}
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <div>
                <div className={styles.cardTitle}>Recent Log</div>
                <div className={styles.muted}>Last generation activities</div>
              </div>
            </div>

            <div className={styles.list}>
              {loading ? (
                <div className={styles.muted}>Loading...</div>
              ) : recentLogs.length ? (
                recentLogs.map((a, idx) => {
                  const parsed = parseBackendTime(a.activity_time);
                  return (
                    <div className={styles.listItem} key={`${a.activity_time}-${idx}`}>
                      <div className={styles.listLeft}>
                        <div className={styles.activity}>{a.activity_label}</div>
                      </div>
                      <div className={styles.time}>
                        {parsed ? formatRelative(parsed) : String(a.activity_time || "")}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.muted}>No recent activity in this range.</div>
              )}
            </div>

            <div className={styles.paginationRow}>
              <button
                type="button"
                className={styles.paginationBtn}
                onClick={() => setRecentLogsPage((p) => Math.max(1, p - 1))}
                disabled={loading || !canGoPrev}
              >
                Prev
              </button>
              <div className={styles.paginationInfo}>
                Page {recentLogsCurrentPage} of {recentLogsLastPage}
              </div>
              <button
                type="button"
                className={styles.paginationBtn}
                onClick={() => setRecentLogsPage((p) => p + 1)}
                disabled={loading || !canGoNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;