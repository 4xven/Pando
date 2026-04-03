"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  Navigation,
} from "lucide-react";
import Header from "../components/shared/header";
import Footer from "../components/shared/footer";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

// ── Import shared shipping utilities ─────────────────────────────────────────
import {
  detectShippingRegion,
  getShippingConfig,
  FREE_SHIPPING_THRESHOLD,
  type ShippingRegion,
  type ShippingConfig,
} from "../lib/shipping";

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

// ── Nominatim API ─────────────────────────────────────────────────────────────
// OpenStreetMap's free reverse geocoding — no API key required.
// Rate limit: max 1 request/sec. Respect their usage policy.
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

interface NominatimResult {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
    [key: string]: string | undefined;
  };
}

async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<NominatimResult | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return null;
    return (await res.json()) as NominatimResult;
  } catch {
    return null;
  }
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&addressdetails=1&limit=5`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return [];
    return (await res.json()) as NominatimResult[];
  } catch {
    return [];
  }
}

// ── Geolocation Button ────────────────────────────────────────────────────────
interface GeolocationButtonProps {
  onDetected: (city: string, province: string, street: string, postal: string) => void;
}

function GeolocationButton({ onDetected }: GeolocationButtonProps) {
  const [state, setState] = useState<"idle" | "locating" | "geocoding" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDetect = async () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setState("error");
      return;
    }

    setState("locating");
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState("geocoding");
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);

        if (!result) {
          setErrorMsg("Could not determine your address. Please fill in manually.");
          setState("error");
          return;
        }

        const addr = result.address;

        // Build street from road + house number
        const streetParts = [addr.house_number, addr.road, addr.suburb].filter(Boolean);
        const street = streetParts.join(", ");

        const city =
          addr.city ?? addr.town ?? addr.municipality ?? addr.suburb ?? addr.village ?? "";
        const province = addr.county ?? addr.state ?? "";
        const postal = addr.postcode ?? "";

        onDetected(city, province, street, postal);
        setState("done");

        // Reset to idle after 2s so user can re-detect
        setTimeout(() => setState("idle"), 2500);
      },
      (err) => {
        let msg = "Location access denied.";
        if (err.code === 1) msg = "Location access denied. Please allow access in your browser.";
        else if (err.code === 2) msg = "Location unavailable. Check your connection.";
        else if (err.code === 3) msg = "Location request timed out.";
        setErrorMsg(msg);
        setState("error");
        setTimeout(() => setState("idle"), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const label = {
    idle: "Detect My Location",
    locating: "Getting GPS…",
    geocoding: "Looking up address…",
    done: "Location Detected!",
    error: errorMsg || "Failed. Try again.",
  }[state];

  const isLoading = state === "locating" || state === "geocoding";
  const isDone = state === "done";
  const isError = state === "error";

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={handleDetect}
        disabled={isLoading || isDone}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          background: isDone ? "#d1fae5" : isError ? "#fee2e2" : "#fff",
          color: isDone ? "#065f46" : isError ? "#991b1b" : "#3C2415",
          border: `1.5px solid ${isDone ? "#86efac" : isError ? "#fca5a5" : "#e0d8d0"}`,
          borderRadius: 10,
          fontSize: "0.83rem",
          fontWeight: 600,
          cursor: isLoading || isDone ? "not-allowed" : "pointer",
          fontFamily: "Arial, Helvetica, sans-serif",
          transition: "all 0.2s",
          opacity: isLoading || isDone ? 0.8 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading && !isDone)
            e.currentTarget.style.borderColor = "#8a6a50";
        }}
        onMouseLeave={(e) => {
          if (!isLoading && !isDone)
            e.currentTarget.style.borderColor = isError ? "#fca5a5" : "#e0d8d0";
        }}
      >
        {isLoading ? (
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
        ) : isDone ? (
          <CheckCircle size={14} />
        ) : (
          <Navigation size={14} />
        )}
        {label}
      </button>
      <p style={{ fontSize: "0.68rem", color: "#9a8070", margin: "5px 0 0" }}>
        Uses your devices GPS + OpenStreetMap. No personal data is stored.
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Address Search Autocomplete ───────────────────────────────────────────────
interface AddressSearchProps {
  onSelect: (city: string, province: string, street: string, postal: string) => void;
}

function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const shouldSearch = query.length >= 4;
  

  // Debounced search
useEffect(() => {
  if (!shouldSearch) return;

  const timer = setTimeout(async () => {
    setLoading(true);
    const found = await searchAddress(query + ", Philippines");
    setResults(found);
    setOpen(found.length > 0);
    setLoading(false);
  }, 600);

  return () => clearTimeout(timer);
}, [query, shouldSearch]);



  const handleSelect = (result: NominatimResult) => {
    const addr = result.address;
    const streetParts = [addr.house_number, addr.road, addr.suburb].filter(Boolean);
    const street = streetParts.join(", ");
    const city = addr.city ?? addr.town ?? addr.municipality ?? addr.village ?? "";
    const province = addr.county ?? addr.state ?? "";
    const postal = addr.postcode ?? "";
    onSelect(city, province, street, postal);
    setQuery("");
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "#9A8070",
          marginBottom: 7,
        }}
      >
        Search Address (optional)
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          placeholder="e.g. Marikina City, Pasig, Cebu…"
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 40px 12px 14px",
            border: "1.5px solid #e0d8d0",
            borderRadius: 10,
            fontSize: "0.88rem",
            color: "#3C2415",
            background: "#fff",
            outline: "none",
            fontFamily: "Arial, Helvetica, sans-serif",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#8a6a50")}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e0d8d0";
            // Delay so click on results fires first
            setTimeout(() => setOpen(false), 200);
          }}
        />
        {loading && (
          <Loader2
            size={15}
            color="#9a8070"
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              animation: "spin 1s linear infinite",
            }}
          />
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            zIndex: 100,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1.5px solid #e0d8d0",
            borderRadius: 10,
            listStyle: "none",
            margin: 0,
            padding: "4px 0",
            boxShadow: "0 8px 24px rgba(60,36,20,0.12)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                padding: "10px 14px",
                fontSize: "0.83rem",
                color: "#3C2415",
                cursor: "pointer",
                borderBottom: i < results.length - 1 ? "1px solid #f0ebe4" : "none",
                lineHeight: 1.4,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f7f3ef")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <MapPin
                size={12}
                color="#9a8070"
                style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}
              />
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Shipping Info Card ────────────────────────────────────────────────────────
interface ShippingInfoCardProps {
  region: ShippingRegion;
  config: ShippingConfig;
  subtotal: number;
}

function ShippingInfoCard({ config, subtotal }: ShippingInfoCardProps) {
  const isFree = config.fee === 0;
  const amountToFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const showFreeHint = !isFree && amountToFree > 0;

  return (
    <div
      style={{
        background: isFree ? "#ecfdf5" : "#fffbeb",
        border: `1.5px solid ${isFree ? "#86efac" : "#fcd34d"}`,
        borderRadius: 12,
        padding: "14px 16px",
        marginTop: 16,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: isFree ? "#dcfce7" : "#fef3c7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isFree ? (
          <CheckCircle size={16} color="#22c55e" />
        ) : (
          <AlertCircle size={16} color="#f59e0b" />
        )}
      </div>
      <div style={{ flex: 1, fontSize: "0.82rem" }}>
        <p style={{ margin: "0 0 3px", fontWeight: 700, color: isFree ? "#065f46" : "#92400e" }}>
          {config.label}
        </p>
        {showFreeHint && (
          <p style={{ margin: "0 0 3px", color: "#92400e", opacity: 0.85 }}>
            Add ₱{amountToFree.toLocaleString("en-PH")} more for FREE shipping nationwide
          </p>
        )}
        <p style={{ margin: 0, color: isFree ? "#065f46" : "#92400e", opacity: 0.7, fontSize: "0.74rem" }}>
          Estimated delivery: {config.estimatedDays[0]}–{config.estimatedDays[1]} business days
        </p>
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
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

function Field({ label, field, placeholder, half, type = "text", value, error, onChange }: FieldProps) {
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
          marginBottom: 7,
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
          borderRadius: 10,
          fontSize: "0.88rem",
          color: "#3C2415",
          background: "#fff",
          outline: "none",
          fontFamily: "Arial, Helvetica, sans-serif",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = error ? "#f87171" : "#8a6a50")}
        onBlur={(e) => (e.currentTarget.style.borderColor = error ? "#f87171" : "#e0d8d0")}
      />
      {error && (
        <p style={{ fontSize: "0.72rem", color: "#b91c1c", marginTop: 4, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Order Summary ─────────────────────────────────────────────────────────────
interface OrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  placing: boolean;
  success: boolean;
  shippingLabel: string;
  onPlaceOrder: () => void;
  formatPrice: (n: number) => string;
}

function OrderSummary({
  cart, subtotal, shippingFee, total, placing, success, shippingLabel, onPlaceOrder, formatPrice,
}: OrderSummaryProps) {
  return (
    <div style={{ background: "#3A2414", borderRadius: 20, padding: 28, color: "#f5e6d3" }}>
      <h3 style={{ margin: "0 0 22px", fontSize: "1.15rem", fontWeight: 700, fontFamily: "Georgia, serif" }}>
        Order Summary
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
        {cart.length === 0 ? (
          <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>No items in cart</p>
        ) : (
          cart.map((item) => (
            <div key={`${item.product.id}-${item.size}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: 10, overflow: "hidden",
                  background: "#5a3a21", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {item.product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.image} alt={item.product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1.4rem" }}>👟</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#f5e6d3" }}>
                  {item.product.name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(245,230,211,0.55)" }}>
                  EU {item.size} · qty {item.quantity}
                </p>
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f5e6d3", whiteSpace: "nowrap" }}>
                {formatPrice(item.product.price * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: "1px solid rgba(245,230,211,0.15)", marginBottom: 16 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
          <span style={{ color: "rgba(245,230,211,0.65)" }}>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
          <span style={{ color: "rgba(245,230,211,0.65)" }}>Shipping</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span>{formatPrice(shippingFee)}</span>
            <span style={{ fontSize: "0.7rem", opacity: 0.55 }}>({shippingLabel})</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(245,230,211,0.15)", marginBottom: 20 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
        <span style={{ fontSize: "0.9rem", color: "rgba(245,230,211,0.75)" }}>Total</span>
        <span style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "Georgia, serif" }}>
          {formatPrice(total)}
        </span>
      </div>

      <button
        onClick={onPlaceOrder}
        disabled={placing || cart.length === 0 || success}
        style={{
          width: "100%",
          background: success ? "#2d6a4f" : placing ? "#7a5a3a" : "linear-gradient(135deg, #8a5a3a, #a07050)",
          color: "#fff", border: "none", borderRadius: 12, padding: 15,
          fontSize: "0.8rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase",
          cursor: placing || cart.length === 0 || success ? "not-allowed" : "pointer",
          transition: "opacity 0.2s, background 0.3s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "Arial, sans-serif",
        }}
        onMouseEnter={(e) => { if (!placing && !success) e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      >
        {success ? (
          <><CheckCircle size={15} /> Order Placed!</>
        ) : placing ? (
          <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Placing Order…</>
        ) : (
          "Place Order →"
        )}
      </button>

      <p style={{ fontSize: "0.7rem", color: "rgba(245,230,211,0.4)", textAlign: "center", margin: "14px 0 0", lineHeight: 1.5 }}>
        By placing your order, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | undefined>();
  const [profileLoading, setProfileLoading] = useState(true);

  const [form, setForm] = useState<ShippingForm>({
    firstName: "", lastName: "", email: "",
    phone: "", street: "", city: "", province: "", postal: "",
  });
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});

  // ── Load cart + pre-fill from Firestore ──────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid;
      setCurrentUid(uid);

      const cartKey = uid ? `pando_cart_${uid}` : "pando_cart_guest";
      const checkoutKey = uid ? `pando_checkout_${uid}` : "pando_checkout_guest";
      try {
        const checkoutItems = localStorage.getItem(checkoutKey);
        setCart(
          checkoutItems
            ? JSON.parse(checkoutItems)
            : JSON.parse(localStorage.getItem(cartKey) ?? "[]"),
        );
      } catch { setCart([]); }

      if (uid) {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) {
            const d = snap.data();
            const fullName: string = d.name ?? user?.displayName ?? "";
            const parts = fullName.trim().split(" ");
            setForm({
              firstName: parts[0] ?? "",
              lastName: parts.slice(1).join(" "),
              email: user?.email ?? d.email ?? "",
              phone: d.phone ?? "",
              street: d.street ?? "",
              city: d.city ?? "",
              province: d.province ?? "",
              postal: d.postal ?? "",
            });
          } else if (user?.email) {
            setForm((p) => ({ ...p, email: user.email ?? "" }));
          }
        } catch { /* user fills manually */ }
      } else if (user?.email) {
        setForm((p) => ({ ...p, email: user.email ?? "" }));
      }

      setProfileLoading(false);
    });
    return () => unsub();
  }, []);

  const formatPrice = (n: number) => "₱" + new Intl.NumberFormat("en-PH").format(n);

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // ── Shipping — computed from shared lib, re-runs whenever city/province changes ──
  const detectedRegion = detectShippingRegion(form.city, form.province);
  const shippingConfig = getShippingConfig(detectedRegion, subtotal);
  const shippingFee = shippingConfig.fee;
  const total = subtotal + shippingFee;

  // ── Callbacks for geo auto-fill ───────────────────────────────────────────
  const handleGeoDetected = useCallback(
    (city: string, province: string, street: string, postal: string) => {
      setForm((prev) => ({
        ...prev,
        city: city || prev.city,
        province: province || prev.province,
        street: street || prev.street,
        postal: postal || prev.postal,
      }));
      // Clear related errors
      setErrors((prev) => ({ ...prev, city: undefined, province: undefined, street: undefined }));
    },
    [],
  );

  const handleAddressSelect = useCallback(
    (city: string, province: string, street: string, postal: string) => {
      setForm((prev) => ({
        ...prev,
        city: city || prev.city,
        province: province || prev.province,
        street: street || prev.street,
        postal: postal || prev.postal,
      }));
      setErrors((prev) => ({ ...prev, city: undefined, province: undefined, street: undefined }));
    },
    [],
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Partial<ShippingForm> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
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

  // ── Place order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validate() || cart.length === 0) return;
    setPlacing(true);

    try {
      await runTransaction(db, async (transaction) => {
        const grouped: Record<string, number> = {};
        for (const item of cart) {
          grouped[item.product.id] = (grouped[item.product.id] ?? 0) + item.quantity;
        }

        const productIds = Object.keys(grouped);
        const productRefs = productIds.map((id) => doc(db, "products", id));
        const snaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

        for (let i = 0; i < productIds.length; i++) {
          const snap = snaps[i];
          if (!snap.exists()) throw new Error("Product no longer exists.");
          const currentStock = snap.data()?.stock ?? 0;
          if (currentStock < grouped[productIds[i]])
            throw new Error(`Only ${currentStock} left in stock.`);
        }

        for (let i = 0; i < productIds.length; i++) {
          const snap = snaps[i];
          const newStock = (snap.data()?.stock ?? 0) - grouped[productIds[i]];
          transaction.update(productRefs[i], {
            stock: newStock,
            status: newStock === 0 ? "Out of Stock" : newStock <= 5 ? "Low Stock" : "In Stock",
          });
        }

        const orderRef = doc(collection(db, "orders"));
        transaction.set(orderRef, {
          userId: currentUid ?? "guest",
          shipping: form,
          items: cart.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            size: item.size,
            quantity: item.quantity,
            image: item.product.image,
          })),
          subtotal,
          shippingFee,
          shippingRegion: detectedRegion,
          total,
          paymentMethod: "COD",
          status: "pending",
          createdAt: serverTimestamp(),
        });
      });

      const suffix = currentUid ?? "guest";
      localStorage.removeItem(`pando_checkout_${suffix}`);
      localStorage.removeItem(`pando_cart_${suffix}`);
      setSuccess(true);
      setTimeout(() => router.push("/profile"), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to place order. Try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main>
      <Header />
      <div
        style={{
          minHeight: "100vh",
          background: "#E8DFD3",
          padding: "40px 20px 80px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          {/* Success banner */}
          {success && (
            <div
              style={{
                background: "#d1fae5", color: "#065f46", borderRadius: 12,
                padding: "16px 24px", marginBottom: 24,
                display: "flex", alignItems: "center", gap: 12,
                fontWeight: 600, fontSize: "0.9rem",
              }}
            >
              <CheckCircle size={20} />
              Order placed! Redirecting to your profile…
            </div>
          )}

          {/* Back + Title */}
          <div style={{ marginBottom: 32 }}>
            
            <h1
              style={{
                fontSize: "2.4rem", fontWeight: 700, color: "#3C2415",
                fontFamily: "Georgia, serif", margin: 0,
              }}
            >
              Checkout
            </h1>
            {profileLoading && (
              <p style={{ fontSize: "0.8rem", color: "#9a8070", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                Loading your saved details…
              </p>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: 24,
              alignItems: "start",
            }}
          >
            {/* LEFT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Shipping */}
              <div
                style={{
                  background: "#fdf9f5", borderRadius: 20, padding: 32,
                  boxShadow: "0 2px 12px rgba(60,36,21,0.07)",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: "#3C2415",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <Truck size={18} color="#A0522D" /> Shipping Information
                </h2>
                <p style={{ fontSize: "0.78rem", color: "#9a8070", margin: "0 0 20px" }}>
                  Auto-filled from your profile — edit if needed.
                </p>

                {/* ── Location Tools ─────────────────────────────── */}
                <div
                  style={{
                    background: "#f0ebe4", borderRadius: 12, padding: "16px 18px",
                    marginBottom: 24, display: "flex", flexDirection: "column", gap: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "2px",
                      textTransform: "uppercase", color: "#9a8070", margin: 0,
                    }}
                  >
                    Quick Location Fill
                  </p>

                  {/* GPS detect */}
                  <GeolocationButton onDetected={handleGeoDetected} />

                  {/* Address search */}
                  <AddressSearch onSelect={handleAddressSelect} />
                </div>

                {/* Form fields */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  <Field label="First Name" field="firstName" placeholder="Juan" half
                    value={form.firstName} error={errors.firstName} onChange={handleChange} />
                  <Field label="Last Name" field="lastName" placeholder="Dela Cruz" half
                    value={form.lastName} error={errors.lastName} onChange={handleChange} />
                  <Field label="Email Address" field="email" placeholder="juan@example.com" type="email"
                    value={form.email} error={errors.email} onChange={handleChange} />
                  <Field label="Phone Number" field="phone" placeholder="+63 900 000 0000"
                    value={form.phone} error={errors.phone} onChange={handleChange} />
                  <Field label="Street Address" field="street" placeholder="House No., Street Name, Barangay"
                    value={form.street} error={errors.street} onChange={handleChange} />
                  <Field label="City" field="city" placeholder="City" half
                    value={form.city} error={errors.city} onChange={handleChange} />
                  <Field label="Province" field="province" placeholder="Province" half
                    value={form.province} error={errors.province} onChange={handleChange} />
                  <Field label="Postal Code" field="postal" placeholder="####" half
                    value={form.postal} error={errors.postal} onChange={handleChange} />
                </div>

                {/* Live shipping card */}
                <ShippingInfoCard
                  region={detectedRegion}
                  config={shippingConfig}
                  subtotal={subtotal}
                />
              </div>

              {/* Payment */}
              <div
                style={{
                  background: "#fdf9f5", borderRadius: 20, padding: 32,
                  boxShadow: "0 2px 12px rgba(60,36,21,0.07)",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 700, color: "#3C2415",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <MapPin size={18} color="#A0522D" /> Payment Method
                </h2>
                <div
                  style={{
                    border: "2px solid #A0522D", borderRadius: 14,
                    padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 16,
                    background: "rgba(160,82,45,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: "#f0e6da", display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0, fontSize: "1.3rem",
                    }}
                  >
                    💵
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 5px", fontSize: "0.9rem", fontWeight: 700, color: "#3C2415" }}>
                      Cash on Delivery (COD)
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#7A6A5A", lineHeight: 1.55 }}>
                      Pay in cash at delivery. Please prepare{" "}
                      <strong style={{ color: "#A0522D" }}>{formatPrice(total)}</strong> exactly.
                    </p>
                  </div>
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: "2px solid #A0522D", background: "#A0522D",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 2,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                  </div>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#B0A090", marginTop: 14 }}>
                  More payment methods (GCash, Credit Card) coming soon.
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ position: "sticky", top: 100 }}>
              <OrderSummary
                cart={cart}
                subtotal={subtotal}
                shippingFee={shippingFee}
                total={total}
                placing={placing}
                success={success}
                shippingLabel={shippingConfig.label}
                onPlaceOrder={handlePlaceOrder}
                formatPrice={formatPrice}
              />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 820px) {
            div[style*="grid-template-columns: 1fr 360px"] { grid-template-columns: 1fr !important; }
            div[style*="position: sticky"] { position: static !important; }
          }
        `}</style>
      </div>
      <Footer />
    </main>
  );
}