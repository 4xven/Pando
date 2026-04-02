"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────
interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
}

interface LowStockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
}

// ── Mock Data ─────────────────────────────────────
const ORDERS: Order[] = [
  { id: "ORD-001", customer: "Juan Dela Cruz", items: 2, total: 9050, status: "Pending" },
  { id: "ORD-002", customer: "Maria Santos", items: 1, total: 2800, status: "Processing" },
  { id: "ORD-003", customer: "Jose Rizal", items: 3, total: 14200, status: "Shipped" },
  { id: "ORD-004", customer: "Andres Bonifacio", items: 1, total: 5200, status: "Delivered" },
  { id: "ORD-005", customer: "Emilio Aguinaldo", items: 1, total: 4250, status: "Cancelled" },
];

const REVENUE = [42000, 50000, 48000, 60000, 58000, 72000];

const STATUS_STYLE: any = {
  Pending: { bg: "#fef3c7", color: "#92400e" },
  Processing: { bg: "#dbeafe", color: "#1e40af" },
  Shipped: { bg: "#ede9fe", color: "#5b21b6" },
  Delivered: { bg: "#dcfce7", color: "#166534" },
  Cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

// ── Chart ─────────────────────────────────────────
function RevenueChart() {
  const max = Math.max(...REVENUE);
  const width = 500;
  const height = 180;

  const points = REVENUE.map((val, i) => {
    const x = (i / (REVENUE.length - 1)) * width;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%" }}>
      <polyline
        fill="none"
        stroke="#a07840"
        strokeWidth="3"
        points={points.join(" ")}
      />
    </svg>
  );
}

// ── Main ──────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [productCount, setProductCount] = useState(0);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProductCount(snap.size);

      const low: LowStockItem[] = [];
      snap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.stock <= 10) {
          low.push({
            id: doc.id,
            name: d.name,
            category: d.category,
            stock: d.stock,
          });
        }
      });

      setLowStock(low);
    });

    return () => unsub();
  }, []);

  const totalRevenue = ORDERS
    .filter((o) => o.status === "Delivered" || o.status === "Shipped")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ background: "#f4efe8", minHeight: "100vh", padding: "30px" }}>
      <h1 style={{ fontFamily: "Georgia", marginBottom: "5px" }}>
        Dashboard Overview
      </h1>
      <p style={{ color: "#777", marginBottom: "25px" }}>
        Welcome back! Here's what's happening with your store.
      </p>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "15px" }}>
        {[
          { label: "Total Products", value: productCount, icon: <Package size={18} /> },
          { label: "Total Orders", value: ORDERS.length, icon: <ShoppingCart size={18} /> },
          { label: "Total Customers", value: 3, icon: <Users size={18} /> },
          { label: "Revenue", value: `₱${totalRevenue.toLocaleString()}`, icon: <DollarSign size={18} /> },
        ].map((card) => (
          <div key={card.label} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={labelStyle}>{card.label}</p>
                <h2 style={{ marginTop: "5px" }}>{card.value}</h2>
                <small style={{ color: "green" }}>+ vs last month</small>
              </div>
              <div style={iconStyle}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHART + LOW STOCK ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "15px", marginTop: "20px" }}>
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Revenue Overview</h3>
          <RevenueChart />
        </div>

        <div style={cardStyle}>
          <h3 style={sectionTitle}>Low Stock Alerts</h3>

          {lowStock.length === 0 && <p>No low stock items</p>}

          {lowStock.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
              <div>
                <strong>{item.name}</strong>
                <p style={{ fontSize: "12px", color: "#777" }}>{item.category}</p>
              </div>
              <span style={{ color: "#a16207", fontWeight: "bold" }}>
                {item.stock} left
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ORDERS TABLE ── */}
      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h3 style={sectionTitle}>Recent Orders</h3>

        <table style={{ width: "100%", marginTop: "15px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#777" }}>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {ORDERS.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{o.id}</td>
                <td>{o.customer}</td>
                <td>{o.items}</td>
                <td>₱{o.total.toLocaleString()}</td>
                <td>
                  <span
                    style={{
                      padding: "5px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      ...STATUS_STYLE[o.status],
                    }}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "18px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#777",
};

const sectionTitle: React.CSSProperties = {
  marginBottom: "10px",
};

const iconStyle: React.CSSProperties = {
  background: "#f3f0ea",
  padding: "10px",
  borderRadius: "50%",
};