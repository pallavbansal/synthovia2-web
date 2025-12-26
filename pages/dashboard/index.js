import React, { useState } from "react";
import Context from "@/context/Context";

const DashboardPage = () => {
  const [timeline, setTimeline] = useState("Today");

  const creditMap = {
    Today: 120,
    "This Week": 540,
    "This Month": 2100,
    All: 8420,
  };

  const recentLogs = [
    { activity: "Used AI Chat Tool", time: "2 mins ago" },
    { activity: "Generated Image", time: "1 hour ago" },
    { activity: "Summarized Document", time: "Yesterday" },
    { activity: "API Credits Deducted", time: "2 days ago" },
  ];

  return (
    <Context>
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c1d] via-[#0e1028] to-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Usage Card */}
        <div className="rounded-2xl bg-[#11122b] border border-purple-500/20 p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Credits Usage</h2>

          <label className="text-sm text-gray-400">Timeline</label>
          <select
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full mt-2 mb-4 bg-[#0b0c1d] border border-purple-500/30 rounded-lg px-3 py-2 focus:outline-none"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>All</option>
          </select>

          <label className="text-sm text-gray-400">Credits Used</label>
          <input
            readOnly
            value={creditMap[timeline]}
            className="w-full mt-2 bg-[#0b0c1d] border border-purple-500/30 rounded-lg px-3 py-2"
          />
        </div>

        {/* Most Used Tool Card */}
        <div className="rounded-2xl bg-[#11122b] border border-purple-500/20 p-6 shadow-lg flex flex-col justify-center">
          <span className="text-sm text-gray-400">Most Used Tool</span>
          <span className="text-2xl font-bold text-purple-400 mt-2">AI Chat Assistant</span>
        </div>

        {/* Recent Logs */}
        <div className="rounded-2xl bg-[#11122b] border border-purple-500/20 p-6 shadow-lg md:col-span-3">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-purple-500/20">
                <th className="pb-2">Activity</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log, index) => (
                <tr
                  key={index}
                  className="border-b border-purple-500/10 text-sm"
                >
                  <td className="py-3">{log.activity}</td>
                  <td className="py-3 text-gray-400">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </Context>
  );
};

export default DashboardPage;
