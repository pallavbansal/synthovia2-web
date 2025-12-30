import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DashboardLayout.module.css";
import { getUser, logout } from "@/utils/auth";

const NAV_ITEMS = [
  { href: "/dashboard-overview", label: "Dashboard", iconClass: "fa-solid fa-gauge" },
  {
    href: "/copywriting-assistant",
    label: "Copywriting Tool",
    iconClass: "fa-solid fa-pen-nib",
  },
  {
    href: "/ad-copy-generator",
    label: "Ad Generator Tool",
    iconClass: "fa-solid fa-bullhorn",
  },
  {
    href: "/email-generator",
    label: "Email & Newsletter Writer Tool",
    iconClass: "fa-solid fa-envelope",
  },
  {
    href: "/seo-keyword-meta-tag-generator",
    label: "SEO Keyword & Meta Tag Generator Tool",
    iconClass: "fa-solid fa-magnifying-glass",
  },
  {
    href: "/caption-and-hastag-generator",
    label: "Caption & Hashtag Generator Tool",
    iconClass: "fa-solid fa-hashtag",
  },
  {
    href: "/script-story-writer-tool",
    label: "Script & Story Writer Tool",
    iconClass: "fa-solid fa-clapperboard",
  },
  { href: "/settings", label: "Settings", iconClass: "fa-solid fa-gear" },
];

const isActivePath = (pathname, href) => {
  if (href === "/dashboard-overview") {
    return pathname === "/dashboard-overview";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

const DashboardLayout = ({ children, title }) => {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const userName = useMemo(() => {
    const user = getUser();
    const raw =
      (user &&
        (user.name ||
          user.full_name ||
          user.fullName ||
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.email)) ||
      "User";

    return String(raw || "User");
  }, []);

  const avatarText = useMemo(() => {
    const parts = userName.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts.length > 1 ? parts[1]?.[0] : "";
    return `${a}${b}`.toUpperCase();
  }, [userName]);

  const dateText = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    router.replace("/signin");
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLeft}>
            <div className={styles.brandMark}>S</div>
            <div>
              <div className={styles.brandTitle}>Synthovia</div>
              <div className={styles.brandSub}>Dashboard</div>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSectionTitle}>Menu</div>
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(router.pathname, item.href);
            const className = `${styles.navLink} ${active ? styles.navLinkActive : ""}`;
            return (
              <Link key={item.href} href={item.href} className={className}>
                <div className={styles.navIcon}>
                  <i className={item.iconClass} />
                </div>
                <div className={styles.navLabel}>{item.label}</div>
              </Link>
            );
          })}
        </nav>

        <div className={styles.navSpacer} />
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.search}>
            <span className={styles.searchIcon}>
              <i className="fa-solid fa-magnifying-glass" />
            </span>
            <input className={styles.searchInput} placeholder="Search" />
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.datePill}>{dateText}</div>
            <button className={styles.iconBtn} type="button" aria-label="Notifications">
              <i className="fa-regular fa-bell" />
            </button>
            <button className={styles.iconBtn} type="button" aria-label="Help">
              <i className="fa-regular fa-circle-question" />
            </button>
            <div className={styles.userMenu} ref={userMenuRef}>
              <button
                className={styles.avatarBtn}
                type="button"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((v) => !v)}
                title={userName}
              >
                <div className={styles.avatar}>{avatarText}</div>
              </button>
              {userMenuOpen ? (
                <div className={styles.userDropdown} role="menu" aria-label="User menu">
                  <button
                    type="button"
                    className={styles.userDropdownItem}
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <i className="fa-sharp fa-solid fa-right-to-bracket" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className={styles.content} aria-label={title || "Dashboard Content"}>
          {children}
        </div>
      </section>
    </div>
  );
};

export default DashboardLayout;
