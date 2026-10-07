import React from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "../app/context/LogoContext";

const Footer: React.FC = () => {
  const router = useRouter();
  const { companyData } = useCompany();

  const navigate = (patch: any) => {
    router.push(patch);
  };

  // Get logo with fallback
  const getLogo = () => {
    return companyData?.logo || "/images/pixovo.png";
  };

  return (
    <>
      <footer>
        <div className="footer">
          <div className="container">
            <div className="row">
              {/* Left Section */}
              <div className="col-md-6">
                <div className="footer-logo">
                  <img
                    src={getLogo()}
                    alt={companyData?.company_name || "Pixovo"}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = "/images/pixovo.png";
                    }}
                  />
                </div>
                <p>
                  Transform your memories into beautiful photo books using our
                  AI-powered design platform. Creating lasting memories has never
                  been easier.
                </p>
                <ul className="social-icons-wrapper d-flex justify-content-start align-items-center">
                  <li>
                    <a href="https://www.facebook.com/mypixovo/" className="social-link d-flex justify-content-center align-items-center" target="_blank">
                      <i className="fab fa-facebook"></i>
                    </a>
                  </li>
                  <li>
                    <a href="https://x.com/mypixovo" className="social-link d-flex justify-content-center align-items-center" target="_blank" aria-label="X (Twitter)">
                      <svg className="x-icon " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.instagram.com/mypixovo/" className="social-link d-flex justify-content-center align-items-center" target="_blank">
                      <i className="fab fa-instagram"></i>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Quick Links */}
              <div className="col-md-3 col-6">
                <h4>Quick Links</h4>
                <ul>
                  <li>
                    <a href="/about-us">About us</a>
                  </li>
                  <li>
                    <a href="/how-it-works">How it Works</a>
                  </li>
                  <li>
                    <a href="/pricing">Pricing</a>
                  </li>
                  <li>
                    <a href="/help-center">Help Center</a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="col-md-3 col-6">
                <h4>Support</h4>
                <ul>
                  <li>
                    <a href="/contact-us">Contact Us</a>
                  </li>
                  <li>
                    <a href="/shipping-info">Shipping Info</a>
                  </li>
                  <li>
                    <a href="/privacy-policy">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="/terms">Terms and Conditions</a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="copy-right">
              <span>© 2026 Pixovo. All rights reserved. Made with </span>
              <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/copy-right-img.png`} alt="Love" width={27} height={27} loading="lazy" decoding="async" />
              <span> for memory makers.</span>
            </div>
          </div>
        </div>

        {/* Dim overlay */}
        <a className="dim_overlay" href="#"></a>
      </footer>
    </>
  );
};

export default Footer;