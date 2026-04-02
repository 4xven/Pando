"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

interface OrderItem {
  name: string;
  size: number;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer: string;
  email?: string;
  phone?: string;
  address?: string;
  items: number;
  itemDetails?: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
}

// ── Mock seed data (replace with real Firestore orders collection) ─────────────
const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    customer: "Juan Dela Cruz",
    email: "juan@example.com",
    phone: "+63 917 000 0001",
    address: "123 Mahogany St., Quezon City 1100",
    items: 2,
    itemDetails: [
      { name: "Oxford Brogues", size: 43, quantity: 1, price: 5500 },
      { name: "Tan Leather Belt", size: 0, quantity: 1, price: 3550 },
    ],
    total: 9050,
    status: "Pending",
    date: "2023-10-25",
  },
  {
    id: "ORD-002",
    customer: "Maria Santos",
    email: "maria@example.com",
    phone: "+63 917 000 0002",
    address: "456 Rizal Ave., Manila 1000",
    items: 1,
    itemDetails: [{ name: "Derby Shoes", size: 38, quantity: 1, price: 2800 }],
    total: 2800,
    status: "Processing",
    date: "2023-10-24",
  },
  {
    id: "ORD-003",
    customer: "Jose Rizal",
    email: "jose@example.com",
    phone: "+63 917 000 0003",
    address: "789 Bonifacio Dr., Makati 1200",
    items: 3,
    itemDetails: [
      { name: "Chukka Boots", size: 42, quantity: 2, price: 5900 },
      { name: "Cedar Shoe Trees", size: 0, quantity: 1, price: 2400 },
    ],
    total: 14200,
    status: "Shipped",
    date: "2023-10-23",
  },
  {
    id: "ORD-004",
    customer: "Andres Bonifacio",
    email: "andres@example.com",
    phone: "+63 917 000 0004",
    address: "321 Mabini St., Pasig 1600",
    items: 1,
    itemDetails: [{ name: "Chelsea Boots", size: 44, quantity: 1, price: 5200 }],
    total: 5200,
    status: "Delivered",
    date: "2023-10-22",
  },
  {
    id: "ORD-005",
    customer: "Emilio Aguinaldo",
    email: "emilio@example.com",
    phone: "+63 917 000 0005",
    address: "654 Luna St., Taguig 1630",
    items: 1,
    itemDetails: [{ name: "Loafers", size: 41, quantity: 1, price: 4250 }],
    total: 4250,
    status: "Cancelled",
    date: "2023-10-21",
  },
];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string }> = {
  Pending:    { bg: "#fef3c7", color: "#92400e" },
  Processing: { bg: "#dbeafe", color: "#1e40af" },
  Shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  Delivered:  { bg: "#dcfce7", color: "#166534" },
  Cancelled:  { bg: "#fee2e2", color: "#991b1b" },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Uncomment to use real Firestore:
  // useEffect(() => {
  //   const unsub = onSnapshot(collection(db, "orders"), (snap) => {
  //     setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
  //   });
  //   return () => unsub();
  // }, []);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    // Firestore write (uncomment when ready):
    // try {
    //   await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    // } catch (e) { console.error(e); }
    setUpdatingId(null);
  };

  const formatPrice = (n: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(n);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3efe9",
        padding: "28px 32px 60px",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* ── Page Title ── */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1a0e06", margin: "0 0 4px" }}>
          Order Management
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#9a8070", margin: 0 }}>
          Track and manage customer orders
        </p>
      </div>

      {/* ── Table Card ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 8px rgba(60,36,20,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Search + Filter bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "18px 24px",
            borderBottom: "1px solid #f0ebe4",
          }}
        >
          {/* Search */}
          <div style={{ flex: 1, position: "relative" }}>
            <Search
              size={15}
              color="#b0a090"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                border: "1.5px solid #e8e0d8",
                borderRadius: "10px",
                fontSize: "0.88rem",
                color: "#3a2010",
                background: "#fdf9f5",
                outline: "none",
                fontFamily: "Georgia, serif",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#a07840")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            />
          </div>

          {/* Status filter */}
          <div style={{ position: "relative" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "All" | OrderStatus)}
              style={{
                padding: "10px 36px 10px 14px",
                border: "1.5px solid #e8e0d8",
                borderRadius: "10px",
                fontSize: "0.85rem",
                color: "#3a2010",
                background: "#fdf9f5",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                fontFamily: "Georgia, serif",
                minWidth: "130px",
              }}
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              color="#9a8070"
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
          </div>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fdf9f5" }}>
              {["Order ID", "Customer", "Items", "Total", "Status", "Date", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: "0.65rem",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#9a8070",
                    fontWeight: 700,
                    padding: "12px 20px",
                    borderBottom: "1px solid #f0ebe4",
                    fontFamily: "Georgia, serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "#9a8070",
                    fontSize: "0.88rem",
                  }}
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((order, i) => {
                const isExpanded = expandedId === order.id;
                const isLast = i === filtered.length - 1;
                const st = STATUS_STYLE[order.status];

                return (
                  <>
                    {/* Main row */}
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: isExpanded || !isLast ? "1px solid #f7f3ef" : "none",
                        background: isExpanded ? "#fffcf9" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded)
                          (e.currentTarget as HTMLTableRowElement).style.background = "#fdf9f5";
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded)
                          (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                      }}
                    >
                      {/* Order ID */}
                      <td style={{ padding: "16px 20px", fontSize: "0.88rem", fontWeight: 700, color: "#1a0e06" }}>
                        {order.id}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: "16px 20px", fontSize: "0.88rem", color: "#3a2010" }}>
                        {order.customer}
                      </td>

                      {/* Items */}
                      <td style={{ padding: "16px 20px", fontSize: "0.88rem", color: "#7a6050" }}>
                        {order.items}
                      </td>

                      {/* Total */}
                      <td style={{ padding: "16px 20px", fontSize: "0.88rem", fontWeight: 600, color: "#1a0e06" }}>
                        {formatPrice(order.total)}
                      </td>

                      {/* Status dropdown */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                            style={{
                              padding: "5px 28px 5px 10px",
                              borderRadius: "999px",
                              border: "none",
                              background: st.bg,
                              color: st.color,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              appearance: "none",
                              fontFamily: "Georgia, serif",
                              outline: "none",
                              letterSpacing: "0.3px",
                            }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown
                            size={12}
                            color={st.color}
                            style={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "16px 20px", fontSize: "0.85rem", color: "#7a6050" }}>
                        {order.date}
                      </td>

                      {/* Expand toggle */}
                      <td style={{ padding: "16px 20px" }}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#b0a090",
                            display: "flex",
                            alignItems: "center",
                            padding: "4px",
                            borderRadius: "6px",
                            transition: "color 0.2s, background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#3a2010";
                            e.currentTarget.style.background = "#f0ebe4";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#b0a090";
                            e.currentTarget.style.background = "none";
                          }}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${order.id}-detail`}>
                        <td
                          colSpan={7}
                          style={{
                            padding: "0 20px 20px 20px",
                            background: "#fffcf9",
                            borderBottom: !isLast ? "1px solid #f0ebe4" : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "20px",
                            }}
                          >
                            {/* Customer Info */}
                            <div
                              style={{
                                background: "#f7f3ef",
                                borderRadius: "12px",
                                padding: "16px 20px",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "0.65rem",
                                  letterSpacing: "2px",
                                  textTransform: "uppercase",
                                  color: "#9a8070",
                                  fontWeight: 700,
                                  margin: "0 0 12px",
                                }}
                              >
                                Customer Details
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {[
                                  { label: "Name", val: order.customer },
                                  { label: "Email", val: order.email ?? "—" },
                                  { label: "Phone", val: order.phone ?? "—" },
                                  { label: "Address", val: order.address ?? "—" },
                                ].map(({ label, val }) => (
                                  <div key={label} style={{ display: "flex", gap: "10px", fontSize: "0.82rem" }}>
                                    <span style={{ color: "#9a8070", minWidth: "60px" }}>{label}</span>
                                    <span style={{ color: "#3a2010", fontWeight: 500 }}>{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Item breakdown */}
                            <div
                              style={{
                                background: "#f7f3ef",
                                borderRadius: "12px",
                                padding: "16px 20px",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "0.65rem",
                                  letterSpacing: "2px",
                                  textTransform: "uppercase",
                                  color: "#9a8070",
                                  fontWeight: 700,
                                  margin: "0 0 12px",
                                }}
                              >
                                Items Ordered
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {(order.itemDetails ?? []).map((item, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontSize: "0.82rem",
                                      borderBottom: idx < (order.itemDetails?.length ?? 0) - 1
                                        ? "1px solid #ede8e0"
                                        : "none",
                                      paddingBottom: "6px",
                                    }}
                                  >
                                    <span style={{ color: "#3a2010", fontWeight: 500 }}>
                                      {item.name}
                                      {item.size > 0 && (
                                        <span style={{ color: "#9a8070", fontWeight: 400 }}>
                                          {" "}· EU {item.size}
                                        </span>
                                      )}
                                      <span style={{ color: "#9a8070", fontWeight: 400 }}>
                                        {" "}× {item.quantity}
                                      </span>
                                    </span>
                                    <span style={{ color: "#1a0e06", fontWeight: 700 }}>
                                      {formatPrice(item.price * item.quantity)}
                                    </span>
                                  </div>
                                ))}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: "#1a0e06",
                                    paddingTop: "4px",
                                  }}
                                >
                                  <span>Total</span>
                                  <span>{formatPrice(order.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #f0ebe4",
              fontSize: "0.75rem",
              color: "#9a8070",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              Showing {filtered.length} of {orders.length} orders
            </span>
            <span style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.65rem" }}>
              Pando · Order Management
            </span>
          </div>
        )}
      </div>
    </div>
  );
}