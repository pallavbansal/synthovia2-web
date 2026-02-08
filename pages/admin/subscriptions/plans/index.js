import dynamic from "next/dynamic";
import React from "react";
import PageHead from "../../../Head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import AdminSubscriptionPlansPage from "@/components/dashboardNew/AdminSubscriptionPlansPage";

const AdminSubscriptionPlansRoute = () => {
  return (
    <>
      <PageHead title="Manage Subscription Plans" />
      <DashboardLayout title="Manage Subscription Plans">
        <AdminSubscriptionPlansPage />
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(AdminSubscriptionPlansRoute), { ssr: false });
