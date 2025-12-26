import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import UserNav from "../Common/UserNav";
import API from "@/utils/api";
import { getAuthHeader } from "@/utils/auth";

const timelineOptions = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All", value: "all" },
];

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hours ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleString();
};

const toolRouteFromKey = (toolKey) => {
  const key = String(toolKey || "").toLowerCase();
  if (!key) return "";

  const map = {
    copywriting: "/copywriting-assistant",
    "copywriting-assistant": "/copywriting-assistant",
    "ad-copy": "/ad-copy-generator",
    "ad-copy-generator": "/ad-copy-generator",
    email: "/email-generator",
    "email-generator": "/email-generator",
    caption: "/caption-and-hastag-generator",
    "caption-and-hastag": "/caption-and-hastag-generator",
    "caption-and-hashtag": "/caption-and-hastag-generator",
    seo: "/seo-keyword-meta-tag-generator",
    script: "/script-story-writer-tool",
    story: "/script-story-writer-tool",
  };

  return map[key] || "";
};

const DashboardOverview = () => {
  const router = useRouter();

  const [timeline, setTimeline] = useState("today");
  const [creditsUsed, setCreditsUsed] = useState(null);
  const [mostUsedTool, setMostUsedTool] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mostUsedToolLink = useMemo(() => {
    if (!mostUsedTool) return "";
    return (
      mostUsedTool.link ||
      toolRouteFromKey(mostUsedTool.key) ||
      toolRouteFromKey(mostUsedTool.name)
    );
  }, [mostUsedTool]);

  const fetchJson = useCallback(async (url) => {
    const response = await fetch(url, {
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
      throw new Error((data && data.message) || "Failed to load dashboard data");
    }

    return data;
  }, []);

  const loadDashboard = useCallback(
    async (selectedTimeline) => {
      if (!API.DASHBOARD_CREDIT_USAGE || !API.DASHBOARD_MOST_USED_TOOL || !API.DASHBOARD_ACTIVITY_LOGS) {
        setError("Dashboard APIs are not configured.");
        return;
      }

      setError("");
      setLoading(true);

      try {
        const creditUrl = `${API.DASHBOARD_CREDIT_USAGE}?timeline=${encodeURIComponent(
          selectedTimeline
        )}`;

        const [creditData, mostUsedData, logsData] = await Promise.all([
          fetchJson(creditUrl),
          fetchJson(API.DASHBOARD_MOST_USED_TOOL),
          fetchJson(`${API.DASHBOARD_ACTIVITY_LOGS}?limit=10`),
        ]);

        const creditValue =
          creditData?.data?.credits_used ??
          creditData?.credits_used ??
          creditData?.data?.credits ??
          creditData?.credits ??
          null;

        setCreditsUsed(
          typeof creditValue === "number" || typeof creditValue === "string"
            ? creditValue
            : null
        );

        const toolPayload = mostUsedData?.data || mostUsedData;
        setMostUsedTool({
          name: toolPayload?.tool_name || toolPayload?.name || "-",
          key: toolPayload?.tool_key || toolPayload?.key || "",
          link: toolPayload?.tool_link || toolPayload?.link || "",
        });

        const logsPayload = logsData?.data?.logs || logsData?.data || logsData?.logs || [];
        setActivityLogs(Array.isArray(logsPayload) ? logsPayload : []);
      } catch (e) {
        setError(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    },
    [fetchJson]
  );

  useEffect(() => {
    loadDashboard(timeline);
  }, [timeline, loadDashboard]);

  const handleMostUsedClick = () => {
    if (!mostUsedToolLink) return;
    router.push(mostUsedToolLink);
  };

  return (
    <>
      <div className="rbt-main-content mb--0">
        <div className="rbt-daynamic-page-content center-width">
          <div className="rbt-dashboard-content">
            <UserNav title="Dashboard" />

            <div className="content-page pb--50">
              <div className="chat-box-list">
                <div className="single-settings-box sessions-box overflow-hidden">
                  <div className="section-title d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="title mb--0">Credits Usage</h4>
                      <p className="description mb--0">Track your credit consumption</p>
                    </div>

                    <div className="d-flex align-items-center" style={{ gap: 12 }}>
                      <div className="rbt-modern-select bg-transparent height-45">
                        <select
                          value={timeline}
                          onChange={(e) => setTimeline(e.target.value)}
                          disabled={loading}
                        >
                          {timelineOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        className="btn-default btn-small round"
                        onClick={() => loadDashboard(timeline)}
                        disabled={loading}
                        type="button"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="rbt-sm-separator mt-0"></div>

                  {error ? <p className="desc">{error}</p> : null}

                  <div className="list-card-grp">
                    <div className="list-card">
                      <div className="inner">
                        <div className="left-content">
                          <div className="content-section">
                            <h6 className="title">Credits Consumed</h6>
                            <p className="desc">
                              {loading ? "Loading..." : creditsUsed ?? "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="list-card style-two"
                      role="button"
                      tabIndex={0}
                      onClick={handleMostUsedClick}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleMostUsedClick();
                      }}
                    >
                      <div className="inner">
                        <div className="left-content">
                          <div className="content-section">
                            <h6 className="title">Most Used Tool</h6>
                            <p className="b4">{mostUsedTool?.name || "-"}</p>
                          </div>
                        </div>
                        <div className="right-content">
                          <button
                            className="btn-default btn-border round"
                            type="button"
                            disabled={!mostUsedToolLink}
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="single-settings-box sessions-box overflow-hidden mt--30">
                  <div className="section-title">
                    <h4 className="title mb--0">Recent Logs</h4>
                    <p className="description">Your most recent activities</p>
                  </div>

                  <div className="rbt-sm-separator mt-0"></div>

                  <div className="list-card-grp">
                    {loading && !activityLogs?.length ? (
                      <p className="desc">Loading...</p>
                    ) : activityLogs?.length ? (
                      activityLogs.map((log, idx) => {
                        const toolName =
                          log?.tool_name || log?.tool || log?.toolTitle || "Tool";
                        const credits =
                          log?.credits_used ?? log?.credits ?? log?.credit ?? null;
                        const ts = log?.timestamp || log?.created_at || log?.time;

                        const label = log?.label || log?.activity || log?.message;
                        const fallbackLabel = `${toolName} used`;

                        return (
                          <div className="list-card" key={log?.id || idx}>
                            <div className="inner">
                              <div className="left-content">
                                <div className="content-section">
                                  <h6 className="title">{label || fallbackLabel}</h6>
                                  <p className="desc">
                                    {credits !== null && credits !== undefined
                                      ? `${credits} credits consumed`
                                      : ""}
                                    {ts ? ` — ${formatTimeAgo(ts)}` : ""}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="desc">No recent activity found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardOverview;
