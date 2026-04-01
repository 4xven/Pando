
"use client";


import Header from "../components/shared/header";
import Footer from "../components/shared/footer";
import { User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
const [user, setUser] = useState<FirebaseUser | null>(null);

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((currentUser) => {
    if (!currentUser) {
      router.push("/login");
    } else {
      setUser(currentUser);
    }
  });

  return () => unsubscribe();
}, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("pando_logged_in");
    localStorage.removeItem("pando_role");

    window.dispatchEvent(new Event("pando_auth_change"));
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div>
        <Header />
        <div style={{ padding: "2rem", color: "#e8dfd3" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Profile</h1>
          <div
            style={{
              background: "#3C2415",
              padding: "1.5rem",
              borderRadius: "12px",
              maxWidth: "400px",
            }}
          >
            {/* User Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <User size={32} />
              <div>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>UID:</strong> {user.uid}</p>
              </div>
            </div>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                marginTop: "1.5rem",
                background: "#D4A373",
                color: "#3C2415",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
        <Footer />
    </div>
  );
}