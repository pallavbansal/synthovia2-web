import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Sal from "sal.js";
import { isAuthenticated } from "@/utils/auth";

import PricingData from "../../data/pricing.json";

import SplitImg from "../../public/images/split/split-2.png";
import SplitLogo from "../../public/images/split/split-2-logo.png";
import DarkSplitImg from "../../public/images/light/split/split-2.png";
import DarkSplitLogo from "../../public/images/light/split/split-2-logo.png";
import bannerImg from "../../public/images/bg/slider-main-image.png";
import bannerWhiteImg from "../../public/images/light/bg/slider-main-image.png";
import shapeOne from "../../public/images/bg/icon-shape/icon-shape-one.png";
import shapeTwo from "../../public/images/bg/icon-shape/icon-shape-two.png";
import shapeThree from "../../public/images/bg/icon-shape/icon-shape-three.png";
import shapeFour from "../../public/images/bg/icon-shape/icon-shape-four.png";
import bgShape from "../../public/images/bg/split-bg-shape.png";
import bgShapeOne from "../../public/images/bg/bg-shape-four.png";
import bgShapeTwo from "../../public/images/bg/bg-shape-five.png";
import bgShapeThree from "../../public/images/bg/bg-shape-two.png";

import BrandList from "../Brands/BrandList";
import TabStyleOne from "../TabStyles/TabStyle-One";
import ServiceStyleOne from "../Services/ServiceStyle-One";
import AdvanceTab from "../TabStyles/AdvanceTab";
import CtaOne from "../CallToActions/Cta-One";
import Pricing from "../Pricing/Pricing";
import ServiceTwo from "../Services/Service-Two";
import Testimonial from "../Testimonials/Testimonial";
import BrandTwo from "../Brands/Brand-Two";
import CtaTwo from "../CallToActions/Cta-Two";
import { useAppContext } from "@/context/Context";

const mobileStyles = `
  @media (max-width: 767px) {
    .mobile-banner-enhance {
      width: 100% !important;
      max-width: 100% !important;
      margin-left: 0 !important;
      border: none !important;
      background: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    .mobile-banner-enhance::before,
    .mobile-banner-enhance::after {
      display: none !important;
    }
    .img-container-mobile-banner {
      overflow: hidden;
      border: none !important;
      background: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    .img-container-mobile-banner::before,
    .img-container-mobile-banner::after {
      display: none !important;
    }
  }
`;

const Home = () => {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const { isLightTheme } = useAppContext();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    Sal();
    setAuthed(isAuthenticated());

    const intervalId = setInterval(() => {
      setVisibleIndex((prevIndex) => (prevIndex + 1) % 3);
    }, 2000);


    // Scroll-to-hash support for #pricing and #features
    const scrollToHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      if (!hash) return;
      const id = hash.replace(/^#/, "");
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // run once on mount in case link navigated here with hash
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  const styles = {
    glasstext: {
      color: "rgba(255, 255, 255, 0.9)",
      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textShadow: "0 0 40px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.3)",
      filter: "drop-shadow(0 4px 20px rgba(255, 255, 255, 0.15))",
    },
    gradientText: {
      background: "linear-gradient(90deg,#c77dff,#9d4edd,#7b2cbf)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      position: "relative",
    },
    fontLarge: {
      fontSize: "xxx-large",
    },
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      <div
        className="slider-area slider-style-1 variation-default slider-bg-image bg-banner1 slider-bg-shape"
        data-black-overlay="1"
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <div className="inner text-center mt--140">
                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#1e1e1e', padding: '8px 18px', borderRadius: '50px', marginBottom: '24px', border: '1px solid #333' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: '#00d26a', borderRadius: '50%', marginRight: '10px', boxShadow: '0 0 10px rgba(0, 210, 106, 0.5)' }}></span>
                  <span style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px' }}>Six focused AI tools for marketing content</span>
                </div>
                <h1 className="title display-one" style={{ ...styles.glasstext, ...styles.fontLarge }}>
                  Generate Marketing<br /> Content in Minutes,<br /><span style={styles.gradientText}> Not Hours</span>

                  {/* <br /> */}
                  {/* {" "}
                  <span className="header-caption">
                    <span className="cd-headline rotate-1">
                      <span className="cd-words-wrapper">
                        <b
                          className={
                            visibleIndex === 0
                              ? "is-visible theme-gradient"
                              : "is-hidden theme-gradient"
                          }
                        >
                          AI Chating
                        </b>
                        <b
                          className={
                            visibleIndex === 1
                              ? "is-visible theme-gradient"
                              : "is-hidden theme-gradient"
                          }
                        >
                          AI Writing
                        </b>
                        <b
                          className={
                            visibleIndex === 2
                              ? "is-visible theme-gradient"
                              : "is-hidden theme-gradient"
                          }
                        >
                          AI Chating
                        </b>
                      </span>
                    </span>
                  </span>{" "}
                  AI Hack */}
                </h1>
                <p className="description" style={{ ...styles.glasstext }}>
                  Tell Synthovia your goal, audience, and tone. <br />{" "}
                  Get ad copy, captions, emails, SEO, and scripts that are ready to publish.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '0px', flexWrap: 'wrap' }}>
                  <Link
                    href={authed ? "/dashboard-overview" : "/signup"}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '16px',
                      padding: '12px 28px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4338ca';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#4f46e5';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    Start creating <span style={{ marginLeft: '6px', fontSize: '18px' }}>&rarr;</span>
                  </Link>
                  <a
                    href="#features"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '16px',
                      padding: '12px 28px',
                      borderRadius: '8px',
                      border: '1px solid #4b5563',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.border = '1px solid #9ca3af';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.border = '1px solid #4b5563';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    See the tools
                  </a>
                </div>
                <div className="inner-shape">
                  <Image
                    src={shapeOne}
                    width={100}
                    height={95}
                    alt="Icon Shape"
                    className="iconshape iconshape-one"
                  />
                  <Image
                    src={shapeTwo}
                    width={60}
                    height={57}
                    alt="Icon Shape"
                    className="iconshape iconshape-two"
                  />
                  <Image
                    src={shapeThree}
                    width={42}
                    height={31}
                    alt="Icon Shape"
                    className="iconshape iconshape-three"
                  />
                  <Image
                    src={shapeFour}
                    width={100}
                    height={95}
                    alt="Icon Shape"
                    className="iconshape iconshape-four"
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-11 col-xl-11 justify-content-center img-container-mobile-banner">
              <Image
                className="slider-image-effect mobile-banner-enhance"
                src={isLightTheme ? bannerImg : bannerWhiteImg}
                width={1055}
                height={898}
                alt="Banner Images"
                priority
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '15px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '10px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#161618',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '30px',
                  padding: '12px 32px',
                  gap: '24px',
                  flexWrap: 'wrap',
                  maxWidth: '100%',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#e4e4e7', fontSize: '15px', fontWeight: '500' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '8px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                    </svg>
                    No prompt skills needed
                  </div>
                  <span style={{ color: '#52525b' }}>&bull;</span>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#e4e4e7', fontSize: '15px', fontWeight: '500' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '8px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                    </svg>
                    Built for real marketing use
                  </div>
                  <span style={{ color: '#52525b' }}>&bull;</span>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#e4e4e7', fontSize: '15px', fontWeight: '500' }}>
                    <svg style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '8px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                    </svg>
                    India & global pricing
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="bg-shape">
          <Image
            className="bg-shape-one"
            width={640}
            height={949}
            src={bgShapeOne}
            alt="Bg Shape"
          />
          <Image
            className="bg-shape-two"
            src={bgShapeTwo}
            width={626}
            height={1004}
            alt="Bg Shape"
          />
        </div>
      </div>

      {/* <div className="rainbow-brand-area rainbow-section-gap">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div
                className="section-title rating-title text-center sal-animate"
                data-sal="slide-up"
                data-sal-duration="700"
                data-sal-delay="100"
              >
                <p className="b1 mb--0 small-title">
                  truest 800,000+ HIGHLY PRODUCTIVE Company
                </p>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12 mt--10">
              <BrandList />
            </div>
          </div>
        </div>
      </div> */}

      <div id="features" className="rainbow-service-area rainbow-section-gap">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div
                className="section-title text-center pb--60"
                data-sal="slide-up"
                data-sal-duration="700"
                data-sal-delay="100"
              >
                <h4 className="subtitle">
                  <span className="theme-gradient">
                    SIX TOOLS ONE CONTENT ENGINE.
                  </span>
                </h4>
                <h2 className="title mb--0">
                  Generative AI made for <br /> creators.
                </h2>
              </div>
            </div>
          </div>
          <TabStyleOne />
        </div>
      </div>

      <div className="rainbow-service-area rainbow-section-gap rainbow-section-gapBottom-big">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div
                className="section-title text-left"
                data-sal="slide-up"
                data-sal-duration="400"
                data-sal-delay="150"
              >
                <h4 className="subtitle">
                  <span className="theme-gradient">Powering Content Worldwide</span>
                </h4>
                <h2 className="title mb--60">
                  Why Synthovia <br /> Start Publishing
                </h2>
              </div>
            </div>
          </div>
        </div>
        <ServiceStyleOne />
      </div>

      <div id="how-it-works" className="rainbow-advance-tab-area aiwave-bg-gradient rainbow-section-gap-big">
        <div className="container">
          <div className="html-tabs" data-tabs="true">
            <AdvanceTab />
          </div>
        </div>
        <div className="bg-shape">
          <Image src={bgShape} width={630} height={879} alt="Bg Shape" />
        </div>
      </div>

      <div className="rainbow-collobration-area rainbow-section-gap-big">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div
                className="section-title text-center"
                data-sal="slide-up"
                data-sal-duration="700"
                data-sal-delay="100"
              >
                <h4 className="subtitle ">
                  <span className="theme-gradient">AI Collaboration</span>
                </h4>
                <h2 className="title mb--20">
                  Synthovia Ecosystem
                </h2>
                <Link
                  className="btn-default btn-large color-blacked"
                  // className="personal-info-button"
                  href="/signin"
                >
                  Try It Now{" "}
                  <i className="fa-sharp fa-light fa-arrow-right ml--5"></i>
                </Link>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12 mt--60">
              <div className="collabration-image-section">
                <Image
                  src={isLightTheme ? SplitImg : DarkSplitImg}
                  width={1305}
                  height={712}
                  alt="collabration-image"
                />

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="rainbow-rn-cta">
        <div className="container">
          <CtaOne />
        </div>
      </div> */}



      {/* <div className="aiwave-service-area rainbow-section-gap">
        <div className="container">
          <div className="row row--15 service-wrapper">
            <ServiceTwo />
          </div>
        </div>
      </div> */}

      {/* <div className="rainbow-testimonial-area rainbow-section-gap">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div
                className="section-title text-left"
                data-sal="slide-up"
                data-sal-duration="400"
                data-sal-delay="150"
              >
                <h4 className="subtitle">
                  <span className="theme-gradient">Assisting individuals</span>
                </h4>
                <h2 className="title mb--60">The opinions of the community</h2>
              </div>
            </div>
          </div>
        </div>
        <Testimonial />
      </div> */}

      {/* <div className="rainbow-brand-area rainbow-section-gap">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div
                className="section-title rating-title text-center sal-animate"
                data-sal="slide-up"
                data-sal-duration="700"
                data-sal-delay="100"
              >
                <div className="rating">
                  <a href="#rating">
                    <i className="fa-sharp fa-solid fa-star"></i>
                  </a>
                  <a href="#rating">
                    <i className="fa-sharp fa-solid fa-star"></i>
                  </a>
                  <a href="#rating">
                    <i className="fa-sharp fa-solid fa-star"></i>
                  </a>
                  <a href="#rating">
                    <i className="fa-sharp fa-solid fa-star"></i>
                  </a>
                  <a href="#rating">
                    <i className="fa-sharp fa-solid fa-star"></i>
                  </a>
                </div>
                <p className="subtitle mb--0">Based on 20,000+ reviews on</p>
              </div>
            </div>
          </div>
          <BrandTwo />
          <div className="bg-shape-left">
            <Image
              src={bgShapeThree}
              width={688}
              height={1055}
              alt="Bg shape"
            />
          </div>
        </div>
      </div> */}

      {/* <div className="rainbow-cta-area rainbow-section-gap rainbow-section-gapBottom-big">
        <div className="container">
          <CtaTwo />
        </div>
      </div> */}
    </>
  );
};

export default Home;
