"use client";

import Header from "../components/shared/header";
import Footer from "../components/shared/footer";
import { User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Edit2, Check, X } from "lucide-react";

// ── Mock order data ──────────────────────────────────────────────────────────
const MOCK_ORDERS = [
  {
    id: "#PND-20481",
    date: "March 28, 2025",
    items: "Oxford Brogues · Tan Leather Belt",
    total: "₱8,450.00",
    status: "delivered",
    count: 2,
  },
  {
    id: "#PND-20309",
    date: "February 14, 2025",
    items: "Derby Shoes · Cedar Shoe Trees",
    total: "₱6,200.00",
    status: "delivered",
    count: 2,
  },
  {
    id: "#PND-20714",
    date: "April 1, 2025",
    items: "Chukka Boots",
    total: "₱5,900.00",
    status: "processing",
    count: 1,
  },
];

const TABS = ["Overview", "Orders", "Settings"] as const;
type Tab = (typeof TABS)[number];

const BADGE_CLASS: Record<string, string> = {
  delivered: "profile-badge profile-badge--delivered",
  processing: "profile-badge profile-badge--processing",
  shipped: "profile-badge profile-badge--shipped",
};

// Default state: blends into the tabbar background, muted text, no border
// Hover state: light warm background, dark brown text — handled via onMouseEnter/Leave
const signOutBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  marginRight: 4,
  background: "transparent",
  color: "#b9a88f",           // muted warm tone — blends with tabbar
  border: "1px solid transparent",
  borderRadius: 6,
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user) return null;

  const emailName = user.displayName ?? user.email?.split("@")[0] ?? "Guest";
  const initials = emailName
    .split(/[\s._-]/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");
  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).getFullYear()
    : "2025";

  return (
    <div className="profile-page" style={{ backgroundColor: "#e8dfd3", minHeight: "100vh" }}>
      <Header />

      {/* ── LOGOUT CONFIRMATION MODAL ───────────────────────── */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "32px 28px",
              width: "100%",
              maxWidth: 380,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9a8070",
                padding: 4,
              }}
            >
              <X size={18} />
            </button>

            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#fdecea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <LogOut size={22} color="#c0392b" />
            </div>

            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#2c2118",
                marginBottom: 8,
                marginTop: 0,
              }}
            >
              Sign out of Pando?
            </h2>
            <p
              style={{
                fontSize: "0.83rem",
                color: "#9a8070",
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              You'll need to sign back in to access your orders and account details.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "none",
                  border: "1px solid #d9cfc4",
                  borderRadius: 7,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#7a5c48",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "#c0392b",
                  border: "none",
                  borderRadius: 7,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO STRIP ──────────────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-avatar">{initials || "P"}</div>
        <div className="profile-hero-info">
          <p className="profile-hero-since">Member since {memberSince}</p>
          <h1 className="profile-hero-name">{emailName}</h1>
          <p className="profile-hero-email">{user.email}</p>
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{MOCK_ORDERS.length}</div>
            <div className="profile-stat-label">Orders</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">2</div>

          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">
              ₱{(
                MOCK_ORDERS.reduce(
                  (s, o) => s + parseFloat(o.total.replace(/[₱,]/g, "")),
                  0
                ) / 1000
              ).toFixed(1)}k
            </div>
            <div className="profile-stat-label">Spent</div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────── */}
      <div
        className="profile-tabbar"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`profile-tab${activeTab === tab ? " profile-tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sign Out button — ghost by default, reveals on hover */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={signOutBtnStyle}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "#f0ebe3";
            btn.style.color = "#3c2415";
            btn.style.borderColor = "#d9cfc4";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "transparent";
            btn.style.color = "#f5f5f5";
            btn.style.borderColor = "transparent";
          }}
        >
          <LogOut size={13} />
          SIGN OUT
        </button>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <div className="profile-content">

        {/* ════════════ OVERVIEW ════════════ */}
        {activeTab === "Overview" && (
          <>
            <div className="profile-grid" style={{ marginBottom: 20 }}>
              <div className="profile-card profile-card--full">
                <div className="profile-card-header">
                  <span className="profile-card-title">Personal Information</span>
                  <button className="btn profile-btn-sm" onClick={() => setActiveTab("Settings")}>
                    <Edit2 size={12} style={{ display: "inline", marginRight: 6 }} />
                    Edit
                  </button>
                </div>
                <div className="profile-info-grid">
                  <div>
                    <p className="profile-info-label">Full Name</p>
                    <p className="profile-info-value">{emailName}</p>
                  </div>
                  <div>
                    <p className="profile-info-label">Email</p>
                    <p className="profile-info-value">{user.email}</p>
                  </div>
                  <div>
                    <p className="profile-info-label">Phone</p>
                    <p className="profile-info-value">-------------</p>
                  </div>
                  <div>
                    <p className="profile-info-label">Member Since</p>
                    <p className="profile-info-value">{memberSince}</p>
                  </div>
                  <div>
                    <p className="profile-info-label">Shoe Size</p>
                    <p className="profile-info-value">------------</p>
                  </div>
                  <div>
                    <p className="profile-info-label">Account Status</p>
                    <p className="profile-info-value" style={{ color: "#4a6a2a" }}>Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Recent Orders</span>
                <button className="btn profile-btn-sm" onClick={() => setActiveTab("Orders")}>
                  View All
                </button>
              </div>
              {MOCK_ORDERS.slice(0, 2).map((order, i) => (
                <div key={order.id}>
                  {i > 0 && <div className="divider" />}
                  <div className="profile-order-row">
                    <div>
                      <p className="profile-order-id">{order.id}</p>
                      <p className="profile-order-meta">{order.date}</p>
                      <p className="profile-order-items">{order.items}</p>
                    </div>
                    <div className="profile-order-right">
                      <span className={BADGE_CLASS[order.status] ?? "profile-badge"}>
                        {order.status}
                      </span>
                      <span className="profile-order-total">{order.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════════════ ORDERS ════════════ */}
        {activeTab === "Orders" && (
          <div className="profile-card">
            <div className="profile-card-header">
              <span className="profile-card-title">Order History</span>
              <span style={{ fontSize: "0.75rem", color: "#9a8070" }}>
                {MOCK_ORDERS.length} orders
              </span>
            </div>
            {MOCK_ORDERS.map((order, i) => (
              <div key={order.id}>
                {i > 0 && <div className="divider" />}
                <div className="profile-order-row">
                  <div>
                    <p className="profile-order-id">{order.id}</p>
                    <p className="profile-order-meta">{order.date}</p>
                    <p className="profile-order-items">{order.items}</p>
                  </div>
                  <div className="profile-order-right">
                    <span className="profile-order-count">
                      {order.count} item{order.count > 1 ? "s" : ""}
                    </span>
                    <span className={BADGE_CLASS[order.status] ?? "profile-badge"}>
                      {order.status}
                    </span>
                    <span className="profile-order-total">{order.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        
        {/* ════════════ SETTINGS ════════════ */}
        {activeTab === "Settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Account Details */}
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Account Details</span>
                {saved && (
                  <span className="profile-saved-badge">
                    <Check size={11} style={{ display: "inline", marginRight: 4 }} />
                    Saved
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="profile-form-row">
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>Full Name</p>
                    <input className="pando-input" style={{ paddingLeft: 16 }} defaultValue={emailName} />
                  </div>
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>Email</p>
                    <input className="pando-input" style={{ paddingLeft: 16 }} defaultValue={user.email ?? ""} readOnly />
                  </div>
                </div>
                <div className="profile-form-row">
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>Phone Number</p>
                    <input className="pando-input" style={{ paddingLeft: 16 }} placeholder="+63 900 000 0000" />
                  </div>
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>Shoe Size (EU)</p>
                    <input className="pando-input" style={{ paddingLeft: 16 }} placeholder="e.g. 43" />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn" onClick={handleSave}>Save Changes</button>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Change Password</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <p className="profile-info-label" style={{ marginBottom: 8 }}>Current Password</p>
                  <input className="pando-input" style={{ paddingLeft: 16 }} type="password" placeholder="••••••••" />
                </div>
                <div className="profile-form-row">
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>New Password</p>
                    <input className="pando-input" style={{ paddingLeft: 16 }} type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>Confirm New Password</p>
                    <input className="pando-input" style={{ paddingLeft: 16 }} type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn">Update Password</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}