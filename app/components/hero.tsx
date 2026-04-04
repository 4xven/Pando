"use client";

import Image from "next/image";
import shoeImg from "../public/img/shoe.png";

export default function Hero() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

        .hero-root {
          --cream: #f5f0e8;
          --warm: #e8dfd3;
          --brown-dark: #2a1508;
          --brown-mid: #5a3520;
          --brown-light: #9a7a5a;
          --gold: #b8864e;
          --gold-light: #d4a96a;
          --fd: 'Cormorant Garamond', Georgia, serif;
          --fb: 'Jost', sans-serif;
        }

        .hero-section {
          background: var(--brown-dark);
          min-height: 560px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid rgba(184,134,78,0.2);
        }

        .hero-top-rule {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--gold), transparent);
          z-index: 4;
        }

        .hero-bg-text {
          position: absolute;
          bottom: -30px; right: -20px;
          font-family: var(--fd);
          font-size: 18rem;
          font-weight: 600;
          color: rgba(255,255,255,0.025);
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        .hero-content {
          padding: 80px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .hero-eyebrow {
          font-family: var(--fb);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.2s forwards;
        }

        .hero-eyebrow::before {
          content: '';
          display: block;
          width: 28px;
          height: 1px;
          background: var(--gold);
        }

        .hero-title {
          font-family: var(--fd);
          font-size: clamp(2.8rem, 5vw, 4.4rem);
          font-weight: 300;
          color: #f5ebe0;
          line-height: 1.08;
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.35s forwards;
        }

        .hero-title em {
          font-style: italic;
          color: var(--gold-light);
        }

        .hero-rule {
          width: 40px;
          height: 1px;
          background: var(--gold);
          margin-bottom: 28px;
          opacity: 0;
          animation: fadeIn 0.8s ease 0.5s forwards;
        }

        .hero-body {
          font-family: var(--fb);
          font-size: 0.9rem;
          font-weight: 300;
          color: rgba(235,220,200,0.75);
          line-height: 1.9;
          margin-bottom: 36px;
          max-width: 380px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.6s forwards;
        }

        .hero-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.75s forwards;
        }

        .btn-primary {
          font-family: var(--fb);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 14px 28px;
          background: var(--gold);
          border: 1px solid var(--gold);
          color: var(--brown-dark);
          cursor: pointer;
          transition: all 0.25s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary:hover {
          background: var(--gold-light);
          border-color: var(--gold-light);
        }

        .btn-outline {
          font-family: var(--fb);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 14px 28px;
          background: transparent;
          border: 1px solid rgba(184,134,78,0.5);
          color: #f5e6d3;
          cursor: pointer;
          transition: all 0.25s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-outline:hover {
          border-color: var(--gold);
          color: var(--gold);
        }

        /* Image side */
        .hero-image-side {
          position: relative;
          background: #1e0f06;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-image-inner {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-img-wrap {
          position: relative;
          width: 540px;
          max-width: 80%;
          margin-left: 60px;
        }

        .hero-label {
          position: absolute;
          font-family: var(--fb);
          font-size: 0.73rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(200,168,120,0.7);
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          padding-left: 375px;
        }

        .hero-label::before {
          content: '';
          display: block;
          width: 20px;
          height: 1px;
          background: currentColor;
        }

        .hero-label.l1::before,
.hero-label.l3::before {
  display: none;
}

.hero-label.l1::after,
.hero-label.l3::after {
  content: '';
  display: block;
  width: 20px;
  height: 1px;
  background: currentColor;
}

        .hero-label.l1 { top: 18%; right: 440px; }
        .hero-label.l2 { top: 50%; left: 45px; }
        .hero-label.l3 { top: 78%; right: 470px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @media (max-width: 900px) {
          .hero-section { grid-template-columns: 1fr; }
          .hero-image-side { min-height: 280px; }
          .hero-content { padding: 56px 32px; }
          .hero-label { display: none; }
        }
        @media (max-width: 560px) {
          .hero-content { padding: 48px 24px; }
        }
      `}</style>

      <section className="hero-root">
        <div className="hero-section">
          <div className="hero-top-rule" />
          <div className="hero-bg-text">PANDO</div>

          <div className="hero-content">
            <p className="hero-eyebrow">Marikina · Est. 2015</p>
            <h1 className="hero-title">
              Crafted for<br />
              those who<br />
              value <em>legacy.</em>
            </h1>
            <div className="hero-rule" />
            <p className="hero-body">
              Handcrafted leather shoes from the heart of Marikina — the Shoe
              Capital of the Philippines. Each pair is a stitch in our citys story.
            </p>
            <div className="hero-ctas">
              <a href="/product" className="btn-primary">Shop Collection</a>
              <a href="/about" className="btn-outline">Our Story</a>
            </div>
          </div>

          <div className="hero-image-side">
            <div className="hero-image-inner">
              <div className="hero-img-wrap">
                <Image src={shoeImg} alt="Pando handcrafted leather shoe" priority />
                <span className="hero-label l1">Full Grain Leather</span>
                <span className="hero-label l2">Padded Footbed</span>
                <span className="hero-label l3">Extra Durable</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}