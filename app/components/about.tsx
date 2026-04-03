"use client";

import { ReactNode, useEffect, useRef } from "react";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Card {
  icon: ReactNode;
  title: string;
  text: string;
  sdg: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const cards: Card[] = [
  {
    sdg: "SDG 08",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2 2 4-4" />
      </svg>
    ),
    title: "Decent Work & Economic Growth",
    text: "We promote traditional shoemaking markets by providing a digital platform that supports local artisans and drives economic growth in our community.",
  },
  {
    sdg: "SDG 09",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
    title: "Industry & Innovation",
    text: "Introducing modern digital infrastructure for marketing and selling products, bridging the gap between heritage craftsmanship and global e-commerce.",
  },
  {
    sdg: "SDG 11",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Sustainable Communities",
    text: "Encouraging people to recognize and celebrate Marikina as the Shoe Capital, preserving our cultural identity for future generations.",
  },
];

const stats = [
  { value: "2015", label: "Founded" },
  { value: "10+", label: "Years of craft" },
  { value: "500+", label: "Pairs handmade" },
  { value: "1", label: "City, one legacy" },
];

// ── Scroll reveal hook ────────────────────────────────────────────────────────
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
      { threshold: 0.12 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return ref;
}

// ── Reveal wrapper ────────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(36px)",
        transition: `opacity 0.75s ease ${delay}ms, transform 0.75s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AboutSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

        .about-root {
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

        .about-root * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Hero ── */
        .about-hero {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          text-align: center;
        }

        .about-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(15,7,2,0.55) 0%,
            rgba(25,12,4,0.72) 50%,
            rgba(35,17,6,0.88) 100%
          );
          z-index: 1;
        }

        .about-hero-grain {
          position: absolute;
          inset: 0;
          z-index: 2;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px;
          pointer-events: none;
        }

        .about-hero-top-rule {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--gold), transparent);
          z-index: 3;
        }

        .about-hero-content {
          position: relative;
          z-index: 4;
          padding: 0 24px;
          max-width: 640px;
          margin: 0 auto;
        }

        .about-hero-eyebrow {
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--gold-light);
          margin-bottom: 20px;
          opacity: 0;
          animation: fadeUp 0.9s ease 0.2s forwards;
        }

        .about-hero-title {
          font-family: var(--font-display);
          font-size: clamp(3.2rem, 7vw, 6rem);
          font-weight: 300;
          color: #f5ebe0;
          line-height: 1.05;
          letter-spacing: 0.01em;
          margin-bottom: 8px;
          opacity: 0;
          animation: fadeUp 0.9s ease 0.35s forwards;
        }

        .about-hero-title em {
          font-style: italic;
          color: var(--gold-light);
        }

        .about-hero-rule {
          width: 48px;
          height: 1px;
          background: var(--gold);
          margin: 26px auto;
          opacity: 0;
          animation: fadeIn 0.9s ease 0.55s forwards;
        }

        .about-hero-body {
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 300;
          line-height: 1.9;
          color: rgba(235,220,200,0.82);
          margin-bottom: 40px;
          opacity: 0;
          animation: fadeUp 0.9s ease 0.7s forwards;
        }

        .about-hero-cta {
          display: inline-block;
          font-family: var(--font-body);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #f5e6d3;
          padding: 14px 28px;
          border: 1px solid rgba(184,134,78,0.6);
          border-radius: 2px;
          text-decoration: none;
          transition: all 0.35s ease;
          opacity: 0;
          animation: fadeUp 0.9s ease 0.85s forwards;
        }

        .about-hero-cta:hover {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--brown-dark);
        }

        .about-scroll-indicator {
          position: absolute;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 4;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: var(--gold);
          opacity: 0.55;
          animation: fadeIn 1.2s ease 1.4s forwards;
          opacity: 0;
        }

        .about-scroll-label {
          font-family: var(--font-body);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        /* ── Stats bar ── */
        .about-stats {
          background: var(--brown-dark);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(184,134,78,0.2);
        }

        .about-stat {
          padding: 36px 24px;
          text-align: center;
          border-right: 1px solid rgba(184,134,78,0.12);
          transition: background 0.3s;
        }

        .about-stat:last-child { border-right: none; }
        .about-stat:hover { background: rgba(184,134,78,0.06); }

        .about-stat-value {
          font-family: var(--font-display);
          font-size: 2.4rem;
          font-weight: 300;
          color: var(--gold-light);
          line-height: 1;
          margin-bottom: 8px;
        }

        .about-stat-label {
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 400;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(200,168,120,0.55);
        }

        /* ── History section ── */
        .about-history {
          background: var(--cream);
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 520px;
        }

        .about-history-left {
          padding: 80px 60px 80px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1px solid rgba(184,134,78,0.18);
        }

        .about-history-right {
          padding: 80px 80px 80px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }

        .about-section-label {
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .about-section-label::before {
          content: '';
          display: block;
          width: 28px;
          height: 1px;
          background: var(--gold);
          flex-shrink: 0;
        }

        .about-history-title {
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 300;
          color: var(--brown-dark);
          line-height: 1.25;
          margin-bottom: 0;
        }

        .about-history-title em {
          font-style: italic;
          color: var(--brown-mid);
        }

        .about-history-body {
          font-family: var(--font-body);
          font-size: 0.93rem;
          font-weight: 300;
          line-height: 2;
          color: var(--text-body);
        }

        .about-history-quote {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-style: italic;
          font-weight: 300;
          color: var(--brown-mid);
          line-height: 1.6;
          border-left: 2px solid var(--gold);
          padding-left: 20px;
          margin-top: 32px;
        }

        /* ── SDG Cards ── */
        .about-sdg {
          background: var(--brown-dark);
          padding: 80px 60px;
          position: relative;
          overflow: hidden;
        }

        .about-sdg-bg-text {
          position: absolute;
          bottom: -20px;
          right: -10px;
          font-family: var(--font-display);
          font-size: 14rem;
          font-weight: 600;
          color: rgba(255,255,255,0.02);
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        .about-sdg-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .about-sdg-title {
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 300;
          color: #f5ebe0;
          margin-top: 16px;
          line-height: 1.2;
        }

        .about-sdg-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 50px;
          max-width: 960px;
          margin: 0 auto;
        }

        .about-sdg-card {
          background: rgba(255,255,255,0.035);
          padding: 40px 32px;
          border: 1px solid rgba(90, 52, 28, 0.15);
          transition: all 0.35s ease;
          position: relative;
          overflow: hidden;

          aspect-ratio: 1 / 1; /* 👈 makes it a perfect square */
          display: flex;
          flex-direction: column;
          justify-content: center; /* center content vertically */
        }

        .about-sdg-card::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
          transform: scaleX(0);
          transition: transform 0.35s ease;
          transform-origin: left;
        }

        .about-sdg-card:hover { background: rgba(184,134,78,0.08); }
        .about-sdg-card:hover::before { transform: scaleX(1); }

        .about-sdg-number {
          font-family: var(--font-body);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .about-sdg-icon {
          color: var(--gold-light);
          margin-bottom: 18px;
          opacity: 0.85;
        }

        .about-sdg-card-title {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 400;
          color: #f0e4d2;
          margin-bottom: 14px;
          line-height: 1.3;
        }

        .about-sdg-card-text {
          font-family: var(--font-body);
          font-size: 0.83rem;
          font-weight: 300;
          color: rgba(200,180,155,0.72);
          line-height: 1.85;
        }

        /* ── Artisans section ── */
        .about-artisans {
          background: var(--warm);
          display: grid;
          grid-template-columns: 420px 1fr;
          min-height: 480px;
        }

        .about-artisans-image-wrap {
          position: relative;
          overflow: hidden;
        }

        .about-artisans-image-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, transparent 70%, var(--warm));
        }

        .about-artisans-text {
          padding: 80px 80px 80px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .about-artisans-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 300;
          color: var(--brown-dark);
          line-height: 1.15;
          margin-bottom: 24px;
        }

        .about-artisans-title em {
          font-style: italic;
          color: var(--brown-mid);
        }

        .about-artisans-body {
          font-family: var(--font-body);
          font-size: 0.92rem;
          font-weight: 300;
          line-height: 2;
          color: var(--text-body);
          margin-bottom: 16px;
        }

        .about-artisans-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-body);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--brown-mid);
          text-decoration: none;
          margin-top: 16px;
          padding-bottom: 4px;
          border-bottom: 1px solid var(--gold);
          transition: all 0.3s;
          width: fit-content;
        }

        .about-artisans-cta:hover {
          color: var(--gold);
          gap: 16px;
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 0.55; }
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .about-stats { grid-template-columns: repeat(2, 1fr); }
          .about-stat:nth-child(2) { border-right: none; }
          .about-stat:nth-child(3) { border-top: 1px solid rgba(184,134,78,0.12); }
          .about-history { grid-template-columns: 1fr; }
          .about-history-left {
            padding: 60px 32px 40px;
            border-right: none;
            border-bottom: 1px solid rgba(184,134,78,0.18);
          }
          .about-history-right { padding: 40px 32px 60px; }
          .about-sdg { padding: 60px 24px; }
          .about-sdg-grid { grid-template-columns: 1fr; gap: 2px; }
          .about-artisans { grid-template-columns: 1fr; }
          .about-artisans-image-wrap { height: 320px; }
          .about-artisans-image-wrap::after { background: linear-gradient(to bottom, transparent 70%, var(--warm)); }
          .about-artisans-text { padding: 40px 32px 60px; }
        }

        @media (max-width: 560px) {
          .about-stats { grid-template-columns: repeat(2, 1fr); }
          .about-history-left, .about-history-right { padding: 48px 24px; }
          .about-sdg { padding: 48px 20px; }
        }
      `}</style>

      <section
        className="about-root"
        style={{ width: "100%", fontFamily: "'Jost', sans-serif" }}
      >
        {/* ── HERO ── */}
        <div className="about-hero">
          <Image
            src="/pando.jpg"
            alt="Pando Shoe Store"
            fill
            style={{ objectFit: "cover", objectPosition: "center top" }}
            priority
          />
          <div className="about-hero-overlay" />
          <div className="about-hero-grain" />
          <div className="about-hero-top-rule" />

          <div className="about-hero-content">
            <p className="about-hero-eyebrow">Marikina · Est. 2015</p>
            <h2 className="about-hero-title">
              Our <em>Heritage</em>
            </h2>
            <div className="about-hero-rule" />
            <p className="about-hero-body">
              Rooted in the heart of Marikina, the Shoe Capital of the
              Philippines. Dedicated to preserving the rich cultural identity of
              local shoemaking while adapting to the modern world.
            </p>
            <a href="#history" className="about-hero-cta">
              Discover Our Story
            </a>
          </div>

          <div className="about-scroll-indicator">
            <span className="about-scroll-label">Scroll</span>
            <svg width="16" height="26" viewBox="0 0 16 26" fill="none">
              <rect
                x="1"
                y="1"
                width="14"
                height="24"
                rx="7"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="8" cy="8" r="2" fill="currentColor">
                <animate
                  attributeName="cy"
                  values="8;16;8"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1;0;1"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="about-stats">
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="about-stat">
                <div className="about-stat-value">{s.value}</div>
                <div className="about-stat-label">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── HISTORY ── */}
        <div id="history" className="about-history">
          <div className="about-history-left">
            <Reveal>
              <p className="about-section-label">Our Beginnings</p>
              <h2 className="about-history-title">
                A decade of craft,
                <br />
                community, and
                <br />
                <em>heritage.</em>
              </h2>
            </Reveal>
          </div>

          <div className="about-history-right">
            <Reveal delay={100}>
              <p className="about-history-body">
                Founded in 2015 by Fernando Lopez, Pando Shoe Store was born
                from a lifelong passion for the art of shoemaking. Growing up in
                Marikina — the undisputed Shoe Capital of the Philippines —
                Fernando witnessed firsthand the slow decline of the local
                cobbling trade as mass production began to dominate the market.
              </p>
              <p className="about-history-body" style={{ marginTop: 20 }}>
                Determined to keep the tradition alive, he opened Pando&apos;s
                first workshop on Batangas Street with nothing more than a pair
                of lasting pliers, decades of inherited skill, and an unwavering
                belief that handcrafted shoes deserved a place in the modern
                world.
              </p>
              <blockquote className="about-history-quote">
                &ldquo;One stitch, one sole, one story at a time.&rdquo;
              </blockquote>
            </Reveal>
          </div>
        </div>

        {/* ── SDG CARDS ── */}
        <div className="about-sdg">
          <div className="about-sdg-bg-text">SDG</div>

          <div className="about-sdg-header">
            <Reveal>
              <p
                className="about-section-label"
                style={{ justifyContent: "center" }}
              >
                Why We Exist
              </p>
              <h2 className="about-sdg-title">
                Aligned with global goals,
                <br />
                rooted in local values.
              </h2>
            </Reveal>
          </div>

          <div className="about-sdg-grid">
            {cards.map((card, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="about-sdg-card">
                  <p className="about-sdg-number">{card.sdg}</p>
                  <div className="about-sdg-icon">{card.icon}</div>
                  <h3 className="about-sdg-card-title">{card.title}</h3>
                  <p className="about-sdg-card-text">{card.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── ARTISANS ── */}
        <div className="about-artisans">
          <div className="about-artisans-image-wrap">
            <Image
              src="/about.jpg"
              alt="Marikina artisans"
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>

          <div className="about-artisans-text">
            <Reveal>
              <p className="about-section-label">The Artisans</p>
              <h2 className="about-artisans-title">
                Generations
                <br />
                of <em>craft.</em>
              </h2>
            </Reveal>

            <Reveal delay={120}>
              <p className="about-artisans-body" style={{ marginTop: 8 }}>
                Every pair of Pando shoes tells a story of dedication. Our
                artisans have honed their skills over decades, passing knowledge
                from hand to hand across generations of Marikina families.
              </p>
              <p className="about-artisans-body">
                By choosing Pando, you support local craftsmen and help preserve
                a tradition that has defined this city for over a century.
              </p>
              <a href="/product" className="about-artisans-cta">
                Shop the Collection
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
