"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      localStorage.setItem("pando_logged_in", "true");
      window.dispatchEvent(new Event("pando_auth_change"));
      router.push("/");
    }, 1500);
  };

  const panelVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const S = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f0eb",
      padding: "16px",
      fontFamily: "'Georgia', serif",
    } as React.CSSProperties,

    card: {
      position: "relative",
      width: "100%",
      maxWidth: "860px",
      minHeight: "560px",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      display: "flex",
      background: "#faf8f5",
    } as React.CSSProperties,

    heroPanel: {
      position: "relative",
      width: "42%",
      flexShrink: 0,
      overflow: "hidden",
    } as React.CSSProperties,

    heroBg: {
      position: "absolute",
      inset: 0,
      backgroundImage: "url('/login.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: "brightness(0.68)",
    } as React.CSSProperties,

    heroGradient: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)",
    } as React.CSSProperties,

    brandMark: {
      position: "absolute",
      top: 28,
      left: 28,
      color: "#fff",
      fontWeight: 700,
      letterSpacing: "4px",
      fontSize: "15px",
      textTransform: "uppercase" as const,
    } as React.CSSProperties,

    heroText: {
      position: "absolute",
      bottom: 36,
      left: 28,
      right: 28,
      color: "#fff",
    } as React.CSSProperties,

    heroHeading: {
      fontSize: "28px",
      fontWeight: 700,
      lineHeight: 1.25,
      marginBottom: "10px",
      margin: "0 0 10px 0",
    } as React.CSSProperties,

    heroSub: {
      fontSize: "13px",
      color: "rgba(255,255,255,0.68)",
      lineHeight: 1.6,
      margin: 0,
    } as React.CSSProperties,

    formPanel: {
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
      padding: "36px 40px",
    } as React.CSSProperties,

    backLink: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "11px",
      color: "#a09080",
      textDecoration: "none",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      marginBottom: "24px",
    } as React.CSSProperties,

    tabWrapper: {
      display: "flex",
      alignSelf: "center",
      border: "1px solid #e5ddd5",
      borderRadius: "999px",
      padding: "3px",
      background: "#f5f0ea",
      marginBottom: "28px",
      gap: "4px",
    } as React.CSSProperties,

    tabActive: {
      padding: "6px 22px",
      fontSize: "11px",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      fontWeight: 700,
      borderRadius: "999px",
      background: "#2a1f14",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      fontFamily: "inherit",
    } as React.CSSProperties,

    tabInactive: {
      padding: "6px 22px",
      fontSize: "11px",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      fontWeight: 600,
      borderRadius: "999px",
      background: "transparent",
      color: "#8a7a6a",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
    } as React.CSSProperties,

    headingBlock: {
      textAlign: "center" as const,
      marginBottom: "24px",
    } as React.CSSProperties,

    heading: {
      fontSize: "24px",
      fontWeight: 700,
      color: "#1a1008",
      letterSpacing: "-0.3px",
      margin: 0,
    } as React.CSSProperties,

    subheading: {
      fontSize: "12px",
      color: "#a09080",
      marginTop: "4px",
      letterSpacing: "0.5px",
    } as React.CSSProperties,

    form: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "16px",
    } as React.CSSProperties,

    fieldGroup: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "6px",
    } as React.CSSProperties,

    labelRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    } as React.CSSProperties,

    label: {
      fontSize: "10px",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      color: "#7a6a5a",
      fontWeight: 600,
      margin: 0,
    } as React.CSSProperties,

    forgotBtn: {
      fontSize: "10px",
      color: "#a09080",
      background: "none",
      border: "none",
      cursor: "pointer",
      letterSpacing: "1px",
      fontFamily: "inherit",
    } as React.CSSProperties,

    inputWrapper: {
      position: "relative" as const,
    } as React.CSSProperties,

    inputIcon: {
      position: "absolute" as const,
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#b0a090",
      pointerEvents: "none" as const,
      display: "flex",
    } as React.CSSProperties,

    input: (focused: boolean): React.CSSProperties => ({
      width: "100%",
      border: `1px solid ${focused ? "#6a5a4a" : "#ddd5c8"}`,
      borderRadius: "10px",
      padding: "10px 14px 10px 36px",
      fontSize: "13px",
      color: "#2a1f14",
      background: "#fff",
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
    }),

    submitBtn: (submitting: boolean): React.CSSProperties => ({
      marginTop: "6px",
      width: "100%",
      background: submitting ? "#5a4a3a" : "#2a1f14",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      padding: "13px 20px",
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "2.5px",
      textTransform: "uppercase" as const,
      cursor: submitting ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      fontFamily: "inherit",
    }),

    dividerRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      margin: "18px 0",
    } as React.CSSProperties,

    dividerLine: {
      flex: 1,
      height: "1px",
      background: "#e5ddd5",
    } as React.CSSProperties,

    dividerText: {
      fontSize: "10px",
      color: "#b0a090",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const,
    } as React.CSSProperties,

    socialRow: {
      display: "flex",
      gap: "12px",
      justifyContent: "center",
    } as React.CSSProperties,

    socialBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "1px solid #e5ddd5",
      background: "#fff",
      cursor: "pointer",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* LEFT HERO */}
        <div style={S.heroPanel}>
          <div style={S.heroBg} />
          <div style={S.heroGradient} />
          <div style={S.brandMark}>Pando</div>
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div key="hero-login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} style={S.heroText}>
                <h2 style={S.heroHeading}>Welcome back to the craft.</h2>
                <p style={S.heroSub}>Sign in to access your exclusive orders, saved items, and personalized recommendations.</p>
              </motion.div>
            ) : (
              <motion.div key="hero-signup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} style={S.heroText}>
                <h2 style={S.heroHeading}>Join our heritage.</h2>
                <p style={S.heroSub}>Create an account to experience the finest Marikina shoemaking and exclusive member benefits.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT FORM */}
        <div style={S.formPanel}>

          <Link href="/" style={S.backLink}>
            <ArrowLeft size={13} />
            <span>Back</span>
          </Link>

          {/* Tabs */}
          <div style={S.tabWrapper}>
            {(["Login", "Sign Up"] as const).map((tab) => {
              const active = tab === "Login" ? isLogin : !isLogin;
              return (
                <button key={tab} onClick={() => setIsLogin(tab === "Login")} style={active ? S.tabActive : S.tabInactive}>
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div key="h-login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} style={S.headingBlock}>
                <h1 style={S.heading}>Sign In</h1>
                <p style={S.subheading}>Enter your details to proceed further</p>
              </motion.div>
            ) : (
              <motion.div key="h-signup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} style={S.headingBlock}>
                <h1 style={S.heading}>Create Account</h1>
                <p style={S.subheading}>Fill in the details to get started</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form key={isLogin ? "f-login" : "f-signup"} variants={panelVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleSubmit} style={S.form}>

              {!isLogin && (
                <div style={S.fieldGroup}>
                  <label style={S.label}>Full Name</label>
                  <div style={S.inputWrapper}>
                    <span style={S.inputIcon}><User size={13} /></span>
                    <input type="text" name="name" placeholder="Juan Dela Cruz" value={formData.name} onChange={handleChange} onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)} style={S.input(focusedField === "name")} />
                  </div>
                </div>
              )}

              <div style={S.fieldGroup}>
                <label style={S.label}>Email Address</label>
                <div style={S.inputWrapper}>
                  <span style={S.inputIcon}><Mail size={13} /></span>
                  <input type="email" name="email" placeholder="hello@example.com" value={formData.email} onChange={handleChange} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} required style={S.input(focusedField === "email")} />
                </div>
              </div>

              <div style={S.fieldGroup}>
                <div style={S.labelRow}>
                  <label style={S.label}>Password</label>
                  {isLogin && <button type="button" style={S.forgotBtn}>Forgot?</button>}
                </div>
                <div style={S.inputWrapper}>
                  <span style={S.inputIcon}><Lock size={13} /></span>
                  <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} required style={S.input(focusedField === "password")} />
                </div>
              </div>

              <motion.button type="submit" disabled={isSubmitting} whileTap={{ scale: 0.98 }} style={S.submitBtn(isSubmitting)}>
                {isSubmitting ? "Processing..." : <>{isLogin ? "Sign In" : "Create Account"}<ArrowRight size={13} /></>}
              </motion.button>

            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div style={S.dividerRow}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>or continue with</span>
            <div style={S.dividerLine} />
          </div>

          {/* Social */}
          <div style={S.socialRow}>
            <button style={S.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
            </button>
            <button style={S.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
