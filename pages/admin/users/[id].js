import dynamic from "next/dynamic";
import React from "react";
import { useRouter } from "next/router";

const AdminUserDetailsRoute = () => {
  const router = useRouter();

  React.useEffect(() => {
    if (!router.isReady) return;
    const id = router?.query?.id;
    if (!id) return;
    router.replace(`/admin/users/${id}/dashboard`);
  }, [router.isReady, router.query?.id]);

  return (
    <>
      <div />
    </>
  );
};

export default dynamic(() => Promise.resolve(AdminUserDetailsRoute), { ssr: false });
