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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2 2 4-4" />
      </svg>
    ),
    title: "Decent Work & Growth",
    text: "We promote traditional shoemaking markets by providing a digital platform that supports local artisans and drives economic growth in our community.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
    title: "Industry & Innovation",
    text: "Introducing modern digital infrastructure for marketing and selling products, bridging the gap between heritage craftsmanship and global e-commerce.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
        background: "#e8ddd0",
        paddingBottom: "80px",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* HERO — updated colors */}
      <div
        style={{
          width: "100%",
          background: "#E8DFD3",
          color: "#3a2414",
          paddingTop: "100px",
          paddingBottom: "50px",
          textAlign: "center",
          borderRadius: "0 0 28px 28px",
        }}
      >
        <h2 style={{ fontSize: "2.5rem", marginBottom: "20px", color: "#3a2414" }}>
          Our Heritage
        </h2>

        <p style={{ maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, color: "#3a2414" }}>
          Rooted in the heart of Marikina, the Shoe Capital of the Philippines.
          We are dedicated to preserving the rich cultural identity of local
          shoemaking while adapting to modern e-commerce trends.
        </p>
      </div>

      {/* BUSINESS OWNER */}
      <div
        style={{
          maxWidth: "900px",
          margin: "56px auto 0",
          padding: "0 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "40px",
          background: "#f3efea",
          borderRadius: "20px",
          boxShadow: "0 1px 8px rgba(58,36,20,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Owner Image */}
        <div
          style={{
            width: "220px",
            height: "280px",
            flexShrink: 0,
            overflow: "hidden",
            borderRadius: "16px",
            margin: "28px 0 28px 28px",
            background: "#2a1508",
          }}
        >
          <Image
            src="/owner.jpg"
            alt="Business Owner"
            width={220}
            height={280}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Owner Text */}
        <div style={{ flex: 1, minWidth: "220px", padding: "28px 28px 28px 0" }}>
          <p style={{ fontSize: "0.75rem", color: "#8a6a4a", marginBottom: "8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Meet the Founder
          </p>

          <h2 style={{ fontSize: "1.8rem", marginBottom: "12px", color: "#3a2414" }}>
            Maria Santos
          </h2>

          <p style={{ fontSize: "0.85rem", lineHeight: 1.8, marginBottom: "12px", color: "#5a3a20" }}>
            Born and raised in Marikina, Maria grew up watching her father handcraft
            shoes in their family workshop. With over 20 years of experience in the
            craft, she founded Pando with a single mission: to bring the artistry of
            Marikina shoemaking to the world.
          </p>

          <p style={{ fontSize: "0.85rem", lineHeight: 1.8, color: "#5a3a20" }}>
            Her deep respect for tradition, combined with a forward-looking vision,
            has made Pando a bridge between heritage craftsmanship and the modern
            marketplace — ensuring that the legacy of Marikinas artisans lives on
            for generations to come.
          </p>
        </div>
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

            <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
              {card.text}
            </p>
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
          padding: "0 24px",
        }}
      >
        {/* IMAGE */}
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
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* TEXT */}
        <div style={{ flex: 1, minWidth: "240px" }}>
          <p style={{ fontSize: "0.75rem", color: "#8a6a4a", marginBottom: "10px" }}>
            The Artisans
          </p>

          <h2 style={{ fontSize: "2rem", marginBottom: "16px" }}>
            Generations of Craft
          </h2>

          <p style={{ marginBottom: "12px", lineHeight: 1.7 }}>
            Every pair of Pando shoes tells a story of dedication. Our artisans
            have honed their skills over decades.
          </p>

          <p style={{ lineHeight: 1.7 }}>
            By choosing Pando, you support Marikina craftsmen and preserve tradition.
          </p>
        </div>
      </div>
    </section>
  );
}