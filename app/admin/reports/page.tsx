"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Period = "Daily" | "Weekly" | "Monthly";

interface SalesData { month: string; value: number; }
interface TopProduct { rank: number; name: string; category: string; price: number; stock: number; image: string | null; }
interface CategorySlice { label: string; value: number; color: string; }

// ── Data ──────────────────────────────────────────────────────────────────────
const SALES_DATA: Record<Period, SalesData[]> = {
  Daily: [
    { month: "Mon", value: 8200  },
    { month: "Tue", value: 11400 },
    { month: "Wed", value: 9800  },
    { month: "Thu", value: 13200 },
    { month: "Fri", value: 15600 },
    { month: "Sat", value: 18900 },
    { month: "Sun", value: 12300 },
  ],
  Weekly: [
    { month: "Wk 1", value: 42000 },
    { month: "Wk 2", value: 38000 },
    { month: "Wk 3", value: 51000 },
    { month: "Wk 4", value: 59000 },
  ],
  Monthly: [
    { month: "Jan", value: 48000 },
    { month: "Feb", value: 52000 },
    { month: "Mar", value: 47000 },
    { month: "Apr", value: 61000 },
    { month: "May", value: 58000 },
    { month: "Jun", value: 74000 },
  ],
};

const CATEGORY_DATA: CategorySlice[] = [
  { label: "Formal",  value: 65, color: "#b8943a" },
  { label: "Casual",  value: 25, color: "#e8ddd0" },
  { label: "Sports",  value: 10, color: "#3a2010" },
];

const TOP_PRODUCTS: TopProduct[] = [
  { rank: 1, name: "Chelsea Boots",  category: "Formal", price: 5200, stock: 8,  image: null },
  { rank: 2, name: "Stiletto Heels", category: "Casual", price: 2800, stock: 0,  image: null },
  { rank: 3, name: "Leather Derby",  category: "Formal", price: 4800, stock: 32, image: null },
  { rank: 4, name: "Classic Oxford", category: "Formal", price: 4250, stock: 45, image: null },
];

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }: { data: SalesData[] }) {
  const max = Math.max(...data.map((d) => d.value));
  const W = 340, H = 160, BAR_W = 28, GAP = (W - data.length * BAR_W) / (data.length + 1);
  const Y_TICKS = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H + 44}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8943a" />
          <stop offset="100%" stopColor="#8a6a20" />
        </linearGradient>
      </defs>

      {/* Y-axis grid + labels */}
      {Array.from({ length: Y_TICKS + 1 }).map((_, i) => {
        const val = Math.round((max / Y_TICKS) * (Y_TICKS - i));
        const y = (H / Y_TICKS) * i;
        return (
          <g key={i}>
            <line x1={0} y1={y} x2={W} y2={y} stroke="#f0ebe4" strokeWidth="1" />
            <text x={0} y={y - 4} fontSize="9" fill="#b0a090">{val.toLocaleString()}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / max) * H;
        const x = GAP + i * (BAR_W + GAP);
        const y = H - barH;
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx="4" fill="url(#bar-grad)" opacity="0.92" />
            <text x={x + BAR_W / 2} y={H + 16} fontSize="10" fill="#9a8070" textAnchor="middle">
              {d.month}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(0, ${H + 30})`}>
        <rect x={0} y={0} width={10} height={10} rx="2" fill="#b8943a" />
        <text x={14} y={9} fontSize="9" fill="#9a8070">Revenue</text>
      </g>
    </svg>
  );
}

// ── Pie Chart ─────────────────────────────────────────────────────────────────
function PieChart({ slices }: { slices: CategorySlice[] }) {
  const cx = 90, cy = 90, r = 70;
  let cumulative = 0;

  const paths = slices.map((slice) => {
    const startAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2;
    cumulative += slice.value;
    const endAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = slice.value > 50 ? 1 : 0;

    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const labelR = r + 28;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    return { ...slice, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, lx, ly };
  });

  return (
    <svg viewBox="0 0 220 180" style={{ width: "100%", maxWidth: 220, height: "auto" }}>
      {paths.map((p) => (
        <g key={p.label}>
          <path d={p.d} fill={p.color} stroke="#fff" strokeWidth="2" />
          <text
            x={p.lx}
            y={p.ly}
            fontSize="9.5"
            fill={p.color === "#e8ddd0" ? "#7a6050" : p.color}
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {p.label} {p.value}%
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("Monthly");

  const formatPrice = (n: number) => "₱" + new Intl.NumberFormat("en-PH").format(n);

  const totalRevenue = SALES_DATA[period].reduce((s, d) => s + d.value, 0);
  const avgRevenue   = Math.round(totalRevenue / SALES_DATA[period].length);
  const peakPeriod   = SALES_DATA[period].reduce((a, b) => (a.value > b.value ? a : b));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3efe9",
        padding: "28px 32px 60px",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* ── Page Title ── */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1a0e06", margin: "0 0 4px" }}>
          Reports & Analytics
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#9a8070", margin: 0 }}>
          View detailed insights and performance metrics
        </p>
      </div>

      {/* ── Period Tabs ── */}
      <div
        style={{
          display: "inline-flex",
          background: "#e8e0d6",
          borderRadius: "10px",
          padding: "4px",
          gap: "2px",
          marginBottom: "24px",
        }}
      >
        {(["Daily", "Weekly", "Monthly"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: "7px 18px",
              borderRadius: "7px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
              fontFamily: "Georgia, serif",
              letterSpacing: "0.5px",
              transition: "all 0.18s",
              background: period === p ? "#3a2010" : "transparent",
              color: period === p ? "#f5e6d3" : "#7a6050",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── KPI summary row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Total Revenue",   value: formatPrice(totalRevenue) },
          { label: "Avg per Period",  value: formatPrice(avgRevenue)   },
          { label: `Peak (${peakPeriod.month})`, value: formatPrice(peakPeriod.value) },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "18px 22px",
              boxShadow: "0 1px 6px rgba(60,36,20,0.06)",
            }}
          >
            <p style={{ fontSize: "0.68rem", letterSpacing: "2px", textTransform: "uppercase", color: "#9a8070", margin: "0 0 6px", fontWeight: 700 }}>
              {k.label}
            </p>
            <p style={{ fontSize: "1.45rem", fontWeight: 700, color: "#1a0e06", margin: 0, lineHeight: 1 }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Bar chart card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px 28px",
            boxShadow: "0 1px 8px rgba(60,36,20,0.07)",
          }}
        >
          <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a0e06", margin: "0 0 20px" }}>
            Sales Overview
          </h3>
          <BarChart data={SALES_DATA[period]} />
        </div>

        {/* Pie chart card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px 28px",
            boxShadow: "0 1px 8px rgba(60,36,20,0.07)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a0e06", margin: "0 0 16px" }}>
            Revenue by Category
          </h3>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <PieChart slices={CATEGORY_DATA} />
            {/* Legend */}
            <div style={{ display: "flex", gap: "18px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              {CATEGORY_DATA.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#5a4a3a" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, display: "inline-block", border: "1px solid rgba(0,0,0,0.1)" }} />
                  {s.label} ({s.value}%)
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Selling Products ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 8px rgba(60,36,20,0.07)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0ebe4" }}>
          <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a0e06", margin: 0 }}>
            Top Selling Products
          </h3>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fdf9f5" }}>
              {["Rank", "Product", "Category", "Price", "Stock"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: "0.65rem",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#9a8070",
                    fontWeight: 700,
                    padding: "12px 20px",
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
            {TOP_PRODUCTS.map((p, i) => {
              const RANK_COLORS = ["#c9a84a", "#9a9a9a", "#a06a40", "#7a6050"];
              return (
                <tr
                  key={p.rank}
                  style={{
                    borderBottom: i < TOP_PRODUCTS.length - 1 ? "1px solid #f7f3ef" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#fdf9f5")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                >
                  {/* Rank */}
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: RANK_COLORS[i] ?? "#9a8070",
                        letterSpacing: "1px",
                      }}
                    >
                      #{p.rank}
                    </span>
                  </td>

                  {/* Product */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: "#f0ebe2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "1.1rem" }}>👟</span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a0e06" }}>
                        {p.name}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: "14px 20px", fontSize: "0.85rem", color: "#7a6050" }}>
                    {p.category}
                  </td>

                  {/* Price */}
                  <td style={{ padding: "14px 20px", fontSize: "0.88rem", fontWeight: 700, color: "#1a0e06" }}>
                    {formatPrice(p.price)}
                  </td>

                  {/* Stock */}
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: p.stock === 0 ? "#991b1b" : p.stock <= 10 ? "#92400e" : "#1a0e06",
                      }}
                    >
                      {p.stock}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}