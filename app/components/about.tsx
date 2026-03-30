"use client";

import { ReactNode } from "react";
import Image from "next/image";

interface Card {
  icon: ReactNode;
  title: string;
  text: string;
}

const cards: Card[] = [
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2 2 4-4" />
      </svg>
    ),
    title: "Decent Work & Growth",
    text: "We promote traditional shoemaking markets by providing a digital platform that supports local artisans and drives economic growth in our community.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
    title: "Industry & Innovation",
    text: "Introducing modern digital infrastructure for marketing and selling products, bridging the gap between heritage craftsmanship and global e-commerce.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
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

export default function AboutSection() {
  return (
    <section
      style={{
        width: "100%",
        paddingBottom: "80px",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* HERO — true full-viewport height */}
      <div
        style={{
          width: "100%",
          position: "relative",
          height: "100vh",
          minHeight: "600px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Background Image */}
        <Image
          src="/pando.jpg"
          alt="Hero background"
          fill
          style={{
            objectFit: "cover",
            objectPosition: "center top",
            opacity: 0.8,
          }}
          priority
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(20,10,3,0.6) 0%, rgba(30,15,5,0.7) 60%, rgba(40,20,8,0.85) 100%)",
          }}
        />

        {/* Decorative top border line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background:
              "linear-gradient(to right, transparent, #b8864e, transparent)",
          }}
        />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 1, padding: "0 24px" }}>
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#c8a87a",
              marginBottom: "16px",
            }}
          >
            Marikina · Est. 2015
          </p>

          <h2
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              marginBottom: "20px",
              color: "#f5ebe0",
              fontWeight: "400",
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Our Heritage
          </h2>

          <div
            style={{
              width: "60px",
              height: "1px",
              background: "#b8864e",
              margin: "0 auto 24px",
            }}
          />

          <p
            style={{
              maxWidth: "480px",
              margin: "0 auto 36px",
              lineHeight: 1.9,
              color: "#d8c8b4",
              fontSize: "1rem",
            }}
          >
            Rooted in the heart of Marikina, the Shoe Capital of the
            Philippines. We are dedicated to preserving the rich cultural
            identity of local shoemaking while adapting to modern e-commerce
            trends.
          </p>

          <a
            href="#history"
            style={{
              display: "inline-block",
              backgroundColor: "transparent",
              color: "#f5e6d3",
              padding: "13px 22px",
              borderRadius: "4px",
              border: "1px solid rgba(200,168,120,0.7)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "#8a4a2a";
              el.style.borderColor = "#8a4a2a";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "transparent";
              el.style.borderColor = "rgba(200,168,120,0.7)";
            }}
          >
            Our Story
          </a>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            color: "#c8a87a",
            opacity: 0.7,
          }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Scroll
          </span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect
              x="1"
              y="1"
              width="14"
              height="22"
              rx="7"
              stroke="#c8a87a"
              strokeWidth="1.2"
            />
            <circle cx="8" cy="7" r="2" fill="#c8a87a">
              <animate
                attributeName="cy"
                values="7;14;7"
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

      {/* HISTORY SECTION */}
      <div
        id="history"
        style={{
          background: "#f5f0ea",
          paddingTop: "40px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9a7a5a",
            marginBottom: "16px",
          }}
        >
          Our Beginnings
        </p>

        <h2
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: "500",
            color: "#2a1508",
            maxWidth: "560px",
            margin: "0 auto 20px",
            lineHeight: 1.5,
          }}
        >
          A decade of craft, community, and heritage in the heart of Marikina.
        </h2>

        <div
          style={{
            width: "40px",
            height: "1px",
            background: "#b8864e",
            margin: "0 auto 28px",
          }}
        />

        <p
          style={{
            fontSize: "0.9rem",
            color: "#6a5a4a",
            maxWidth: "620px",
            margin: "0 auto",
            lineHeight: 2,
          }}
        >
          Founded in 2015 by Fernando Lopez, Pando Shoe Store was born from a
          lifelong passion for the art of shoemaking. Growing up in Marikina —
          the undisputed Shoe Capital of the Philippines — Fernando witnessed
          firsthand the slow decline of the local cobbling trade as mass
          production began to dominate the market. Determined to keep the
          tradition alive, he opened Pando&apos;s first workshop on Batangas
          Street with nothing more than a pair of lasting pliers, decades of
          inherited skill, and an unwavering belief that handcrafted shoes
          deserved a place in the modern world. From its humble beginnings as a
          single-room workshop, Pando has grown into a celebrated local brand —
          one stitch, one sole, one story at a time.
        </p>
      </div>

      {/* CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
          maxWidth: "900px",
          margin: "56px auto",
          padding: "0 24px",
        }}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              background: "#f3efea",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 1px 8px rgba(58,36,20,0.07)",
            }}
          >
            <div style={{ marginBottom: "16px", color: "#5a3a20" }}>
              {card.icon}
            </div>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "10px" }}>
              {card.title}
            </h3>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>{card.text}</p>
          </div>
        ))}
      </div>

      {/* BOTTOM SECTION */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "50px",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            background: "#2a1508",
            borderRadius: "20px",
            width: "280px",
            height: "240px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Image
            src="/about.jpg"
            alt="About shoe"
            width={280}
            height={240}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "240px" }}>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#8a6a4a",
              marginBottom: "20px",
            }}
          >
            The Artisans
          </p>
          <h2 style={{ fontSize: "2rem", marginBottom: "19px" }}>
            Generations of Craft
          </h2>
          <p style={{ marginBottom: "12px", lineHeight: 1.7 }}>
            Every pair of Pando shoes tells a story of dedication. Our artisans
            have honed their skills over decades.
          </p>
          <p style={{ lineHeight: 1.7 }}>
            By choosing Pando, you support Marikina craftsmen and preserve
            tradition.
          </p>
        </div>
      </div>
    </section>
  );
}
