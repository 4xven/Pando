"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Zap,
  Activity,
  Star,
  Mail,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════
type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
type DateRange = "7d" | "30d" | "90d" | "all";
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  image: string | null;
  sizes?: number[];
  createdAt?: { seconds: number } | null;
}
interface OrderItem {
  productId: string;
  name: string;
  price: number;
  size: number;
  quantity: number;
  image?: string | null;
}
interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal: string;
}
interface Order {
  id: string;
  userId: string;
  shipping?: ShippingInfo;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: { seconds: number } | null;
  cancelledBy?: "user" | "admin";
}
interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
  role: "user" | "admin";
  shoeSize?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const fmt = (n: number) =>
  "₱" + new Intl.NumberFormat("en-PH").format(Math.round(n));
const fmtK = (n: number) => (n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : fmt(n));
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getOrderDate(o: Order): Date | null {
  if (!o.createdAt) return null;
  return new Date(o.createdAt.seconds * 1000);
}
function isWithinDays(date: Date | null, days: number): boolean {
  if (!date) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}
const STATUS_CFG: Record<
  OrderStatus,
  { bg: string; color: string; dot: string; label: string }
> = {
  pending: {
    bg: "#fef9ec",
    color: "#92400e",
    dot: "#f59e0b",
    label: "Pending",
  },
  processing: {
    bg: "#eff6ff",
    color: "#1e40af",
    dot: "#3b82f6",
    label: "Processing",
  },
  shipped: {
    bg: "#f5f3ff",
    color: "#5b21b6",
    dot: "#8b5cf6",
    label: "Shipped",
  },
  delivered: {
    bg: "#f0fdf4",
    color: "#065f46",
    dot: "#22c55e",
    label: "Delivered",
  },
  cancelled: {
    bg: "#fff1f2",
    color: "#9f1239",
    dot: "#f43f5e",
    label: "Cancelled",
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// MINI CHART: Sparkline
// ══════════════════════════════════════════════════════════════════════════════
function Sparkline({
  values,
  color = "#b8943a",
  height = 44,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 110;
  const h = height;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return [x, y] as [number, number];
  });
  const areaPath = `M0,${h} L${pts.map(([x, y]) => `${x},${y}`).join(" L")} L${w},${h} Z`;
  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`)
    .join(" ");
  const lastPt = pts[pts.length - 1];
  const gradId = `sg-${color.replace("#", "")}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: "100%", height, display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MINI CHART: Donut
// ══════════════════════════════════════════════════════════════════════════════
function DonutChart({
  slices,
  size = 100,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const cx = size / 2,
    cy = size / 2;
  const r = size * 0.38,
    inner = r * 0.6;
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size }}
      >
        <circle cx={cx} cy={cy} r={r} fill="#f3efe9" />
        <circle cx={cx} cy={cy} r={inner} fill="#fff" />
      </svg>
    );
  }
  const paths: { d: string; color: string; label: string }[] = [];
  let startAngle = -Math.PI / 2;
  slices.forEach((sl) => {
    const angle = (sl.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + inner * Math.cos(startAngle);
    const iy1 = cy + inner * Math.sin(startAngle);
    const ix2 = cx + inner * Math.cos(endAngle);
    const iy2 = cy + inner * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1}Z`;
    paths.push({ d, color: sl.color, label: sl.label });
    startAngle = endAngle;
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {paths.map((p) => (
        <path
          key={p.label}
          d={p.d}
          fill={p.color}
          stroke="#fff"
          strokeWidth="2"
        />
      ))}
      <circle cx={cx} cy={cy} r={inner * 0.85} fill="#fff" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MINI CHART: Revenue Bar Chart (SVG)
// ══════════════════════════════════════════════════════════════════════════════
function RevenueBarChart({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}) {
  const max = Math.max(...data, 1);
  const W = 600,
    H = 140,
    barW = Math.max(8, Math.floor(W / data.length) - 6);
  const pad = { t: 10, b: 28, l: 0, r: 0 };
  const plotH = H - pad.t - pad.b;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", overflow: "visible" }}
    >
      {data.map((v, i) => {
        const barH = (v / max) * plotH;
        const x = (i / data.length) * W + (W / data.length - barW) / 2;
        const y = pad.t + plotH - barH;
        const isMax = v === max;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={isMax ? "#3a2010" : "#d4b896"}
              opacity={v === 0 ? 0.2 : 1}
            />
            {labels[i] && (
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={10}
                fill="#9a8070"
                fontFamily="Georgia, serif"
              >
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TREND BADGE
// ══════════════════════════════════════════════════════════════════════════════
function TrendBadge({ value }: { value: number }) {
  if (value === 0)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: "0.72rem",
          color: "#9a8070",
          fontWeight: 600,
        }}
      >
        <Minus size={10} /> Flat
      </span>
    );
  const up = value > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: "0.72rem",
        fontWeight: 700,
        color: up ? "#065f46" : "#9f1239",
      }}
    >
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(value)}%
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// KPI CARD
// ══════════════════════════════════════════════════════════════════════════════
function KpiCard({
  label,
  value,
  sub,
  trend,
  icon,
  spark,
  accent = "#b8943a",
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  icon?: React.ReactNode;
  spark?: number[];
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 70,
          height: 70,
          borderRadius: "0 16px 0 100%",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <p
          style={{
            fontSize: "0.62rem",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#9a8070",
            margin: 0,
            fontWeight: 700,
          }}
        >
          {label}
        </p>
        {icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: `${accent}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div>
        <p
          style={{
            fontSize: "1.55rem",
            fontWeight: 800,
            color: "#1a0e06",
            margin: "0 0 3px",
            lineHeight: 1,
            fontFamily: "Georgia, serif",
          }}
        >
          {value}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {sub && (
            <span style={{ fontSize: "0.72rem", color: "#9a8070" }}>{sub}</span>
          )}
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
      </div>
      {spark && spark.length > 1 && (
        <div style={{ marginTop: 2 }}>
          <Sparkline values={spark} color={accent} height={36} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SMART INSIGHT CARD
// ══════════════════════════════════════════════════════════════════════════════
function InsightCard({
  icon,
  title,
  body,
  type = "info",
}: {
  icon: string;
  title: string;
  body: string;
  type?: "info" | "warning" | "success" | "danger";
}) {
  const colors = {
    info: { bg: "#f3e9e2", border: "#d6b8a6", color: "#5a341c" }, // light
    warning: { bg: "#e8d6c8", border: "#c2a391", color: "#4a2c17" }, // medium-light
    success: { bg: "#d6b8a6", border: "#a67c63", color: "#3b2312" }, // medium
    danger: { bg: "#c2a391", border: "#8b5e3c", color: "#2e1a0f" }, // darker
  }[type];

  return (
    <div
      style={{
        padding: "12px 16px",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: "1rem", flexShrink: 0, lineHeight: 1.4 }}>
          {icon}
        </span>
        <div>
          <p
            style={{
              margin: "0 0 3px",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: colors.color,
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: colors.color,
              opacity: 0.85,
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("30d");
  const [lastSync, setLastSync] = useState(new Date());

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  // ── Firestore real-time listeners ──────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    const check = () => {
      if (++loaded >= 4) {
        setLoading(false);
        setLastSync(new Date());
      }
    };

    const unP = onSnapshot(collection(db, "products"), (s) => {
      setProducts(
        s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })),
      );
      check();
    });
    const unO = onSnapshot(collection(db, "orders"), (s) => {
      setOrders(
        s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })),
      );
      check();
    });
    const unC = onSnapshot(collection(db, "users"), (s) => {
      setCustomers(
        s.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Customer, "id">),
        })),
      );
      check();
    });
    const unM = onSnapshot(collection(db, "messages"), (s) => {
      setTotalMessages(s.docs.length);
      setUnreadMessages(
        s.docs.filter((d) => d.data().status === "unread").length,
      );
      check();
    });

    return () => {
      unP();
      unO();
      unC();
      unM();
    };
  }, []);

  // ── Range filter ───────────────────────────────────────────────────────────
  const rangeDays =
    range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 99999;
  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) => range === "all" || isWithinDays(getOrderDate(o), rangeDays),
      ),
    [orders, range, rangeDays],
  );

  // ── Core analytics ─────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const delivered = filteredOrders.filter((o) => o.status === "delivered");
    const cancelled = filteredOrders.filter((o) => o.status === "cancelled");
    const pending = filteredOrders.filter((o) => o.status === "pending");
    const processing = filteredOrders.filter((o) => o.status === "processing");
    const shipped = filteredOrders.filter((o) => o.status === "shipped");
    const revenue = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
    const avgOrder = delivered.length ? revenue / delivered.length : 0;
    const totalItems = delivered.reduce(
      (s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0),
      0,
    );

    const chartDays = range === "7d" ? 7 : range === "30d" ? 30 : 14;
    const now = new Date();
    const dailyRevenue = Array.from({ length: chartDays }, (_, i) => {
      const day = new Date(now);
      day.setDate(day.getDate() - (chartDays - 1 - i));
      const dayStr = day.toDateString();
      return delivered
        .filter((o) => getOrderDate(o)?.toDateString() === dayStr)
        .reduce((s, o) => s + (o.total ?? 0), 0);
    });
    const chartLabels = Array.from({ length: chartDays }, (_, i) => {
      const day = new Date(now);
      day.setDate(day.getDate() - (chartDays - 1 - i));
      return chartDays <= 7
        ? DAYS_SHORT[day.getDay()]
        : i % 5 === 0
          ? MONTHS_SHORT[day.getMonth()]
          : "";
    });

    const productSales: Record<
      string,
      { name: string; qty: number; rev: number; category: string }
    > = {};
    delivered.forEach((o) => {
      o.items.forEach((item) => {
        if (!productSales[item.productId]) {
          const p = products.find((p) => p.id === item.productId);
          productSales[item.productId] = {
            name: item.name,
            qty: 0,
            rev: 0,
            category: p?.category ?? "—",
          };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].rev += item.price * item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    const sizeSales: Record<number, number> = {};
    delivered.forEach((o) =>
      o.items.forEach((item) => {
        sizeSales[item.size] = (sizeSales[item.size] ?? 0) + item.quantity;
      }),
    );
    const topSizes = Object.entries(sizeSales)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 6)
      .map(([size, qty]) => ({ size: Number(size), qty }));

    const statusCounts = {
      delivered: delivered.length,
      processing: processing.length,
      shipped: shipped.length,
      pending: pending.length,
      cancelled: cancelled.length,
    };
    const cancelLostRev = cancelled.reduce((s, o) => s + (o.total ?? 0), 0);

    return {
      revenue,
      avgOrder,
      totalItems,
      dailyRevenue,
      chartLabels,
      topProducts,
      topSizes,
      statusCounts,
      cancelLostRev,
      deliveryRate: pct(delivered.length, filteredOrders.length),
      cancelRate: pct(cancelled.length, filteredOrders.length),
    };
  }, [filteredOrders, products, range]);

  // ── Customer analytics ─────────────────────────────────────────────────────
  const custAnalytics = useMemo(() => {
    const users = customers.filter((c) => c.role === "user");
    const active = users.filter((c) => (c.totalOrders ?? 0) > 0);
    const spendMap: Record<
      string,
      { id: string; name: string; totalSpent: number; totalOrders: number }
    > = {};
    orders
      .filter((o) => o.status === "delivered")
      .forEach((o) => {
        if (!spendMap[o.userId]) {
          const user = customers.find((c) => c.id === o.userId);
          spendMap[o.userId] = {
            id: o.userId,
            name: user?.name ?? "Unknown",
            totalSpent: 0,
            totalOrders: 0,
          };
        }
        spendMap[o.userId].totalSpent += o.total ?? 0;
        spendMap[o.userId].totalOrders += 1;
      });
    const topSpenders = Object.values(spendMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 3);
    const shoeSizeDist: Record<string, number> = {};
    users.forEach((c) => {
      if (c.shoeSize)
        shoeSizeDist[c.shoeSize] = (shoeSizeDist[c.shoeSize] ?? 0) + 1;
    });
    const topShoeSize = Object.entries(shoeSizeDist).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    return { users, active, topSpenders, topShoeSize };
  }, [customers, orders]);

  // ── Stock insights ─────────────────────────────────────────────────────────
  const stockInsights = useMemo(() => {
    const outOfStock = products.filter((p) => p.stock === 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
    const healthy = products.filter((p) => p.stock > 5);
    const soldIds = new Set(analytics.topProducts.map((p) => p.id));
    const slowMoving = products
      .filter((p) => p.stock > 0 && !soldIds.has(p.id))
      .slice(0, 3);
    const restockNeeded = analytics.topProducts
      .map((tp) => ({
        ...tp,
        stock: products.find((p) => p.id === tp.id)?.stock ?? 99,
      }))
      .filter((tp) => tp.stock <= 10)
      .slice(0, 4);
    return { outOfStock, lowStock, healthy, slowMoving, restockNeeded };
  }, [products, analytics.topProducts]);

  // ── Smart insights ─────────────────────────────────────────────────────────
  const smartInsights = useMemo(() => {
    const insights: Array<{
      icon: string;
      title: string;
      body: string;
      type: "info" | "warning" | "success" | "danger";
    }> = [];
    if (stockInsights.outOfStock.length > 0) {
      insights.push({
        icon: "📦",
        type: "danger",
        title: `${stockInsights.outOfStock.length} product${stockInsights.outOfStock.length > 1 ? "s" : ""} out of stock`,
        body: `${stockInsights.outOfStock
          .slice(0, 2)
          .map((p) => p.name)
          .join(
            ", ",
          )}${stockInsights.outOfStock.length > 2 ? ` and ${stockInsights.outOfStock.length - 2} more` : ""} need immediate restocking.`,
      });
    }
    if (stockInsights.restockNeeded.length > 0) {
      const best = stockInsights.restockNeeded[0];
      insights.push({
        icon: "🔁",
        type: "warning",
        title: `Restock "${best.name}"`,
        body: `Your #1 seller has only ${best.stock} units left. Order more before you run out.`,
      });
    }
    if (analytics.cancelRate > 15) {
      insights.push({
        icon: "⚠️",
        type: "warning",
        title: `High cancellation rate (${analytics.cancelRate}%)`,
        body: `₱${Math.round(analytics.cancelLostRev / 1000)}k lost this period. Review order processing times.`,
      });
    }
    if (stockInsights.slowMoving.length > 0) {
      insights.push({
        icon: "🐢",
        type: "info",
        title: "Slow-moving inventory detected",
        body: `${stockInsights.slowMoving
          .slice(0, 2)
          .map((p) => p.name)
          .join(", ")} have stock but no recent sales. Consider a promo.`,
      });
    }
    if (analytics.deliveryRate >= 85) {
      insights.push({
        icon: "🏆",
        type: "success",
        title: `Strong delivery rate: ${analytics.deliveryRate}%`,
        body: "Your fulfillment performance is excellent. Keep the momentum going.",
      });
    }
    const inactiveCount =
      custAnalytics.users.length - custAnalytics.active.length;
    if (inactiveCount > 2) {
      insights.push({
        icon: "👥",
        type: "info",
        title: `${inactiveCount} customers haven't ordered yet`,
        body: "Consider a welcome discount to convert registered but inactive customers.",
      });
    }
    if (analytics.topSizes.length > 0) {
      const topSize = analytics.topSizes[0];
      insights.push({
        icon: "👟",
        type: "info",
        title: `EU ${topSize.size} is your most popular size`,
        body: `${topSize.qty} pairs sold. Prioritize this size when restocking inventory.`,
      });
    }
    if (unreadMessages > 0) {
      insights.push({
        icon: "✉️",
        type: "info",
        title: `${unreadMessages} unread customer message${unreadMessages > 1 ? "s" : ""}`,
        body: "Customers are waiting for a reply. Head to the Messages page to respond.",
      });
    }
    return insights.slice(0, 5);
  }, [stockInsights, analytics, custAnalytics, unreadMessages]);

  // ── Status donut slices ────────────────────────────────────────────────────
  const statusSlices = [
    {
      label: "Delivered",
      value: analytics.statusCounts.delivered,
      color: "#22c55e",
    },
    {
      label: "Processing",
      value: analytics.statusCounts.processing,
      color: "#3b82f6",
    },
    {
      label: "Shipped",
      value: analytics.statusCounts.shipped,
      color: "#8b5cf6",
    },
    {
      label: "Pending",
      value: analytics.statusCounts.pending,
      color: "#f59e0b",
    },
    {
      label: "Cancelled",
      value: analytics.statusCounts.cancelled,
      color: "#f43f5e",
    },
  ].filter((s) => s.value > 0);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f3efe9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <RefreshCw
            size={26}
            color="#b8943a"
            style={{ animation: "spin 1s linear infinite", marginBottom: 14 }}
          />
          <p style={{ color: "#9a8070", fontSize: "0.88rem", margin: 0 }}>
            Loading dashboard…
          </p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3efe9",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #ede6df",
          padding: "20px 32px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 1px 6px rgba(60,36,20,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                color: "#1a0e06",
                margin: "0 0 2px",
                lineHeight: 1,
                fontFamily: "Georgia, serif",
              }}
            >
              Dashboard Overview
            </h1>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a8070" }}>
              Live · Synced at{" "}
              {lastSync.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div
            style={{
              display: "inline-flex",
              background: "#f0ebe4",
              borderRadius: 10,
              padding: "3px",
            }}
          >
            {(["7d", "30d", "90d", "all"] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "Georgia, serif",
                  background: range === r ? "#3a2010" : "transparent",
                  color: range === r ? "#f5e6d3" : "#7a6050",
                  transition: "all 0.15s",
                }}
              >
                {r === "all"
                  ? "All time"
                  : r === "7d"
                    ? "7 days"
                    : r === "30d"
                      ? "30 days"
                      : "90 days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 32px 60px" }}>
        {/* ── ROW 1: KPI CARDS ────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <KpiCard
            label="Total Revenue"
            value={fmtK(analytics.revenue)}
            sub={`${filteredOrders.filter((o) => o.status === "delivered").length} delivered orders`}
            icon={<TrendingUp size={15} color="#8b5e3c" />}
            spark={analytics.dailyRevenue}
            accent="#8b5e3c"
          />
          <KpiCard
            label="Total Orders"
            value={String(filteredOrders.length)}
            sub={`${analytics.deliveryRate}% delivery rate`}
            icon={<ShoppingCart size={15} color="#a67c63" />}
            spark={analytics.dailyRevenue.map(
              (v, i) =>
                filteredOrders.filter((o) => {
                  const d = getOrderDate(o);
                  if (!d) return false;
                  const day = new Date();
                  day.setDate(
                    day.getDate() - (analytics.dailyRevenue.length - 1 - i),
                  );
                  return d.toDateString() === day.toDateString();
                }).length,
            )}
            accent="#a67c63"
          />
          <KpiCard
            label="Customers"
            value={String(custAnalytics.users.length)}
            sub={`${custAnalytics.active.length} active`}
            icon={<Users size={15} color="#5a341c" />}
            accent="#5a341c"
          />
          <KpiCard
            label="Products"
            value={String(products.length)}
            sub={`${stockInsights.outOfStock.length} out · ${stockInsights.lowStock.length} low`}
            icon={
              <Package
                size={15}
                color={
                  stockInsights.outOfStock.length > 0 ? "#6b3e26" : "#c2a391"
                }
              />
            }
            accent={stockInsights.outOfStock.length > 0 ? "#6b3e26" : "#c2a391"}
          />
          {/* ── MESSAGES KPI CARD ── */}
          <KpiCard
            label="Messages"
            value={String(unreadMessages)}
            sub={`${totalMessages} total received`}
            icon={<Mail size={15} color="#4a2c17" />}
            accent="#4a2c17"
          />
        </div>

        {/* ── ROW 2: REVENUE CHART + ORDER STATUS ─────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 2fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "#1a0e06",
                  }}
                >
                  Revenue Trend
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.72rem",
                    color: "#9a8070",
                  }}
                >
                  {range === "all" ? "All-time" : `Last ${range}`} · Delivered
                  orders only
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#1a0e06",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {fmtK(analytics.revenue)}
                </p>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#9a8070" }}>
                  confirmed revenue
                </p>
              </div>
            </div>
            <RevenueBarChart
              data={analytics.dailyRevenue}
              labels={analytics.chartLabels}
            />
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#1a0e06",
              }}
            >
              Order Status
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <DonutChart slices={statusSlices} size={110} />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                {statusSlices.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: s.color,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "0.78rem", color: "#5a4a3a" }}>
                        {s.label}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "#1a0e06",
                        }}
                      >
                        {s.value}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#9a8070" }}>
                        ({pct(s.value, filteredOrders.length)}%)
                      </span>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <p
                    style={{ fontSize: "0.78rem", color: "#9a8070", margin: 0 }}
                  >
                    No orders in this period.
                  </p>
                )}
              </div>
            </div>
            {analytics.cancelRate > 0 && (
              <div
                style={{
                  marginTop: 14,
                  padding: "8px 12px",
                  background: "#fff1f2",
                  borderRadius: 8,
                  fontSize: "0.72rem",
                  color: "#9f1239",
                  fontWeight: 600,
                }}
              >
                ⚠ {analytics.cancelRate}% cancel rate · ₱
                {Math.round(analytics.cancelLostRev / 1000)}k lost
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 3: TOP PRODUCTS + TOP CUSTOMERS + SIZES ─────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Star size={14} color="#b8943a" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a0e06",
                }}
              >
                Top Products
              </h3>
            </div>
            {analytics.topProducts.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "#9a8070", margin: 0 }}>
                No sales data yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {analytics.topProducts.map((p, i) => {
                  const MEDALS = ["🥇", "🥈", "🥉"];
                  const maxQty = analytics.topProducts[0].qty;
                  return (
                    <div key={p.id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: i === 0 ? "#fdf3e6" : "transparent",
                        }}
                      >
                        <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>
                          {MEDALS[i] ?? `${i + 1}.`}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.83rem",
                              fontWeight: 600,
                              color: "#1a0e06",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.7rem",
                              color: "#9a8070",
                            }}
                          >
                            {p.category}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.83rem",
                              fontWeight: 700,
                              color: "#1a0e06",
                            }}
                          >
                            {p.qty} sold
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.68rem",
                              color: "#9a8070",
                            }}
                          >
                            {fmtK(p.rev)}
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: "#f0ebe4",
                          borderRadius: 2,
                          margin: "0 12px 4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(p.qty / maxQty) * 100}%`,
                            background: i === 0 ? "#b8943a" : "#d4b896",
                            borderRadius: 2,
                            transition: "width 0.5s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Users size={14} color="#b8943a" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a0e06",
                }}
              >
                Top Customers
              </h3>
            </div>
            {custAnalytics.topSpenders.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "#9a8070", margin: 0 }}>
                No customer data.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {custAnalytics.topSpenders.map((c) => (
                  <div
                    key={c.id}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#f0ebe4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#5a3a20",
                        flexShrink: 0,
                      }}
                    >
                      {c.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#1a0e06",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.68rem",
                          color: "#9a8070",
                        }}
                      >
                        {c.totalOrders} orders
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#1a0e06",
                        flexShrink: 0,
                      }}
                    >
                      {fmtK(c.totalSpent)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <BarChart2 size={14} color="#b8943a" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a0e06",
                }}
              >
                Popular Sizes
              </h3>
            </div>
            {analytics.topSizes.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "#9a8070", margin: 0 }}>
                No size data yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {analytics.topSizes.map((sz, i) => {
                  const maxQty = analytics.topSizes[0]?.qty ?? 1;
                  const intensity = sz.qty / maxQty;
                  return (
                    <div
                      key={sz.size}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                        background: `rgba(184,148,58,${0.08 + intensity * 0.4})`,
                        border:
                          i === 0
                            ? "1.5px solid #b8943a"
                            : "1.5px solid transparent",
                        borderRadius: 8,
                        padding: "9px 10px",
                        minWidth: 52,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: "#1a0e06",
                        }}
                      >
                        EU {sz.size}
                      </span>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          color: "#7a6050",
                          fontWeight: 600,
                        }}
                      >
                        {sz.qty} sold
                      </span>
                      {i === 0 && (
                        <span
                          style={{
                            fontSize: "0.58rem",
                            background: "#b8943a",
                            color: "#fff",
                            borderRadius: 4,
                            padding: "1px 4px",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                          }}
                        >
                          TOP
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 4: STOCK ALERTS + SMART INSIGHTS ────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={14} color="#f59e0b" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a0e06",
                }}
              >
                Inventory Alerts
              </h3>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                {
                  label: "In Stock",
                  count: stockInsights.healthy.length,
                  bg: "#f0fdf4",
                  color: "#065f46",
                },
                {
                  label: "Low Stock",
                  count: stockInsights.lowStock.length,
                  bg: "#fef9ec",
                  color: "#92400e",
                },
                {
                  label: "Out of Stock",
                  count: stockInsights.outOfStock.length,
                  bg: "#fff1f2",
                  color: "#9f1239",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 4px",
                    background: item.bg,
                    borderRadius: 8,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: item.color,
                    }}
                  >
                    {item.count}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.62rem",
                      color: item.color,
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            {[...stockInsights.outOfStock, ...stockInsights.lowStock].length ===
            0 ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  color: "#065f46",
                  fontWeight: 600,
                }}
              >
                ✓ All stock levels are healthy.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...stockInsights.outOfStock, ...stockInsights.lowStock]
                  .slice(0, 6)
                  .map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: p.stock === 0 ? "#fff1f2" : "#fef9ec",
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: "#1a0e06",
                          }}
                        >
                          {p.name}
                        </span>
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: "0.7rem",
                            color: "#9a8070",
                          }}
                        >
                          {p.category}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: p.stock === 0 ? "#9f1239" : "#92400e",
                        }}
                      >
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Zap size={14} color="#b8943a" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a0e06",
                }}
              >
                Smart Insights
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {smartInsights.length === 0 ? (
                <InsightCard
                  icon="✓"
                  type="success"
                  title="Everything looks good"
                  body="No urgent insights at this time. Keep up the great work!"
                />
              ) : (
                smartInsights.map((ins, i) => <InsightCard key={i} {...ins} />)
              )}
            </div>
          </div>
        </div>

        {/* ── ROW 5: MESSAGES SUMMARY ──────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "24px",
            boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={14} color="#6d28d9" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a0e06",
                }}
              >
                Messages Overview
              </h3>
            </div>
            <button
              onClick={() => router.push("/admin/messages")}
              style={{
                background: "#5a341c",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "7px 16px",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Georgia, serif",
                letterSpacing: "0.5px",
              }}
            >
              View All Messages →
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {[
              {
                label: "Total Messages",
                value: totalMessages,
                bg: "#f3e9e2",
                color: "#5a341c",
              },
              {
                label: "Unread",
                value: unreadMessages,
                bg: "#e0cfc4",
                color: "#4a2c17",
              },
              {
                label: "Read / Replied",
                value: totalMessages - unreadMessages,
                bg: "#c2a391",
                color: "#2e1a0f",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: item.bg,
                  borderRadius: 10,
                  padding: "16px 20px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color: item.color,
                    fontFamily: "Georgia, serif",
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: item.color,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          {unreadMessages > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 16px",
                background: "#f3e9e2",
                border: "1px solid #c2a391",
                borderRadius: 8,
                fontSize: "0.78rem",
                color: "#5a341c",
                fontWeight: 600,
              }}
            >
              ✉ You have {unreadMessages} unread message
              {unreadMessages > 1 ? "s" : ""} waiting for a reply. Click View
              All Messages to respond.
            </div>
          )}
        </div>

        {/* ── ROW 6: RECENT ORDERS TABLE ───────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "24px",
            boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={14} color="#b8943a" />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a0e06",
                }}
              >
                Recent Orders
              </h3>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#9a8070" }}>
              {filteredOrders.length} total
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Order",
                  "Customer",
                  "Items",
                  "Total",
                  "Method",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: "0.62rem",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#9a8070",
                      fontWeight: 700,
                      padding: "8px 12px",
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
              {filteredOrders.slice(0, 8).map((o) => {
                const cfg = STATUS_CFG[o.status] ?? STATUS_CFG["pending"];
                const fullName = o.shipping
                  ? `${o.shipping.firstName ?? ""} ${o.shipping.lastName ?? ""}`.trim()
                  : (customers.find((c) => c.id === o.userId)?.name ?? "—");
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f7f3ef" }}>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: "0.78rem",
                        color: "#7a6050",
                        fontFamily: "monospace",
                      }}
                    >
                      {o.id.slice(0, 8)}…
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: "0.82rem",
                        color: "#1a0e06",
                        fontWeight: 500,
                      }}
                    >
                      {fullName || "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: "0.82rem",
                        color: "#5a4a3a",
                      }}
                    >
                      {o.items?.length ?? 0}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#1a0e06",
                      }}
                    >
                      {fmt(o.total)}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: "0.78rem",
                        color: "#7a6050",
                      }}
                    >
                      {o.paymentMethod ?? "COD"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          background: cfg.bg,
                          color: cfg.color,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: cfg.dot,
                          }}
                        />
                        {cfg.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: "0.75rem",
                        color: "#9a8070",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.createdAt
                        ? new Date(
                            o.createdAt.seconds * 1000,
                          ).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: "#9a8070",
                      fontSize: "0.85rem",
                    }}
                  >
                    No orders in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredOrders.length > 8 && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#9a8070" }}>
                Showing 8 of {filteredOrders.length} orders
              </span>
            </div>
          )}
        </div>

        {/* ── ROW 7: PERFORMANCE SCORECARD ───────────────────────────────── */}
        <div
          style={{
            marginTop: 20,
            background: "#2a1608",
            borderRadius: 16,
            padding: "28px",
            boxShadow: "0 2px 12px rgba(30,12,4,0.18)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#f5e6d3",
              fontFamily: "Georgia, serif",
            }}
          >
            Performance Scorecard
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {[
              {
                label: "Delivery rate",
                value: `${analytics.deliveryRate}%`,
                good: analytics.deliveryRate >= 80,
                desc: "of orders fulfilled",
              },
              {
                label: "Cancel rate",
                value: `${analytics.cancelRate}%`,
                good: analytics.cancelRate <= 10,
                desc: "of orders cancelled",
              },
              {
                label: "Customer activity",
                value: `${pct(custAnalytics.active.length, custAnalytics.users.length)}%`,
                good:
                  pct(
                    custAnalytics.active.length,
                    custAnalytics.users.length,
                  ) >= 50,
                desc: "customers ordered",
              },
              {
                label: "Stock health",
                value: `${pct(stockInsights.healthy.length, products.length)}%`,
                good: pct(stockInsights.healthy.length, products.length) >= 70,
                desc: "products well stocked",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "0.62rem",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#c8a870",
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color: item.good ? "#4ade80" : "#fb7185",
                    fontFamily: "Georgia, serif",
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.7rem",
                    color: "#9a7a50",
                  }}
                >
                  {item.good ? "✓" : "⚠"} {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
