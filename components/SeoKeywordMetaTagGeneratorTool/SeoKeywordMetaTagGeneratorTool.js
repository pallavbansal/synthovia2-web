import React from "react";

import UserNav from "../Common/UserNav";
import SeoKeywordMetaTagGeneratorForm from "./SeoKeywordMetaTagGeneratorForm";

const SeoKeywordMetaTagGeneratorTool = () => {
  return (
    <>
      <div className="rbt-main-content mb--0">
        <div className="rbt-daynamic-page-content center-width">
          <div className="rbt-dashboard-content">
            <UserNav title="SEO Keyword & Meta Tag Generator" />

            <div className="content-page pb--50">
              <div className="chat-box-section">
                <SeoKeywordMetaTagGeneratorForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SeoKeywordMetaTagGeneratorTool;
