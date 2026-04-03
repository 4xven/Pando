"use client";

import Header from "../components/shared/header";
import Footer from "../components/shared/footer";
import { User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "./../lib/firebase";
import {
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  DocumentSnapshot,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { LogOut, Edit2, Check, X, Loader2, Package, XCircle, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  shoeSize: string;
  street: string;
  city: string;
  province: string;
  postal: string;
}

interface FirestoreOrder {
  id: string;
  userId: string;
  shipping: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    postal: string;
  };
  items: {
    productId: string;
    name: string;
    price: number;
    size: number;
    quantity: number;
    image: string | null;
  }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: { seconds: number } | null;
}

const TABS = ["Overview", "Orders", "Settings"] as const;
type Tab = (typeof TABS)[number];

// Status badge config — locked statuses cannot be changed by user
const STATUS_BADGE: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  pending:    { bg: "#fef9ec", color: "#92400e", dot: "#f59e0b", label: "Pending" },
  processing: { bg: "#eff6ff", color: "#1e40af", dot: "#3b82f6", label: "Processing" },
  shipped:    { bg: "#f5f3ff", color: "#5b21b6", dot: "#8b5cf6", label: "Shipped" },
  delivered:  { bg: "#f0fdf4", color: "#065f46", dot: "#22c55e", label: "Delivered" },
  cancelled:  { bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e", label: "Cancelled" },
};

const CANCELLABLE_STATUSES = ["pending"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPrice = (n: number) =>
  "₱" + new Intl.NumberFormat("en-PH").format(n);

const formatDate = (ts: { seconds: number } | null) => {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ── Reusable Input ────────────────────────────────────────────────────────────
function FormInput({
  label, value, onChange, placeholder, type = "text", readOnly = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", marginBottom: 8, marginTop: 0 }}>
        {label}
      </p>
      <input
        type={type} value={value} placeholder={placeholder} readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ width: "100%", padding: "10px 16px", border: "1.5px solid #e0d8d0", borderRadius: 8, fontSize: "0.88rem", color: readOnly ? "#9a8070" : "#3C2415", background: readOnly ? "#f7f3ef" : "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", cursor: readOnly ? "not-allowed" : "text" }}
        onFocus={(e) => { if (!readOnly) e.currentTarget.style.borderColor = "#8a6a50"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e0d8d0"; }}
      />
    </div>
  );
}

// ── Alert banner ──────────────────────────────────────────────────────────────
function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div style={{ padding: "10px 16px", borderRadius: 8, fontSize: "0.83rem", fontWeight: 500, marginBottom: 16, background: type === "success" ? "#d1fae5" : "#fee2e2", color: type === "success" ? "#065f46" : "#991b1b", display: "flex", alignItems: "center", gap: 8 }}>
      {type === "success" ? <Check size={14} /> : <X size={14} />}
      {message}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status?.toLowerCase()] ?? STATUS_BADGE["pending"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.color, letterSpacing: "0.3px" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Order Card (modern, image-forward) ────────────────────────────────────────
function OrderCard({
  order,
  onCancel,
  cancelling,
  expanded,
  onToggle,
}: {
  order: FirestoreOrder;
  onCancel?: (id: string) => void;
  cancelling?: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const canCancel = CANCELLABLE_STATUSES.includes(order.status?.toLowerCase());
  const firstItem = order.items?.[0];
  const extraCount = (order.items?.length ?? 1) - 1;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ede6df", overflow: "hidden", transition: "box-shadow 0.2s", marginBottom: 12 }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 18px rgba(60,36,20,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Card header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }} onClick={onToggle}>
        {/* Product image */}
        <div style={{ width: 64, height: 64, borderRadius: 10, background: "#f7f3ef", flexShrink: 0, overflow: "hidden", border: "1px solid #ede6df" }}>
          {firstItem?.image ? (
            <img src={firstItem.image} alt={firstItem.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={22} color="#c8b8a8" />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#1a0e06", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {firstItem?.name ?? "Order"}
            </p>
            {extraCount > 0 && (
              <span style={{ fontSize: "0.72rem", background: "#f0ebe4", color: "#7a6050", borderRadius: 10, padding: "2px 7px", fontWeight: 600, flexShrink: 0 }}>
                +{extraCount} more
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#9a8070" }}>
            {firstItem && <>EU {firstItem.size} · Qty {firstItem.quantity}</>}
            {" · "}{formatDate(order.createdAt)}
          </p>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <StatusBadge status={order.status} />
          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#1a0e06" }}>
            {formatPrice(order.total)}
          </p>
        </div>

        <div style={{ color: "#b0a090", marginLeft: 4 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #f0ebe4", padding: "14px 18px", background: "#fdfaf7" }}>
          {/* All items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {order.items?.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f0ebe4", overflow: "hidden", flexShrink: 0, border: "1px solid #ede6df" }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={16} color="#c8b8a8" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#1a0e06" }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#9a8070" }}>EU {item.size} · Qty {item.quantity}</p>
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1a0e06" }}>
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div style={{ borderTop: "1px solid #ede6df", paddingTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#9a8070" }}>
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#9a8070" }}>
              <span>Shipping ({order.paymentMethod ?? "COD"})</span><span>{formatPrice(order.shippingFee ?? 250)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", fontWeight: 700, color: "#1a0e06", paddingTop: 6, borderTop: "1px solid #ede6df" }}>
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Cancel button — only for pending */}
          {canCancel && onCancel && (
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={(e) => {
  e.stopPropagation();

  const confirmCancel = window.confirm("Are you sure you want to cancel this order?");

  if (!confirmCancel) return;

  onCancel(order.id);
}}
                disabled={cancelling}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: cancelling ? "#f7f3ef" : "#fff1f2", color: "#9f1239", border: "1.5px solid #fecdd3", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, cursor: cancelling ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: cancelling ? 0.7 : 1 }}
                onMouseEnter={(e) => { if (!cancelling) { e.currentTarget.style.background = "#ffe4e6"; e.currentTarget.style.borderColor = "#fb7185"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.borderColor = "#fecdd3"; }}
              >
                {cancelling ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                {cancelling ? "Cancelling…" : "Cancel Order"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "", phone: "", shoeSize: "", street: "", city: "", province: "", postal: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAlert, setProfileAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwAlert, setPwAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    let ordersUnsub: (() => void) | undefined;

    const authUnsub = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) { router.push("/login"); return; }
      setUser(currentUser);

      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          name: data.name ?? currentUser.displayName ?? "",
          email: currentUser.email ?? "",
          phone: data.phone ?? "",
          shoeSize: data.shoeSize ?? "",
          street: data.street ?? "",
          city: data.city ?? "",
          province: data.province ?? "",
          postal: data.postal ?? "",
        });
      } else {
        setProfile((prev) => ({ ...prev, name: currentUser.displayName ?? currentUser.email?.split("@")[0] ?? "", email: currentUser.email ?? "" }));
      }

      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      ordersUnsub = onSnapshot(ordersQuery,
        (snap) => {
          setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FirestoreOrder, "id">) })));
          setOrdersLoading(false);
        },
        (err) => { console.error("Orders listener error:", err); setOrdersLoading(false); }
      );
    });

    return () => { authUnsub(); ordersUnsub?.(); };
  }, [router]);

  // ── Cancel order ───────────────────────────────────────────────────────────
const handleCancelOrder = async (orderId: string) => {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  if (!CANCELLABLE_STATUSES.includes(order.status?.toLowerCase())) return;

  setCancellingId(orderId);

  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, "orders", orderId);

      // ✅ READ ORDER FIRST
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) return;

      const orderData = orderSnap.data();

      // Prevent double cancel
      if (orderData.status === "cancelled") return;

      // ✅ GROUP ITEMS FIRST
const grouped: Record<string, number> = {};

for (const item of order.items) {
  if (!grouped[item.productId]) {
    grouped[item.productId] = 0;
  }
  grouped[item.productId] += item.quantity;
}

const productIds = Object.keys(grouped);
const productRefs = productIds.map((id) => doc(db, "products", id));



// Read all products
const productSnaps: DocumentSnapshot[] = [];
for (const ref of productRefs) {
  const snap = await transaction.get(ref);
  productSnaps.push(snap);
}

// Update order
transaction.update(orderRef, {
  status: "cancelled",
  cancelledAt: new Date(),
  cancelledBy: "user",
});

// ✅ RESTORE STOCK PROPERLY
for (let i = 0; i < productIds.length; i++) {
  const snap = productSnaps[i];
  if (!snap.exists()) continue;

  const currentStock = snap.data().stock || 0;
  const totalQty = grouped[productIds[i]];

  transaction.update(productRefs[i], {
    stock: currentStock + totalQty,
  });
}
    });

  } catch (err) {
    console.error("Failed to cancel order:", err);
    alert("Could not cancel order. Please try again.");
  } finally {
    setCancellingId(null);
  }
};

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true); setProfileAlert(null);
    try {
      await updateProfile(user, { displayName: profile.name });
      await setDoc(doc(db, "users", user.uid), {
        name: profile.name, email: profile.email, phone: profile.phone, shoeSize: profile.shoeSize,
        street: profile.street, city: profile.city, province: profile.province, postal: profile.postal,
      }, { merge: true });
      setProfileAlert({ type: "success", message: "Profile saved successfully!" });
    } catch (err: unknown) {
      setProfileAlert({ type: "error", message: err instanceof Error ? err.message : "Failed to save profile." });
    } finally { setProfileSaving(false); }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    setPwAlert(null);
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwAlert({ type: "error", message: "Please fill in all password fields." }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwAlert({ type: "error", message: "New passwords do not match." }); return; }
    if (pwForm.next.length < 6) { setPwAlert({ type: "error", message: "Password must be at least 6 characters." }); return; }
    setPwSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, pwForm.next);
      setPwAlert({ type: "success", message: "Password updated successfully!" });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message.includes("wrong-password") ? "Current password is incorrect." : err instanceof Error ? err.message : "Failed to update password.";
      setPwAlert({ type: "error", message: msg });
    } finally { setPwSaving(false); }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("pando_logged_in");
    localStorage.removeItem("pando_role");
    window.dispatchEvent(new Event("pando_auth_change"));
    router.push("/login");
  };

  if (!user) return null;

  const displayName = profile.name || user.displayName || user.email?.split("@")[0] || "Guest";
  const initials = displayName.split(/[\s._-]/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
  const memberSince = user.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : "2025";
  const totalSpent = orders.reduce((s, o) => s + (o.total ?? 0), 0);

  const toggleOrder = (id: string) => setExpandedOrderId((prev) => (prev === id ? null : id));

  return (
    <div className="profile-page" style={{ backgroundColor: "#e8dfd3", minHeight: "100vh" }}>
      <Header />

      {/* ── LOGOUT MODAL ─────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "32px 28px", width: "100%", maxWidth: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowLogoutConfirm(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#9a8070", padding: 4 }}><X size={18} /></button>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fdecea", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <LogOut size={22} color="#c0392b" />
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#2c2118", marginBottom: 8, marginTop: 0 }}>Sign out of Pando?</h2>
            <p style={{ fontSize: "0.83rem", color: "#9a8070", marginBottom: 24, lineHeight: 1.5 }}>Youll need to sign back in to access your orders and account details.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: "10px 0", background: "none", border: "1px solid #d9cfc4", borderRadius: 7, fontSize: "0.85rem", fontWeight: 600, color: "#7a5c48", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: "10px 0", background: "#c0392b", border: "none", borderRadius: 7, fontSize: "0.85rem", fontWeight: 600, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-avatar">{initials || "P"}</div>
        <div className="profile-hero-info">
          <p className="profile-hero-since">Member since {memberSince}</p>
          <h1 className="profile-hero-name">{displayName}</h1>
          <p className="profile-hero-email">{user.email}</p>
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{orders.length}</div>
            <div className="profile-stat-label">Orders</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">₱{(totalSpent / 1000).toFixed(1)}k</div>
            <div className="profile-stat-label">Spent</div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ──────────────────────────────────────────── */}
      <div className="profile-tabbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex" }}>
          {TABS.map((tab) => (
            <button key={tab} className={`profile-tab${activeTab === tab ? " profile-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        <button
  onClick={() => setShowLogoutConfirm(true)}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    marginRight: 4,
    background: "transparent",
    color: "#e8dfd3",
    border: "1px solid transparent",
    borderRadius: 6,
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease"
  }}
  onMouseEnter={(e) => {
    const b = e.currentTarget;
    b.style.background = "#e8dfd3";
    b.style.color = "#3a2414";
    b.style.borderColor = "#e8dfd3";
  }}
  onMouseLeave={(e) => {
    const b = e.currentTarget;
    b.style.background = "transparent";
    b.style.color = "#e8dfd3";
    b.style.borderColor = "transparent";
  }}
>
  <LogOut size={14} />
  LOGOUT
</button>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <div className="profile-content">

        {/* ════ OVERVIEW ════ */}
        {activeTab === "Overview" && (
          <>
            <div className="profile-grid" style={{ marginBottom: 20 }}>
              <div className="profile-card profile-card--full">
                <div className="profile-card-header">
                  <span className="profile-card-title">Personal Information</span>
                  <button className="btn profile-btn-sm" onClick={() => setActiveTab("Settings")}>
                    <Edit2 size={12} style={{ display: "inline", marginRight: 6 }} />Edit
                  </button>
                </div>
                <div className="profile-info-grid">
                  <div><p className="profile-info-label">Full Name</p><p className="profile-info-value">{profile.name || "—"}</p></div>
                  <div><p className="profile-info-label">Email</p><p className="profile-info-value">{user.email}</p></div>
                  <div><p className="profile-info-label">Phone</p><p className="profile-info-value">{profile.phone || "—"}</p></div>
                  <div><p className="profile-info-label">Member Since</p><p className="profile-info-value">{memberSince}</p></div>
                  <div><p className="profile-info-label">Shoe Size (EU)</p><p className="profile-info-value">{profile.shoeSize || "—"}</p></div>
                  <div><p className="profile-info-label">Account Status</p><p className="profile-info-value" style={{ color: "#4a6a2a" }}>Active</p></div>
                </div>
                {(profile.street || profile.city) && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #ede6df" }}>
                    <p className="profile-info-label">Default Shipping Address</p>
                    <p className="profile-info-value" style={{ lineHeight: 1.6 }}>
                      {[profile.street, profile.city, profile.province, profile.postal].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Recent Orders</span>
                <button className="btn profile-btn-sm" onClick={() => setActiveTab("Orders")}>View All</button>
              </div>
              {ordersLoading ? (
                <p style={{ fontSize: "0.85rem", color: "#9a8070", padding: "12px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={14} className="animate-spin" /> Loading orders…
                </p>
              ) : orders.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                  <ShoppingBag size={36} color="#c8b8a8" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: "0.85rem", color: "#9a8070", margin: 0 }}>No orders yet.</p>
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {orders.slice(0, 2).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onCancel={handleCancelOrder}
                      cancelling={cancellingId === order.id}
                      expanded={expandedOrderId === order.id}
                      onToggle={() => toggleOrder(order.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ════ ORDERS ════ */}
        {activeTab === "Orders" && (
          <div className="profile-card">
            <div className="profile-card-header">
              <span className="profile-card-title">Order History</span>
              <span style={{ fontSize: "0.75rem", color: "#9a8070" }}>
                {ordersLoading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {ordersLoading ? (
              <p style={{ fontSize: "0.85rem", color: "#9a8070", padding: "12px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <Loader2 size={14} className="animate-spin" /> Loading orders…
              </p>
            ) : orders.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <ShoppingBag size={48} color="#c8b8a8" style={{ marginBottom: 14 }} />
                <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#7a6050", margin: "0 0 6px" }}>No orders yet</p>
                <p style={{ fontSize: "0.83rem", color: "#9a8070", margin: 0 }}>When you place an order, it will appear here.</p>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onCancel={handleCancelOrder}
                    cancelling={cancellingId === order.id}
                    expanded={expandedOrderId === order.id}
                    onToggle={() => toggleOrder(order.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {activeTab === "Settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="profile-card">
              <div className="profile-card-header"><span className="profile-card-title">Account Details</span></div>
              {profileAlert && <Alert type={profileAlert.type} message={profileAlert.message} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="profile-form-row">
                  <FormInput label="Full Name" value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} placeholder="Your full name" />
                  <FormInput label="Email" value={profile.email} readOnly />
                </div>
                <div className="profile-form-row">
                  <FormInput label="Phone Number" value={profile.phone} onChange={(v) => setProfile((p) => ({ ...p, phone: v }))} placeholder="+63 900 000 0000" />
                  <FormInput label="Shoe Size (EU)" value={profile.shoeSize} onChange={(v) => setProfile((p) => ({ ...p, shoeSize: v }))} placeholder="e.g. 43" />
                </div>
                <div style={{ paddingTop: 8, borderTop: "1px solid #ede6df" }}>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", marginBottom: 16, marginTop: 0 }}>Default Shipping Address</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <FormInput label="Street Address" value={profile.street} onChange={(v) => setProfile((p) => ({ ...p, street: v }))} placeholder="House No., Street Name, Barangay" />
                    <div className="profile-form-row">
                      <FormInput label="City" value={profile.city} onChange={(v) => setProfile((p) => ({ ...p, city: v }))} placeholder="City" />
                      <FormInput label="Province" value={profile.province} onChange={(v) => setProfile((p) => ({ ...p, province: v }))} placeholder="Province" />
                    </div>
                    <div style={{ maxWidth: "calc(50% - 8px)" }}>
                      <FormInput label="Postal Code" value={profile.postal} onChange={(v) => setProfile((p) => ({ ...p, postal: v }))} placeholder="####" />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn" onClick={handleSaveProfile} disabled={profileSaving} style={{ display: "flex", alignItems: "center", gap: 8, opacity: profileSaving ? 0.7 : 1, cursor: profileSaving ? "not-allowed" : "pointer" }}>
                    {profileSaving && <Loader2 size={13} className="animate-spin" />}
                    {profileSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-card-header"><span className="profile-card-title">Change Password</span></div>
              {pwAlert && <Alert type={pwAlert.type} message={pwAlert.message} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <FormInput label="Current Password" value={pwForm.current} onChange={(v) => setPwForm((p) => ({ ...p, current: v }))} type="password" placeholder="••••••••" />
                <div className="profile-form-row">
                  <FormInput label="New Password" value={pwForm.next} onChange={(v) => setPwForm((p) => ({ ...p, next: v }))} type="password" placeholder="••••••••" />
                  <FormInput label="Confirm New Password" value={pwForm.confirm} onChange={(v) => setPwForm((p) => ({ ...p, confirm: v }))} type="password" placeholder="••••••••" />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn" onClick={handleChangePassword} disabled={pwSaving} style={{ display: "flex", alignItems: "center", gap: 8, opacity: pwSaving ? 0.7 : 1, cursor: pwSaving ? "not-allowed" : "pointer" }}>
                    {pwSaving && <Loader2 size={13} className="animate-spin" />}
                    {pwSaving ? "Updating…" : "Update Password"}
                  </button>
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