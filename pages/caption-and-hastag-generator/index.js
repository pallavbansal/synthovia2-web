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
              <div className="rbt-main-content">
                <div className="rbt-daynamic-page-content">
                  <div className="rbt-dashboard-content">
                 
                          <div className="rbt-card-body">
                            <Captionandhastaggeneratorform />
                          </div>
                    
                  </div>
                </div>
              </div>

              <BackToTop />
            </Context>
          </div>
        </main>
        <style jsx global>{`
          [data-dashboard-layout='new'] .rbt-main-content {
            margin-top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          [data-dashboard-layout='new'] .rbt-panel-wrapper,
          [data-dashboard-layout='new'] .rbt-dashboard-content,
          [data-dashboard-layout='new'] .rbt-daynamic-page-content,
          [data-dashboard-layout='new'] .content-page {
            width: 100% !important;
          }
          [data-dashboard-layout='new'] .rbt-card-body {
            overflow-x: visible !important;
          }

          /* Ensure form grid is responsive even if Bootstrap grid isn't present */
          [data-dashboard-layout='new'] .rbt-card-body .row {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
          }
          [data-dashboard-layout='new'] .rbt-card-body .col-12 {
            width: 100%;
          }
          [data-dashboard-layout='new'] .rbt-card-body .col-md-6 {
            width: 100%;
          }
          @media (min-width: 992px) {
            [data-dashboard-layout='new'] .rbt-card-body .col-md-6 {
              width: calc(50% - 8px);
            }
          }
          /* Prevent any inner container from exceeding viewport width */
          [data-dashboard-layout='new'] .rbt-dashboard-content,
          [data-dashboard-layout='new'] .rbt-daynamic-page-content,
          [data-dashboard-layout='new'] .content-page,
          [data-dashboard-layout='new'] .chat-box-section,
          [data-dashboard-layout='new'] .rbt-card,
          [data-dashboard-layout='new'] .rbt-card-body {
            max-width: 100% !important;
          }
        `}</style>
      </DashboardLayout>
    </>
  );
};

export default dynamic(() => Promise.resolve(CaptionandhastaggeneratorPage), { ssr: false });
