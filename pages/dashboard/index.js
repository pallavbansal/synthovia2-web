import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { isAdminAuthenticated } from "@/utils/auth";

const DashboardPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAdminAuthenticated() ? "/admin/users/dashboard" : "/dashboard-overview");
  }, [router]);

  return null;
};

export default DashboardPage;
