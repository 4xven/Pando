"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ShoppingCart, Check } from "lucide-react";

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

// ── Toast notification ────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  visible: boolean;
}

function Toast({ message, visible }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : "12px"})`,
        background: "#3C2415",
        color: "#f5e6d3",
        padding: "12px 22px",
        borderRadius: "30px",
        fontSize: "0.83rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 8px 28px rgba(60,36,21,0.28)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s, transform 0.25s",
        zIndex: 9999,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      <Check size={14} strokeWidth={2.5} />
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

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [sizeError, setSizeError] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastProps>({ message: "", visible: false });
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getCartKey = useCallback(() => {
    const user = auth.currentUser;
    return user ? `pando_cart_${user.uid}` : "pando_cart_guest";
  }, []);

  const getCheckoutKey = useCallback(() => {
    const user = auth.currentUser;
    return user ? `pando_checkout_${user.uid}` : "pando_checkout_guest";
  }, []);

  // ── Cart state (localStorage-backed, same as your existing pattern) ───────
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const user = auth.currentUser;
      const key = user ? `pando_cart_${user.uid}` : "pando_cart_guest";
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-load cart when auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const key = user ? `pando_cart_${user.uid}` : "pando_cart_guest";
      try {
        const saved = localStorage.getItem(key);
        setCart(saved ? JSON.parse(saved) : []);
      } catch {
        setCart([]);
      }
    });
    return () => unsub();
  }, []);

  // Persist cart to localStorage + fire event for header badge
  useEffect(() => {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
    window.dispatchEvent(new Event("pando_cart_updated"));
  }, [cart, getCartKey]);

  // ── Firestore real-time products listener ─────────────────────────────────
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

      // Auto-fix cart quantities if stock decreases
      const productsMap = new Map(data.map((p) => [p.id, p]));
      setCart((prev) =>
        prev.map((item) => {
          const latest = productsMap.get(item.product.id);
          if (!latest) return item;
          return {
            ...item,
            product: { ...item.product, stock: latest.stock },
            quantity: Math.min(item.quantity, latest.stock),
          };
        })
      );
    });
    return () => unsub();
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((message: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast({ message, visible: true });
    const t = setTimeout(() => setToast({ message: "", visible: false }), 2800);
    setToastTimer(t);
  }, [toastTimer]);

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(null);
    setSizeError(false);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setSelectedSize(null);
    setSizeError(false);
  };

  // ── Core cart mutation ─────────────────────────────────────────────────────
  // Returns the updated cart array (doesn't setState — callers do that so
  // Buy Now can write to localStorage without a React re-render race)
  const buildUpdatedCart = (
    prev: CartItem[],
    product: Product,
    size: number,
    qty = 1
  ): CartItem[] => {
    const existing = prev.find(
      (i) => i.product.id === product.id && i.size === size
    );
    if (existing) {
      return prev.map((i) =>
        i.product.id === product.id && i.size === size
          ? { ...i, quantity: i.quantity + qty }
          : i
      );
    }
    return [...prev, { product, size, quantity: qty }];
  };

  // ── ADD TO CART ───────────────────────────────────────────────────────────
  // Saves item to cart localStorage, shows toast, stays on page.
  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    setCart((prev) => {
      const updated = buildUpdatedCart(prev, selectedProduct, selectedSize);
      // Also immediately persist so Buy Now (if called next) sees latest cart
      const key = auth.currentUser
        ? `pando_cart_${auth.currentUser.uid}`
        : "pando_cart_guest";
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });

    showToast(`Added ${selectedProduct.name} (EU ${selectedSize}) to cart`);
    closeModal();
  }, [selectedProduct, selectedSize, showToast]);

  // ── BUY NOW ───────────────────────────────────────────────────────────────
  // Writes ONLY this one item to pando_checkout_{uid}, then navigates.
  // Does NOT touch the regular cart.
  const handleBuyNow = useCallback(() => {
    if (!selectedProduct || !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    const buyNowItem: CartItem = {
      product: selectedProduct,
      size: selectedSize,
      quantity: 1,
    };

    // Write to the checkout key so CheckoutPage picks it up
    const key = getCheckoutKey();
    localStorage.setItem(key, JSON.stringify([buyNowItem]));

    closeModal();
    router.push("/checkout");
  }, [selectedProduct, selectedSize, getCheckoutKey, router]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered =
    filter === "All"
      ? products
      : products.filter(
          (p) => p.category?.toLowerCase() === filter.toLowerCase()
        );

  const formatPrice = (price: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(price);

  const getBadgeStyle = (): React.CSSProperties => ({
    background: "#3C2415",
    color: "#f5e6d3",
  });

  const getStockBadge = (product: Product) => {
    if (product.stock === 0)
      return { label: "Out of Stock", bg: "#f5e6d3", color: "#3C2415" };
    if (product.stock <= 5)
      return { label: `Low Stock: ${product.stock}`, bg: "#f5e6d3", color: "#3C2415" };
    return { label: `In Stock: ${product.stock}`, bg: "#f5e6d3", color: "#3C2415" };
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E8DFD3",
        padding: "20px 16px 60px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Toast */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* Title + Filters */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1
          style={{
            fontSize: "3.2rem",
            fontWeight: 700,
            color: "#3C2415",
            marginBottom: "12px",
            fontFamily: "Georgia, serif",
          }}
        >
          Our Collection
        </h1>

        <p
          style={{
            color: "#5A3D2B",
            fontSize: ".85rem",
            maxWidth: "420px",
            margin: "0 auto 28px",
            lineHeight: 1.7,
            opacity: 0.8,
          }}
        >
          Discover the finest Marikina craftsmanship. Each pair is meticulously
          handcrafted to ensure lasting quality and timeless style.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 22px",
                borderRadius: "5px",
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

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            color: "#5A3D2B",
            fontSize: "0.9rem",
            marginTop: "48px",
          }}
        >
          Loading products…
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "#9A8070",
            fontSize: "0.9rem",
            marginTop: "48px",
          }}
        >
          No products found in this category.
        </div>
      )}

      {/* Product grid */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            maxWidth: "1500px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "20px",
          }}
        >
          {filtered.map((product) => {
            const stockBadge = getStockBadge(product);
            const isOOS = product.stock === 0;

            return (
              <div
                key={product.id}
                onClick={() => !isOOS && openModal(product)}
                style={{
                  background: "#f3efea",
                  borderRadius: "16px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 10px rgba(60,36,21,0.08)",
                  opacity: isOOS ? 0.65 : 1,
                  cursor: isOOS ? "not-allowed" : "pointer",
                  transition: "transform 0.18s, box-shadow 0.18s",
                }}
                onMouseEnter={(e) => {
                  if (!isOOS) {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 8px 24px rgba(60,36,21,0.14)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 2px 10px rgba(60,36,21,0.08)";
                }}
              >
                {/* Image */}
                <div
                  style={{
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
                  }}
                >
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "3rem", opacity: 0.3 }}>👟</span>
                  )}

                  {/* Category badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      ...getBadgeStyle(),
                    }}
                  >
                    {product.category}
                  </span>

                  {/* Stock badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      background: stockBadge.bg,
                      color: stockBadge.color,
                    }}
                  >
                    {stockBadge.label}
                  </span>
                </div>

                {/* Name + price */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{ fontWeight: 700, fontSize: "0.88rem", color: "#3C2415" }}
                  >
                    {product.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#A0522D",
                      fontWeight: 600,
                      marginLeft: "8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatPrice(product.price)}
                  </span>
                </div>

                {/* Category label */}
                <p
                  style={{
                    fontSize: "0.73rem",
                    color: "#9A8070",
                    marginBottom: "10px",
                  }}
                >
                  {product.category}
                </p>

                {/* Size preview */}
                {product.sizes && product.sizes.length > 0 && (
                  <p
                    style={{
                      fontSize: "0.68rem",
                      color: "#9A8070",
                      marginBottom: "14px",
                    }}
                  >
                    Sizes: EU {Math.min(...product.sizes)}–
                    {Math.max(...product.sizes)}
                  </p>
                )}

                {/* ── CTA Buttons ─────────────────────────────────────────── */}
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    gap: "8px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Add to Cart */}
                  <button
                    disabled={isOOS}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOOS) openModal(product);
                    }}
                    title="Add to Cart"
                    style={{
                      flex: 1,
                      background: isOOS ? "#c4b9af" : "#fff",
                      color: isOOS ? "#fff" : "#3a2414",
                      border: isOOS ? "none" : "1.5px solid #3a2414",
                      padding: "10px 10px",
                      borderRadius: "10px",
                      cursor: isOOS ? "not-allowed" : "pointer",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "background 0.2s, color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isOOS) {
                        e.currentTarget.style.background = "#3a2414";
                        e.currentTarget.style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOOS) {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "#3a2414";
                      }
                    }}
                  >
                    <ShoppingCart size={13} strokeWidth={2} />
                    {isOOS ? "Out of Stock" : "Add to Cart"}
                  </button>

                  {/* Buy Now */}
                  {!isOOS && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(product);
                        // Flag so modal knows Buy Now was tapped
                        // We handle this via modal's own Buy Now button
                      }}
                      title="Buy Now"
                      style={{
                        flex: 1,
                        background: "#3a2414",
                        color: "#f5e6d3",
                        border: "none",
                        padding: "10px 10px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#5a3a21";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#3a2414";
                      }}
                    >
                      
                      Buy Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Product Detail Modal ─────────────────────────────────────────────── */}
      {selectedProduct && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fdf9f5",
              borderRadius: "20px",
              maxWidth: "560px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(60,36,21,0.25)",
            }}
          >
            {/* Image */}
            <div
              style={{
                width: "100%",
                height: "280px",
                background: "#f0e6d8",
                borderRadius: "20px 20px 0 0",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {selectedProduct.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "5rem", opacity: 0.2 }}>👟</span>
              )}

              {/* Close */}
              <button
                onClick={closeModal}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "rgba(255,255,255,0.9)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                ×
              </button>

              {/* Category badge */}
              <span
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  ...getBadgeStyle(),
                }}
              >
                {selectedProduct.category}
              </span>
            </div>

            {/* Content */}
            <div style={{ padding: "24px 28px 28px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "#3C2415",
                    fontFamily: "Georgia, serif",
                    margin: 0,
                  }}
                >
                  {selectedProduct.name}
                </h2>
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#A0522D",
                    marginLeft: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatPrice(selectedProduct.price)}
                </span>
              </div>

              {/* Stock */}
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#9A8070",
                  marginBottom: "14px",
                }}
              >
                {selectedProduct.stock > 0
                  ? `${selectedProduct.stock} pairs available`
                  : "Out of stock"}
              </p>

              {/* Description */}
              {selectedProduct.description && (
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#5A3D2B",
                    lineHeight: 1.75,
                    marginBottom: "20px",
                    borderLeft: "3px solid #D4A373",
                    paddingLeft: "12px",
                  }}
                >
                  {selectedProduct.description}
                </p>
              )}

              {/* Size selection */}
              <div style={{ marginBottom: "20px" }}>
                <p
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#3C2415",
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  Select Size (EU)
                  {sizeError && (
                    <span
                      style={{
                        color: "#b91c1c",
                        fontWeight: 500,
                        marginLeft: "8px",
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      — Please select a size
                    </span>
                  )}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {ALL_SIZES.map((size) => {
                    const available = selectedProduct.sizes?.includes(size);
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        disabled={!available}
                        onClick={() => {
                          if (available) {
                            setSelectedSize(size);
                            setSizeError(false);
                          }
                        }}
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: available ? "pointer" : "not-allowed",
                          border: isSelected
                            ? "2px solid #3C2415"
                            : available
                            ? "1.5px solid #d6c9be"
                            : "1.5px solid #e8e0d8",
                          background: isSelected
                            ? "#3C2415"
                            : available
                            ? "#fff"
                            : "#f3f0ed",
                          color: isSelected
                            ? "#fff"
                            : available
                            ? "#3C2415"
                            : "#c4b8ae",
                          position: "relative",
                          transition: "all 0.15s",
                        }}
                      >
                        {size}
                        {!available && (
                          <span
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "8%",
                              width: "84%",
                              height: "1.5px",
                              background: "#d6ccc5",
                              transform: "translateY(-50%) rotate(-20deg)",
                              pointerEvents: "none",
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Size legend */}
                <div
                  style={{ display: "flex", gap: "16px", marginTop: "10px" }}
                >
                  {[
                    { label: "Available", bg: "#fff", border: "#d6c9be" },
                    { label: "Unavailable", bg: "#f3f0ed", border: "#e8e0d8" },
                    { label: "Selected", bg: "#3C2415", border: "#3C2415" },
                  ].map(({ label, bg, border }) => (
                    <span
                      key={label}
                      style={{
                        fontSize: "0.65rem",
                        color: "#9A8070",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "3px",
                          background: bg,
                          border: `1.5px solid ${border}`,
                          display: "inline-block",
                        }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Modal action buttons ───────────────────────────────────── */}
              <div style={{ display: "flex", gap: "10px" }}>
                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  style={{
                    flex: 1,
                    background: selectedSize ? "#fff" : "#f0ebe5",
                    color: selectedSize ? "#3C2415" : "#a89080",
                    border: selectedSize
                      ? "1.5px solid #3C2415"
                      : "1.5px solid #d6c9be",
                    padding: "13px",
                    borderRadius: "12px",
                    fontSize: "0.83rem",
                    fontWeight: 600,
                    cursor: selectedSize ? "pointer" : "default",
                    transition: "background 0.2s, color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    letterSpacing: "0.2px",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSize) {
                      e.currentTarget.style.background = "#3C2415";
                      e.currentTarget.style.color = "#f5e6d3";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSize) {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.color = "#3C2415";
                    }
                  }}
                >
                  <ShoppingCart size={14} strokeWidth={2} />
                  Add to Cart
                </button>

                {/* Buy Now */}
                <button
                  onClick={handleBuyNow}
                  style={{
                    flex: 1,
                    background: selectedSize ? "#3C2415" : "#a89080",
                    color: "#fff",
                    border: "none",
                    padding: "13px",
                    borderRadius: "12px",
                    fontSize: "0.83rem",
                    fontWeight: 600,
                    cursor: selectedSize ? "pointer" : "default",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    letterSpacing: "0.2px",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSize) e.currentTarget.style.background = "#5a3a21";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSize) e.currentTarget.style.background = "#3C2415";
                  }}
                >
                  {selectedSize ? `Buy Now — EU ${selectedSize}` : "Select size first"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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