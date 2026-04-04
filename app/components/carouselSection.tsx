"use client";

import { useEffect, useState, useMemo, useCallback, useRef, ReactNode } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, X, Lock } from "lucide-react";

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

const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export default function CarouselSection() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUser, setIsUser] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    });
    return () => unsub();
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsUser(!!user);
    });
    return () => unsub();
  }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isModalOpen || showLoginModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, showLoginModal]);

  const showToast = useCallback(
    (message: string) => {
      if (toastTimer) clearTimeout(toastTimer);
      setToast({ message, visible: true });
      const t = setTimeout(() => setToast({ message: "", visible: false }), 2800);
      setToastTimer(t);
    },
    [toastTimer]
  );

  const openModal = (product: Product) => {
    if (!isUser) {
      setShowLoginModal(true);
      return;
    }
    setSelectedProduct(product);
    setSelectedSize(null);
    setSizeError(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setSelectedSize(null);
    setSizeError(false);
    setIsModalOpen(false);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const getCartKey = useCallback(() => {
    const user = auth.currentUser;
    return user ? `pando_cart_${user.uid}` : "pando_cart_guest";
  }, []);

  const getCheckoutKey = useCallback(() => {
    const user = auth.currentUser;
    return user ? `pando_checkout_${user.uid}` : "pando_checkout_guest";
  }, []);

  const buildUpdatedCart = (prev: CartItem[], product: Product, size: number, qty = 1): CartItem[] => {
    const existing = prev.find((i) => i.product.id === product.id && i.size === size);
    if (existing) {
      return prev.map((i) => i.product.id === product.id && i.size === size ? { ...i, quantity: i.quantity + qty } : i);
    }
    return [...prev, { product, size, quantity: qty }];
  };

  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const key = auth.currentUser ? `pando_cart_${auth.currentUser.uid}` : "pando_cart_guest";
    try {
      const saved = localStorage.getItem(key);
      const currentCart = saved ? JSON.parse(saved) : [];
      const updated = buildUpdatedCart(currentCart, selectedProduct, selectedSize);
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new Event("pando_cart_updated"));
    } catch (e) {
      console.error("Error updating cart:", e);
    }
    showToast(`Added to cart — EU ${selectedSize}`);
    closeModal();
  }, [selectedProduct, selectedSize, showToast]);

  const handleBuyNow = useCallback(() => {
    if (!selectedProduct || !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const buyNowItem: CartItem = { product: selectedProduct, size: selectedSize, quantity: 1 };
    const key = auth.currentUser ? `pando_checkout_${auth.currentUser.uid}` : "pando_checkout_guest";
    localStorage.setItem(key, JSON.stringify([buyNowItem]));
    closeModal();
    router.push("/checkout");
  }, [selectedProduct, selectedSize, router]);

  function shuffleArray(array: Product[]) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const featured = useMemo(() => shuffleArray(products).slice(0, 4), [products]);

  const formatPrice = (price: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(price);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

        .fc-root {
          --cream: #f5f0e8;
          --warm: #e8dfd3;
          --brown-dark: #2a1508;
          --brown-mid: #5a3520;
          --brown-light: #9a7a5a;
          --gold: #b8864e;
          --gold-light: #d4a96a;
          --text-body: #4a3828;
          --fd: 'Cormorant Garamond', Georgia, serif;
          --fb: 'Jost', sans-serif;
        }
        .fc-root * { box-sizing: border-box; margin: 0; padding: 0; }

        .fc-section {
          background: var(--warm);
          padding: 60px 60px;
        }

        .fc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 48px;
        }

        .fc-section-label {
          font-family: var(--fb);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fc-section-label::before {
          content: '';
          display: block;
          width: 28px;
          height: 1px;
          background: var(--gold);
          flex-shrink: 0;
        }

        .fc-heading {
          font-family: var(--fd);
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 300;
          color: var(--brown-dark);
          line-height: 1.2;
        }

        .fc-heading em {
          font-style: italic;
          color: var(--brown-mid);
        }

        .fc-view-all {
          font-family: var(--fb);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--brown-light);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(154,122,90,0.4);
          padding-bottom: 2px;
          transition: color 0.25s;
          white-space: nowrap;
        }

        .fc-view-all:hover { color: var(--gold); }

        /* Grid */
        .fc-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        /* Card */
        .fc-card {
          background: var(--cream);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(.22,1,.36,1),
                      box-shadow 0.35s ease;
          user-select: none;
        }

        .fc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(42, 21, 8, 0.18);
        }

        .fc-card:hover .fc-card-overlay {
          opacity: 1;
        }

        .fc-card:hover .fc-card-img img {
          transform: scale(1.04);
        }

        .fc-card:focus {
          outline: 2px solid var(--gold);
          outline-offset: -2px;
        }

        .fc-card-img {
          width: 100%;
          aspect-ratio: 3 / 3;
          background: #ede6db;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fc-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.55s cubic-bezier(.22,1,.36,1);
        }

        .fc-card-img-placeholder {
          font-size: 3.5rem;
          opacity: 0.12;
        }

        .fc-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(20,8,2,0.28);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 20px;
        }

        .fc-card-overlay-btn {
          font-family: var(--fb);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f5ebe0;
          padding: 10px 20px;
          border: 1px solid rgba(245,235,224,0.6);
          background: transparent;
          cursor: pointer;
          transition: all 0.25s;
          display: inline-block;
          user-select: none;
        }

        .fc-card-overlay-btn:hover {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--brown-dark);
        }

        .fc-card-overlay-btn:focus {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }

        .fc-card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          font-family: var(--fb);
          font-size: 0.56rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #f5ebe0;
          background: #3a2414;
          padding: 4px 10px;
        }

        .fc-card-body {
          padding: 18px 20px 22px;
          border-top: 1px solid rgba(184,134,78,0.12);
        }

        .fc-card-name {
          font-family: var(--fd);
          font-size: 1.75rem;
          font-weight: 400;
          color: var(--brown-dark);
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .fc-card-cat {
          font-family: var(--fb);
          font-size: 0.84rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--brown-light);
          margin-bottom: 8px;
        }

        .fc-card-price {
          font-family: var(--fd);
          font-size: 1.3rem;
          font-weight: 300;
          color: var(--gold);
        }

        /* MODALS */
        .fc-modal-backdrop {
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

        .fc-modal {
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

        .fc-modal-img {
          aspect-ratio: 3/4;
          background: #ede6db;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fc-modal-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .fc-modal-img-cat {
          position: absolute;
          bottom: 16px;
          left: 16px;
          font-family: var(--fb);
          font-size: 0.58rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f5ebe0;
          background: var(--brown-dark);
          padding: 5px 12px;
        }

        .fc-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255,255,255,0.9);
          border: none;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s;
        }

        .fc-modal-close:hover {
          background: var(--gold);
          color: #fff;
        }

        .fc-modal-content {
          padding: 36px 32px 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
        }

        .fc-modal-eyebrow {
          font-family: var(--fb);
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

        .fc-modal-eyebrow::before {
          content: '';
          display: block;
          width: 18px;
          height: 1px;
          background: var(--gold);
        }

        .fc-modal-name {
          font-family: var(--fd);
          font-size: 1.9rem;
          font-weight: 300;
          color: var(--brown-dark);
          line-height: 1.15;
          margin-bottom: 4px;
        }

        .fc-modal-price {
          font-family: var(--fd);
          font-size: 1.15rem;
          font-weight: 300;
          color: var(--gold);
          margin-bottom: 16px;
        }

        .fc-modal-stock {
          font-family: var(--fb);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: var(--brown-light);
          margin-bottom: 18px;
          text-transform: uppercase;
        }

        .fc-modal-desc {
          font-family: var(--fb);
          font-size: 0.83rem;
          font-weight: 300;
          line-height: 1.85;
          color: var(--text-body);
          border-left: 2px solid var(--gold);
          padding-left: 14px;
          margin-bottom: 24px;
        }

        .fc-modal-divider {
          width: 100%;
          height: 1px;
          background: rgba(184,134,78,0.15);
          margin-bottom: 20px;
        }

        .fc-size-label {
          font-family: var(--fb);
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brown-mid);
          margin-bottom: 12px;
        }

        .fc-size-error {
          color: #b91c1c;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          margin-left: 8px;
          font-weight: 400;
          text-transform: none;
        }

        .fc-size-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .fc-size-btn {
          width: 42px;
          height: 42px;
          font-family: var(--fb);
          font-size: 0.72rem;
          font-weight: 500;
          border: 1px solid #ddd4c4;
          background: #fff;
          color: var(--brown-dark);
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }

        .fc-size-btn:hover:not(:disabled):not(.selected) {
          border-color: var(--gold);
          color: var(--gold);
        }

        .fc-size-btn.selected {
          background: var(--brown-dark);
          border-color: var(--brown-dark);
          color: #f5ebe0;
        }

        .fc-size-btn:disabled {
          background: #f3ede6;
          color: #c8b8a4;
          cursor: not-allowed;
          border-color: #e8ddd2;
        }

        .fc-size-strike {
          position: absolute;
          top: 50%;
          left: 8%;
          width: 84%;
          height: 1px;
          background: #d6ccc5;
          transform: translateY(-50%) rotate(-18deg);
          pointer-events: none;
        }

        .fc-size-legend {
          display: flex;
          gap: 14px;
          margin-bottom: 22px;
        }

        .fc-size-legend-item {
          font-family: var(--fb);
          font-size: 0.6rem;
          color: var(--brown-light);
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.06em;
        }

        .fc-size-legend-swatch {
          width: 10px;
          height: 10px;
          border: 1px solid;
        }

        .fc-modal-actions {
          display: flex;
          gap: 10px;
        }

        .fc-btn-cart {
          flex: 1;
          font-family: var(--fb);
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

        .fc-btn-cart:hover {
          background: var(--brown-dark);
          color: #f5ebe0;
        }

        .fc-btn-cart:disabled {
          border-color: #d6c9be;
          color: #b0a090;
          cursor: default;
        }

        .fc-btn-cart:disabled:hover {
          background: transparent;
          color: #b0a090;
        }

        .fc-btn-buy {
          flex: 1;
          font-family: var(--fb);
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

        .fc-btn-buy:hover {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--brown-dark);
        }

        .fc-btn-buy:disabled {
          background: #b0a090;
          cursor: default;
        }

        .fc-btn-buy:disabled:hover {
          background: #b0a090;
        }

        /* LOGIN MODAL */
        .fc-login-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,7,2,0.72);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 600;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        .fc-login-modal {
          background: var(--cream);
          width: 100%;
          max-width: 420px;
          padding: 48px 36px;
          position: relative;
          box-shadow: 0 30px 80px rgba(15,7,2,0.5);
          border: 1px solid rgba(184,134,78,0.2);
        }

        .fc-login-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--brown-dark);
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
        }

        .fc-login-modal-close:hover {
          color: var(--gold);
        }

        .fc-login-modal-header {
          text-align: center;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .fc-login-modal-icon {
          width: 56px;
          height: 56px;
          background: rgba(184,134,78,0.1);
          border: 1px solid var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fc-login-modal-title {
          font-family: var(--fd);
          font-size: 1.6rem;
          font-weight: 300;
          color: var(--brown-dark);
          line-height: 1.2;
        }

        .fc-login-modal-subtitle {
          font-family: var(--fb);
          font-size: 0.85rem;
          color: var(--brown-light);
          line-height: 1.6;
          text-align: center;
          margin-bottom: 24px;
        }

        .fc-login-modal-divider {
          width: 100%;
          height: 1px;
          background: rgba(184,134,78,0.15);
          margin-bottom: 28px;
        }

        .fc-login-modal-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .fc-login-btn-primary {
          font-family: var(--fb);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 14px 24px;
          border: 1px solid transparent;
          background: var(--brown-dark);
          color: #f5ebe0;
          cursor: pointer;
          transition: all 0.25s;
          width: 100%;
        }

        .fc-login-btn-primary:hover {
          background: var(--gold);
          color: var(--brown-dark);
        }

        .fc-login-btn-secondary {
          font-family: var(--fb);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 14px 24px;
          border: 1px solid var(--brown-dark);
          background: transparent;
          color: var(--brown-dark);
          cursor: pointer;
          transition: all 0.25s;
          width: 100%;
        }

        .fc-login-btn-secondary:hover {
          background: var(--brown-dark);
          color: #f5ebe0;
        }

        /* Empty / Loading */
        .fc-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 24px;
          font-family: var(--fd);
          font-size: 1.2rem;
          font-weight: 300;
          color: var(--brown-light);
          font-style: italic;
        }

        @media (max-width: 1100px) {
          .fc-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 800px) {
          .fc-section { padding: 60px 28px; }
          .fc-grid { grid-template-columns: repeat(2, 1fr); }
          .fc-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .fc-modal { grid-template-columns: 1fr; }
          .fc-modal-img { aspect-ratio: 16/9; }
        }
        @media (max-width: 500px) {
          .fc-section { padding: 48px 20px; }
          .fc-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
      `}</style>

      <section className="fc-root">
        <Toast message={toast.message} visible={toast.visible} />

        <div className="fc-section">
          <div className="fc-header">
            <div>
              <p className="fc-section-label">From the Workshop</p>
              <h2 className="fc-heading">
                Featured <em>Collection</em>
              </h2>
            </div>
            <a href="/product" className="fc-view-all">
              View All
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="fc-grid">
            {loading && (
              <div className="fc-empty">Loading the collection…</div>
            )}

            {!loading && featured.length === 0 && (
              <div className="fc-empty">No products available.</div>
            )}

            {!loading &&
              featured.map((product) => (
                <div
                  key={product.id}
                  className="fc-card"
                  onClick={() => openModal(product)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      openModal(product);
                    }
                  }}
                >
                  <div className="fc-card-img">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span className="fc-card-img-placeholder">👟</span>
                    )}
                    <div className="fc-card-overlay">
                      <div 
                        className="fc-card-overlay-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(product);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            openModal(product);
                          }
                        }}
                      >
                        View Details
                      </div>
                    </div>
                    <span className="fc-card-badge">{product.category}</span>
                  </div>
                  <div className="fc-card-body">
                    <div className="fc-card-name">{product.name}</div>
                    <div className="fc-card-price">{formatPrice(product.price)}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ── LOGIN MODAL ── */}
        {showLoginModal && (
          <div className="fc-login-modal-backdrop" onClick={closeLoginModal}>
            <div className="fc-login-modal" onClick={(e) => e.stopPropagation()}>
              <button className="fc-login-modal-close" onClick={closeLoginModal}>
                <X size={18} />
              </button>

              <div className="fc-login-modal-header">
                <div className="fc-login-modal-icon">
                  <Lock size={28} color="#b8864e" />
                </div>
                <h2 className="fc-login-modal-title">Sign In Required</h2>
              </div>

              <p className="fc-login-modal-subtitle">
                Please sign in to your account to browse and purchase from our collection.
              </p>

              <div className="fc-login-modal-divider" />

              <div className="fc-login-modal-actions">
                <button 
                  className="fc-login-btn-primary" 
                  onClick={() => router.push("/login")}
                >
                  Sign In
                </button>
                <button 
                  className="fc-login-btn-secondary" 
                  onClick={() => router.push("/signup")}
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCT MODAL ── */}
        {selectedProduct && (
          <div className="fc-modal-backdrop" onClick={closeModal}>
            <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
              {/* Image side */}
              <div className="fc-modal-img">
                {selectedProduct.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedProduct.image} alt={selectedProduct.name} />
                ) : (
                  <span style={{ fontSize: "5rem", opacity: 0.15 }}>👟</span>
                )}
                <span className="fc-modal-img-cat">{selectedProduct.category}</span>
              </div>

              {/* Content side */}
              <div className="fc-modal-content">
                <button className="fc-modal-close" onClick={closeModal}>
                  <X size={15} />
                </button>

                <p className="fc-modal-eyebrow">{selectedProduct.category}</p>
                <h2 className="fc-modal-name">{selectedProduct.name}</h2>
                <p className="fc-modal-price">{formatPrice(selectedProduct.price)}</p>
                <p className="fc-modal-stock">
                  {selectedProduct.stock > 0
                    ? `${selectedProduct.stock} pairs available`
                    : "Out of stock"}
                </p>

                {selectedProduct.description && (
                  <p className="fc-modal-desc">{selectedProduct.description}</p>
                )}

                <div className="fc-modal-divider" />

                {/* Size selector */}
                <p className="fc-size-label">
                  Select Size (EU)
                  {sizeError && (
                    <span className="fc-size-error">— Please select a size</span>
                  )}
                </p>

                <div className="fc-size-grid">
                  {ALL_SIZES.map((size) => {
                    const available = selectedProduct.sizes?.includes(size);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        disabled={!available}
                        className={`fc-size-btn${isSelected ? " selected" : ""}`}
                        onClick={() => {
                          if (available) {
                            setSelectedSize(size);
                            setSizeError(false);
                          }
                        }}
                      >
                        {size}
                        {!available && <span className="fc-size-strike" />}
                      </button>
                    );
                  })}
                </div>

                <div className="fc-size-legend">
                  {[
                    { label: "Available", bg: "#fff", border: "#ddd4c4" },
                    { label: "Unavailable", bg: "#f3ede6", border: "#e8ddd2" },
                    { label: "Selected", bg: "#2a1508", border: "#2a1508" },
                  ].map(({ label, bg, border }) => (
                    <span key={label} className="fc-size-legend-item">
                      <span 
                        className="fc-size-legend-swatch" 
                        style={{ background: bg, borderColor: border }} 
                      />
                      {label}
                    </span>
                  ))}
                </div>

                <div className="fc-modal-actions">
                  <button
                    className="fc-btn-cart"
                    disabled={!selectedSize}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart size={13} strokeWidth={2} />
                    Add to Cart
                  </button>
                  <button
                    className="fc-btn-buy"
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
      </section>
    </>
  );
}