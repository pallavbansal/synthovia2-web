import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { useAppContext } from "@/context/Context";
import { getUser, isAuthenticated, logout } from "@/utils/auth";

import logo from "../../public/images/logo/logo.png";
import logoDark from "../../public/images/light/logo/logo-dark.png";
import Nav from "./Nav";

const Header = ({ headerTransparent, headerSticky, btnClass }) => {
  const { activeMobileMenu, setActiveMobileMenu } = useAppContext();
  const [isSticky, setIsSticky] = useState(false);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authedUser, setAuthedUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState("");

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

  useEffect(() => {
    setIsClient(true);
    const readAuth = () => {
      const user = getUser();
      setAuthedUser(user);
      const pic = (user && (user.profile_picture || user.avatar || user.picture || user.image_url)) || "";
      setProfilePicture(pic ? String(pic) : "");
      setAuthed(isAuthenticated());
    };

    readAuth();
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === "synthovia-auth-user" || e.key === "synthovia-auth-token") readAuth();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const userName = useMemo(() => {
    const user = authedUser;
    const raw =
      (user &&
        (user.name ||
          user.full_name ||
          user.fullName ||
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.email)) ||
      "User";
    return String(raw || "User").trim();
  }, [authedUser]);

  const avatarText = useMemo(() => {
    const parts = userName.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts.length > 1 ? parts[1]?.[0] : "";
    return `${a}${b}`.toUpperCase();
  }, [userName]);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    setAuthed(false);
    setAuthedUser(null);
    setProfilePicture("");
    router.replace("/signin");
  };

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
                      width: 60,
                      height: 44,
                      // overflow: "hidden",
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
                {isClient && authed ? (
                  <div className="rbt-admin-panel account-access rbt-user-wrapper right-align-dropdown">
                    <div className="rbt-admin-card grid-style">
                      <a className="d-flex align-items-center" href="#" onClick={(e) => e.preventDefault()}>
                        <div className="inner d-flex align-items-center">
                          <div className="img-box">
                            {profilePicture ? (
                              <img
                                src={profilePicture}
                                alt={userName}
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
                        </div>
                        <div className="icon" style={{ marginLeft: 6, display: "flex", alignItems: "center" }}>
                          <i className="fa-sharp fa-solid fa-chevron-down"></i>
                        </div>
                      </a>
                    </div>
                    <div className="rbt-user-menu-list-wrapper">
                      <div className="inner">
                        <div className="rbt-admin-profile" style={{ padding: "10px 12px 8px" }}>
                          <div className="admin-info">
                            <span className="name" style={{ display: "block", fontWeight: 800 }}>
                              {userName}
                            </span>
                            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{authedUser?.email || ""}</span>
                          </div>
                        </div>
                        <ul className="user-list-wrapper user-nav">
                          <li>
                            <Link href="/dashboard-overview">
                              <i className="fa-solid fa-gauge"></i>
                              <span>Dashboard Overview</span>
                            </Link>
                          </li>
                        </ul>
                        <ul className="user-list-wrapper">
                          <li>
                            <Link href="/signin" onClick={handleLogout}>
                              <i className="fa-sharp fa-solid fa-right-to-bracket"></i>
                              <span>Logout</span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="header-btn">
                    <Link className={`${btnClass}`} href="/signin">
                      <span>Get Start</span>
                    </Link>
                  </div>
                )}

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
