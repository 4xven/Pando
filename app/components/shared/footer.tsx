"use client";

import Link from "next/link";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer
      className="footer"
      style={{ fontFamily: "'Jost', sans-serif", color: "#e6d3b3" }}
    >
      <div className="footer-container">
        {/* TOP TEXT */}
        <h2
          className="footer-title"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#f5ebe0",
            marginBottom: "24px",
          }}
        >
          Where to?
        </h2>

        {/* NAV LINKS */}
        <nav className="footer-nav">
          <Link href="/about">SHOP</Link>
          <Link href="/product">COLLECTION</Link>
          <Link href="/contact">LOCATION</Link>
          <Link href="/contact">SUPPORT</Link>
        </nav>

        <div className="divider" />

        {/* BOTTOM ROW */}
        <div className="footer-bottom">
          <div className="left">
            <p>TIP Quezon City</p>
            <span>Local Devs</span>
          </div>

          <div className="center">
            <a href="#">Back to Top</a>
          </div>

          <div className="right-group">
            <div className="right">
              <FaFacebookF />
              <FaTwitter />
              <FaInstagram />
            </div>
            <p className="copyright">
              © 2026 Pando Shoecraft — All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}