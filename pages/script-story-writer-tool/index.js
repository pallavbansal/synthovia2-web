import React from "react";
import PageHead from "../Head";
import Context from "@/context/Context";
import HeaderDashboard from "@/components/Header/HeaderDashboard";
import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import LeftDashboardSidebar from "@/components/Header/LeftDashboardSidebar";
import ScriptStoryWriterTool from "@/components/ScriptStoryWriterTool/ScriptStoryWriterTool";

const ScriptStoryWriterToolPage = () => {
  return (
    <>
      <PageHead title="Script & Story Writer Tool" />

      <main className="page-wrapper rbt-dashboard-page">
        <Context>
          <div className="rbt-panel-wrapper">
            <HeaderDashboard display="d-none" />
            <PopupMobileMenu />
            <LeftDashboardSidebar />

            <ScriptStoryWriterTool />
          </div>
        </Context>
      </main>
    </>
  );
};

export default ScriptStoryWriterToolPage;
