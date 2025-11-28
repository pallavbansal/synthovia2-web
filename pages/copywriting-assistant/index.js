// pages/copywriting-assistant/index.js
import React from "react";
import Context from "@/context/Context";
import PageHead from "../Head";
import HeaderDashboard from "@/components/Header/HeaderDashboard";
import CopywritingAssistantForm from "@/components/CopywritingAssistant/CopywritingAssistantForm";

const CopywritingAssistantPage = () => {
  return (
    <>
      <PageHead title="Copywriting Assistant Tool" />
      <main className="page-wrapper rbt-dashboard-page">
        <div className="rbt-panel-wrapper">
          <Context>
            <HeaderDashboard display="" />
            <div className="rbt-main-content">
              <div className="rbt-daynamic-page-content">
                <div className="rbt-dashboard-content">
                  <div className="chat-box-section">
                    <div className="rbt-card">
                      <div className="rbt-card-body">
                        <CopywritingAssistantForm />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Context>
        </div>
      </main>
    </>
  );
};

export default CopywritingAssistantPage;