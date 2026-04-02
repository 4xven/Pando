"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [profileForm, setProfileForm] = useState({
    name: "Admin User",
    email: "admin@pando.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [storeForm, setStoreForm] = useState({
    storeName: "Pando Shoe Store",
    address: "TIP Quezon City, Local Devs",
    phone: "+63 912 345 6789",
    email: "contact@pando.com",
    logoUrl: "",
  });

  const [profileSaved, setProfileSaved] = useState(false);
  const [storeSaved, setStoreSaved] = useState(false);

  const handleProfileSave = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleStoreSave = () => {
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0ece4",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: "40px 32px",
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "700",
            color: "#2c2118",
            margin: 0,
            letterSpacing: "-0.3px",
          }}
        >
          Settings
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#7a6a58",
            marginTop: "4px",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          Manage your account and store settings
        </p>
      </div>

      {/* Profile Settings Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #e8e0d4",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#2c2118",
            marginBottom: "24px",
            marginTop: 0,
          }}
        >
          Profile Settings
        </h2>

        {/* Name & Email Row */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Name</label>
            <input
              style={inputStyle}
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm({ ...profileForm, email: e.target.value })
              }
            />
          </div>
        </div>

        {/* Change Password */}
        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#2c2118",
              marginBottom: "14px",
              marginTop: 0,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}
          >
            Change Password
          </p>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Current Password</label>
            <input
              style={inputStyle}
              type="password"
              value={profileForm.currentPassword}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  currentPassword: e.target.value,
                })
              }
            />
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>New Password</label>
              <input
                style={inputStyle}
                type="password"
                value={profileForm.newPassword}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    newPassword: e.target.value,
                  })
                }
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                style={inputStyle}
                type="password"
                value={profileForm.confirmPassword}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleProfileSave}
            style={{
              ...buttonStyle,
              backgroundColor: profileSaved ? "#4a7c59" : "#2c2118",
              transition: "background-color 0.3s ease",
            }}
          >
            {profileSaved ? "Saved ✓" : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Store Settings Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #e8e0d4",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#2c2118",
            marginBottom: "24px",
            marginTop: 0,
          }}
        >
          Store Settings
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Store Name</label>
          <input
            style={inputStyle}
            value={storeForm.storeName}
            onChange={(e) =>
              setStoreForm({ ...storeForm, storeName: e.target.value })
            }
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Address</label>
          <input
            style={inputStyle}
            value={storeForm.address}
            onChange={(e) =>
              setStoreForm({ ...storeForm, address: e.target.value })
            }
          />
        </div>

        <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              value={storeForm.phone}
              onChange={(e) =>
                setStoreForm({ ...storeForm, phone: e.target.value })
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={storeForm.email}
              onChange={(e) =>
                setStoreForm({ ...storeForm, email: e.target.value })
              }
            />
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Logo URL</label>
          <input
            style={inputStyle}
            placeholder="https://example.com/logo.png"
            value={storeForm.logoUrl}
            onChange={(e) =>
              setStoreForm({ ...storeForm, logoUrl: e.target.value })
            }
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleStoreSave}
            style={{
              ...buttonStyle,
              backgroundColor: storeSaved ? "#4a7c59" : "#2c2118",
              transition: "background-color 0.3s ease",
            }}
          >
            {storeSaved ? "Saved ✓" : "Save Store Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: "500",
  color: "#6b5b4e",
  marginBottom: "6px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  letterSpacing: "0.2px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd6cc",
  borderRadius: "6px",
  fontSize: "14px",
  color: "#2c2118",
  backgroundColor: "#faf8f5",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s ease",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#2c2118",
  color: "#ffffff",
  border: "none",
  borderRadius: "7px",
  padding: "10px 22px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  letterSpacing: "0.2px",
};