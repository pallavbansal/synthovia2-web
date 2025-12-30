import { useEffect, useMemo, useState } from "react";
import styles from "./DashboardOverviewPage.module.css";
import API from "@/utils/api";
import { getAuthHeader, getUser } from "@/utils/auth";

const TIMELINES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All" },
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
  const [timeline, setTimeline] = useState("month");
  const initialRange = useMemo(() => getRangeForTimeline("month", now, null), [now]);
  const [startDate, setStartDate] = useState(toDateInputValue(initialRange.start));
  const [endDate, setEndDate] = useState(toDateInputValue(initialRange.end));

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
        url.searchParams.set("timeline", timeline);
        url.searchParams.set("start_date", startDate);
        url.searchParams.set("end_date", endDate);

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

    if (timeline && startDate && endDate) {
      fetchStats();
    }

    return () => {
      cancelled = true;
    };
  }, [timeline, startDate, endDate]);

  const creditsUsed = stats?.credits_usage?.credits_used ?? 0;
  const creditsRemaining = stats?.credits_usage?.credits_remaining ?? 0;
  const creditsTotal = creditsUsed + creditsRemaining;
  const creditsUsedPct = creditsTotal ? Math.round((creditsUsed / creditsTotal) * 100) : 0;
  const creditsRemainingPct = creditsTotal ? 100 - creditsUsedPct : 0;
  const mostUsedToolLabel = stats?.most_used_tool?.label || "Most Used Tool";
  const mostUsedToolName = stats?.most_used_tool?.tool_name || "—";
  const mostUsedToolCount = stats?.most_used_tool?.generation_count ?? 0;

  const recentLogs = useMemo(() => {
    const items = stats?.recent_logs?.items || [];
    return items.slice(0, 6);
  }, [stats]);

  const onTimelineChange = (value) => {
    setTimeline(value);
    const range = getRangeForTimeline(value, new Date(), null);
    setStartDate(toDateInputValue(range.start));
    setEndDate(toDateInputValue(range.end));
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.greeting}>
          <div className={styles.greetingTitle}>Hello, {name}!</div>
          <div className={styles.greetingSub}>
            Here’s your credits usage and recent generation activity.
          </div>
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
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <div>
                <div className={styles.cardTitle}>Credits Usage</div>
                <div className={styles.muted}>Aggregate credits usage per period</div>
              </div>
              <span className={styles.pill}>
                <i className="fa-solid fa-bolt" />
                Usage
              </span>
            </div>

            <div className={styles.filters}>
              <div className={styles.control}>
                <div className={styles.label}>Timeline</div>
                <select
                  className={styles.select}
                  value={timeline}
                  onChange={(e) => onTimelineChange(e.target.value)}
                >
                  {TIMELINES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.control}>
                <div className={styles.label}>Start date</div>
                <input
                  className={styles.input}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className={styles.control}>
                <div className={styles.label}>End date</div>
                <input
                  className={styles.input}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className={styles.control}>
                <div className={styles.label}>Credit value</div>
                <input
                  className={styles.input}
                  readOnly
                  value={loading ? "..." : String(creditsUsed)}
                />
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div className={styles.statsRow}>
              <div>
                <div className={styles.muted}>Total credits used</div>
                <div className={styles.bigNumber}>{loading ? "..." : creditsUsed}</div>
              </div>
              <div className={styles.muted}>
                {loading ? "Loading..." : `${startDate} to ${endDate}`}
              </div>
            </div>

            {error ? <div className={styles.muted} style={{ marginTop: 10 }}>{error}</div> : null}
            {!loading && !error ? (
              <div className={styles.muted} style={{ marginTop: 10 }}>
                Credits remaining: {creditsRemaining}
              </div>
            ) : null}
          </div>

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
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <div>
                <div className={styles.cardTitle}>{mostUsedToolLabel}</div>
                <div className={styles.muted}>Top tool for selected period</div>
              </div>
              <span className={styles.pill}>
                <i className="fa-solid fa-chart-simple" />
                Top
              </span>
            </div>

            <div className={styles.muted}>Tool name</div>
            <div className={styles.toolName}>{loading ? "..." : mostUsedToolName}</div>
            {!loading ? (
              <div className={styles.muted} style={{ marginTop: 8 }}>
                Generations: {mostUsedToolCount}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
