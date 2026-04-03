"use client";

import React from "react";
import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ShoppingCart, Check, X } from "lucide-react";

type FilterType = "All" | "Men" | "Women";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string | null;
  stock: number;
  status: string;
  description?: string;
  sizes?: number[];
}

interface CartItem {
  product: Product;
  size: number;
  quantity: number;
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "36px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : "12px"})`,
        background: "#2a1508",
        color: "#f5e6d3",
        padding: "13px 24px",
        borderRadius: "2px",
        fontSize: "0.75rem",
        fontWeight: 500,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: "0 12px 40px rgba(20,10,2,0.35)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s, transform 0.3s",
        zIndex: 9999,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        border: "1px solid rgba(184,134,78,0.3)",
        fontFamily: "'Jost', sans-serif",
      }}
    >
      <Check size={13} strokeWidth={2.5} color="#b8864e" />
      {message}
    </div>
  );
}

const FILTERS: FilterType[] = ["All", "Men", "Women"];
const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export default function ProductPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const getCartKey = useCallback(() => {
    const user = auth.currentUser;
    return user ? `pando_cart_${user.uid}` : "pando_cart_guest";
  }, []);

  const getCheckoutKey = useCallback(() => {
    const user = auth.currentUser;
    return user ? `pando_checkout_${user.uid}` : "pando_checkout_guest";
  }, []);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const user = auth.currentUser;
      const key = user ? `pando_cart_${user.uid}` : "pando_cart_guest";
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const key = user ? `pando_cart_${user.uid}` : "pando_cart_guest";
      try {
        const saved = localStorage.getItem(key);
        setCart(saved ? JSON.parse(saved) : []);
      } catch { setCart([]); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
    window.dispatchEvent(new Event("pando_cart_updated"));
  }, [cart, getCartKey]);

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
          description: raw.description ?? "",
          sizes: Array.isArray(raw.sizes) ? raw.sizes : [],
        };
      });
      setProducts(data);
      setLoading(false);
      const productsMap = new Map(data.map((p) => [p.id, p]));
      setCart((prev) =>
        prev.map((item) => {
          const latest = productsMap.get(item.product.id);
          if (!latest) return item;
          return { ...item, product: { ...item.product, stock: latest.stock }, quantity: Math.min(item.quantity, latest.stock) };
        })
      );
    });
    return () => unsub();
  }, []);

  const showToast = useCallback(
    (message: string) => {
      if (toastTimer) clearTimeout(toastTimer);
      setToast({ message, visible: true });
      const t = setTimeout(() => setToast({ message: "", visible: false }), 2800);
      setToastTimer(t);
    },
    [toastTimer]
  );

const [isModalOpen, setIsModalOpen] = useState(false);

const openModal = (product: Product) => {
  setSelectedProduct(product);
  setSelectedSize(null);
  setSizeError(false);
  setIsModalOpen(true); // trigger effect
};

const closeModal = () => {
  setSelectedProduct(null);
  setSelectedSize(null);
  setSizeError(false);
  setIsModalOpen(false); // trigger effect
};

// Side effect for body scroll lock
useEffect(() => {
  document.body.style.overflow = isModalOpen ? "hidden" : "";
  return () => {
    document.body.style.overflow = ""; // cleanup
  };
}, [isModalOpen]);

  const buildUpdatedCart = (prev: CartItem[], product: Product, size: number, qty = 1): CartItem[] => {
    const existing = prev.find((i) => i.product.id === product.id && i.size === size);
    if (existing) {
      return prev.map((i) => i.product.id === product.id && i.size === size ? { ...i, quantity: i.quantity + qty } : i);
    }
    return [...prev, { product, size, quantity: qty }];
  };

  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    setCart((prev) => {
      const updated = buildUpdatedCart(prev, selectedProduct, selectedSize);
      const key = auth.currentUser ? `pando_cart_${auth.currentUser.uid}` : "pando_cart_guest";
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
    showToast(`Added to cart — EU ${selectedSize}`);
    closeModal();
  }, [selectedProduct, selectedSize, showToast]);

  const handleBuyNow = useCallback(() => {
    if (!selectedProduct || !selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    const buyNowItem: CartItem = { product: selectedProduct, size: selectedSize, quantity: 1 };
    localStorage.setItem(getCheckoutKey(), JSON.stringify([buyNowItem]));
    closeModal();
    router.push("/checkout");
  }, [selectedProduct, selectedSize, getCheckoutKey, router]);

  const filtered =
    filter === "All" ? products : products.filter((p) => p.category?.toLowerCase() === filter.toLowerCase());

  const formatPrice = (price: number) => "₱" + new Intl.NumberFormat("en-PH").format(price);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

        .prod-root {
          --cream: #f5f0e8;
          --warm: #e8dfd3;
          --brown-dark: #2a1508;
          --brown-mid: #5a3520;
          --brown-light: #9a7a5a;
          --gold: #b8864e;
          --gold-light: #d4a96a;
          --text-body: #4a3828;
          --font-display: 'Cormorant Garamond', Georgia, serif;
          --font-body: 'Jost', sans-serif;
        }
        .prod-root * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Hero header ── */
        .prod-hero {
          background: var(--brown-dark);
          padding: 100px 60px 70px;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid rgba(184,134,78,0.2);
        }
        .prod-hero::before {
          content: 'COLLECTION';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: var(--font-display);
          font-size: 14rem;
          font-weight: 600;
          color: rgba(255,255,255,0.02);
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
        }
        .prod-hero-top-rule {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--gold), transparent);
        }
        .prod-hero-eyebrow {
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.2s forwards;
        }
        .prod-hero-title {
          font-family: var(--font-display);
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: 300;
          color: #f5ebe0;
          line-height: 1.05;
          letter-spacing: 0.01em;
          margin-bottom: 0;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.35s forwards;
        }
        .prod-hero-title em { font-style: italic; color: var(--gold-light); }
        .prod-hero-rule {
          width: 40px; height: 1px;
          background: var(--gold);
          margin: 24px auto;
          opacity: 0;
          animation: fadeIn 0.8s ease 0.5s forwards;
        }
        .prod-hero-sub {
          font-family: var(--font-body);
          font-size: 0.88rem;
          font-weight: 300;
          color: rgba(235,220,200,0.65);
          line-height: 1.85;
          max-width: 460px;
          margin: 0 auto 40px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.6s forwards;
        }

        /* ── Filter bar ── */
        .prod-filter-bar {
          background: var(--cream);
          border-bottom: 1px solid rgba(184,134,78,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 50px;
          padding: 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .prod-filter-btn {
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 18px 36px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(90,53,32,0.5);
          border-bottom: 2px solid transparent;
          transition: all 0.25s ease;
          position: relative;
        }
        .prod-filter-btn.active {
          color: var(--brown-dark);
          border-bottom-color: var(--gold);
        }
        .prod-filter-btn:hover:not(.active) { color: var(--brown-mid); }
        .prod-filter-sep {
          width: 1px; height: 20px;
          background: rgba(184,134,78,0.2);
        }

        /* ── Grid ── */
        .prod-grid-section {
          background: var(--warm);
          padding: 64px 60px 80px;
          
        }
        .prod-section-label {
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 48px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .prod-section-label::before {
          content: '';
          display: block;
          width: 28px; height: 1px;
          background: var(--gold);
          flex-shrink: 0;
        }
        .prod-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ── Card ── */
        .prod-card {
          background: var(--cream);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(.22,1,.36,1);
        }
        .prod-card.oos { opacity: 0.5; cursor: not-allowed; }
        .prod-card:not(.oos):hover { transform: translateY(-4px); z-index: 2; }
        .prod-card:not(.oos):hover .prod-card-overlay { opacity: 1; }
        .prod-card:not(.oos):hover .prod-card-img img { transform: scale(1.04); }

        .prod-card-img {
          width: 100%;
          aspect-ratio: 3 / 4;
          background: #ede6db;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prod-card-img img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.55s cubic-bezier(.22,1,.36,1);
        }
        .prod-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(20, 8, 2, 0.28);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 24px;
        }
        .prod-card-overlay-btn {
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f5ebe0;
          padding: 11px 22px;
          border: 1px solid rgba(245,235,224,0.6);
          background: transparent;
          cursor: pointer;
          transition: all 0.25s;
        }
        .prod-card-overlay-btn:hover {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--brown-dark);
        }

        .prod-card-badge-cat {
          position: absolute;
          top: 14px; left: 14px;
          font-family: var(--font-body);
          font-size: 0.58rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #f5ebe0;
          background: #3a2414;
          padding: 4px 10px;
        }
        .prod-card-badge-stock {
          position: absolute;
          top: 14px; right: 14px;
          font-family: var(--font-body);
          font-size: 0.56rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 10px;
          background: rgba(245,240,232,0.92);
          color: var(--brown-mid);
        }
        .prod-card-badge-stock.low { color: #a05c1a; }
        .prod-card-badge-stock.out { color: #8a2020; background: rgba(245,230,220,0.92); }

        .prod-card-body {
          padding: 20px 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-top: 1px solid rgba(184,134,78,0.12);
        }
        .prod-card-name {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 400;
          color: var(--brown-dark);
          line-height: 1.2;
        }
        .prod-card-meta {
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--brown-light);
        }
        .prod-card-price {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 300;
          color: var(--gold);
          margin-top: 4px;
        }
        .prod-card-sizes {
          font-family: var(--font-body);
          font-size: 0.65rem;
          color: rgba(90,72,50,0.5);
          letter-spacing: 0.08em;
          margin-top: 2px;
        }

        /* ── Modal ── */
        .prod-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,7,2,0.72);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 500;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .prod-modal {
          background: var(--cream);
          width: 100%;
          max-width: 740px;
          max-height: 90vh;
          overflow-y: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          box-shadow: 0 30px 80px rgba(15,7,2,0.5);
        }
        .prod-modal-img {
          aspect-ratio: 3/4;
          background: #ede6db;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prod-modal-img img {
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .prod-modal-img-cat {
          position: absolute;
          bottom: 16px; left: 16px;
          font-family: var(--font-body);
          font-size: 0.58rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f5ebe0;
          background: var(--brown-dark);
          padding: 5px 12px;
        }
        .prod-modal-close {
          position: absolute;
          top: 16px; right: 16px;
          background: rgba(255,255,255,0.9);
          border: none;
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s;
        }
        .prod-modal-close:hover { background: var(--gold); color: #fff; }

        .prod-modal-content {
          padding: 36px 32px 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
        }
        .prod-modal-eyebrow {
          font-family: var(--font-body);
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .prod-modal-eyebrow::before {
          content: '';
          display: block;
          width: 18px; height: 1px;
          background: var(--gold);
        }
        .prod-modal-name {
          font-family: var(--font-display);
          font-size: 1.9rem;
          font-weight: 300;
          color: var(--brown-dark);
          line-height: 1.15;
          margin-bottom: 4px;
        }
        .prod-modal-price {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 300;
          color: var(--gold);
          margin-bottom: 16px;
        }
        .prod-modal-stock {
          font-family: var(--font-body);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: var(--brown-light);
          margin-bottom: 18px;
          text-transform: uppercase;
        }
        .prod-modal-desc {
          font-family: var(--font-body);
          font-size: 0.83rem;
          font-weight: 300;
          line-height: 1.85;
          color: var(--text-body);
          border-left: 2px solid var(--gold);
          padding-left: 14px;
          margin-bottom: 24px;
        }
        .prod-modal-divider {
          width: 100%; height: 1px;
          background: rgba(184,134,78,0.15);
          margin-bottom: 20px;
        }
        .prod-size-label {
          font-family: var(--font-body);
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brown-mid);
          margin-bottom: 12px;
        }
        .prod-size-error {
          color: #b91c1c;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          margin-left: 8px;
          font-weight: 400;
          text-transform: none;
        }
        .prod-size-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .prod-size-btn {
          width: 42px; height: 42px;
          font-family: var(--font-body);
          font-size: 0.72rem;
          font-weight: 500;
          border: 1px solid #ddd4c4;
          background: #fff;
          color: var(--brown-dark);
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }
        .prod-size-btn:hover:not(:disabled):not(.selected) {
          border-color: var(--gold);
          color: var(--gold);
        }
        .prod-size-btn.selected {
          background: var(--brown-dark);
          border-color: var(--brown-dark);
          color: #f5ebe0;
        }
        .prod-size-btn:disabled {
          background: #f3ede6;
          color: #c8b8a4;
          cursor: not-allowed;
          border-color: #e8ddd2;
        }
        .prod-size-strike {
          position: absolute;
          top: 50%; left: 8%;
          width: 84%; height: 1px;
          background: #d6ccc5;
          transform: translateY(-50%) rotate(-18deg);
          pointer-events: none;
        }
        .prod-size-legend {
          display: flex;
          gap: 14px;
          margin-bottom: 22px;
        }
        .prod-size-legend-item {
          font-family: var(--font-body);
          font-size: 0.6rem;
          color: var(--brown-light);
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.06em;
        }
        .prod-size-legend-swatch {
          width: 10px; height: 10px;
          border: 1px solid;
        }
        .prod-modal-actions {
          display: flex;
          gap: 10px;
        }
        .prod-btn-cart {
          flex: 1;
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 14px 16px;
          border: 1px solid var(--brown-dark);
          background: transparent;
          color: var(--brown-dark);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s;
        }
        .prod-btn-cart:hover {
          background: var(--brown-dark);
          color: #f5ebe0;
        }
        .prod-btn-cart:disabled {
          border-color: #d6c9be;
          color: #b0a090;
          cursor: default;
        }
        .prod-btn-cart:disabled:hover {
          background: transparent;
          color: #b0a090;
        }
        .prod-btn-buy {
          flex: 1;
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 14px 16px;
          border: 1px solid transparent;
          background: var(--brown-dark);
          color: #f5ebe0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s;
        }
        .prod-btn-buy:hover { background: var(--gold); border-color: var(--gold); color: var(--brown-dark); }
        .prod-btn-buy:disabled { background: #b0a090; cursor: default; }
        .prod-btn-buy:disabled:hover { background: #b0a090; }

        /* ── Empty / Loading ── */
        .prod-empty {
          text-align: center;
          padding: 80px 24px;
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 300;
          color: var(--brown-light);
          font-style: italic;
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .prod-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 800px) {
          .prod-hero { padding: 80px 24px 56px; }
          .prod-grid-section { padding: 48px 24px 60px; }
          .prod-grid { grid-template-columns: repeat(2, 1fr); }
          .prod-modal { grid-template-columns: 1fr; }
          .prod-modal-img { aspect-ratio: 16/9; }
        }
        @media (max-width: 500px) {
          .prod-filter-btn { padding: 16px 20px; font-size: 0.6rem; }
          .prod-grid { grid-template-columns: repeat(2, 1fr); gap: 1px; }
        }
      `}</style>

      <div className="prod-root">
        <Toast message={toast.message} visible={toast.visible} />

        {/* ── HERO ── */}
        <div className="prod-hero">
          <div className="prod-hero-top-rule" />
          <p className="prod-hero-eyebrow">Marikina · Handcrafted</p>
          <h1 className="prod-hero-title">
            Our <em>Collection</em>
          </h1>
          <div className="prod-hero-rule" />
          <p className="prod-hero-sub">
            Discover the finest Marikina craftsmanship. Each pair is meticulously
            handcrafted to ensure lasting quality and timeless style.
          </p>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="prod-filter-bar">
          {FILTERS.map((f, i) => (
            <React.Fragment key={f}>
              {i > 0 && <div key={`sep-${f}`} className="prod-filter-sep" />}
              <button
                key={f}
                className={`prod-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* ── GRID ── */}
        <div className="prod-grid-section">
          <Reveal>
            <p className="prod-section-label">
              {filter === "All" ? "All Products" : `${filter}'s Collection`}
            </p>
          </Reveal>

          {loading && <div className="prod-empty">Loading the collection…</div>}
          {!loading && filtered.length === 0 && (
            <div className="prod-empty">No products in this category.</div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="prod-grid">
              {filtered.map((product, i) => {
                const isOOS = product.stock === 0;
                const isLow = product.stock > 0 && product.stock <= 5;
                return (
                  <Reveal key={product.id} delay={(i % 4) * 60}>
                    <div
                      className={`prod-card${isOOS ? " oos" : ""}`}
                      onClick={() => !isOOS && openModal(product)}
                    >
                      <div className="prod-card-img">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <span style={{ fontSize: "3.5rem", opacity: 0.2 }}>👟</span>
                        )}

                        {/* Hover overlay */}
                        {!isOOS && (
                          <div className="prod-card-overlay">
                            <button
                              className="prod-card-overlay-btn"
                              onClick={(e) => { e.stopPropagation(); openModal(product); }}
                            >
                              Select Size
                            </button>
                          </div>
                        )}

                        {/* Badges */}
                        <span className="prod-card-badge-cat">{product.category}</span>
                        <span
                          className={`prod-card-badge-stock${isOOS ? " out" : isLow ? " low" : ""}`}
                        >
                          {isOOS ? "Sold Out" : isLow ? `Only ${product.stock} left` : `In Stock `}
                        </span>
                      </div>

                      <div className="prod-card-body">
                        <div className="prod-card-name">{product.name}</div>
                        <div className="prod-card-meta">{product.category}</div>
                        <div className="prod-card-price">{formatPrice(product.price)}</div>
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="prod-card-sizes">
                            EU {Math.min(...product.sizes)}–{Math.max(...product.sizes)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MODAL ── */}
        {selectedProduct && (
          <div className="prod-modal-backdrop" onClick={closeModal}>
            <div className="prod-modal" onClick={(e) => e.stopPropagation()}>

              {/* Image side */}
              <div className="prod-modal-img">
                {selectedProduct.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedProduct.image} alt={selectedProduct.name} />
                ) : (
                  <span style={{ fontSize: "5rem", opacity: 0.15 }}>👟</span>
                )}
                <span className="prod-modal-img-cat">{selectedProduct.category}</span>
              </div>

              {/* Content side */}
              <div className="prod-modal-content">
                <button className="prod-modal-close" onClick={closeModal}>
                  <X size={15} />
                </button>

                <p className="prod-modal-eyebrow">{selectedProduct.category}</p>
                <h2 className="prod-modal-name">{selectedProduct.name}</h2>
                <p className="prod-modal-price">{formatPrice(selectedProduct.price)}</p>
                <p className="prod-modal-stock">
                  {selectedProduct.stock > 0
                    ? `${selectedProduct.stock} pairs available`
                    : "Out of stock"}
                </p>

                {selectedProduct.description && (
                  <p className="prod-modal-desc">{selectedProduct.description}</p>
                )}

                <div className="prod-modal-divider" />

                {/* Size selector */}
                <p className="prod-size-label">
                  Select Size (EU)
                  {sizeError && (
                    <span className="prod-size-error">— Please select a size</span>
                  )}
                </p>

                <div className="prod-size-grid">
                  {ALL_SIZES.map((size) => {
                    const available = selectedProduct.sizes?.includes(size);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        disabled={!available}
                        className={`prod-size-btn${isSelected ? " selected" : ""}`}
                        onClick={() => { if (available) { setSelectedSize(size); setSizeError(false); } }}
                      >
                        {size}
                        {!available && <span className="prod-size-strike" />}
                      </button>
                    );
                  })}
                </div>

                <div className="prod-size-legend">
                  {[
                    { label: "Available", bg: "#fff", border: "#ddd4c4" },
                    { label: "Unavailable", bg: "#f3ede6", border: "#e8ddd2" },
                    { label: "Selected", bg: "#2a1508", border: "#2a1508" },
                  ].map(({ label, bg, border }) => (
                    <span key={label} className="prod-size-legend-item">
                      <span className="prod-size-legend-swatch" style={{ background: bg, borderColor: border }} />
                      {label}
                    </span>
                  ))}
                </div>

                <div className="prod-modal-actions">
                  <button
                    className="prod-btn-cart"
                    disabled={!selectedSize}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart size={13} strokeWidth={2} />
                    Add to Cart
                  </button>
                  <button
                    className="prod-btn-buy"
                    disabled={!selectedSize}
                    onClick={handleBuyNow}
                  >
                    {selectedSize ? `Buy Now · EU ${selectedSize}` : "Select size"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}