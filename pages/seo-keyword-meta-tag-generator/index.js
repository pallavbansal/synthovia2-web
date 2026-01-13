import dynamic from "next/dynamic";
import React from "react";
import PageHead from "../Head";
import Context from "@/context/Context";
import SeoKeywordMetaTagGeneratorTool from "@/components/SeoKeywordMetaTagGeneratorTool/SeoKeywordMetaTagGeneratorTool";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";

const SeoKeywordMetaTagGeneratorPage = () => {
  return (
    <>
      <PageHead title="SEO Keyword & Meta Tag Generator" />

      <DashboardLayout title="SEO Keyword & Meta Tag Generator">
        <main className="page-wrapper rbt-dashboard-page">
          <Context>
            <div className="rbt-panel-wrapper">
              <SeoKeywordMetaTagGeneratorTool />
            </div>
          </Context>
        </main>
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(SeoKeywordMetaTagGeneratorPage), { ssr: false });
