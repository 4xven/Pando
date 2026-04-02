"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ArrowLeft } from "lucide-react";
import Header from "../components/shared/header";
import Footer from "../components/shared/footer";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

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

// Returns the correct localStorage key for the current user
const getCartKey = (uid?: string) =>
  uid ? `pando_cart_${uid}` : "pando_cart_guest";

const getCheckoutKey = (uid?: string) =>
  uid ? `pando_checkout_${uid}` : "pando_checkout_guest";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUid, setCurrentUid] = useState<string | undefined>(undefined);

  useEffect(() => {
    let unsubProducts: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid;
      setCurrentUid(uid);
      const key = getCartKey(uid);

      // Load saved cart from localStorage
      const saved = localStorage.getItem(key);
      setCart(saved ? JSON.parse(saved) : []);

      // Start listening to product changes for live stock updates
      if (unsubProducts) unsubProducts();
      unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
        const productsMap = new Map(
          snapshot.docs.map((doc) => [doc.id, doc.data()])
        );
        setCart((prev) =>
          prev.map((item) => {
            const latest = productsMap.get(item.product.id);
            if (!latest) return item;
            return { ...item, product: { ...item.product, stock: latest.stock } };
          })
        );
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubProducts) unsubProducts();
    };
  }, []);

  // ─── Sync cart to localStorage on every change ───────────────────────────
  useEffect(() => {
    localStorage.setItem(getCartKey(currentUid), JSON.stringify(cart));
  }, [cart, currentUid]);

  // ─── Selection state ──────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cartUpdated, setCartUpdated] = useState(false);

  const itemKey = (productId: string, size: number) => `${productId}-${size}`;

  const formatPrice = (price: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(price);

  const flash = () => {
    setCartUpdated(true);
    setTimeout(() => setCartUpdated(false), 1500);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const selectedItems = cart.filter((i) =>
    selected.has(itemKey(i.product.id, i.size))
  );
  const summaryItems = selected.size > 0 ? selectedItems : cart;
  const summaryCount = summaryItems.reduce((sum, i) => sum + i.quantity, 0);
  const summaryTotal = summaryItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  const allKeys = cart.map((i) => itemKey(i.product.id, i.size));
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someSelected = selected.size > 0;

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(allKeys));
  };

  const toggleSelect = (productId: string, size: number) => {
    const key = itemKey(productId, size);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ─── Cart operations ──────────────────────────────────────────────────────
  const removeFromCart = (productId: string, size: number) => {
    setCart((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.size === size))
    );
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(itemKey(productId, size));
      return next;
    });
    flash();
  };

  const removeSelected = () => {
    if (!someSelected) return;
    if (!confirm(`Remove ${selected.size} selected item(s) from cart?`)) return;
    setCart((prev) =>
      prev.filter((i) => !selected.has(itemKey(i.product.id, i.size)))
    );
    setSelected(new Set());
    flash();
  };

  const updateQuantity = (productId: string, size: number, newQuantity: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id === productId && i.size === size) {
          const maxStock = i.product.stock;
          if (newQuantity > maxStock) {
            alert(`Only ${maxStock} item(s) available in stock`);
            return { ...i, quantity: maxStock };
          }
          if (newQuantity < 1) return i;
          return { ...i, quantity: newQuantity };
        }
        return i;
      })
    );
  };

  // ─── Checkout navigation ──────────────────────────────────────────────────
  const handleCheckout = () => {
    // If specific items are selected, save only those for checkout.
    // Otherwise pass the full cart.
    const itemsForCheckout = someSelected ? selectedItems : cart;
    localStorage.setItem(
      getCheckoutKey(currentUid),
      JSON.stringify(itemsForCheckout)
    );
    router.push("/checkout");
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main>
      <Header />
      <div
        style={{
          minHeight: "100vh",
          background: "#E8DFD3",
          padding: "140px 16px 60px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Page heading */}
          <div style={{ marginBottom: "40px" }}>
            <Link
              href="/product"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#3C2415",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                marginBottom: "20px",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
            <h1
              style={{
                fontSize: "2.8rem",
                fontWeight: 700,
                color: "#3C2415",
                fontFamily: "Georgia, serif",
                margin: "0 0 8px 0",
              }}
            >
              Your Cart
            </h1>
            <p style={{ color: "#9A8070", fontSize: "0.9rem", margin: 0 }}>
              {cartCount === 0
                ? "Your cart is empty"
                : `${cartCount} item${cartCount !== 1 ? "s" : ""} in cart${
                    someSelected ? ` · ${selected.size} selected` : ""
                  }`}
            </p>
          </div>

          {/* Flash message */}
          {cartUpdated && (
            <div
              style={{
                background: "#dcfce7",
                color: "#166534",
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "24px",
                fontSize: "0.85rem",
                fontWeight: 500,
                animation: "slideDown 0.3s ease-out",
              }}
            >
              ✓ Cart updated successfully
            </div>
          )}

          {/* Empty state */}
          {cart.length === 0 ? (
            <div
              style={{
                background: "#fdf9f5",
                borderRadius: "20px",
                padding: "60px 32px",
                textAlign: "center",
                boxShadow: "0 2px 10px rgba(60,36,21,0.08)",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🛒</div>
              <h2
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "#3C2415",
                  marginBottom: "8px",
                  fontFamily: "Georgia, serif",
                }}
              >
                Your cart is empty
              </h2>
              <p style={{ color: "#9A8070", fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 28px" }}>
                Discover our collection of premium Marikina shoes and add your favorites to the cart.
              </p>
              <Link
                href="/product"
                style={{
                  display: "inline-block",
                  background: "#3C2415",
                  color: "#fff",
                  padding: "12px 32px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#5a3a21")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#3C2415")}
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
              {/* LEFT — cart items */}
              <div
                style={{
                  background: "#fdf9f5",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 2px 10px rgba(60,36,21,0.08)",
                }}
              >
                {/* Bulk action toolbar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #ede6df",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "#3C2415",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      style={{ width: "17px", height: "17px", cursor: "pointer", accentColor: "#3C2415" }}
                    />
                    Select All
                  </label>
                  {someSelected && (
                    <span style={{ fontSize: "0.82rem", color: "#9A8070" }}>
                      {selected.size} selected
                    </span>
                  )}
                  {someSelected && (
                    <button
                      onClick={removeSelected}
                      style={{
                        marginLeft: "auto",
                        background: "none",
                        border: "1px solid #fca5a5",
                        color: "#b91c1c",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <Trash2 size={14} />
                      Delete Selected
                    </button>
                  )}
                </div>

                {/* Cart item rows */}
                {cart.map((item, idx) => {
                  const key = itemKey(item.product.id, item.size);
                  const isSelected = selected.has(key);
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        gap: "16px",
                        padding: "12px",
                        marginBottom: idx < cart.length - 1 ? "8px" : "0",
                        borderBottom: idx < cart.length - 1 ? "1px solid #ede6df" : "none",
                        borderRadius: "12px",
                        background: isSelected ? "rgba(160,82,45,0.06)" : "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{ display: "flex", alignItems: "flex-start", paddingTop: "4px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.product.id, item.size)}
                          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#3C2415", marginTop: "2px" }}
                        />
                      </div>

                      {/* Image */}
                      <div
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          background: "#f0e6d8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {item.product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span style={{ fontSize: "2rem", opacity: 0.3 }}>👟</span>
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <div>
                            <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "#3C2415" }}>
                              {item.product.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "#9A8070" }}>
                              EU {item.size} · {item.product.category}
                            </p>
                          </div>
                          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#A0522D", whiteSpace: "nowrap", marginLeft: "12px" }}>
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              background: "#f3efea",
                              borderRadius: "8px",
                              padding: "4px 8px",
                            }}
                          >
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                              style={{ background: "none", border: "none", color: "#9A8070", cursor: "pointer", fontSize: "1rem", padding: "4px 8px", transition: "color 0.2s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#3C2415")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#9A8070")}
                            >
                              −
                            </button>
                            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3C2415", minWidth: "24px", textAlign: "center" }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              style={{
                                background: "none",
                                border: "none",
                                color: item.quantity >= item.product.stock ? "#ccc" : "#9A8070",
                                cursor: item.quantity >= item.product.stock ? "not-allowed" : "pointer",
                                fontSize: "1rem",
                                padding: "4px 8px",
                              }}
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id, item.size)}
                            style={{ background: "none", border: "none", color: "#c4b9af", cursor: "pointer", padding: "4px 8px", transition: "color 0.2s", marginLeft: "auto" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#b91c1c")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#c4b9af")}
                            title="Remove from cart"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT — Order Summary */}
              <div>
                <div
                  style={{
                    background: "#fdf9f5",
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 2px 10px rgba(60,36,21,0.08)",
                    position: "sticky",
                    top: "100px",
                  }}
                >
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", color: "#3C2415", letterSpacing: "0.8px" }}>
                    Order Summary
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: someSelected ? "#A0522D" : "#9A8070", fontWeight: someSelected ? 500 : 400, margin: "0 0 16px" }}>
                    {someSelected
                      ? `Total for ${selected.size} selected item${selected.size !== 1 ? "s" : ""}`
                      : "Select items to checkout a specific order"}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#5A3D2B" }}>
                      <span>Subtotal ({summaryCount} items)</span>
                      <span>{formatPrice(summaryTotal)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#5A3D2B" }}>
                      <span>Shipping</span>
                      <span style={{ color: "#606C38", fontWeight: 600 }}>Free</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#5A3D2B" }}>
                      <span>Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "16px",
                      borderTop: "1px solid #ede6df",
                      marginBottom: "20px",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "#3C2415",
                    }}
                  >
                    <span>Total</span>
                    <span>{formatPrice(summaryTotal)}</span>
                  </div>

                  {/* ── Checkout button — navigates to /checkout ── */}
                  <button
                    onClick={handleCheckout}
                    style={{
                      width: "100%",
                      background: "#3C2415",
                      color: "#fff",
                      border: "none",
                      padding: "13px",
                      borderRadius: "12px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background 0.2s",
                      marginBottom: "12px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#5a3a21")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#3C2415")}
                  >
                    {someSelected
                      ? `Checkout (${selected.size} item${selected.size !== 1 ? "s" : ""})`
                      : "Proceed to Checkout"}
                  </button>

                  <Link
                    href="/product"
                    style={{
                      display: "block",
                      textAlign: "center",
                      background: "none",
                      color: "#3C2415",
                      border: "1px solid #d6ccc5",
                      padding: "12px",
                      borderRadius: "12px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3C2415";
                      e.currentTarget.style.background = "#f3efea";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#d6ccc5";
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 768px) {
            div[style*="grid-template-columns: 1fr 340px"] {
              grid-template-columns: 1fr !important;
            }
            div[style*="position: sticky"] {
              position: static !important;
            }
          }
        `}</style>
      </div>
      <Footer />
    </main>
  );
}