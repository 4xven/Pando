"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  // Lazy initialize from localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    localStorage.getItem("pando_logged_in") === "true"
  );

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem("pando_logged_in") === "true");
    };

    window.addEventListener("pando_auth_change", handleAuthChange);

    return () => {
      window.removeEventListener("pando_auth_change", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("pando_logged_in");
    window.dispatchEvent(new Event("pando_auth_change"));
  };

  return (
    <header className="header">
      <div className="container flex justify-between items-center">
        <div className="logo font-bold text-xl">PANDO</div>

        <nav className="nav flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/product">Product</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          {isLoggedIn && <Link href="/profile">Profile</Link>}
        </nav>

        <div className="login">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-sm"
            >
              Logout
            </button>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}