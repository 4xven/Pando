"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Truck, MapPin } from "lucide-react";
import Header from "../components/shared/header";
import Footer from "../components/shared/footer";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string | null;
  stock: number;
  status: string;
}

interface CartItem {
  product: Product;
  size: number;
  quantity: number;
}

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal: string;
}

const SHIPPING_FEE = 250;

// ── Field component (outside CheckoutPage to avoid react-hooks/static-components) ──
interface FieldProps {
  label: string;
  field: keyof ShippingForm;
  placeholder?: string;
  half?: boolean;
  type?: string;
  value: string;
  error?: string;
  onChange: (field: keyof ShippingForm, value: string) => void;
}

function Field({
  label,
  field,
  placeholder,
  half,
  type = "text",
  value,
  error,
  onChange,
}: FieldProps) {
  return (
    <div style={{ flex: half ? "1 1 calc(50% - 8px)" : "1 1 100%" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "#9A8070",
          marginBottom: "7px",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(field, e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          border: `1.5px solid ${error ? "#f87171" : "#e0d8d0"}`,
          borderRadius: "10px",
          fontSize: "0.88rem",
          color: "#3C2415",
          background: "#fff",
          outline: "none",
          fontFamily: "Arial, Helvetica, sans-serif",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = error ? "#f87171" : "#8a6a50")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = error ? "#f87171" : "#e0d8d0")
        }
      />
      {error && (
        <p
          style={{
            fontSize: "0.72rem",
            color: "#b91c1c",
            marginTop: "4px",
            marginBottom: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ── OrderSummary component (outside CheckoutPage) ─────────────────────────────
interface OrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  total: number;
  placing: boolean;
  onPlaceOrder: () => void;
  formatPrice: (n: number) => string;
}

function OrderSummary({
  cart,
  subtotal,
  total,
  placing,
  onPlaceOrder,
  formatPrice,
}: OrderSummaryProps) {
  return (
    <div
      style={{
        background: "#3A2414",
        borderRadius: "20px",
        padding: "28px",
        color: "#f5e6d3",
      }}
    >
      <h3
        style={{
          margin: "0 0 22px",
          fontSize: "1.15rem",
          fontWeight: 700,
          fontFamily: "Georgia, serif",
          letterSpacing: "0.5px",
        }}
      >
        Order Summary
      </h3>

      {/* Cart Items */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        {cart.length === 0 ? (
          <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>No items in cart</p>
        ) : (
          cart.map((item) => (
            <div
              key={`${item.product.id}-${item.size}`}
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "#5a3a21",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "1.4rem" }}>👟</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "#f5e6d3",
                  }}
                >
                  {item.product.name}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "0.75rem",
                    color: "rgba(245,230,211,0.55)",
                  }}
                >
                  EU {item.size} · qty {item.quantity}
                </p>
              </div>
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#f5e6d3",
                  whiteSpace: "nowrap",
                }}
              >
                {formatPrice(item.product.price * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(245,230,211,0.15)",
          marginBottom: "16px",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "rgba(245,230,211,0.65)" }}>Subtotal</span>
          <span style={{ color: "#f5e6d3" }}>{formatPrice(subtotal)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "rgba(245,230,211,0.65)" }}>Shipping</span>
          <span style={{ color: "#f5e6d3" }}>{formatPrice(SHIPPING_FEE)}</span>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(245,230,211,0.15)",
          marginBottom: "20px",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "24px",
        }}
      >
        <span style={{ fontSize: "0.9rem", color: "rgba(245,230,211,0.75)" }}>
          Total
        </span>
        <span
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            color: "#f5e6d3",
          }}
        >
          {formatPrice(total)}
        </span>
      </div>

      <button
        onClick={onPlaceOrder}
        disabled={placing || cart.length === 0}
        style={{
          width: "100%",
          background: placing
            ? "#7a5a3a"
            : "linear-gradient(135deg, #8a5a3a, #a07050)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          padding: "15px",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          cursor: placing || cart.length === 0 ? "not-allowed" : "pointer",
          transition: "opacity 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontFamily: "Arial, sans-serif",
        }}
        onMouseEnter={(e) => {
          if (!placing) e.currentTarget.style.opacity = "0.88";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        {placing ? "Placing Order…" : "Place Order →"}
      </button>

      <p
        style={{
          fontSize: "0.7rem",
          color: "rgba(245,230,211,0.4)",
          textAlign: "center",
          margin: "14px 0 0",
          lineHeight: 1.5,
        }}
      >
        By placing your order, you agree to our Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    province: "",
    postal: "",
  });
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});

  // Load checkout cart (may be a subset if user selected items on cart page)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const cartKey = user ? `pando_cart_${user.uid}` : "pando_cart_guest";
      const checkoutKey = user
        ? `pando_checkout_${user.uid}`
        : "pando_checkout_guest";

      try {
        // Prefer checkout-specific items (set by cart page when items are selected)
        const checkoutItems = localStorage.getItem(checkoutKey);
        if (checkoutItems) {
          setCart(JSON.parse(checkoutItems));
        } else {
          // Fallback: use full cart
          const saved = localStorage.getItem(cartKey);
          setCart(saved ? JSON.parse(saved) : []);
        }
      } catch {
        setCart([]);
      }
    });
    return () => unsub();
  }, []);

  // Pre-fill email from Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setForm((prev) => ({ ...prev, email: user.email ?? "" }));
      }
    });
    return () => unsub();
  }, []);

  const formatPrice = (n: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(n);

  const subtotal = cart.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const total = subtotal + SHIPPING_FEE;

  const validate = () => {
    const e: Partial<ShippingForm> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.street.trim()) e.street = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.province.trim()) e.province = "Required";
    if (!form.postal.trim()) e.postal = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    // TODO: integrate with Firestore / PayMongo / etc.
    await new Promise((r) => setTimeout(r, 1500));
    alert("Order placed! (integration coming soon)");
    setPlacing(false);
  };

  return (
    <main>
      <Header />

      <div
        style={{
          minHeight: "100vh",
          background: "#E8DFD3",
          padding: "130px 20px 80px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          {/* Back link + Title */}
          <div style={{ marginBottom: "32px" }}>
            <Link
              href="/cart"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#3C2415",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 500,
                marginBottom: "14px",
                opacity: 0.75,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
            >
              <ArrowLeft size={16} />
              Back to Cart
            </Link>

            <h1
              style={{
                fontSize: "2.4rem",
                fontWeight: 700,
                color: "#3C2415",
                fontFamily: "Georgia, serif",
                margin: 0,
              }}
            >
              Checkout
            </h1>
          </div>

          {/* 2-column grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* LEFT COLUMN */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Shipping Information */}
              <div
                style={{
                  background: "#fdf9f5",
                  borderRadius: "20px",
                  padding: "32px",
                  boxShadow: "0 2px 12px rgba(60,36,21,0.07)",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 28px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#3C2415",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Truck size={18} color="#A0522D" />
                  Shipping Information
                </h2>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                  <Field
                    label="First Name"
                    field="firstName"
                    placeholder="First Name"
                    half
                    value={form.firstName}
                    error={errors.firstName}
                    onChange={handleChange}
                  />
                  <Field
                    label="Last Name"
                    field="lastName"
                    placeholder="Last Name"
                    half
                    value={form.lastName}
                    error={errors.lastName}
                    onChange={handleChange}
                  />
                  <Field
                    label="Email Address"
                    field="email"
                    placeholder="Email Account"
                    type="email"
                    value={form.email}
                    error={errors.email}
                    onChange={handleChange}
                  />
                  <Field
                    label="Phone Number"
                    field="phone"
                    placeholder="+63 900 000 0000"
                    value={form.phone}
                    error={errors.phone}
                    onChange={handleChange}
                  />
                  <Field
                    label="Street Address"
                    field="street"
                    placeholder="House No., Street Name, Barangay"
                    value={form.street}
                    error={errors.street}
                    onChange={handleChange}
                  />
                  <Field
                    label="City"
                    field="city"
                    placeholder="City"
                    half
                    value={form.city}
                    error={errors.city}
                    onChange={handleChange}
                  />
                  <Field
                    label="Province"
                    field="province"
                    placeholder="Province"
                    half
                    value={form.province}
                    error={errors.province}
                    onChange={handleChange}
                  />
                  <Field
                    label="Postal Code"
                    field="postal"
                    placeholder="####"
                    half
                    value={form.postal}
                    error={errors.postal}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div
                style={{
                  background: "#fdf9f5",
                  borderRadius: "20px",
                  padding: "32px",
                  boxShadow: "0 2px 12px rgba(60,36,21,0.07)",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#3C2415",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <MapPin size={18} color="#A0522D" />
                  Payment Method
                </h2>

                <div
                  style={{
                    border: "2px solid #A0522D",
                    borderRadius: "14px",
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                    background: "rgba(160,82,45,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "#f0e6da",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "1.3rem",
                    }}
                  >
                    💵
                  </div>

                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: "0 0 5px",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#3C2415",
                      }}
                    >
                      Cash on Delivery (COD)
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        color: "#7A6A5A",
                        lineHeight: 1.55,
                      }}
                    >
                      Pay in cash when your order arrives at your doorstep.
                      Please prepare the exact amount of{" "}
                      <strong style={{ color: "#A0522D" }}>
                        {formatPrice(total)}
                      </strong>{" "}
                      to ensure a smooth transaction.
                    </p>
                  </div>

                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: "2px solid #A0522D",
                      background: "#A0522D",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#fff",
                      }}
                    />
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#B0A090",
                    marginTop: "14px",
                    letterSpacing: "0.5px",
                  }}
                >
                  More payment methods (GCash, Credit Card) coming soon.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN — sticky order summary */}
            <div style={{ position: "sticky", top: "100px" }}>
              <OrderSummary
                cart={cart}
                subtotal={subtotal}
                total={total}
                placing={placing}
                onPlaceOrder={handlePlaceOrder}
                formatPrice={formatPrice}
              />
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 820px) {
            div[style*="grid-template-columns: 1fr 360px"] {
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
