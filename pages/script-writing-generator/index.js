import React from "react";
import Context from "@/context/Context";

import PageHead from "../Head";

import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import BackToTop from "../backToTop";
import HeaderDashboard from "@/components/Header/HeaderDashboard";
import ScriptWritingGeneratorForm from "@/components/ScriptWritingGenerator/ScriptWritingGeneratorForm";
const ScriptWritingGeneratorPage = () => {
  return (
    <>
      <PageHead title="ScriptWriting Generator" />

      <main className="page-wrapper rbt-dashboard-page">
        <div className="rbt-panel-wrapper">
          <Context>
            <HeaderDashboard display="" />

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
    </>
  );
};

export default ScriptWritingGeneratorPage;
