"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  ShieldCheck,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders?: number;
  totalSpent?: number;
  joinDate?: string;
  createdAt?: string;
  role: "user" | "admin";
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  size: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: { seconds: number } | null;
}

type RoleFilter = "All" | "user" | "admin";
type SortKey = keyof Pick<
  Customer,
  "name" | "totalOrders" | "totalSpent" | "joinDate" | "createdAt"
>;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Firestore real-time listeners ────────────────────────────────────────────
  useEffect(() => {
    let loadedCount = 0;
    const checkDone = () => {
      if (++loadedCount >= 2) setLoading(false);
    };

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const data: Customer[] = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          name: raw.name ?? "—",
          email: raw.email ?? "—",
          phone: raw.phone ?? "—",
          joinDate: raw.joinDate ?? raw.createdAt ?? "—",
          createdAt: raw.createdAt ?? "",
          role: raw.role ?? "user",
        };
      });
      setCustomers(data);
      checkDone();
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const data: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, "id">),
      }));
      setOrders(data);
      checkDone();
    });

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  // ── Compute totalOrders & totalSpent from orders (like Reports page) ─────────
  const customersWithTotals = useMemo(() => {
    return customers.map((customer) => {
      const deliveredOrders = orders.filter(
        (o) => o.userId === customer.id && o.status === "delivered"
      );
      return {
        ...customer,
        totalOrders: deliveredOrders.length,
        totalSpent: deliveredOrders.reduce(
          (sum, o) => sum + (o.total ?? 0),
          0
        ),
      };
    });
  }, [customers, orders]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalUsers = customersWithTotals.filter((c) => c.role === "user").length;
  const totalAdmins = customersWithTotals.filter((c) => c.role === "admin").length;

  const STAT_CARDS = [
    {
      label: "All Accounts",
      value: customersWithTotals.length,
      icon: <Users size={20} color="#a07840" />,
      filter: "All" as RoleFilter,
    },
    {
      label: "Customers",
      value: totalUsers,
      icon: <Users size={20} color="#a07840" />,
      filter: "user" as RoleFilter,
    },
    {
      label: "Admins",
      value: totalAdmins,
      icon: <ShieldCheck size={20} color="#a07840" />,
      filter: "admin" as RoleFilter,
    },
  ];

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // ── Filtered + sorted list ───────────────────────────────────────────────────
  const filtered = customersWithTotals
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "All" || c.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number")
        return sortAsc ? av - bv : bv - av;
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const formatPrice = (n: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(n);

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? (
        <ChevronUp size={12} />
      ) : (
        <ChevronDown size={12} />
      )
    ) : (
      <ChevronDown size={12} style={{ opacity: 0.3 }} />
    );

  const COL_HEADERS: { label: string; key?: SortKey; width?: string }[] = [
    { label: "Name", key: "name", width: "22%" },
    { label: "Email", width: "22%" },
    { label: "Phone", width: "16%" },
    { label: "Total Orders", key: "totalOrders", width: "12%" },
    { label: "Total Spent", key: "totalSpent", width: "13%" },
    { label: "Role", width: "8%" },
    { label: "Joined", key: "createdAt", width: "7%" },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "87vh",
        background: "#f3efe9",
        padding: "28px 32px 60px",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Page Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#1a0e06",
            margin: "0 0 4px",
          }}
        >
          Customer Management
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#9a8070", margin: 0 }}>
          All registered accounts from Firestore
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {STAT_CARDS.map((card) => {
          const active = roleFilter === card.filter;
          return (
            <button
              key={card.label}
              onClick={() => setRoleFilter(active ? "All" : card.filter)}
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "20px 24px",
                boxShadow: active
                  ? "0 0 0 2px #a07840, 0 2px 10px rgba(60,36,20,0.08)"
                  : "0 1px 6px rgba(60,36,20,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                border: "none",
                textAlign: "left",
                transition: "box-shadow 0.18s",
                fontFamily: "Georgia, serif",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  e.currentTarget.style.boxShadow =
                    "0 0 0 1.5px #d4b896, 0 2px 10px rgba(60,36,20,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  e.currentTarget.style.boxShadow =
                    "0 1px 6px rgba(60,36,20,0.06)";
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#9a8070",
                    margin: "0 0 8px",
                    fontWeight: 700,
                  }}
                >
                  {card.label}
                </p>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "#1a0e06",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {loading ? "—" : card.value}
                </p>
              </div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#fdf3e6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
            </button>
          );
        })}
      </div>

      {/* Table Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 8px rgba(60,36,20,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Search bar + active filter badge */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f0ebe4",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ position: "relative", maxWidth: "440px", flex: 1 }}>
            <Search
              size={15}
              color="#b0a090"
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
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

          {/* Active role filter badge */}
          {roleFilter !== "All" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "20px",
                background: "#fdf3e6",
                border: "1px solid #d4b896",
                fontSize: "0.75rem",
                color: "#a07840",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {roleFilter === "admin" ? (
                <ShieldCheck size={12} />
              ) : (
                <Users size={12} />
              )}
              {roleFilter === "admin" ? "Admins" : "Customers"}
              <button
                onClick={() => setRoleFilter("All")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#a07840",
                  fontWeight: 900,
                  fontSize: "0.9rem",
                  lineHeight: 1,
                  padding: 0,
                  marginLeft: "2px",
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div
            style={{
              padding: "64px",
              textAlign: "center",
              color: "#9a8070",
              fontSize: "0.88rem",
            }}
          >
            Loading accounts…
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fdf9f5" }}>
                {COL_HEADERS.map(({ label, key, width }) => (
                  <th
                    key={label}
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
                      width,
                      cursor: key ? "pointer" : "default",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => key && handleSort(key)}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {label}
                      {key && <SortIcon col={key} />}
                    </span>
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
                    No accounts found.
                  </td>
                </tr>
              ) : (
                filtered.map((customer, i) => {
                  const isExpanded = expandedId === customer.id;
                  const isLast = i === filtered.length - 1;

                  return (
                    <React.Fragment key={customer.id}>
                      <tr
                        onClick={() =>
                          setExpandedId(isExpanded ? null : customer.id)
                        }
                        style={{
                          borderBottom:
                            isLast && !isExpanded
                              ? "none"
                              : "1px solid #f7f3ef",
                          background: isExpanded ? "#fffcf9" : "transparent",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded)
                            (
                              e.currentTarget as HTMLTableRowElement
                            ).style.background = "#fdf9f5";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded)
                            (
                              e.currentTarget as HTMLTableRowElement
                            ).style.background = "transparent";
                        }}
                      >
                        {/* Name + avatar */}
                        <td style={{ padding: "14px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                background:
                                  customer.role === "admin"
                                    ? "#e0d4f0"
                                    : "#e8ddd0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                color:
                                  customer.role === "admin"
                                    ? "#5a3a80"
                                    : "#5a3a20",
                                flexShrink: 0,
                                letterSpacing: "0.5px",
                              }}
                            >
                              {customer.name
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <span
                              style={{
                                fontSize: "0.88rem",
                                fontWeight: 600,
                                color: "#1a0e06",
                              }}
                            >
                              {customer.name}
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "0.85rem",
                            color: "#5a4a3a",
                          }}
                        >
                          {customer.email}
                        </td>

                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "0.85rem",
                            color: "#7a6050",
                          }}
                        >
                          {customer.phone ?? "—"}
                        </td>

                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "0.85rem",
                            color: "#3a2010",
                            fontWeight: 500,
                          }}
                        >
                          {customer.totalOrders ?? 0}
                        </td>

                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            color: "#1a0e06",
                          }}
                        >
                          {formatPrice(customer.totalSpent ?? 0)}
                        </td>

                        {/* Role badge */}
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 10px",
                              borderRadius: "20px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              letterSpacing: "1px",
                              textTransform: "uppercase",
                              background:
                                customer.role === "admin"
                                  ? "#ede8f8"
                                  : "#e8f4ec",
                              color:
                                customer.role === "admin"
                                  ? "#6b3fa0"
                                  : "#2e7d46",
                            }}
                          >
                            {customer.role === "admin" ? (
                              <ShieldCheck size={10} />
                            ) : (
                              <Users size={10} />
                            )}
                            {customer.role}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "0.82rem",
                            color: "#7a6050",
                          }}
                        >
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString(
                                "en-PH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${customer.id}-detail`}>
                          <td
                            colSpan={7}
                            style={{
                              padding: "0 20px 20px",
                              background: "#fffcf9",
                              borderBottom: !isLast
                                ? "1px solid #f0ebe4"
                                : "none",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "12px",
                              }}
                            >
                              {[
                                { label: "Full Name", value: customer.name },
                                { label: "Email", value: customer.email },
                                {
                                  label: "Phone",
                                  value: customer.phone ?? "—",
                                },
                                { label: "Role", value: customer.role },
                                {
                                  label: "Total Orders",
                                  value: String(customer.totalOrders ?? 0),
                                },
                                {
                                  label: "Total Spent",
                                  value: formatPrice(customer.totalSpent ?? 0),
                                },
                                {
                                  label: "Avg per Order",
                                  value: formatPrice(
                                    Math.round(
                                      (customer.totalSpent ?? 0) /
                                        (customer.totalOrders || 1)
                                    )
                                  ),
                                },
                                { label: "User ID", value: customer.id },
                              ].map(({ label, value }) => (
                                <div
                                  key={label}
                                  style={{
                                    background: "#f7f3ef",
                                    borderRadius: "10px",
                                    padding: "12px 16px",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "0.62rem",
                                      letterSpacing: "2px",
                                      textTransform: "uppercase",
                                      color: "#9a8070",
                                      margin: "0 0 5px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {label}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: "0.82rem",
                                      fontWeight: 600,
                                      color: "#1a0e06",
                                      margin: 0,
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {value}
                                  </p>
                                </div>
                              ))}
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
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #f0ebe4",
            fontSize: "0.75rem",
            color: "#9a8070",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            {filtered.length} of {customersWithTotals.length} accounts
            {roleFilter !== "All" && (
              <span
                style={{ marginLeft: "6px", color: "#a07840", fontWeight: 700 }}
              >
                · Filtered: {roleFilter}
              </span>
            )}
          </span>
          <span
            style={{
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontSize: "0.65rem",
            }}
          >
            Pando · Customer Management
          </span>
        </div>
      </div>
    </div>
  );
}