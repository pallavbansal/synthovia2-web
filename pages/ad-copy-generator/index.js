import dynamic from "next/dynamic";
import React from "react";
import Context from "@/context/Context";
import PageHead from "../Head";
import BackToTop from "../backToTop";
import AdCopyGeneratorForm from "@/components/AdCopyGenerator/AdCopyGeneratorForm";
import DashboardLayout from "@/components/dashboardNew/DashboardLayout";

const AdCopyGeneratorPage = () => {
  return (
    <>
      <PageHead title="Ad Copy Generator" />
      <DashboardLayout title="Ad Copy Generator">
        <main className="page-wrapper rbt-dashboard-page">
          <div className="rbt-panel-wrapper">
            <Context>
              {/* <LeftDashboardSidebar /> */}
              {/* <RightDashboardSidebar /> */}
              {/* <Modal />
              <PopupMobileMenu /> */}

              <div className="rbt-main-content">
                <div className="rbt-daynamic-page-content">
                  <div className="rbt-dashboard-content">
                    <div className="content-page">
                      <div className="chat-box-section">
                        <div className="rbt-card">
                          <div className="rbt-card-body">
                            <AdCopyGeneratorForm />
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

export default dynamic(() => Promise.resolve(AdCopyGeneratorPage), { ssr: false });
