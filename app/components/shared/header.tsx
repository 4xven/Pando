"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { LogOut, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("pando_logged_in") === "true",
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

  const handleLogout = async () => {
    await signOut(auth); // Sign out from Firebase
    localStorage.removeItem("pando_logged_in");
    localStorage.removeItem("pando_role");

    window.dispatchEvent(new Event("pando_auth_change"));

    // ✅ Redirect to login page
    router.push("/login");
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

        <div className="flex items-center gap-6">
          {isLoggedIn ? (
            <>
              <Link href="/cart" className="text-[#e8dfd3] rounded-full">
                <ShoppingCart size={24} />
              </Link>

              <button
                onClick={handleLogout}
                className="text-[#e8dfd3] rounded-full"
              >
                <LogOut size={24} />
              </button>
            </>
          ) : (
            <Link href="/login" className="login-btn">
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}