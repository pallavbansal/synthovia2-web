import dynamic from "next/dynamic";
import React from "react";
import Context from "@/context/Context";

import PageHead from "../Head";

import BackToTop from "../backToTop";
import ScriptWritingGeneratorForm from "@/components/ScriptWritingGenerator/ScriptWritingGeneratorForm";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";
const ScriptWritingGeneratorPage = () => {
  return (
    <>
      <PageHead title="ScriptWriting Generator" />

      <DashboardLayout title="ScriptWriting Generator">
        <main className="page-wrapper rbt-dashboard-page">
          <div className="rbt-panel-wrapper">
            <Context>
              <div className="rbt-main-content">
                <div className="rbt-daynamic-page-content">
                  <div className="rbt-dashboard-content">
                    <div className="content-page">
                      <div className="chat-box-section">
                        <ScriptWritingGeneratorForm />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <BackToTop />
            </Context>
          </div>
        </main>
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(ScriptWritingGeneratorPage), { ssr: false });
