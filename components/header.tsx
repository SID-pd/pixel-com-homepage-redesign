"use client";

import React, { useEffect, useState } from "react";
import { removeEncrypted } from "../app/api/service/storage";
import { useRouter } from "next/navigation";
import { useModal } from "../app/context/ModalContext";
import { useUser } from "../app/context/UserContext";
import { useCompany } from "../app/context/LogoContext";
import { apiPost } from "../app/api/service/api-service";
import { toastError, toastSuccess } from "../app/api/service/common";
import { set } from "../app/api/service/storage";
import { claimGuestSessionIfAny } from "@/app/api/service/guest";

interface HeaderProps {
  onSignOutClick: () => void;
  isLoggedInData: any;
  isLoggedInDataSet: any;
  cartCount?: number;
}

export default function Header({ onSignOutClick, isLoggedInData, isLoggedInDataSet, cartCount = 0, }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");
  const { openSignIn } = useModal();
  const { user, setUser, countCart } = useUser();
  const { companyData } = useCompany();
  const facebook_appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";

  useEffect(() => {
    isLoggedInDataSet(user)
    const fetchUser = async () => {
      setLoading(false);
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    //===// Avoid adding the script multiple times //===//
    if (document.getElementById("facebook-jssdk")) return;
    console.log("facebook_appId", facebook_appId);


    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("✅ FB SDK script loaded");
      (window as any).FB.init({
        appId: facebook_appId,
        cookie: true,
        xfbml: true,
        version: "v17.0",
      });
      console.log("✅ FB SDK initialized");
    };

    document.body.appendChild(script);
  }, []);

  const handleSignup = () => {
    router.push("/photo-book");
  };

  const navigate = (path: string) => {
    router.push(path);
    setCurrentPath(path);
    setMenuOpen(false);
    document.body.classList.remove("body_active");
  };

  const goToHome = () => {
    router.push("/");
    setMenuOpen(false);
    document.body.classList.remove("body_active");
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    removeEncrypted("user");
    onSignOutClick();
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    document.body.classList.toggle("body_active", !menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.classList.remove("body_active");
  };

  // Get logo with fallback
  const getLogo = () => {
    return companyData?.logo || "/images/pixovo.png";
  };

  return (
    <>
      <div
        className={`dim_overlay ${menuOpen ? "active" : ""}`}
        onMouseDown={() => {
          setMenuOpen(false);
          document.body.classList.remove("body_active");
        }}
      ></div>

      <header>
        <div className="container">
          <div className="row align-items-center">
            {/* Logo */}
            <div className="col-lg-2 col-sm-2 col-4 site-logo">
              <a
                onClick={goToHome}
                className="logo"
                style={{ cursor: "pointer" }}
              >
                {/* No width/height: src is the tenant's CMS logo of unknown
                    aspect ratio, so fixed dimensions would distort it. */}
                <img
                  src={getLogo()}
                  alt={companyData?.company_name || "Pixovo"}
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "/images/pixovo.png";
                  }}
                />
              </a>
            </div>

            {/* Navigation */}
            <div className="col-lg-6 col-sm-6 col-1 d-none d-lg-block header-middle">
              <div className="menu_bar">
                <ul className="gap-4 mb-0">
                  <li>
                    <a onClick={() => navigate("/")} style={{ cursor: "pointer" }} className={currentPath === "/" ? "active" : ""}>
                      Home
                    </a>
                  </li>
                  <li>
                    <a onClick={() => navigate("/about-us/")} style={{ cursor: "pointer" }} className={currentPath === "/about-us/" ? "active" : ""}>
                      About Us
                    </a>
                  </li>
                  <li>
                    <a onClick={() => navigate("/how-it-works")} style={{ cursor: "pointer" }} className={currentPath === "/how-it-works" ? "active" : ""}>
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a onClick={() => navigate("/pricing/")} style={{ cursor: "pointer" }} className={currentPath === "/pricing/" ? "active" : ""}>
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a onClick={() => navigate("/contact-us/")} style={{ cursor: "pointer" }} className={currentPath === "/contact-us/" ? "active" : ""}>
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Menu Icon */}
            <div className="d-lg-none col-1">
              <div className={`menu-icon ${menuOpen ? "open" : ""}`} onClick={toggleMenu}>
                <div className="bar bar-1"></div>
                <div className="bar bar-2"></div>
                <div className="bar bar-3"></div>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className={`menu_bar ${menuOpen ? "active" : ""} d-lg-none`}>
              <ul className="list-unstyled">
                <li>
                  <a onClick={() => navigate("/")} style={{ cursor: "pointer" }} className={currentPath === "/" ? "active" : ""}>
                    Home
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate("/about-us/")} style={{ cursor: "pointer" }} className={currentPath === "/about-us/" ? "active" : ""}>
                    About Us
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate("/how-it-works/")} style={{ cursor: "pointer" }} className={currentPath === "/how-it-works/" ? "active" : ""}>
                    How It Works
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate("/pricing/")} style={{ cursor: "pointer" }} className={currentPath === "/pricing/" ? "active" : ""}>
                    Pricing
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate("/contact-us/")} style={{ cursor: "pointer" }} className={currentPath === "/contact-us/" ? "active" : ""}>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Auth Section */}
            <div className="col-lg-4 col-sm-4 col-7 header-sign-btn">
              {loading ? (
                <div className="text-end">
                  <span className="spinner-border spinner-border-sm text-secondary" role="status"></span>
                </div>
              ) : !isLoggedInData || !isLoggedInData._id ? (
                <>
                  <button className="btn btn-primary" onClick={openSignIn}>
                    Sign In
                  </button>
                  {/* <button className="btn btn-secondary" onClick={handleFacebookLogin}>
                    Continue With Facebook
                  </button> */}
                </>
              ) : (
                <div className="user-header-box">
                  <a onClick={() => navigate("/cart/")} className="cart-box" style={{ cursor: "pointer" }}>
                    <span className="badge rounded-pill bg-danger">
                      {countCart}
                    </span>
                    <i className="fa fa-shopping-cart" aria-hidden="true"></i>
                  </a>

                  <div className="user-menu">
                    <div
                      className="user-menu__toggle"
                      onClick={toggleUserMenu}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa fa-user pe d-inline d-md-none d-xl-none d-xxl-none"></i>
                      <span className="d-none d-md-inline d-xl-inline d-xxl-inline">
                        Welcome,{" "}
                        <span>
                          {isLoggedInData.first_name} {isLoggedInData.last_name}
                        </span>
                      </span>
                      <span className="arrow">▼</span>
                    </div>

                    {userMenuOpen && (
                      <ul className="user-menu__dropdown">
                        <li>
                          <a onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                            Home
                          </a>
                        </li>
                        <li>
                          <a onClick={() => navigate("/photo-book/")} style={{ cursor: "pointer" }}>
                            Create Your Photobook
                          </a>
                        </li>
                        <li>
                          <a onClick={() => navigate("/order/")} style={{ cursor: "pointer" }}>
                            Orders
                          </a>
                        </li>
                        <li>
                          <a onClick={() => navigate("/profile/")} style={{ cursor: "pointer" }}>
                            My Profile
                          </a>
                        </li>
                        <li>
                          <button onClick={handleLogout}>Sign Out</button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}