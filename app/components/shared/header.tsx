"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { ShoppingCart, User } from "lucide-react";


interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string | null;
    stock: number;
    status: string;
  };
  size: number;
  quantity: number;
}

export default function Header() {
  // const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const getCartKey = () => {
    const user = auth.currentUser;
    return user ? `pando_cart_${user.uid}` : "pando_cart_guest";
  };

  useEffect(() => {
    // Update auth status
    const updateAuth = () => {
      setIsLoggedIn(localStorage.getItem("pando_logged_in") === "true");
    };

    updateAuth();
    window.addEventListener("pando_auth_change", updateAuth);

    return () => {
      window.removeEventListener("pando_auth_change", updateAuth);
    };
  }, []);

  // Watch for cart updates from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      const saved = localStorage.getItem(getCartKey());
      if (saved) {
        try {
          const cart: CartItem[] = JSON.parse(saved);
          const count = cart.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(count);
        } catch (e) {
          console.error("Failed to parse cart:", e);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    // Initial load
    updateCartCount();

    // Listen for changes from other components/tabs
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("pando_cart_updated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("pando_cart_updated", updateCartCount);
    };
  }, []);



  return (
    <header className="header">
      <div className="container flex justify-between items-center">
        <Link
          href="/"
          className="logo font-bold text-xl"
          style={{ textDecoration: "none", color: "#f5e6d3" }}
        >
          PANDO
        </Link>

        <nav className="nav flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/product">Collection</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="flex items-center gap-6">
          {isLoggedIn ? (
            <>
              {/* Cart Icon */}
              <Link
                href="/cart"
                className="relative text-[#e8dfd3] rounded-full transition-opacity hover:opacity-75"
                style={{ display: "flex", alignItems: "center" }}
              >
                <ShoppingCart size={26} />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-12px",
                      background: "#e8dfd2",
                      color: "#3C2415",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile Icon */}
              <Link
                href="/profile"
                className="text-[#e8dfd3] rounded-full transition-opacity hover:opacity-75"
                style={{ display: "flex", alignItems: "center" }}
              >
                <User size={28} />
              </Link>


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
