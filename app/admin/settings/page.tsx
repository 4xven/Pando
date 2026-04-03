"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  updateEmail as fbUpdateEmail,
  updateProfile as fbUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth";

interface ProfileForm {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileSaved, setProfileSaved] = useState(false);

  // Fetch admin user info on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileForm((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || user.email || "",
        }));
      }
    };

    fetchAdminData();
  }, []);

  const handleProfileSave = async () => {
    try {
      const user: User | null = auth.currentUser;
      if (!user) return alert("No admin logged in.");

      // Update name only
      if (profileForm.name !== user.displayName) {
        await fbUpdateProfile(user, { displayName: profileForm.name });
        await updateDoc(doc(db, "users", user.uid), { name: profileForm.name });
      }

      // Update email
      if (profileForm.email !== user.email) {
        if (!profileForm.currentPassword) {
          return alert("To change email, please enter your current password.");
        }
        const credential = EmailAuthProvider.credential(
          user.email!,
          profileForm.currentPassword,
        );
        await reauthenticateWithCredential(user, credential);

        await fbUpdateEmail(user, profileForm.email);
        await updateDoc(doc(db, "users", user.uid), {
          email: profileForm.email,
        });

        alert(
          "Email updated successfully. For security, you will be logged out.",
        );
        await auth.signOut();
        window.location.href = "/login";
        return;
      }

      // Update password
      if (profileForm.newPassword) {
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          return alert("New password and confirm password do not match.");
        }
        if (!profileForm.currentPassword) {
          return alert("Please enter current password to change password.");
        }

        const credential = EmailAuthProvider.credential(
          user.email!,
          profileForm.currentPassword,
        );
        await reauthenticateWithCredential(user, credential);

        await updatePassword(user, profileForm.newPassword);

        alert(
          "Password updated successfully. For security, you will be logged out.",
        );
        await auth.signOut();
        window.location.href = "/login";
        return;
      }

      // Success feedback for name update only
      if (profileForm.name !== user.displayName) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2000);
      }

      // Clear password fields
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: unknown) {
      console.log(error);
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as any).code === "string"
      ) {
        const errCode = (error as any).code;
        if (errCode === "auth/requires-recent-login") {
          alert(
            "Please log out and log in again to update sensitive information.",
          );
        } else if (errCode === "auth/id-token-expired") {
          alert("Session expired. Please refresh the page or log in again.");
        } else {
          alert(
            (error as any).message ||
              "Something went wrong while saving profile.",
          );
        }
      } else {
        alert("Something went wrong while saving profile.");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "87vh",
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
