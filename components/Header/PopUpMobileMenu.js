import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAppContext } from "@/context/Context";
import { getUser, getUserRole, isAuthenticated, isAdminRole, logout } from "@/utils/auth";

import logoLight from "../../public/images/logo/logo.png";
import logoDark from "../../public/images/light/logo/logo-dark.png";

import Nav from "./Nav";
import SmallNav from "./SmallNav";

const PopupMobileMenu = () => {
  const { activeMobileMenu, setActiveMobileMenu, isLightTheme } =
    useAppContext();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authedUser, setAuthedUser] = useState(null);
  const [adminEnabled, setAdminEnabled] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const readAuth = () => {
      const user = getUser();
      setAuthedUser(user);
      setAuthed(isAuthenticated());
      const role = getUserRole && getUserRole();
      setAdminEnabled(isAdminRole && isAdminRole(role));
    };
    readAuth();
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === "synthovia-auth-user" || e.key === "synthovia-auth-token") readAuth();
    };
    const onAuthChanged = () => readAuth();
    window.addEventListener("storage", onStorage);
    window.addEventListener("synthovia-auth-changed", onAuthChanged);
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

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    setAuthed(false);
    setActiveMobileMenu(true);
    router.replace("/signin");
  };

  const handleResize = () => {
    if (window.innerWidth > 992) {
      setActiveMobileMenu(true);
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [activeMobileMenu]);

  return (
    <>
      <div className={`popup-mobile-menu ${activeMobileMenu ? "" : "active"}`}>
        <div
          className="bg"
          onClick={() => setActiveMobileMenu(!activeMobileMenu)}
        ></div>
        <div className="inner-popup">
          <div className="header-top">
            <div className="close-menu">
              <button
                className="close-button"
                onClick={() => setActiveMobileMenu(!activeMobileMenu)}
              >
                <i className="fa-sharp fa-regular fa-x"></i>
              </button>
            </div>
          </div>
          <div className="content">
            <Nav />
          </div>
          <div className="header-btn d-block d-md-none">
            {isClient && authed ? (
              <div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700, marginBottom: 10 }}>
                  {userName}
                </div>
                <Link className="btn-default" href={adminEnabled ? "/admin/users/dashboard" : "/dashboard-overview"} onClick={() => setActiveMobileMenu(true)}>
                  Dashboard Overview
                </Link>
                <div style={{ height: 10 }} />
                <Link className="btn-default" href="/signin" onClick={handleLogout}>
                  Logout
                </Link>
              </div>
            ) : (
              <Link className="btn-default" href="/signin" onClick={() => setActiveMobileMenu(true)}>
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PopupMobileMenu;
