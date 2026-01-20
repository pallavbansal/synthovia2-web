import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useAppContext } from "@/context/Context";

import logo from "../../public/images/logo/logo4.png";
import logoDark from "../../public/images/light/logo/logo-dark.png";
import Nav from "./Nav";
import DarkSwitch from "./dark-switch";

const Header = ({ headerTransparent, headerSticky, btnClass }) => {
  const { activeMobileMenu, setActiveMobileMenu } = useAppContext();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      if (scrolled > 200) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <>
      {/* <DarkSwitch isLight={isLightTheme} switchTheme={toggleTheme} /> */}
      <header
        className={`rainbow-header header-default ${headerTransparent} ${headerSticky} ${
          isSticky ? "sticky" : ""
        }`}
      >
        <div className="container position-relative">
          <div className="row align-items-center row--0">
            <div className="col-lg-2 col-md-6 col-6">
              <div className="logo">
                <Link href="/">
                  <span
                    style={{
                      position: "relative",
                      display: "inline-block",
                      width: 44,
                      height: 44,
                      overflow: "hidden",
                      verticalAlign: "middle",
                    }}
                  >
                    <Image
                      className="logo-light"
                      src={logo}
                      fill
                      sizes="44px"
                      priority={true}
                      alt="ChatBot Logo"
                      style={{ objectFit: "cover", transform: "scale(1.35)", transformOrigin: "center" }}
                    />
                  </span>
                  <Image
                    className="logo-dark"
                    src={logoDark}
                    width={135}
                    height={35}
                    priority={true}
                    alt="ChatBot Logo"
                  />
                </Link>
              </div>
            </div>

            <div className="col-lg-8 d-none d-lg-block">
              <nav className="mainmenu-nav d-none d-lg-flex justify-content-center">
                <Nav />
              </nav>
            </div>

            <div className="col-lg-2 col-md-6 col-6 position-static">
              <div className="header-right">
                <div className="header-btn">
                  <Link className={`${btnClass}`} href="/signin">
                    <span>Get Start</span>
                  </Link>
                </div>

                <div className="mobile-menu-bar ml--5 d-flex justify-content-end d-lg-none">
                  <div className="hamberger">
                    <button
                      className="hamberger-button"
                      onClick={() => setActiveMobileMenu(!activeMobileMenu)}
                    >
                      <i className="fa-sharp fa-regular fa-bars"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
