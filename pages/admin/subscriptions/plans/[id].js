import dynamic from "next/dynamic";
import React from "react";
import PageHead from "../../../Head";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
import AdminSubscriptionPlanViewPage from "@/components/dashboardNew/AdminSubscriptionPlanViewPage";

const AdminSubscriptionPlanDetailsRoute = () => {
  return (
    <>
      <PageHead title="Subscription Plan Details" />
      <DashboardLayout title="Subscription Plan Details">
        <AdminSubscriptionPlanViewPage />
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(AdminSubscriptionPlanDetailsRoute), { ssr: false });
