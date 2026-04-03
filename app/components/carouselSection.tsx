"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string | null;
  stock: number;
  status: string;
}

export default function CarouselSection() {
  const [products, setProducts] = useState<Product[]>([]);

  // 🔥 Fetch products from Firestore
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data: Product[] = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          name: raw.name ?? "",
          price: raw.price ?? 0,
          category: raw.category ?? "Casual",
          image: raw.image ?? null,
          stock: raw.stock ?? 0,
          status: raw.status ?? "In Stock",
        };
      });

      setProducts(data);
    });

    return () => unsub();
  }, []);

  // 🔥 Shuffle function
  function shuffleArray(array: Product[]) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 🔥 Random featured products (changes on refresh)
  const featured = useMemo(() => {
    return shuffleArray(products).slice(0, 5);
  }, [products]);

  const formatPrice = (price: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(price);

  return (
    <section style={{ padding: "60px 20px", background: "#E8DFD3" }}>
      {/* TITLE */}
      <div style={{ maxWidth: "1100px", margin: "0 auto 20px" }}>
        <h2
  style={{
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#3C2415",
    fontFamily: "'Cormorant Garamond', serif", // 👈 display font
  }}
>
  Featured Collection
</h2>
      </div>

      {/* SCROLL */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          overflowX: "auto",
          display: "flex",
          gap: "20px",
          scrollSnapType: "x mandatory",
          paddingBottom: "10px",
        }}
        className="no-scrollbar"
      >
        {featured.map((product) => (
          <div
            key={product.id}
            style={{
              minWidth: "280px",
              flex: "0 0 auto",
              scrollSnapAlign: "start",
              background: "#f3efea",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(60,36,21,0.08)",
            }}
          >
            {/* IMAGE */}
            <div style={{ width: "100%", height: "180px", background: "#ddd" }}>
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>

            {/* CONTENT */}
            <div style={{ padding: "12px" }}>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#3C2415",
                }}
              >
                {product.name}
              </h3>

              <p style={{ fontSize: "0.75rem", color: "#8b6f5a" }}>
                {product.category}
              </p>

              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#A0522D",
                }}
              >
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* HIDE SCROLLBAR */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
