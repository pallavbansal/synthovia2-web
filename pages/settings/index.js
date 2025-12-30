import dynamic from "next/dynamic";
import React from "react";
import PageHead from "../Head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";

const SettingsPage = () => {
  return (
    <>
      <PageHead title="Settings" />
      <DashboardLayout title="Settings">
        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 18,
            padding: 14,
            backdropFilter: "blur(10px)",
            color: "rgba(255, 255, 255, 0.92)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
            Settings
          </div>
          <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 13 }}>
            Settings page placeholder.
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(SettingsPage), { ssr: false });
