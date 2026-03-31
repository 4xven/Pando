"use client";

import { LogOut, User } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import styles from "./design.module.scss";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");

    if (!confirmLogout) return;

    try {
      await signOut(auth);

      // clear local storage (if you are using it)
      localStorage.removeItem("pando_logged_in");
      localStorage.removeItem("pando_role");

      // redirect to login
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.right}>
        
        {/* User */}
        <div className={styles.user}>
          <div className={styles.avatar}>
            <User size={16} />
          </div>
          <span>Admin User</span>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Logout */}
        <button className={styles.logout} onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}