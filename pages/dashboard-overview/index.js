import dynamic from "next/dynamic";
import React from "react";
import PageHead from "../Head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import DashboardOverviewPage from "@/components/dashboardNew/DashboardOverviewPage";

const DashboardOverviewRoute = () => {
  return (
    <>
      <PageHead title="Dashboard Overview" />
      <DashboardLayout title="Dashboard Overview">
        <DashboardOverviewPage />
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(DashboardOverviewRoute), { ssr: false });
