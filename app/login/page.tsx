"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // LOGIN
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // ✅ Fetch role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : "user";

        // ✅ Store login state + role
        localStorage.setItem("pando_logged_in", "true");
        localStorage.setItem("pando_role", role);
        window.dispatchEvent(new Event("pando_auth_change"));

        // ✅ Redirect based on role
        localStorage.setItem("pando_logged_in", "true");
localStorage.setItem("pando_role", role);
window.dispatchEvent(new Event("pando_auth_change"));

// ✅ ADD THIS BACK
if (role === "admin") {
  router.push("/admin/dashboard");
} else {
  router.push("/");
}

      } else {
        // SIGN UP
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const user = userCredential.user;

        if (user && formData.name) {
          await updateProfile(user, { displayName: formData.name });
        }

        // ✅ Save user to Firestore with default role "user"
        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          email: formData.email,
          role: "user",
          createdAt: new Date().toISOString(),
        });

        alert("Account created successfully! Please log in.");
        setIsLogin(true);
        setFormData({ name: "", email: formData.email, password: "" });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const panelVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" } },
  };

  return (
    <div className="pando-page">
      <div className="pando-card">

        {/* HERO */}
        <div className="pando-hero">
          <div className="pando-hero-bg" />
          <div className="pando-hero-gradient" />
          <div className="pando-brand">Pando</div>
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="hero-login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="pando-hero-text"
              >
                <h2 className="pando-hero-heading">Welcome back to the craft.</h2>
                <p className="pando-hero-sub">Sign in to access your exclusive orders and saved items.</p>
              </motion.div>
            ) : (
              <motion.div
                key="hero-signup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="pando-hero-text"
              >
                <h2 className="pando-hero-heading">Join our heritage.</h2>
                <p className="pando-hero-sub">Create an account to experience exclusive member benefits.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FORM PANEL */}
        <div className="pando-form-panel">
          {/* Tabs */}
          <div className="pando-tabs">
            {(["Login", "Sign Up"] as const).map((tab) => {
              const active = tab === "Login" ? isLogin : !isLogin;
              return (
                <button
                  key={tab}
                  onClick={() => setIsLogin(tab === "Login")}
                  className={`pando-tab ${active ? "pando-tab--active" : "pando-tab--inactive"}`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "f-login" : "f-signup"}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleSubmit}
              className="pando-form"
            >
              {!isLogin && (
                <div className="pando-field">
                  <label className="pando-label">Full Name</label>
                  <div className="pando-input-wrap">
                    <span className="pando-input-icon"><User size={14} /></span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pando-input"
                    />
                  </div>
                </div>
              )}

              <div className="pando-field">
                <label className="pando-label">Email Address</label>
                <div className="pando-input-wrap">
                  <span className="pando-input-icon"><Mail size={14} /></span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pando-input"
                  />
                </div>
              </div>

              <div className="pando-field">
                <div className="pando-label-row">
                  <label className="pando-label">Password</label>
                  {isLogin && <button type="button" className="pando-forgot">Forgot?</button>}
                </div>
                <div className="pando-input-wrap">
                  <span className="pando-input-icon"><Lock size={14} /></span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pando-input"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.98 }}
                className="pando-submit"
              >
                {isSubmitting
                  ? "Processing..."
                  : <>{isLogin ? "Sign In" : "Create Account"}<ArrowRight size={14} /></>
                }
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}