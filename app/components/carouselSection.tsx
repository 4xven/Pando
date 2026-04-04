"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string | null;
  stock: number;
  status: string;
}

export default function CarouselSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Product[] = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          name: raw.name ?? "",
          price: raw.price ?? 0,
          category: raw.category ?? "Casual",
          image: raw.image ?? null,
          stock: raw.stock ?? 0,
          status: raw.status ?? "In Stock",
        };
      });
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function shuffleArray(array: Product[]) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const featured = useMemo(() => shuffleArray(products).slice(0, 4), [products]);

  const formatPrice = (price: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(price);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

        .fc-root {
          --cream: #f5f0e8;
          --warm: #e8dfd3;
          --brown-dark: #2a1508;
          --brown-mid: #5a3520;
          --brown-light: #9a7a5a;
          --gold: #b8864e;
          --gold-light: #d4a96a;
          --text-body: #4a3828;
          --fd: 'Cormorant Garamond', Georgia, serif;
          --fb: 'Jost', sans-serif;
        }
        .fc-root * { box-sizing: border-box; margin: 0; padding: 0; }

        .fc-section {
          background: var(--warm);
          padding: 60px 60px;
        }

        .fc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 48px;
        }

        .fc-section-label {
          font-family: var(--fb);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fc-section-label::before {
          content: '';
          display: block;
          width: 28px;
          height: 1px;
          background: var(--gold);
          flex-shrink: 0;
        }

        .fc-heading {
          font-family: var(--fd);
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 300;
          color: var(--brown-dark);
          line-height: 1.2;
        }

        .fc-heading em {
          font-style: italic;
          color: var(--brown-mid);
        }

        .fc-view-all {
          font-family: var(--fb);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--brown-light);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(154,122,90,0.4);
          padding-bottom: 2px;
          transition: color 0.25s;
          white-space: nowrap;
        }

        .fc-view-all:hover { color: var(--gold); }

        /* Grid */
        .fc-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        /* Card */
.fc-card {
  background: var(--cream);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(.22,1,.36,1),
              box-shadow 0.35s ease;
}

.fc-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(42, 21, 8, 0.18);
}

        .fc-card:hover .fc-card-overlay {
          opacity: 1;
        }

        .fc-card:hover .fc-card-img img {
          transform: scale(1.04);
        }

        .fc-card-img {
          width: 100%;
          aspect-ratio: 3 / 4;
          background: #ede6db;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fc-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.55s cubic-bezier(.22,1,.36,1);
        }

        .fc-card-img-placeholder {
          font-size: 3.5rem;
          opacity: 0.12;
        }

        .fc-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(20,8,2,0.28);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 20px;
        }

        .fc-card-overlay-btn {
          font-family: var(--fb);
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f5ebe0;
          padding: 10px 20px;
          border: 1px solid rgba(245,235,224,0.6);
          background: transparent;
          cursor: pointer;
          transition: all 0.25s;
        }

        .fc-card-overlay-btn:hover {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--brown-dark);
        }

        .fc-card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          font-family: var(--fb);
          font-size: 0.56rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #f5ebe0;
          background: #3a2414;
          padding: 4px 10px;
        }

        .fc-card-body {
          padding: 18px 20px 22px;
          border-top: 1px solid rgba(184,134,78,0.12);
        }

        .fc-card-name {
          font-family: var(--fd);
          font-size: 1.75rem;
          font-weight: 400;
          color: var(--brown-dark);
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .fc-card-cat {
          font-family: var(--fb);
          font-size: 0.84rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--brown-light);
          margin-bottom: 8px;
        }

        .fc-card-price {
          font-family: var(--fd);
          font-size: 1.3rem;
          font-weight: 300;
          color: var(--gold);
        }

        /* Empty / Loading */
        .fc-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 24px;
          font-family: var(--fd);
          font-size: 1.2rem;
          font-weight: 300;
          color: var(--brown-light);
          font-style: italic;
        }

        @media (max-width: 1100px) {
          .fc-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 800px) {
          .fc-section { padding: 60px 28px; }
          .fc-grid { grid-template-columns: repeat(2, 1fr); }
          .fc-header { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
        @media (max-width: 500px) {
          .fc-section { padding: 48px 20px; }
          .fc-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
      `}</style>

      <section className="fc-root">
        <div className="fc-section">
          <div className="fc-header">
            <div>
              <p className="fc-section-label">From the Workshop</p>
              <h2 className="fc-heading">
                Featured <em>Collection</em>
              </h2>
            </div>
            <a href="/product" className="fc-view-all">
              View All
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="fc-grid">
            {loading && (
              <div className="fc-empty">Loading the collection…</div>
            )}

            {!loading && featured.length === 0 && (
              <div className="fc-empty">No products available.</div>
            )}

            {!loading &&
              featured.map((product) => (
                <a key={product.id} href="/product" className="fc-card">
                  <div className="fc-card-img">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span className="fc-card-img-placeholder">👟</span>
                    )}
                    <div className="fc-card-overlay">
                      {/* <button className="fc-card-overlay-btn">View Details</button> */}
                    </div>
                    <span className="fc-card-badge">{product.category}</span>
                  </div>
                  <div className="fc-card-body">
                    <div className="fc-card-name">{product.name}</div>
                    <div className="fc-card-price">{formatPrice(product.price)}</div>
                  </div>
                </a>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}