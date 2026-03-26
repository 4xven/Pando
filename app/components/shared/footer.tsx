"use client";

import Link from "next/link";

import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* TOP TEXT */}
        <h2 className="footer-title">Where to?</h2>

        {/* NAV LINKS */}
        <nav className="footer-nav">
          <Link href="#">SHOP</Link>
          <Link href="#">COLLECTION</Link>
          <Link href="#">LOCATION</Link>
          <Link href="#">SUPPORT</Link>
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
    © 2025 Pando Shoecraft — All Rights Reserved
  </p>
</div>
</div>



        
      </div>
    </footer>
  );
}
