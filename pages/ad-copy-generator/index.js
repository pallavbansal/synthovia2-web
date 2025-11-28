import React from "react";
import Context from "@/context/Context";
import PageHead from "../Head";
import PopupMobileMenu from "@/components/Header/PopUpMobileMenu";
import BackToTop from "../backToTop";
import LeftDashboardSidebar from "@/components/Header/LeftDashboardSidebar";
import HeaderDashboard from "@/components/Header/HeaderDashboard";
import RightDashboardSidebar from "@/components/Header/RightDashboardSidebar";
import Modal from "@/components/Common/Modal";
import StaticbarDashboard from "@/components/Common/StaticBarDashboard";
import AdCopyGeneratorForm from "@/components/AdCopyGenerator/AdCopyGeneratorForm";

const AdCopyGeneratorPage = () => {
  return (
    <>
      <PageHead title="Ad Copy Generator" />
      <main className="page-wrapper rbt-dashboard-page">
        <div className="rbt-panel-wrapper">
          <Context>
            {/* <LeftDashboardSidebar /> */}
            <HeaderDashboard display="" />
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
    </>
  );
};

export default AdCopyGeneratorPage;
