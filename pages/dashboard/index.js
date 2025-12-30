import React, { useEffect } from "react";
import { useRouter } from "next/router";

const DashboardPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard-overview");
  }, [router]);

  return null;
};

export default DashboardPage;
