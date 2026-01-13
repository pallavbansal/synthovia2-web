import dynamic from "next/dynamic";
import React from "react";
import Context from "@/context/Context";
import PageHead from "../Head";
import BackToTop from "../backToTop";
import Captionandhastaggeneratorform from "@/components/Captionandhastaggenerator/CaptionandhastaggeneratorForm";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";

const CaptionandhastaggeneratorPage = () => {
  return (
    <>
      <PageHead title="Caption and hastag generator" />
      <DashboardLayout title="Caption and hastag generator">
        <main className="page-wrapper rbt-dashboard-page">
          <div className="rbt-panel-wrapper">
            <Context>
              {/* <LeftDashboardSidebar /> */}
              {/* <RightDashboardSidebar />
              <Modal />
              <PopupMobileMenu /> */}

              <div className="rbt-main-content">
                <div className="rbt-daynamic-page-content">
                  <div className="rbt-dashboard-content">
                    <div className="content-page">
                      <div className="chat-box-section">
                        <div className="rbt-card">
                          <div className="rbt-card-body">
                            <Captionandhastaggeneratorform />
                          </div>
                        </div>
                        {/* <StaticbarDashboard /> */}
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

export default dynamic(() => Promise.resolve(CaptionandhastaggeneratorPage), { ssr: false });
