"use client";

import { useState } from "react";

type FilterType = "All" | "Men's" | "Women's" | "Casual" | "Formal";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  badge: FilterType;
  image: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Classic Oxford",
    price: 4250,
    category: "Formal",
    badge: "Men's",
    image: "/product1.jpg",
  },
  {
    id: 2,
    name: "Leather Derby",
    price: 4800,
    category: "Formal",
    badge: "Men's",
    image: "/product2.jpg",
  },
  {
    id: 3,
    name: "Chelsea Boots",
    price: 5200,
    category: "Formal",
    badge: "Men's",
    image: "/product3.jpg",
  },
  {
    id: 4,
    name: "Stiletto Heels",
    price: 2800,
    category: "Casual",
    badge: "Women's",
    image: "/product4.jpg",
  },
  {
    id: 5,
    name: "Pointed Flats",
    price: 2600,
    category: "Casual",
    badge: "Women's",
    image: "/product5.jpg",
  },
  {
    id: 6,
    name: "Leather Loafers",
    price: 3500,
    category: "Casual",
    badge: "Men's",
    image: "/product6.jpg",
  },
  {
    id: 7,
    name: "Ankle Boots",
    price: 4100,
    category: "Formal",
    badge: "Women's",
    image: "/product7.jpg",
  },
  {
    id: 8,
    name: "Leather Moccasins",
    price: 3000,
    category: "Casual",
    badge: "Men's",
    image: "/product8.jpg",
  },
];

const FILTERS: FilterType[] = ["All", "Men's", "Women's", "Casual", "Formal"];

export default function ProductPage() {
  const [filter, setFilter] = useState<FilterType>("All");

  const filtered =
    filter === "All"
      ? products
      : products.filter((p) => p.badge === filter || p.category === filter);

  const formatPrice = (price: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(price);

  const getBadgeStyle = (badge: string): React.CSSProperties => {
    switch (badge) {
      case "Men's":   return { background: "#3C2415", color: "#f5e6d3" };
      case "Women's": return { background: "#B56576", color: "#fff" };
      case "Casual":  return { background: "#606C38", color: "#fff" };
      case "Formal":  return { background: "#D4A373", color: "#fff" };
      default:        return { background: "#FDF5E6", color: "#3C2415" };
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#e8d8c0",
      padding: "140px 16px 60px",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}>

      {/* ── TITLE + FILTERS ── */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{
          fontSize: "2.2rem",
          fontWeight: 700,
          color: "#3C2415",
          marginBottom: "12px",
          fontFamily: "Georgia, serif",
        }}>
          Our Collection
        </h1>

        <p style={{
          color: "#5A3D2B",
          fontSize: "0.85rem",
          maxWidth: "420px",
          margin: "0 auto 28px",
          lineHeight: 1.7,
          opacity: 0.8,
        }}>
          Discover the finest Marikina craftsmanship. Each pair is meticulously
          handcrafted to ensure lasting quality and timeless style.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 22px",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: filter === f ? "none" : "1px solid #3C2415",
                background: filter === f ? "#3C2415" : "#fff",
                color: filter === f ? "#fff" : "#3C2415",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div style={{
        maxWidth: "960px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
      }}>
        {filtered.map((product) => (
          <div
            key={product.id}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 10px rgba(60,36,21,0.08)",
            }}
          >
            {/* IMAGE */}
            <div style={{
              position: "relative",
              width: "100%",
              height: "190px",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "12px",
              background: "#f0e6d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />

              {/* BADGE */}
              <span style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: "999px",
                ...getBadgeStyle(product.badge),
              }}>
                {product.badge}
              </span>
            </div>

            {/* NAME + PRICE */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#3C2415" }}>
                {product.name}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#A0522D", fontWeight: 600, marginLeft: "8px", whiteSpace: "nowrap" }}>
                {formatPrice(product.price)}
              </span>
            </div>

            {/* CATEGORY */}
            <p style={{ fontSize: "0.73rem", color: "#9A8070", marginBottom: "14px" }}>
              {product.category}
            </p>

            {/* ADD TO CART */}
            <button
              style={{
                marginTop: "auto",
                background: "#3a2414",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "0.8rem",
                width: "100%",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#5a3a21")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#3a2414")}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* RESPONSIVE */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}