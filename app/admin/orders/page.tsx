"use client";

import React from "react";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { ChevronDown, ChevronUp, Search, Lock, Package } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  name: string;
  size: number;
  quantity: number;
  price: number;
  image?: string | null;
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal: string;
}

interface Order {
  id: string;
  userId: string;
  shipping: ShippingInfo;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: { seconds: number } | null;
  cancelledBy?: "user" | "admin";
  cancelledAt?: unknown;
}

// ── Status config ─────────────────────────────────────────────────────────────
// Admin can only move orders forward through this flow.
// Cancelled orders (by user) are LOCKED — admin cannot edit them.
const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; dot: string }> = {
  pending:    { bg: "#fef9ec", color: "#92400e", dot: "#f59e0b" },
  processing: { bg: "#eff6ff", color: "#1e40af", dot: "#3b82f6" },
  shipped:    { bg: "#f5f3ff", color: "#5b21b6", dot: "#8b5cf6" },
  delivered:  { bg: "#f0fdf4", color: "#065f46", dot: "#22c55e" },
  cancelled:  { bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e" },
};

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

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_STYLE[status] ?? STATUS_STYLE["pending"];
  const label = STATUS_LABEL[status] ?? "Unknown";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.color, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Real-time Firestore listener ──────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
        setLoading(false);
      },
      (err) => { console.error("Firestore orders listener error:", err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  // ── Update order status (admin only, locked if cancelled by user) ─────────
  const updateStatus = async (order: Order, newStatus: OrderStatus) => {
    // LOCK: if cancelled by user, admin cannot update
    if (order.status === "cancelled" && order.cancelledBy === "user") return;
    // LOCK: if already delivered or cancelled (terminal states)
    if (order.status === "delivered" || order.status === "cancelled") return;

    setUpdatingId(order.id);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: "admin",
      });
    } catch (e) {
      console.error("Failed to update order status:", e);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const isLocked = (order: Order) =>
    order.status === "delivered" ||
    order.status === "cancelled";

  // ── Filtered view ─────────────────────────────────────────────────────────
  const filtered = orders.filter((o) => {
    const fullName = `${o.shipping?.firstName ?? ""} ${o.shipping?.lastName ?? ""}`.trim();
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      (o.shipping?.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Summary counts ────────────────────────────────────────────────────────
  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "87vh", background: "#f3efe9", padding: "28px 32px 60px", fontFamily: "Georgia, serif" }}>

      {/* Page Title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1a0e06", margin: "0 0 4px" }}>Order Management</h1>
        <p style={{ fontSize: "0.85rem", color: "#9a8070", margin: 0 }}>
          {loading ? "Loading orders…" : `${orders.length} order${orders.length !== 1 ? "s" : ""} total · live sync enabled`}
        </p>
      </div>

      {/* Status Summary Pills */}
      {!loading && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <button
            onClick={() => setStatusFilter("all")}
            style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", borderColor: statusFilter === "all" ? "#6b4c35" : "#ddd5cc", background: statusFilter === "all" ? "#3a2010" : "#fff", color: statusFilter === "all" ? "#fff" : "#7a6050" }}
          >
            All · {orders.length}
          </button>
          {STATUS_OPTIONS.map((s) => {
            const cfg = STATUS_STYLE[s];
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", borderColor: active ? cfg.dot : "#ddd5cc", background: active ? cfg.bg : "#fff", color: active ? cfg.color : "#7a6050" }}
              >
                {STATUS_LABEL[s]} · {counts[s]}
              </button>
            );
          })}
        </div>
      )}

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 8px rgba(60,36,20,0.07)", overflow: "hidden" }}>

        {/* Search bar */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0ebe4" }}>
          <div style={{ position: "relative", maxWidth: 480 }}>
            <Search size={15} color="#b0a090" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by order ID, customer name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 38px", border: "1.5px solid #e8e0d8", borderRadius: 10, fontSize: "0.88rem", color: "#3a2010", background: "#fdf9f5", outline: "none", fontFamily: "Georgia, serif", boxSizing: "border-box" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#a07840")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ padding: 48, textAlign: "center", color: "#9a8070", fontSize: "0.88rem" }}>Loading orders…</div>
        )}

        {/* Table */}
        {!loading && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fdf9f5" }}>
                {["Product", "Customer", "Total", "Payment", "Status", "Date", "Details"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", fontWeight: 700, padding: "12px 20px", borderBottom: "1px solid #f0ebe4", fontFamily: "Georgia, serif", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 48, color: "#9a8070", fontSize: "0.88rem" }}>No orders found.</td>
                </tr>
              ) : (
                filtered.map((order, i) => {
                  const isExpanded = expandedId === order.id;
                  const isLast = i === filtered.length - 1;
                  const locked = isLocked(order);
                  const st = STATUS_STYLE[order.status] ?? STATUS_STYLE["pending"];
                  const fullName = `${order.shipping?.firstName ?? ""} ${order.shipping?.lastName ?? ""}`.trim() || "—";
                  const firstItem = order.items?.[0];
                  const extraCount = (order.items?.length ?? 1) - 1;
                  const cancelledByUser = order.status === "cancelled" && order.cancelledBy === "user";

                  return (
                    <React.Fragment key={order.id}>
                      {/* Main row */}
                      <tr
                      
                        style={{ borderBottom: isExpanded || !isLast ? "1px solid #f7f3ef" : "none", background: isExpanded ? "#fffcf9" : locked ? "#fdfaf8" : "transparent", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.background = "#fdf9f5"; }}
                        onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.background = locked ? "#fdfaf8" : "transparent"; }}
                      >
                        {/* Product preview */}
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f7f3ef", flexShrink: 0, overflow: "hidden", border: "1px solid #ede6df" }}>
                              {firstItem?.image ? (
                                <img src={firstItem.image} alt={firstItem.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Package size={16} color="#c8b8a8" />
                                </div>
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 600, color: "#1a0e06", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                                {firstItem?.name ?? "—"}
                              </p>
                              {extraCount > 0 && (
                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a8070" }}>+{extraCount} more item{extraCount > 1 ? "s" : ""}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: "14px 20px" }}>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#3a2010", fontWeight: 500 }}>{fullName}</p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#9a8070" }}>{order.shipping?.email ?? "—"}</p>
                        </td>

                        {/* Total */}
                        <td style={{ padding: "14px 20px", fontSize: "0.88rem", fontWeight: 700, color: "#1a0e06" }}>
                          {formatPrice(order.total)}
                        </td>

                        {/* Payment */}
                        <td style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#7a6050" }}>
                          {order.paymentMethod ?? "COD"}
                        </td>

                        {/* Status — dropdown or locked badge */}
                        <td style={{ padding: "14px 20px" }}>
                          {locked ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <StatusBadge status={order.status} />
                              {cancelledByUser && (
                                <span title="Cancelled by customer" style={{ color: "#9a8070" }}>
                                  <Lock size={12} />
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ position: "relative", display: "inline-block" }}>
                              <select
                                value={order.status}
                                disabled={updatingId === order.id}
                                onChange={(e) => updateStatus(order, e.target.value as OrderStatus)}
                                style={{ padding: "5px 28px 5px 10px", borderRadius: 999, border: "none", background: st.bg, color: st.color, fontSize: "0.75rem", fontWeight: 700, cursor: updatingId === order.id ? "not-allowed" : "pointer", appearance: "none", fontFamily: "Georgia, serif", outline: "none", letterSpacing: "0.3px", opacity: updatingId === order.id ? 0.6 : 1, transition: "opacity 0.2s" }}
                              >
                                {/* Only show forward-progression statuses — don't allow downgrading */}
                                {STATUS_OPTIONS.filter((s) => s !== "cancelled").map((s) => (
                                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} color={st.color} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#7a6050", whiteSpace: "nowrap" }}>
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Expand toggle */}
                        <td style={{ padding: "14px 20px" }}>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#b0a090", display: "flex", alignItems: "center", padding: 4, borderRadius: 6, transition: "color 0.2s, background 0.2s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#3a2010"; e.currentTarget.style.background = "#f0ebe4"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#b0a090"; e.currentTarget.style.background = "none"; }}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={7} style={{ padding: "0 20px 20px 20px", background: "#fffcf9", borderBottom: !isLast ? "1px solid #f0ebe4" : "none" }}>

                            {/* Locked notice */}
                            {cancelledByUser && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, marginBottom: 16, fontSize: "0.82rem", color: "#9f1239", fontWeight: 600 }}>
                                <Lock size={13} />
                                This order was cancelled by the customer and cannot be modified.
                              </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                              {/* Customer info */}
                              <div style={{ background: "#f7f3ef", borderRadius: 12, padding: "16px 20px" }}>
                                <p style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", fontWeight: 700, margin: "0 0 12px" }}>Customer Details</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {[
                                    { label: "Name", val: fullName },
                                    { label: "Email", val: order.shipping?.email ?? "—" },
                                    { label: "Phone", val: order.shipping?.phone ?? "—" },
                                    { label: "Address", val: [order.shipping?.street, order.shipping?.city, order.shipping?.province, order.shipping?.postal].filter(Boolean).join(", ") || "—" },
                                    { label: "Payment", val: order.paymentMethod ?? "COD" },
                                  ].map(({ label, val }) => (
                                    <div key={label} style={{ display: "flex", gap: 10, fontSize: "0.82rem" }}>
                                      <span style={{ color: "#9a8070", minWidth: 60 }}>{label}</span>
                                      <span style={{ color: "#3a2010", fontWeight: 500 }}>{val}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Items breakdown */}
                              <div style={{ background: "#f7f3ef", borderRadius: 12, padding: "16px 20px" }}>
                                <p style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", fontWeight: 700, margin: "0 0 12px" }}>Items Ordered</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  {(order.items ?? []).map((item, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: idx < (order.items?.length ?? 0) - 1 ? 10 : 0, borderBottom: idx < (order.items?.length ?? 0) - 1 ? "1px solid #ede8e0" : "none" }}>
                                      <div style={{ width: 36, height: 36, borderRadius: 6, background: "#ede8e0", overflow: "hidden", flexShrink: 0 }}>
                                        {item.image ? (
                                          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Package size={14} color="#c8b8a8" />
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#3a2010" }}>{item.name}</p>
                                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a8070" }}>EU {item.size} · Qty {item.quantity}</p>
                                      </div>
                                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a0e06" }}>{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                  ))}
                                  {/* Totals */}
                                  <div style={{ borderTop: "1px solid #ede8e0", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#9a8070" }}>
                                      <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#9a8070" }}>
                                      <span>Shipping</span><span>{formatPrice(order.shippingFee ?? 250)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, color: "#1a0e06", paddingTop: 4, borderTop: "1px solid #ede8e0" }}>
                                      <span>Total</span><span>{formatPrice(order.total)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid #f0ebe4", fontSize: "0.75rem", color: "#9a8070", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Showing {filtered.length} of {orders.length} orders</span>
            <span style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.65rem" }}>Pando · Order Management</span>
          </div>
        )}
      </div>
    </div>
  );
}