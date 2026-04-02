"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
}

// ── Mock data (replace with real Firestore) ───────────────────────────────────
const MOCK_CUSTOMERS: Customer[] = [
  { id: "1", name: "Juan Dela Cruz",   email: "juan@example.com",  phone: "+63 912 345 6789", totalOrders: 5, totalSpent: 24500, joinDate: "2023-01-15" },
  { id: "2", name: "Maria Santos",     email: "maria@example.com", phone: "+63 998 765 4321", totalOrders: 2, totalSpent: 7600,  joinDate: "2023-03-22" },
  { id: "3", name: "Jose Rizal",       email: "jose@example.com",  phone: "+63 917 111 2222", totalOrders: 8, totalSpent: 45200, joinDate: "2022-11-03" },
  { id: "4", name: "Andres Bonifacio", email: "andres@example.com",phone: "+63 905 333 4444", totalOrders: 1, totalSpent: 5200,  joinDate: "2024-01-08" },
  { id: "5", name: "Emilio Aguinaldo", email: "emilio@example.com",phone: "+63 926 555 6666", totalOrders: 3, totalSpent: 13450, joinDate: "2023-07-19" },
];

type SortKey = keyof Pick<Customer, "name" | "totalOrders" | "totalSpent" | "joinDate">;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joinDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Uncomment for Firestore:
  // useEffect(() => {
  //   const unsub = onSnapshot(collection(db, "users"), (snap) => {
  //     setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer)));
  //   });
  //   return () => unsub();
  // }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = customers
    .filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number")
        return sortAsc ? av - bv : bv - av;
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const formatPrice = (n: number) => "₱" + new Intl.NumberFormat("en-PH").format(n);

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    ) : (
      <ChevronDown size={12} style={{ opacity: 0.3 }} />
    );

  const COL_HEADERS: { label: string; key?: SortKey; width?: string }[] = [
    { label: "Name",         key: "name",        width: "20%" },
    { label: "Email",                             width: "22%" },
    { label: "Phone",                             width: "18%" },
    { label: "Total Orders", key: "totalOrders", width: "13%" },
    { label: "Total Spent",  key: "totalSpent",  width: "14%" },
    { label: "Join Date",    key: "joinDate",     width: "13%" },
  ];

  // Summary stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgSpend = totalCustomers ? Math.round(totalRevenue / totalCustomers) : 0;

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
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1a0e06", margin: "0 0 4px" }}>
          Customer Management
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#9a8070", margin: 0 }}>
          View and manage customer information
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Customers", value: totalCustomers, sub: "Registered accounts" },
          { label: "Total Revenue",   value: formatPrice(totalRevenue), sub: "From all customers" },
          { label: "Avg. Spend",      value: formatPrice(avgSpend),     sub: "Per customer" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "20px 24px",
              boxShadow: "0 1px 6px rgba(60,36,20,0.06)",
            }}
          >
            <p style={{ fontSize: "0.68rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", margin: "0 0 8px", fontWeight: 700 }}>
              {card.label}
            </p>
            <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1a0e06", margin: "0 0 4px", lineHeight: 1 }}>
              {card.value}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#b0a090", margin: 0 }}>{card.sub}</p>
          </div>
        ))}
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
        {/* Search bar */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0ebe4" }}>
          <div style={{ position: "relative", maxWidth: "480px" }}>
            <Search
              size={15}
              color="#b0a090"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
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
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#a07840")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            />
          </div>
        </div>

        {/* Table */}
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
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
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
                <td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "#9a8070", fontSize: "0.88rem" }}>
                  No customers found.
                </td>
              </tr>
            ) : (
              filtered.map((customer, i) => {
                const isExpanded = expandedId === customer.id;
                const isLast = i === filtered.length - 1;

                return (
                  <>
                    <tr
                      key={customer.id}
                      onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                      style={{
                        borderBottom: isLast && !isExpanded ? "none" : "1px solid #f7f3ef",
                        background: isExpanded ? "#fffcf9" : "transparent",
                        cursor: "pointer",
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
                      {/* Name + avatar */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: "#e8ddd0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              color: "#5a3a20",
                              flexShrink: 0,
                              letterSpacing: "0.5px",
                            }}
                          >
                            {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </div>
                          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a0e06" }}>
                            {customer.name}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "14px 20px", fontSize: "0.85rem", color: "#5a4a3a" }}>
                        {customer.email}
                      </td>

                      <td style={{ padding: "14px 20px", fontSize: "0.85rem", color: "#7a6050" }}>
                        {customer.phone}
                      </td>

                      <td style={{ padding: "14px 20px", fontSize: "0.85rem", color: "#3a2010", fontWeight: 500 }}>
                        {customer.totalOrders}
                      </td>

                      <td style={{ padding: "14px 20px", fontSize: "0.88rem", fontWeight: 700, color: "#1a0e06" }}>
                        {formatPrice(customer.totalSpent)}
                      </td>

                      <td style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#7a6050" }}>
                        {customer.joinDate}
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr key={`${customer.id}-detail`}>
                        <td
                          colSpan={6}
                          style={{
                            padding: "0 20px 20px",
                            background: "#fffcf9",
                            borderBottom: !isLast ? "1px solid #f0ebe4" : "none",
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
                              { label: "Full Name",    value: customer.name },
                              { label: "Email",        value: customer.email },
                              { label: "Phone",        value: customer.phone },
                              { label: "Member Since", value: customer.joinDate },
                              { label: "Total Orders", value: String(customer.totalOrders) },
                              { label: "Total Spent",  value: formatPrice(customer.totalSpent) },
                              { label: "Avg per Order",value: formatPrice(Math.round(customer.totalSpent / (customer.totalOrders || 1))) },
                              { label: "Customer ID",  value: `CUST-${customer.id.padStart(3, "0")}` },
                            ].map(({ label, value }) => (
                              <div
                                key={label}
                                style={{
                                  background: "#f7f3ef",
                                  borderRadius: "10px",
                                  padding: "12px 16px",
                                }}
                              >
                                <p style={{ fontSize: "0.62rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", margin: "0 0 5px", fontWeight: 700 }}>
                                  {label}
                                </p>
                                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a0e06", margin: 0 }}>
                                  {value}
                                </p>
                              </div>
                            ))}
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
            {filtered.length} of {customers.length} customers
          </span>
          <span style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.65rem" }}>
            Pando · Customer Management
          </span>
        </div>
      </div>
    </div>
  );
}