"use client";

import Header from "../components/shared/header";
import Footer from "../components/shared/footer";
import { User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Edit2, Check } from "lucide-react";

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

const TABS = ["Overview", "Orders", "Addresses", "Settings"] as const;
type Tab = (typeof TABS)[number];

const BADGE_CLASS: Record<string, string> = {
  delivered: "profile-badge profile-badge--delivered",
  processing: "profile-badge profile-badge--processing",
  shipped: "profile-badge profile-badge--shipped",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [saved, setSaved] = useState(false);

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

  // Derive display name / initials from email
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
    <div className="profile-page">
      <Header />

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
            <div className="profile-stat-value">
              {MOCK_ORDERS.length}
            </div>
            <div className="profile-stat-label">Orders</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">2</div>
            <div className="profile-stat-label">Addresses</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">
              ₱{(
                MOCK_ORDERS.reduce(
                  (s, o) => s + parseFloat(o.total.replace(/[₱,]/g, "")),
                  0
                ) / 1000
              ).toFixed(1)}
              k
            </div>
            <div className="profile-stat-label">Spent</div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────── */}
      <div className="profile-tabbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="profile-logout-tab"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            marginRight: 4,
            background: "none",
            border: "1px solid #d9cfc4",
            borderRadius: 6,
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#7a5c48",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#3c2415";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#3c2415";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.color = "#7a5c48";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#d9cfc4";
          }}
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <div className="profile-content">

        {/* ════════════ OVERVIEW ════════════ */}
        {activeTab === "Overview" && (
          <>
            {/* Personal Info */}
            <div className="profile-grid" style={{ marginBottom: 20 }}>
              <div className="profile-card profile-card--full">
                <div className="profile-card-header">
                  <span className="profile-card-title">Personal Information</span>
                  <button
                    className="btn profile-btn-sm"
                    onClick={() => setActiveTab("Settings")}
                  >
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
                    <p className="profile-info-value">+63 917 000 0000</p>
                  </div>
                  <div>
                    <p className="profile-info-label">Member Since</p>
                    <p className="profile-info-value">{memberSince}</p>
                  </div>
                  <div>
                    <p className="profile-info-label">Shoe Size</p>
                    <p className="profile-info-value">EU 43</p>
                  </div>
                  <div>
                    <p className="profile-info-label">Account Status</p>
                    <p className="profile-info-value" style={{ color: "#4a6a2a" }}>Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders summary */}
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Recent Orders</span>
                <button
                  className="btn profile-btn-sm"
                  onClick={() => setActiveTab("Orders")}
                >
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
                      <span
                        className={
                          BADGE_CLASS[order.status] ?? "profile-badge"
                        }
                      >
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
                    <span
                      className={BADGE_CLASS[order.status] ?? "profile-badge"}
                    >
                      {order.status}
                    </span>
                    <span className="profile-order-total">{order.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════ ADDRESSES ════════════ */}
        {activeTab === "Addresses" && (
          <div className="profile-grid profile-grid--3">
            {/* Address 1 */}
            <div className="profile-card">
              <div className="profile-address-card">
                <span className="profile-address-tag">Home</span>
                <p className="profile-address-name">{emailName}</p>
                <p className="profile-address-line">
                  123 Mahogany St., Brgy. San Antonio
                  <br />
                  Quezon City, Metro Manila 1100
                </p>
                <p className="profile-address-phone">+63 917 000 0000</p>
              </div>
              <div className="divider" />
              <button className="btn profile-btn-sm">
                <Edit2 size={11} style={{ display: "inline", marginRight: 6 }} />
                Edit
              </button>
            </div>

            {/* Address 2 */}
            <div className="profile-card">
              <div className="profile-address-card">
                <span className="profile-address-tag">Office</span>
                <p className="profile-address-name">{emailName}</p>
                <p className="profile-address-line">
                  8F One Corporate Centre
                  <br />
                  Doña Julia Vargas Ave., Ortigas 1605
                </p>
                <p className="profile-address-phone">+63 917 000 0000</p>
              </div>
              <div className="divider" />
              <button className="btn profile-btn-sm">
                <Edit2 size={11} style={{ display: "inline", marginRight: 6 }} />
                Edit
              </button>
            </div>

            {/* Add new */}
            <button className="profile-card profile-address-add">
              <span className="profile-address-add-icon">
                <Plus size={32} color="#b9a88f" />
              </span>
              <span className="profile-address-add-text">Add New Address</span>
            </button>
          </div>
        )}

        {/* ════════════ SETTINGS ════════════ */}
        {activeTab === "Settings" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
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

              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div className="profile-form-row">
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>
                      Full Name
                    </p>
                    <input
                      className="pando-input"
                      style={{ paddingLeft: 16 }}
                      defaultValue={emailName}
                    />
                  </div>
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>
                      Email
                    </p>
                    <input
                      className="pando-input"
                      style={{ paddingLeft: 16 }}
                      defaultValue={user.email ?? ""}
                      readOnly
                    />
                  </div>
                </div>

                <div className="profile-form-row">
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>
                      Phone Number
                    </p>
                    <input
                      className="pando-input"
                      style={{ paddingLeft: 16 }}
                      placeholder="+63 900 000 0000"
                    />
                  </div>
                  <div>
                    <p className="profile-info-label" style={{ marginBottom: 8 }}>
                      Shoe Size (EU)
                    </p>
                    <input
                      className="pando-input"
                      style={{ paddingLeft: 16 }}
                      placeholder="e.g. 43"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn" onClick={handleSave}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Change Password</span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div>
                  <p className="profile-info-label" style={{ marginBottom: 8 }}>
                    Current Password
                  </p>
                  <input
                    className="pando-input"
                    style={{ paddingLeft: 16 }}
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <div className="profile-form-row">
                  <div>
                    <p
                      className="profile-info-label"
                      style={{ marginBottom: 8 }}
                    >
                      New Password
                    </p>
                    <input
                      className="pando-input"
                      style={{ paddingLeft: 16 }}
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <p
                      className="profile-info-label"
                      style={{ marginBottom: 8 }}
                    >
                      Confirm New Password
                    </p>
                    <input
                      className="pando-input"
                      style={{ paddingLeft: 16 }}
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn">Update Password</button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div
              className="profile-card"
              style={{ borderLeft: "3px solid #c0392b" }}
            >
              <div className="profile-card-header">
                <span className="profile-card-title" style={{ color: "#c0392b" }}>
                  Danger Zone
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#3c2415",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Sign Out
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "#9a8070" }}>
                    You will be redirected to the login page.
                  </p>
                </div>
                <button
                  className="btn"
                  style={{ background: "#3c2415", float: "none" }}
                  onClick={handleLogout}
                >
                  <LogOut
                    size={13}
                    style={{ display: "inline", marginRight: 8 }}
                  />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}