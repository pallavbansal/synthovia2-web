import React, { useEffect } from "react";
import { useRouter } from "next/router";

const AdminUsersIndexRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/users/dashboard");
  }, [router]);

  return null;
};

export default AdminUsersIndexRedirect;
