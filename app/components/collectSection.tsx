"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";

type Props = {
  eyebrow?: string;
  heading: string;
  headingItalic?: string;
  description: string;
  image: string;
  href?: string;
  reverse?: boolean;
};

export default function CollectionSection({
  eyebrow,
  heading,
  headingItalic,
  description,
  image,
  href = "/product",
  reverse = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .pando-collection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 640px;
          background: var(--pg-bg);
          overflow: hidden;
          border-top: 1px solid var(--pg-rule);
        }
        .pando-collection.reverse .pc-image-col { order: 2; }
        .pando-collection.reverse .pc-text-col  { order: 1; }

        /* ── Image column ── */
        .pc-image-col {
          position: relative;
          overflow: hidden;
        }
        .pc-image-col::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(250,247,242,0.2) 0%, transparent 60%);
          z-index: 1;
          pointer-events: none;
        }
        .pc-image-col img {
          width: 100% !important;
          height: 100% !important;
          object-fit: fill;
          transition: transform 0.9s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .pando-collection:hover .pc-image-col img {
          transform: scale(1.04);
        }

        /* corner accents */
        .pc-corner {
          position: absolute;
          width: 48px;
          height: 48px;
          z-index: 2;
          pointer-events: none;
        }
        .pc-corner.tl {
          top: 22px; left: 22px;
          border-top: 1px solid var(--pg-gold);
          border-left: 1px solid var(--pg-gold);
          opacity: 0.5;
        }
        .pc-corner.br {
          bottom: 22px; right: 22px;
          border-bottom: 1px solid var(--pg-gold);
          border-right: 1px solid var(--pg-gold);
          opacity: 0.5;
        }

        /* edition badge */
        .pc-badge {
          position: absolute;
          bottom: 24px;
          left: 24px;
          z-index: 3;
          font-family: var(--fb);
          font-size: 0.56rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--pg-ink-mid);
          background: rgba(250,247,242,0.85);
          border: 1px solid var(--pg-rule);
          padding: 6px 13px;
          backdrop-filter: blur(6px);
        }
        .pando-collection.reverse .pc-badge {
          left: auto;
          right: 24px;
        }

        /* ── Text column ── */
        .pc-text-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 72px;
          background: var(--pg-bg-alt);
          position: relative;
          overflow: hidden;
        }
        .pc-text-col::after {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(184,134,78,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Eyebrow */
        .pc-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--fb);
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--pg-gold);
          margin-bottom: 20px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s;
        }
        .pc-eyebrow-line {
          display: block;
          width: 26px;
          height: 1px;
          background: var(--pg-gold);
          flex-shrink: 0;
        }

        /* Heading */
        .pc-heading {
          font-family: var(--fd);
          font-size: clamp(2rem, 3.2vw, 3rem);
          font-weight: 300;
          color: var(--pg-ink);
          line-height: 1.2;
          margin-bottom: 26px;
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.65s ease 0.2s, transform 0.65s ease 0.2s;
        }
        .pc-heading em {
          font-style: italic;
          color: var(--pg-gold);
        }

        /* Divider */
        .pc-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
          opacity: 0;
          transition: opacity 0.55s ease 0.35s;
        }
        .pc-divider-bar {
          height: 1px;
          width: 36px;
          background: var(--pg-rule);
        }
        .pc-divider-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--pg-gold-lt);
        }

        /* Description */
        .pc-description {
          font-family: var(--fb);
          font-size: 0.85rem;
          font-weight: 300;
          color: var(--pg-ink-mid);
          line-height: 1.95;
          max-width: 420px;
          margin-bottom: 44px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s;
        }

        /* CTA */
        .pc-cta {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.55s ease 0.52s, transform 0.55s ease 0.52s;
        }
        .pc-cta-label {
          font-family: var(--fb);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--pg-ink-soft);
          transition: color 0.3s ease;
          border-bottom: 1px solid var(--pg-rule);
          padding-bottom: 2px;
        }
        .pc-cta-line {
          width: 36px;
          height: 1px;
          background: var(--pg-gold);
          transition: width 0.35s ease;
        }
        .pc-cta:hover .pc-cta-line  { width: 60px; }
        .pc-cta:hover .pc-cta-label {
          color: var(--pg-gold);
          border-color: var(--pg-gold);
        }

        /* ── Visible state ── */
        .pando-collection.is-visible .pc-eyebrow,
        .pando-collection.is-visible .pc-heading,
        .pando-collection.is-visible .pc-divider,
        .pando-collection.is-visible .pc-description,
        .pando-collection.is-visible .pc-cta {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .pando-collection { grid-template-columns: 1fr; }
          .pando-collection .pc-image-col { order: 1 !important; min-height: 320px; }
          .pando-collection .pc-text-col  { order: 2 !important; padding: 52px 32px; }
        }
      `}</style>

      <section
        ref={sectionRef}
        className={`pando-collection${reverse ? " reverse" : ""}${visible ? " is-visible" : ""}`}
      >
        {/* ── Image ── */}
        <div className="pc-image-col">
          <div className="pc-corner tl" />
          <div className="pc-corner br" />
          <Image
  src={image}
  alt={heading}
  fill
  sizes="(max-width: 900px) 100vw, 50vw"
  style={{ objectFit: "contain", objectPosition: "center" }}
/>
          <span className="pc-badge">Marikina · Est. 2015</span>
        </div>

        {/* ── Text ── */}
        <div className="pc-text-col">
          {eyebrow && (
            <p className="pc-eyebrow">
              <span className="pc-eyebrow-line" />
              {eyebrow}
            </p>
          )}

          <h2 className="pc-heading">
            {heading}
            {headingItalic && (
              <>
                {" "}
                <em>{headingItalic}</em>
              </>
            )}
          </h2>

          <div className="pc-divider">
            <span className="pc-divider-bar" />
            <span className="pc-divider-dot" />
            <span className="pc-divider-bar" />
          </div>

          <p className="pc-description">{description}</p>

          <Link href={href} className="pc-cta">
            <span className="pc-cta-label">Explore Collection</span>
            <span className="pc-cta-line" />
          </Link>
        </div>
      </section>
    </>
  );
}