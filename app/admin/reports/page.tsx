"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  TrendingUp, Users, Package, ShoppingBag,
  AlertTriangle, XCircle, BarChart2, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight, Minus, Filter, RefreshCw,
  Star, Zap, Target, Activity
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
type Period = "7d" | "30d" | "90d" | "all";
type CategoryFilter = "All" | "Men" | "Women";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  image: string | null;
  sizes?: number[];
  description?: string;
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

interface Order {
  id: string;
  userId: string;
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
  phone?: string;
  shoeSize?: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
  role: "user" | "admin";
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => "₱" + new Intl.NumberFormat("en-PH").format(Math.round(n));
const fmtK = (n: number) => n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : fmt(n);
const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);

const getOrderDate = (o: Order): Date | null => {
  if (!o.createdAt) return null;
  return new Date(o.createdAt.seconds * 1000);
};

const isWithinDays = (date: Date | null, days: number): boolean => {
  if (!date) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
};

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  pending:    { bg: "#fef9ec", color: "#92400e", dot: "#f59e0b", label: "Pending" },
  processing: { bg: "#eff6ff", color: "#1e40af", dot: "#3b82f6", label: "Processing" },
  shipped:    { bg: "#f5f3ff", color: "#5b21b6", dot: "#8b5cf6", label: "Shipped" },
  delivered:  { bg: "#f0fdf4", color: "#065f46", dot: "#22c55e", label: "Delivered" },
  cancelled:  { bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e", label: "Cancelled" },
};

// ── Mini SVG Components ────────────────────────────────────────────────────────

function Sparkline({ values, color = "#b8943a", height = 40 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 120;
  const h = height;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h, display: "block" }}>
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`M0,${h} L${values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`).join(" L")} L${w},${h} Z`}
        fill={`url(#spark-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last dot */}
      <circle cx={(values.length - 1) / (values.length - 1) * w}
        cy={h - ((values[values.length - 1] - min) / range) * (h - 6) - 3}
        r="3" fill={color} />
    </svg>
  );
}

function DonutChart({ slices, size = 120 }: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = r * 0.62;
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: "#f0ebe4" }} />;

  const angles = slices.map((sl) => (sl.value / total) * 2 * Math.PI);

const cumulative = angles.reduce<number[]>((acc, angle, i) => {
  if (i === 0) return [-Math.PI / 2];
  return [...acc, acc[i - 1] + angles[i - 1]];
}, []);

const paths = slices.map((sl, i) => {
  const start = cumulative[i];
  const end = start + angles[i];

  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);

  const ix1 = cx + inner * Math.cos(start);
  const iy1 = cy + inner * Math.sin(start);
  const ix2 = cx + inner * Math.cos(end);
  const iy2 = cy + inner * Math.sin(end);

  const large = angles[i] > Math.PI ? 1 : 0;

  const d = `M ${x1} ${y1}
             A ${r} ${r} 0 ${large} 1 ${x2} ${y2}
             L ${ix2} ${iy2}
             A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`;

  return { ...sl, d };
});

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {paths.map((p) => (
        <path key={p.label} d={p.d} fill={p.color} stroke="#fff" strokeWidth="2" />
      ))}
      <circle cx={cx} cy={cy} r={inner * 0.85} fill="#fff" />
    </svg>
  );
}

function HBarChart({ items, max, color = "#b8943a" }: {
  items: { label: string; value: number; sub?: string }[];
  max: number;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.8rem" }}>
            <span style={{ color: "#3a2010", fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: "#9a8070", fontWeight: 500 }}>{item.sub ?? item.value}</span>
          </div>
          <div style={{ height: 7, background: "#f0ebe4", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              width: `${max === 0 ? 0 : Math.min(100, (item.value / max) * 100)}%`,
              background: color,
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)"
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.72rem", color: "#9a8070", fontWeight: 600 }}>
      <Minus size={10} /> Flat
    </span>
  );
  const up = value > 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.72rem", fontWeight: 700, color: up ? "#065f46" : "#9f1239" }}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(value)}%
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, trend, icon, spark, accent = "#b8943a", wide = false
}: {
  label: string; value: string; sub?: string; trend?: number;
  icon?: React.ReactNode; spark?: number[]; accent?: string; wide?: boolean;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      padding: "20px 22px",
      boxShadow: "0 1px 8px rgba(60,36,20,0.06)",
      display: "flex", flexDirection: "column", gap: 10,
      gridColumn: wide ? "span 2" : undefined,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 16px 0 100%", background: `${accent}08` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", margin: 0, fontWeight: 700 }}>{label}</p>
        {icon && (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a0e06", margin: "0 0 3px", lineHeight: 1, fontFamily: "Georgia, serif" }}>{value}</p>
        {(sub || trend !== undefined) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sub && <span style={{ fontSize: "0.75rem", color: "#9a8070" }}>{sub}</span>}
            {trend !== undefined && <TrendBadge value={trend} />}
          </div>
        )}
      </div>
      {spark && spark.length > 1 && (
        <div style={{ marginTop: 4 }}>
          <Sparkline values={spark} color={accent} height={36} />
        </div>
      )}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      {icon && (
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f0ebe2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      )}
      <div>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1a0e06" }}>{title}</h2>
        {subtitle && <p style={{ margin: 0, fontSize: "0.75rem", color: "#9a8070", marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Alert Banner ──────────────────────────────────────────────────────────────
function AlertBanner({ items }: { items: { label: string; detail: string; severity: "high" | "medium" | "low" }[] }) {
  if (items.length === 0) return (
    <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, fontSize: "0.82rem", color: "#065f46", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
      ✓ All stock levels are healthy.
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => {
        const cfg = item.severity === "high"
          ? { bg: "#fff1f2", border: "#fecdd3", color: "#9f1239", icon: "🔴" }
          : item.severity === "medium"
          ? { bg: "#fef9ec", border: "#fde68a", color: "#92400e", icon: "🟡" }
          : { bg: "#f0fdf4", border: "#bbf7d0", color: "#065f46", icon: "🟢" };
        return (
          <div key={item.label} style={{ padding: "10px 14px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: cfg.color, fontWeight: 600 }}>{cfg.icon} {item.label}</span>
            <span style={{ fontSize: "0.75rem", color: cfg.color, opacity: 0.8 }}>{item.detail}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Real-time Firestore listeners ──────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    const check = () => { if (++loaded >= 3) setLoading(false); };

    const unP = onSnapshot(collection(db, "products"), (s) => {
      setProducts(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })));
      setLastRefresh(new Date());
      check();
    });
    const unO = onSnapshot(collection(db, "orders"), (s) => {
      setOrders(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
      check();
    });
    const unC = onSnapshot(collection(db, "users"), (s) => {
      setCustomers(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Customer, "id">) })));
      check();
    });

    return () => { unP(); unO(); unC(); };
  }, []);

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 99999;

  const filteredOrders = useMemo(() => orders.filter((o) => {
    const date = getOrderDate(o);
    const withinPeriod = period === "all" || isWithinDays(date, periodDays);
    const withinCat = categoryFilter === "All" || o.items.some((i) => {
      const p = products.find((p) => p.id === i.productId);
      return p?.category?.toLowerCase() === categoryFilter.toLowerCase();
    });
    return withinPeriod && withinCat;
  }), [orders, period, categoryFilter, products, periodDays]);

  const filteredProducts = useMemo(() => products.filter((p) =>
    categoryFilter === "All" || p.category?.toLowerCase() === categoryFilter.toLowerCase()
  ), [products, categoryFilter]);

  // ── Order analytics ────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const delivered = filteredOrders.filter((o) => o.status === "delivered");
    const cancelled = filteredOrders.filter((o) => o.status === "cancelled");
    const pending = filteredOrders.filter((o) => o.status === "pending");
    const processing = filteredOrders.filter((o) => o.status === "processing");
    const shipped = filteredOrders.filter((o) => o.status === "shipped");

    const revenue = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
    const shipping = delivered.reduce((s, o) => s + (o.shippingFee ?? 0), 0);
    const subtotal = delivered.reduce((s, o) => s + (o.subtotal ?? 0), 0);
    const avgOrder = delivered.length ? revenue / delivered.length : 0;
    const totalItems = delivered.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);

    // Daily revenue last N days for sparkline
    const now = new Date();
    const sparkDays = period === "7d" ? 7 : period === "30d" ? 30 : 14;
    const dailyRevenue: number[] = Array.from({ length: sparkDays }, (_, i) => {
      const day = new Date(now);
      day.setDate(day.getDate() - (sparkDays - 1 - i));
      const dayStr = day.toDateString();
      return delivered
        .filter((o) => getOrderDate(o)?.toDateString() === dayStr)
        .reduce((s, o) => s + (o.total ?? 0), 0);
    });

    // Status breakdown
    const statusCounts: Record<string, number> = {
      delivered: delivered.length,
      processing: processing.length,
      shipped: shipped.length,
      pending: pending.length,
      cancelled: cancelled.length,
    };

    // Product popularity
    const productSales: Record<string, { name: string; qty: number; rev: number; category: string }> = {};
    delivered.forEach((o) => {
      o.items.forEach((item) => {
        if (!productSales[item.productId]) {
          const p = products.find((p) => p.id === item.productId);
          productSales[item.productId] = { name: item.name, qty: 0, rev: 0, category: p?.category ?? "—" };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].rev += item.price * item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 6)
      .map(([id, data]) => ({ id, ...data }));

    // Size popularity
    const sizeSales: Record<number, number> = {};
    delivered.forEach((o) => o.items.forEach((item) => {
      sizeSales[item.size] = (sizeSales[item.size] ?? 0) + item.quantity;
    }));
    const topSizes = Object.entries(sizeSales)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 10)
      .map(([size, qty]) => ({ size: Number(size), qty }));

    // Category revenue
    const catRevenue: Record<string, number> = {};
    delivered.forEach((o) => o.items.forEach((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      const cat = p?.category ?? "Unknown";
      catRevenue[cat] = (catRevenue[cat] ?? 0) + item.price * item.quantity;
    }));

    // Cancellation analysis
    const cancelByUser = cancelled.filter((o) => o.cancelledBy === "user").length;
    const cancelByAdmin = cancelled.filter((o) => o.cancelledBy === "admin").length;
    const cancelLostRev = cancelled.reduce((s, o) => s + (o.total ?? 0), 0);

    // Payment methods
    const paymentMethods: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const m = o.paymentMethod ?? "COD";
      paymentMethods[m] = (paymentMethods[m] ?? 0) + 1;
    });

    return {
      revenue, shipping, subtotal, avgOrder, totalItems,
      dailyRevenue, statusCounts, topProducts, topSizes,
      catRevenue, cancelByUser, cancelByAdmin, cancelLostRev,
      paymentMethods,
      deliveryRate: pct(delivered.length, filteredOrders.length),
      cancelRate: pct(cancelled.length, filteredOrders.length),
    };
  }, [filteredOrders, products, period]);

  // ── Customer analytics ──────────────────────────────────────────────────────
  const customerAnalytics = useMemo(() => {
    const users = customers.filter((c) => c.role === "user");
    const active = users.filter((c) => (c.totalOrders ?? 0) > 0);
    const inactive = users.filter((c) => (c.totalOrders ?? 0) === 0);
    const totalSpent = users.reduce((s, c) => s + (c.totalSpent ?? 0), 0);
    const avgSpent = users.length ? totalSpent / users.length : 0;

    // Shoe size distribution
    const shoeSizes: Record<string, number> = {};
    users.forEach((c) => {
      if (c.shoeSize) shoeSizes[c.shoeSize] = (shoeSizes[c.shoeSize] ?? 0) + 1;
    });

    // New customers this period
    const newThisPeriod = users.filter((c) => {
      if (!c.createdAt || period === "all") return false;
      const d = new Date(c.createdAt);
      return isWithinDays(d, periodDays);
    }).length;

    // Top spenders
    const spenderMap: Record<string, {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  totalOrders: number;
}> = {};

filteredOrders
  .filter(o => o.status === "delivered")
  .forEach((o) => {
    if (!spenderMap[o.userId]) {
      const user = customers.find(c => c.id === o.userId);

      spenderMap[o.userId] = {
        id: o.userId,
        name: user?.name ?? "Unknown",
        email: user?.email ?? "",
        totalSpent: 0,
        totalOrders: 0,
      };
    }

    spenderMap[o.userId].totalSpent += o.total ?? 0;
    spenderMap[o.userId].totalOrders += 1;
  });

const topSpenders = Object.values(spenderMap)
  .sort((a, b) => b.totalSpent - a.totalSpent)
  .slice(0, 5);

    return { users, active, inactive, totalSpent, avgSpent, shoeSizes, newThisPeriod, topSpenders };
  }, [customers, period, periodDays, filteredOrders]);

  // ── Stock alerts ────────────────────────────────────────────────────────────
  const stockAlerts = useMemo(() => {
    return filteredProducts
      .filter((p) => p.stock <= 5)
      .map((p) => ({
        label: p.name,
        detail: p.stock === 0 ? "Out of stock" : `Only ${p.stock} left`,
        severity: (p.stock === 0 ? "high" : p.stock <= 2 ? "high" : "medium") as "high" | "medium" | "low"
      }))
      .sort((a) => (a.severity === "high" ? -1 : 1));
  }, [filteredProducts]);

  // ── Predictive demand (simple) ─────────────────────────────────────────────
  const predictedDemand = useMemo(() => {
    // Based on top sizes sold, estimate next period demand
    const topSizes = analytics.topSizes.slice(0, 5);
    const totalSold = topSizes.reduce((s, sz) => s + sz.qty, 0);
    return topSizes.map((sz) => ({
      size: sz.size,
      sold: sz.qty,
      predicted: Math.ceil(sz.qty * 1.1), // +10% growth estimate
      sharePercent: totalSold ? Math.round((sz.qty / totalSold) * 100) : 0,
    }));
  }, [analytics.topSizes]);

  // ── Donut slices ───────────────────────────────────────────────────────────
  const statusSlices = [
    { label: "Delivered", value: analytics.statusCounts.delivered, color: "#22c55e" },
    { label: "Processing", value: analytics.statusCounts.processing, color: "#3b82f6" },
    { label: "Shipped", value: analytics.statusCounts.shipped, color: "#8b5cf6" },
    { label: "Pending", value: analytics.statusCounts.pending, color: "#f59e0b" },
    { label: "Cancelled", value: analytics.statusCounts.cancelled, color: "#f43f5e" },
  ].filter((s) => s.value > 0);

  const catRevenueSlices = Object.entries(analytics.catRevenue).map(([label, value], i) => ({
    label, value, color: ["#b8943a", "#3a2010", "#8a6a20", "#c8a060"][i % 4]
  }));

  const SECTIONS = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "products", label: "Products" },
    { id: "customers", label: "Customers" },
    { id: "alerts", label: "Alerts & Predictions" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "87vh", background: "#f3efe9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw size={28} color="#b8943a" style={{ animation: "spin 1s linear infinite", marginBottom: 14 }} />
          <p style={{ color: "#9a8070", fontSize: "0.9rem" }}>Loading analytics…</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "87vh", background: "#f3efe9", fontFamily: "Georgia, serif" }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ede6df", padding: "20px 32px", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 1px 6px rgba(60,36,20,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a0e06", margin: 0, lineHeight: 1 }}>Analytics & Reports</h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#9a8070" }}>
              Live · Last synced {lastRefresh.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Period */}
            <div style={{ display: "inline-flex", background: "#f0ebe4", borderRadius: 10, padding: "3px" }}>
              {(["7d", "30d", "90d", "all"] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: "0.75rem", fontWeight: 700, fontFamily: "Georgia, serif",
                  background: period === p ? "#3a2010" : "transparent",
                  color: period === p ? "#f5e6d3" : "#7a6050",
                  transition: "all 0.15s"
                }}>
                  {p === "all" ? "All Time" : p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
                </button>
              ))}
            </div>

            {/* Category */}
            <div style={{ position: "relative" }}>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                style={{ padding: "8px 32px 8px 14px", borderRadius: 10, border: "1.5px solid #e0d8d0", background: "#fff", fontSize: "0.8rem", fontWeight: 600, color: "#3a2010", fontFamily: "Georgia, serif", appearance: "none", cursor: "pointer", outline: "none" }}>
                <option>All</option>
                <option>Men</option>
                <option>Women</option>
              </select>
              <Filter size={12} color="#9a8070" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", gap: 2, marginTop: 16, borderBottom: "1px solid #f0ebe4", marginBottom: -1 }}>
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 700, fontFamily: "Georgia, serif",
              color: activeSection === s.id ? "#3a2010" : "#9a8070",
              borderBottom: activeSection === s.id ? "2.5px solid #b8943a" : "2.5px solid transparent",
              transition: "all 0.15s", marginBottom: -1
            }}>
              {s.label}
              {s.id === "alerts" && stockAlerts.length > 0 && (
                <span style={{ marginLeft: 6, background: "#f43f5e", color: "#fff", borderRadius: 10, fontSize: "0.6rem", padding: "1px 5px", fontWeight: 800 }}>
                  {stockAlerts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px 60px" }}>

        {/* ══════════════════════ OVERVIEW ══════════════════════ */}
        {activeSection === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Top KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <KpiCard
                label="Total Revenue"
                value={fmtK(analytics.revenue)}
                sub={`${filteredOrders.filter(o => o.status === "delivered").length} delivered orders`}
                icon={<TrendingUp size={16} color="#b8943a" />}
                spark={analytics.dailyRevenue}
                accent="#b8943a"
              />
              <KpiCard
                label="Total Orders"
                value={String(filteredOrders.length)}
                sub={`${analytics.deliveryRate}% delivery rate`}
                icon={<ShoppingBag size={16} color="#3b82f6" />}
                accent="#3b82f6"
              />
              <KpiCard
                label="Avg Order Value"
                value={fmtK(analytics.avgOrder)}
                sub={`${analytics.totalItems} items sold`}
                icon={<Target size={16} color="#8b5cf6" />}
                accent="#8b5cf6"
              />
              <KpiCard
                label="Active Customers"
                value={String(customerAnalytics.active.length)}
                sub={`of ${customerAnalytics.users.length} registered`}
                icon={<Users size={16} color="#22c55e" />}
                accent="#22c55e"
              />
            </div>

            {/* Secondary KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <KpiCard label="Total Products" value={String(filteredProducts.length)} sub={`${filteredProducts.filter(p => p.stock === 0).length} out of stock`} icon={<Package size={16} color="#f59e0b" />} accent="#f59e0b" />
              <KpiCard label="Cancelled Orders" value={String(analytics.statusCounts.cancelled ?? 0)} sub={`₱${Math.round(analytics.cancelLostRev / 1000)}k lost revenue`} icon={<XCircle size={16} color="#f43f5e" />} accent="#f43f5e" />
              <KpiCard label="Shipping Revenue" value={fmtK(analytics.shipping)} sub="From delivery fees" icon={<Activity size={16} color="#06b6d4" />} accent="#06b6d4" />
              <KpiCard label="New Customers" value={String(customerAnalytics.newThisPeriod)} sub={`in selected period`} icon={<Zap size={16} color="#a07840" />} accent="#a07840" />
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Order status donut */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
                <SectionHeader title="Order Status Breakdown" icon={<PieIcon size={14} color="#b8943a" />} />
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <DonutChart slices={statusSlices} size={130} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    {statusSlices.map((s) => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                          <span style={{ fontSize: "0.8rem", color: "#5a4a3a", fontWeight: 500 }}>{s.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a0e06" }}>{s.value}</span>
                          <span style={{ fontSize: "0.7rem", color: "#9a8070" }}>({pct(s.value, filteredOrders.length)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Revenue by category */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
                <SectionHeader title="Revenue by Category" icon={<BarChart2 size={14} color="#b8943a" />} />
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <DonutChart slices={catRevenueSlices} size={130} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    {catRevenueSlices.map((s) => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                          <span style={{ fontSize: "0.8rem", color: "#5a4a3a", fontWeight: 500 }}>{s.label}</span>
                        </div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a0e06" }}>{fmtK(s.value)}</span>
                      </div>
                    ))}
                    {catRevenueSlices.length === 0 && (
                      <p style={{ fontSize: "0.8rem", color: "#9a8070", margin: 0 }}>No revenue data yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue trend sparkline card */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <SectionHeader title={`Revenue Trend · ${period === "all" ? "All Time" : period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : "Last 90 days"}`} icon={<TrendingUp size={14} color="#b8943a" />} />
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#1a0e06" }}>{fmtK(analytics.revenue)}</p>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a8070" }}>total confirmed revenue</p>
                </div>
              </div>
              <div style={{ height: 80 }}>
                <Sparkline values={analytics.dailyRevenue.length > 0 ? analytics.dailyRevenue : [0, 0]} color="#b8943a" height={80} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {analytics.dailyRevenue.filter((_, i) => i % Math.ceil(analytics.dailyRevenue.length / 6) === 0).map((v, i) => (
                  <span key={i} style={{ fontSize: "0.65rem", color: "#b0a090" }}>Day {i * Math.ceil(analytics.dailyRevenue.length / 6) + 1}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════ ORDERS ══════════════════════ */}
        {activeSection === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Order KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <KpiCard label="Total Orders" value={String(filteredOrders.length)} icon={<ShoppingBag size={16} color="#b8943a" />} />
              <KpiCard label="Confirmed Revenue" value={fmtK(analytics.revenue)} sub="Delivered only" icon={<TrendingUp size={16} color="#22c55e" />} accent="#22c55e" />
              <KpiCard label="Avg Order Value" value={fmtK(analytics.avgOrder)} icon={<Target size={16} color="#3b82f6" />} accent="#3b82f6" />
              <KpiCard label="Cancellation Rate" value={`${analytics.cancelRate}%`} sub={`₱${Math.round(analytics.cancelLostRev / 1000)}k lost`} icon={<XCircle size={16} color="#f43f5e" />} accent="#f43f5e" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Status breakdown table */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
                <SectionHeader title="Orders by Status" />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {Object.entries(analytics.statusCounts).map(([status, count]) => {
                    const cfg = STATUS_CFG[status] ?? STATUS_CFG["pending"];
                    return (
                      <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: cfg.bg }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: cfg.color }}>{count}</span>
                          <span style={{ fontSize: "0.72rem", color: cfg.color, opacity: 0.7 }}>{pct(count, filteredOrders.length)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment methods */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
                <SectionHeader title="Payment Methods" />
                <HBarChart
                  items={Object.entries(analytics.paymentMethods).map(([label, value]) => ({ label, value, sub: `${value} orders (${pct(value, filteredOrders.length)}%)` }))}
                  max={Math.max(...Object.values(analytics.paymentMethods))}
                />
              </div>
            </div>

            {/* Cancellation insights */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Cancellation Insights" subtitle="Understanding why orders are cancelled helps improve service" icon={<XCircle size={14} color="#f43f5e" />} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                <div style={{ background: "#fff1f2", borderRadius: 12, padding: "16px 20px" }}>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9f1239", margin: "0 0 8px", fontWeight: 700 }}>By Customer</p>
                  <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#9f1239", margin: 0 }}>{analytics.cancelByUser}</p>
                  <p style={{ fontSize: "0.75rem", color: "#9f1239", opacity: 0.7, margin: "4px 0 0" }}>User-initiated</p>
                </div>
                <div style={{ background: "#fef9ec", borderRadius: 12, padding: "16px 20px" }}>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#92400e", margin: "0 0 8px", fontWeight: 700 }}>By Admin</p>
                  <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#92400e", margin: 0 }}>{analytics.cancelByAdmin}</p>
                  <p style={{ fontSize: "0.75rem", color: "#92400e", opacity: 0.7, margin: "4px 0 0" }}>Admin-initiated</p>
                </div>
                <div style={{ background: "#f7f3ef", borderRadius: 12, padding: "16px 20px" }}>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#5a4a3a", margin: "0 0 8px", fontWeight: 700 }}>Lost Revenue</p>
                  <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#3a2010", margin: 0 }}>{fmtK(analytics.cancelLostRev)}</p>
                  <p style={{ fontSize: "0.75rem", color: "#9a8070", margin: "4px 0 0" }}>From cancelled orders</p>
                </div>
              </div>
            </div>

            {/* Top selling products */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Top Products by Orders" icon={<Star size={14} color="#b8943a" />} />
              <HBarChart
                items={analytics.topProducts.map((p) => ({
                  label: p.name,
                  value: p.qty,
                  sub: `${p.qty} units · ${fmtK(p.rev)}`
                }))}
                max={analytics.topProducts[0]?.qty ?? 1}
              />
            </div>

            {/* Size popularity */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Sales by Shoe Size" subtitle="Which EU sizes are most purchased" icon={<BarChart2 size={14} color="#b8943a" />} />
              {analytics.topSizes.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#9a8070" }}>No size data available yet.</p>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {analytics.topSizes.map((sz, i) => {
                    const maxQty = analytics.topSizes[0]?.qty ?? 1;
                    const intensity = sz.qty / maxQty;
                    return (
                      <div key={sz.size} style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        background: `rgba(184,148,58,${0.1 + intensity * 0.5})`,
                        border: i === 0 ? "2px solid #b8943a" : "2px solid transparent",
                        borderRadius: 10, padding: "12px 16px", minWidth: 64
                      }}>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "#1a0e06" }}>EU {sz.size}</span>
                        <span style={{ fontSize: "0.7rem", color: "#7a6050", fontWeight: 600 }}>{sz.qty} sold</span>
                        {i === 0 && <span style={{ fontSize: "0.6rem", background: "#b8943a", color: "#fff", borderRadius: 6, padding: "1px 5px", fontWeight: 700 }}>TOP</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════ PRODUCTS ══════════════════════ */}
        {activeSection === "products" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <KpiCard label="Total Products" value={String(filteredProducts.length)} icon={<Package size={16} color="#b8943a" />} />
              <KpiCard label="In Stock" value={String(filteredProducts.filter(p => p.stock > 5).length)} icon={<Package size={16} color="#22c55e" />} accent="#22c55e" />
              <KpiCard label="Low Stock" value={String(filteredProducts.filter(p => p.stock > 0 && p.stock <= 5).length)} icon={<AlertTriangle size={16} color="#f59e0b" />} accent="#f59e0b" />
              <KpiCard label="Out of Stock" value={String(filteredProducts.filter(p => p.stock === 0).length)} icon={<XCircle size={16} color="#f43f5e" />} accent="#f43f5e" />
            </div>

            {/* Stock levels table */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Product Stock Levels" subtitle="Sorted by urgency" icon={<AlertTriangle size={14} color="#b8943a" />} />
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#fdf9f5" }}>
                      {["Product", "Category", "Price", "Stock", "Status", "Available Sizes"].map((h) => (
                        <th key={h} style={{ textAlign: "left", fontSize: "0.62rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", fontWeight: 700, padding: "10px 16px", borderBottom: "1px solid #f0ebe4", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredProducts]
                      .sort((a, b) => a.stock - b.stock)
                      .map((p) => {
                        const stockColor = p.stock === 0 ? "#9f1239" : p.stock <= 5 ? "#92400e" : "#065f46";
                        const stockBg = p.stock === 0 ? "#fff1f2" : p.stock <= 5 ? "#fef9ec" : "transparent";
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f7f3ef", background: stockBg }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = p.stock === 0 ? "#ffe4e6" : p.stock <= 5 ? "#fef3c7" : "#fdf9f5")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = stockBg)}
                          >
                            <td style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 600, color: "#1a0e06" }}>{p.name}</td>
                            <td style={{ padding: "12px 16px", fontSize: "0.82rem", color: "#7a6050" }}>{p.category}</td>
                            <td style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "#1a0e06" }}>{fmt(p.price)}</td>
                            <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 800, color: stockColor }}>{p.stock}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: p.stock === 0 ? "#fff1f2" : p.stock <= 5 ? "#fef9ec" : "#f0fdf4", color: stockColor }}>
                                {p.stock === 0 ? "Out of Stock" : p.stock <= 5 ? "Low Stock" : "In Stock"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "0.75rem", color: "#9a8070" }}>
                              {p.sizes && p.sizes.length > 0 ? `EU ${p.sizes.join(", ")}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top products by revenue */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Most Popular Products" subtitle="By units sold from delivered orders" icon={<Star size={14} color="#b8943a" />} />
              {analytics.topProducts.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#9a8070" }}>No sales data yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {analytics.topProducts.map((p, i) => {
                    const MEDALS = ["🥇", "🥈", "🥉"];
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: i === 0 ? "#fdf3e6" : "#fdfaf7", borderRadius: 10, border: i === 0 ? "1px solid #e8c97a" : "1px solid #f0ebe4" }}>
                        <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{MEDALS[i] ?? `#${i + 1}`}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#1a0e06" }}>{p.name}</p>
                          <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a8070" }}>{p.category}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: "#1a0e06" }}>{p.qty} units</p>
                          <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a8070" }}>{fmtK(p.rev)} revenue</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════ CUSTOMERS ══════════════════════ */}
        {activeSection === "customers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <KpiCard label="Total Customers" value={String(customerAnalytics.users.length)} icon={<Users size={16} color="#b8943a" />} />
              <KpiCard label="Active Customers" value={String(customerAnalytics.active.length)} sub={`${pct(customerAnalytics.active.length, customerAnalytics.users.length)}% of total`} icon={<Activity size={16} color="#22c55e" />} accent="#22c55e" />
              <KpiCard label="Inactive Customers" value={String(customerAnalytics.inactive.length)} sub="No orders placed" icon={<Users size={16} color="#9a8070" />} accent="#9a8070" />
              <KpiCard label="Avg Customer Spend" value={fmtK(customerAnalytics.avgSpent)} icon={<TrendingUp size={16} color="#3b82f6" />} accent="#3b82f6" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Active vs Inactive */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
                <SectionHeader title="Customer Activity" subtitle="Active = has placed at least 1 order" />
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <DonutChart slices={[
                    { label: "Active", value: customerAnalytics.active.length, color: "#22c55e" },
                    { label: "Inactive", value: customerAnalytics.inactive.length, color: "#e8ddd0" },
                  ]} size={120} />
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.82rem", color: "#22c55e", fontWeight: 700 }}>● Active</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 800 }}>{customerAnalytics.active.length} ({pct(customerAnalytics.active.length, customerAnalytics.users.length)}%)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.82rem", color: "#9a8070", fontWeight: 700 }}>● Inactive</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 800 }}>{customerAnalytics.inactive.length} ({pct(customerAnalytics.inactive.length, customerAnalytics.users.length)}%)</span>
                      </div>
                    </div>
                    <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: "0.75rem", color: "#065f46", fontWeight: 600 }}>
                      💡 {customerAnalytics.inactive.length} customers havent ordered yet — consider a promo.
                    </div>
                  </div>
                </div>
              </div>

              {/* Shoe size preferences */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
                <SectionHeader title="Customer Shoe Sizes" subtitle="Self-reported profile sizes" />
                {Object.keys(customerAnalytics.shoeSizes).length === 0 ? (
                  <p style={{ fontSize: "0.82rem", color: "#9a8070" }}>No shoe size data from profiles yet.</p>
                ) : (
                  <HBarChart
                    items={Object.entries(customerAnalytics.shoeSizes)
                      .sort((a, b) => Number(b[1]) - Number(a[1]))
                      .slice(0, 8)
                      .map(([size, count]) => ({ label: `EU ${size}`, value: count, sub: `${count} customers` }))}
                    max={Math.max(...Object.values(customerAnalytics.shoeSizes))}
                    color="#b8943a"
                  />
                )}
              </div>
            </div>

            {/* Top spenders */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Top Spenders" subtitle="Highest value customers" icon={<Star size={14} color="#b8943a" />} />
              {customerAnalytics.topSpenders.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#9a8070" }}>No customer spending data yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {customerAnalytics.topSpenders.map((c) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#fdf9f5", borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8ddd0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, color: "#5a3a20", flexShrink: 0 }}>
                        {c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#1a0e06" }}>{c.name}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9a8070" }}>{c.email} · {c.totalOrders ?? 0} orders</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 800, color: "#1a0e06" }}>{fmtK(c.totalSpent ?? 0)}</p>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#9a8070" }}>total spent</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════ ALERTS & PREDICTIONS ══════════════════════ */}
        {activeSection === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Stock Alerts */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Inventory Alerts" subtitle="Products requiring immediate attention" icon={<AlertTriangle size={14} color="#f59e0b" />} />
              <AlertBanner items={stockAlerts} />
            </div>

            {/* Demand predictions */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Predicted Demand by Size" subtitle="Based on historical sales · +10% growth estimate for next period" icon={<Zap size={14} color="#3b82f6" />} />
              {predictedDemand.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#9a8070" }}>Not enough order data to generate predictions.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 8 }}>
                    {predictedDemand.map((d) => (
                      <div key={d.size} style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#1e40af", fontWeight: 700 }}>EU {d.size}</p>
                        <p style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 800, color: "#1e40af" }}>{d.predicted}</p>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#3b82f6" }}>est. units</p>
                        <p style={{ margin: "6px 0 0", fontSize: "0.68rem", color: "#9a8070" }}>{d.sold} sold previously</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "12px 16px", background: "#eff6ff", borderRadius: 10, fontSize: "0.78rem", color: "#1e40af", fontWeight: 500 }}>
                    💡 <strong>Restock recommendation:</strong> Prioritize the top {Math.min(3, predictedDemand.length)} sizes (
                    {predictedDemand.slice(0, 3).map(d => `EU ${d.size}`).join(", ")}) — they account for {
                      predictedDemand.slice(0, 3).reduce((s, d) => s + d.sharePercent, 0)
                    }% of demand.
                  </div>
                </div>
              )}
            </div>

            {/* Revenue vs estimated cost */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.06)" }}>
              <SectionHeader title="Revenue Overview" subtitle="Breakdown of confirmed revenue from delivered orders" icon={<BarChart2 size={14} color="#b8943a" />} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[
                  { label: "Product Revenue", value: analytics.subtotal, color: "#22c55e", note: "From product sales" },
                  { label: "Shipping Revenue", value: analytics.shipping, color: "#3b82f6", note: "From delivery fees" },
                  { label: "Total Revenue", value: analytics.revenue, color: "#b8943a", note: "Combined total" },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#fdf9f5", borderRadius: 12, padding: "18px 20px", border: "1px solid #ede6df" }}>
                    <p style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", margin: "0 0 8px", fontWeight: 700 }}>{item.label}</p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 800, color: item.color, margin: "0 0 4px" }}>{fmtK(item.value)}</p>
                    <p style={{ fontSize: "0.72rem", color: "#9a8070", margin: 0 }}>{item.note}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "14px 16px", background: "#fef9ec", borderRadius: 10, fontSize: "0.78rem", color: "#92400e", fontWeight: 500 }}>
                ⚠️ <strong>Note:</strong> Product cost data is not tracked in the system. To calculate true profit margins, consider adding a <code>costPrice</code> field to your products collection.
              </div>
            </div>

            {/* Key performance summary */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 8px rgba(60,36,20,0.12)" }}>
              <SectionHeader title="Executive Summary" subtitle={`Analytics snapshot · ${period === "all" ? "All time" : `Last ${period}`}`} icon={<Activity size={14} color="#f5e6d3" />} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {[
                  { label: "Delivery Success Rate", value: `${analytics.deliveryRate}%`, good: analytics.deliveryRate >= 80 },
                  { label: "Cancellation Rate", value: `${analytics.cancelRate}%`, good: analytics.cancelRate <= 10 },
                  { label: "Customer Activation", value: `${pct(customerAnalytics.active.length, customerAnalytics.users.length)}%`, good: pct(customerAnalytics.active.length, customerAnalytics.users.length) >= 50 },
                  { label: "Stock Health", value: `${pct(filteredProducts.filter(p => p.stock > 5).length, filteredProducts.length)}%`, good: pct(filteredProducts.filter(p => p.stock > 5).length, filteredProducts.length) >= 70 },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 10 }}>
                    <span style={{ fontSize: "0.82rem", color: "#c8b8a8", fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: "0.92rem", fontWeight: 800, color: item.good ? "#4ade80" : "#fb7185" }}>{item.value} {item.good ? "✓" : "⚠"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}