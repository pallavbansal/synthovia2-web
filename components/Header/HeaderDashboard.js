import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/context/Context";

import logo from "../../public/images/logo/logo.png";
import logoDark from "../../public/images/logo/logo.png";

import Nav from "./Nav";
import UserMenu from "./UserMenu";

import { getUser } from "@/utils/auth";

const HeaderDashboard = ({ display }) => {
  const {
    mobile,
    setMobile,
    rightBar,
    setRightBar,
    activeMobileMenu,
    setActiveMobileMenu,
  } = useAppContext();

  const [userTitle, setUserTitle] = useState("-");
  const [userSub, setUserSub] = useState("-");
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    const user = getUser();
    const first = user?.first_name || user?.firstName;
    const last = user?.last_name || user?.lastName;
    const fullFromParts = [first, last].filter(Boolean).join(" ").trim();
    const full =
      fullFromParts ||
      user?.name ||
      user?.full_name ||
      user?.fullName ||
      "User";

    setUserTitle(full);
    setUserSub(user?.email || "-");
    const pic = (user && (user.profile_picture || user.avatar || user.picture || user.image_url)) || "";
    setProfilePicture(pic ? String(pic) : "");
  }, []);

  const avatarText = useMemo(() => {
    const parts = String(userTitle || "User").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts.length > 1 ? parts[1]?.[0] : "";
    return `${a}${b}`.toUpperCase();
  }, [userTitle]);
  return (
    <>
      <header className="rbt-dashboard-header rainbow-header header-default header-left-align rbt-fluid-header">
        <div className="container-fluid position-relative">
          <div className="row align-items-center justify-content-between">
            <div className="col-lg-3 col-md-6 col-6">
              <div className="header-left d-flex">
                {/* <div className="expand-btn-grp">
                  <button
                    className={`bg-solid-primary popup-dashboardleft-btn ${
                      mobile ? "" : "collapsed"
                    }`}
                    onClick={() => setMobile(!mobile)}
                  >
                    <i className="fa-sharp fa-regular fa-sidebar"></i>
                  </button>
                </div> */}
                <div className="expand-btn-grp">
                  <button
                    type="button"
                    aria-label="Toggle side navigation"
                    className={`bg-solid-primary popup-dashboardleft-btn ${
                      mobile ? "" : "collapsed"
                    }`}
                    onClick={() => setMobile(!mobile)}
                  >
                    <i className="fa-sharp fa-regular fa-sidebar"></i>
                  </button>
                </div>
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
                        alt="Corporate Logo"
                        style={{ objectFit: "cover", transform: "scale(1.35)", transformOrigin: "center" }}
                      />
                    </span>
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
                        className="logo-dark"
                        src={logoDark}
                        fill
                        sizes="44px"
                        alt="Corporate Logo"
                        style={{ objectFit: "cover", transform: "scale(1.35)", transformOrigin: "center" }}
                      />
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-6 d-none d-lg-block text-center">
              <nav className="mainmenu-nav d-none d-lg-block text-center">
                <Nav />
              </nav>
            </div>

            <div className="col-lg-3 col-md-6 col-6">
              <div className="header-right">
                <div className="mobile-menu-bar mr--10 ml--10 d-block d-lg-none">
                  <div className="hamberger">
                    <button
                      className="hamberger-button"
                      onClick={() => setActiveMobileMenu(!activeMobileMenu)}
                    >
                      <i className="feather-menu"></i>
                    </button>
                  </div>
                </div>

                <div className="rbt-admin-panel account-access rbt-user-wrapper right-align-dropdown">
                  <div className="rbt-admin-card grid-style">
                    <a className="d-flex align-items-center" href="#">
                      <div className="inner d-flex align-items-center">
                        <div className="img-box">
                          {profilePicture ? (
                            <img
                              src={profilePicture}
                              alt={userTitle}
                              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: 12,
                                letterSpacing: "0.06em",
                                color: "#fff",
                                background:
                                  "linear-gradient(135deg, rgba(124,58,237,1) 0%, rgba(99,102,241,1) 60%, rgba(236,72,153,0.9) 100%)",
                              }}
                            >
                              {avatarText}
                            </div>
                          )}
                        </div>
                        <div className="content">
                          <span className="title ">{userTitle}</span>
                          <p>{userSub}</p>
                        </div>
                      </div>
                      <div className="icon" style={{ marginLeft: 6, display: "flex", alignItems: "center" }}>
                        <i className="fa-sharp fa-solid fa-chevron-down"></i>
                      </div>
                    </a>
                  </div>
                  <div className="rbt-user-menu-list-wrapper">
                    <UserMenu />
                  </div>
                </div>

                {/* <div className={`expand-btn-grp ${display}`}>
                  <button
                    className={`bg-solid-primary popup-dashboardright-btn ${
                      rightBar ? "" : "collapsed"
                    }`}
                    onClick={() => setRightBar(!rightBar)}
                  >
                    <i className="fa-sharp fa-regular fa-sidebar-flip"></i>
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderDashboard;
