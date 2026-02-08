import dynamic from "next/dynamic";
import React from "react";
import PageHead from "../../../Head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import AdminUsersPage from "@/components/dashboardNew/AdminUsersPage";

const AdminUsersDashboardRoute = () => {
  return (
    <>
      <PageHead title="Admin Users Dashboard" />
      <DashboardLayout title="Admin Users Dashboard">
        <AdminUsersPage />
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(AdminUsersDashboardRoute), { ssr: false });
