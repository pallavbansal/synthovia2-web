import dynamic from "next/dynamic";
import React from "react";
import PageHead from "../Head";
import Context from "@/context/Context";
import ScriptStoryWriterTool from "@/components/ScriptStoryWriterTool/ScriptStoryWriterTool";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";

const ScriptStoryWriterToolPage = () => {
  return (
    <>
      <PageHead title="Script & Story Writer Tool" />

      <DashboardLayout title="Script & Story Writer Tool">
        <main className="page-wrapper rbt-dashboard-page">
          <Context>
            <div className="rbt-panel-wrapper">
              <ScriptStoryWriterTool />
            </div>
          </Context>
        </main>
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(ScriptStoryWriterToolPage), { ssr: false });
