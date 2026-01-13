// pages/copywriting-assistant/index.js
import dynamic from "next/dynamic";
import React from "react";
import Context from "@/context/Context";
import PageHead from "../Head";
import CopywritingAssistantForm from "@/components/CopywritingAssistant/CopywritingAssistantForm";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";

const CopywritingAssistantPage = () => {
  return (
    <>
      <PageHead title="Copywriting Assistant Tool" />
      <DashboardLayout title="Copywriting Assistant Tool">
        <main className="page-wrapper rbt-dashboard-page">
          <div className="rbt-panel-wrapper">
            <Context>
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
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(CopywritingAssistantPage), { ssr: false });