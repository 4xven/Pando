"use client";

import Image from "next/image";
import shoeImg from "../public/img/shoe.png";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Classic Elegance</h1>
        <p>Handcrafted leather shoes for classic, lasting style.</p>

        <div className="image-wrapper">
          <Image src={shoeImg} alt="Leather shoes" />

          {/* Labels */}
          <div className="txt">
            <span className="label left">FULL GRAIN LEATHER</span>
            <span className="label right top">EXTRA DURABLE</span>
            <span className="label right bottom">PADDED FOOTBED</span>
          </div>
        </div>
      </div>
    </section>
  );
}
