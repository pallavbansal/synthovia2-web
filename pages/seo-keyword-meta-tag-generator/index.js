import React from "react";
import PageHead from "../Head";
import Context from "@/context/Context";
import HeaderDashboard from "@/components/Header/HeaderDashboard";
import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import LeftDashboardSidebar from "@/components/Header/LeftDashboardSidebar";
import SeoKeywordMetaTagGeneratorTool from "@/components/SeoKeywordMetaTagGeneratorTool/SeoKeywordMetaTagGeneratorTool";

const SeoKeywordMetaTagGeneratorPage = () => {
  return (
    <>
      <PageHead title="SEO Keyword & Meta Tag Generator" />

      <main className="page-wrapper rbt-dashboard-page">
        <Context>
          <div className="rbt-panel-wrapper">
            <HeaderDashboard display="d-none" />
            <PopupMobileMenu />
            <LeftDashboardSidebar />

            <SeoKeywordMetaTagGeneratorTool />
          </div>
        </Context>
      </main>
    </>
  );
};

export default SeoKeywordMetaTagGeneratorPage;
