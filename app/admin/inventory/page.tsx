"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Package, AlertTriangle, XCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  image: string | null;
}

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

const getStatus = (stock: number): StockStatus => {
  if (stock === 0) return "Out of Stock";
  if (stock <= 10) return "Low Stock";
  return "In Stock";
};

const STATUS_STYLE: Record<StockStatus, { bg: string; color: string }> = {
  "In Stock":      { bg: "#dcfce7", color: "#166534" },
  "Low Stock":     { bg: "#fef3c7", color: "#92400e" },
  "Out of Stock":  { bg: "#fee2e2", color: "#991b1b" },
};

// ── Mock seed data (replace with real Firestore) ──────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Classic Oxford",  category: "Formal", stock: 45, image: null },
  { id: "2", name: "Leather Derby",   category: "Formal", stock: 32, image: null },
  { id: "3", name: "Chelsea Boots",   category: "Formal", stock: 8,  image: null },
  { id: "4", name: "Stiletto Heels",  category: "Casual", stock: 0,  image: null },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filter, setFilter] = useState<"All" | StockStatus>("All");

  // Uncomment to use real Firestore:
  // useEffect(() => {
  //   const unsub = onSnapshot(collection(db, "products"), (snap) => {
  //     setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
  //   });
  //   return () => unsub();
  // }, []);

  const totalItems     = products.length;
  const lowStockCount  = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStock     = products.filter((p) => p.stock === 0).length;

  const filtered = products.filter((p) => {
    if (filter === "All") return true;
    return getStatus(p.stock) === filter;
  });

  const STAT_CARDS = [
    {
      label: "Total Items",
      value: totalItems,
      icon: <Package size={20} color="#a07840" />,
      active: filter === "All",
      onClick: () => setFilter("All"),
    },
    {
      label: "Low Stock",
      value: lowStockCount,
      icon: <AlertTriangle size={20} color="#a07840" />,
      active: filter === "Low Stock",
      onClick: () => setFilter(filter === "Low Stock" ? "All" : "Low Stock"),
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: <XCircle size={20} color="#a07840" />,
      active: filter === "Out of Stock",
      onClick: () => setFilter(filter === "Out of Stock" ? "All" : "Out of Stock"),
    },
  ];

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
          Inventory Management
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#9a8070", margin: 0 }}>
          Monitor and manage stock levels
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {STAT_CARDS.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "20px 24px",
              boxShadow: card.active
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
              if (!card.active)
                e.currentTarget.style.boxShadow = "0 0 0 1.5px #d4b896, 0 2px 10px rgba(60,36,20,0.08)";
            }}
            onMouseLeave={(e) => {
              if (!card.active)
                e.currentTarget.style.boxShadow = "0 1px 6px rgba(60,36,20,0.06)";
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
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "#1a0e06", margin: 0, lineHeight: 1 }}>
                {card.value}
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
        ))}
      </div>

      {/* ── Stock Overview Table ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 8px rgba(60,36,20,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #f0ebe4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a0e06", margin: 0 }}>
            Stock Overview
          </h3>
          {filter !== "All" && (
            <button
              onClick={() => setFilter("All")}
              style={{
                background: "none",
                border: "1px solid #e0d8d0",
                borderRadius: "8px",
                padding: "5px 12px",
                fontSize: "0.75rem",
                color: "#7a6050",
                cursor: "pointer",
                fontFamily: "Georgia, serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#a07840";
                e.currentTarget.style.color = "#3a2010";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e0d8d0";
                e.currentTarget.style.color = "#7a6050";
              }}
            >
              ✕ Clear Filter
            </button>
          )}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fdf9f5" }}>
              {["Product", "Category", "Current Stock", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: "0.65rem",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#9a8070",
                    fontWeight: 700,
                    padding: "12px 24px",
                    borderBottom: "1px solid #f0ebe4",
                    fontFamily: "Georgia, serif",
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
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "#9a8070",
                    fontSize: "0.88rem",
                  }}
                >
                  No products match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((product, i) => {
                const status = getStatus(product.stock);
                const st = STATUS_STYLE[status];
                const isLast = i === filtered.length - 1;

                return (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: !isLast ? "1px solid #f7f3ef" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.background = "#fdf9f5")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")
                    }
                  >
                    {/* Product */}
                    <td style={{ padding: "14px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: "#f0ebe2",
                            overflow: "hidden",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: "1.1rem" }}>👟</span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a0e06" }}>
                          {product.name}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "14px 24px", fontSize: "0.85rem", color: "#7a6050" }}>
                      {product.category}
                    </td>

                    {/* Stock */}
                    <td style={{ padding: "14px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a0e06" }}>
                          {product.stock}
                        </span>
                        {/* Stock bar */}
                        <div
                          style={{
                            width: "80px",
                            height: "6px",
                            borderRadius: "999px",
                            background: "#f0ebe4",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: "999px",
                              width: `${Math.min((product.stock / 50) * 100, 100)}%`,
                              background:
                                product.stock === 0
                                  ? "#f87171"
                                  : product.stock <= 10
                                  ? "#fbbf24"
                                  : "#4ade80",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: "14px 24px" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "4px 12px",
                          borderRadius: "999px",
                          background: st.bg,
                          color: st.color,
                          letterSpacing: "0.4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
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
            {filtered.length} of {products.length} products
            {filter !== "All" && ` · Filtered: ${filter}`}
          </span>
          <span style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.65rem" }}>
            Pando · Inventory
          </span>
        </div>
      </div>
    </div>
  );
}