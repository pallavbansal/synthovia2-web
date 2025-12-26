import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useAppContext } from "@/context/Context";

const UserMenuItems = ({ parentClass }) => {
  const router = useRouter();
  const { setMobile } = useAppContext();
  const isActive = (href) => router.pathname === href;

  const handleItemClick = () => {
    setMobile(false);
  };
  return (
    <>
      <ul className={parentClass}>
        <li>
          <Link
            className={isActive("/profile-details") ? "active" : ""}
            href="/profile-details"
            onClick={handleItemClick}
          >
            <i className="fa-sharp fa-regular fa-user"></i>
            <span>Profile Details</span>
          </Link>
        </li>
        <li>
          <Link
            className={isActive("/notification") ? "active" : ""}
            href="/notification"
            onClick={handleItemClick}
          >
            <i className="fa-sharp fa-regular fa-shopping-bag"></i>
            <span>Notification</span>
          </Link>
        </li>
        <li>
          <Link
            className={isActive("/chat-export") ? "active" : ""}
            href="/chat-export"
            onClick={handleItemClick}
          >
            <i className="fa-sharp fa-regular fa-users"></i>
            <span>Chat Export</span>
          </Link>
        </li>
        <li>
          <Link
            className={isActive("/appearance") ? "active" : ""}
            href="/appearance"
            onClick={handleItemClick}
          >
            <i className="fa-sharp fa-regular fa-home"></i>
            <span>Apperance</span>
          </Link>
        </li>
        <li>
          <Link
            className={isActive("/plans-billing") ? "active" : ""}
            href="/plans-billing"
            onClick={handleItemClick}
          >
            <i className="fa-sharp fa-regular fa-briefcase"></i>
            <span>Plans and Billing</span>
          </Link>
        </li>
        <li>
          <Link
            className={isActive("/sessions") ? "active" : ""}
            href="/sessions"
            onClick={handleItemClick}
          >
            <i className="fa-sharp fa-regular fa-users"></i>
            <span>Sessions</span>
          </Link>
        </li>
        <li>
          <Link
            className={isActive("/application") ? "active" : ""}
            href="/application"
            onClick={handleItemClick}
          >
            <i className="fa-sharp fa-regular fa-list"></i>
            <span>Application</span>
          </Link>
        </li>
      </ul>
    </>
  );
};

export default UserMenuItems;
