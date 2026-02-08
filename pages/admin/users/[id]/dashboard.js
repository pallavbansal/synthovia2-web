import dynamic from "next/dynamic";
import React from "react";
import PageHead from "../../../Head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import AdminUserDetailsPage from "@/components/dashboardNew/AdminUserDetailsPage";

const AdminUserDetailsDashboardRoute = () => {
  return (
    <>
      <PageHead title="Admin User Details" />
      <DashboardLayout title="Admin User Details">
        <AdminUserDetailsPage />
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(AdminUserDetailsDashboardRoute), { ssr: false });
