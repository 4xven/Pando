import Header from "./components/shared/header";
import Hero from "./components/hero";
import CollectionSection from "./components/collectSection";
import CarouselSection from "./components/carouselSection";
import Footer from "./components/shared/footer";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />

      {/* Stats bar */}
      <div style={{
        background: "#2a1508",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderTop: "1px solid rgba(184,134,78,0.15)",
        borderBottom: "1px solid rgba(184,134,78,0.15)",
      }}>
        {[
          { value: "2015", label: "Founded" },
          { value: "10+",  label: "Years of craft" },
          { value: "15000+", label: "Pairs handmade" },
          { value: "1",    label: "City, one legacy" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "32px 20px",
            textAlign: "center",
            borderRight: i < 3 ? "1px solid rgba(184,134,78,0.1)" : "none",
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "2.2rem",
              fontWeight: 300,
              color: "#d4a96a",
              lineHeight: 1,
              marginBottom: 6,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: "0.62rem",
              fontWeight: 400,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(200,168,120,0.5)",
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Marquee strip */}
      <div style={{
        background: "#2a1508",
        overflow: "hidden",
        borderBottom: "1px solid rgba(184,134,78,0.15)",
        padding: 0,
      }}>
        <style>{`
          @keyframes pando-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .pando-marquee-track {
            display: flex;
            width: max-content;
            animation: pando-marquee 28s linear infinite;
          }
          .pando-marquee-item {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 0.9rem;
            font-weight: 300;
            font-style: italic;
            color: rgba(184,134,78,0.45);
            white-space: nowrap;
            padding: 14px 40px;
            letter-spacing: 0.08em;
            display: flex;
            align-items: center;
            gap: 28px;
          }
          .pando-marquee-dot {
            width: 3px; height: 3px;
            border-radius: 50%;
            background: rgba(184,134,78,0.3);
            display: inline-block;
            flex-shrink: 0;
          }
        `}</style>
        <div className="pando-marquee-track">
          {[
            "Handcrafted in Marikina",
            "Full Grain Leather",
            "Shoe Capital of the Philippines",
            "Est. 2015",
            "Heritage Craftsmanship",
            "Built to Last",
            "Handcrafted in Marikina",
            "Full Grain Leather",
            "Shoe Capital of the Philippines",
            "Est. 2015",
            "Heritage Craftsmanship",
            "Built to Last",
          ].map((text, i) => (
            <span key={i} className="pando-marquee-item">
              {text}
              <span className="pando-marquee-dot" />
            </span>
          ))}
        </div>
      </div>

      {/* Men's Collection */}
      <CollectionSection
        eyebrow="For Him"
        heading="Built for the man who values"
        headingItalic="craftsmanship."
        description="The men's collection features a sleek and refined design that reflects confidence and sophistication. With structured layouts, rich earthy tones, and bold presentation, the section highlights timeless footwear styles crafted for both comfort and class."
        image="/male2.png"
        href="/product"
      />

      {/* Women's Collection */}
      <CollectionSection
        eyebrow="For Her"
        heading="Elegance in every stitch,"
        headingItalic="every step."
        description="The women's collection embraces elegance and simplicity with a soft, graceful presentation. Light tones, balanced spacing, and smooth rounded elements enhance the refined look of the footwear, offering a stylish and seamless browsing experience."
        image="/female1.png"
        href="/product"
        reverse
      />

      {/* Featured products from Firestore */}
      <CarouselSection />

      {/* Values strip */}
      <div style={{
        background: "#2a1508",
        padding: "80px 60px",
        position: "relative",
        overflow: "hidden",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          .pando-values-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 35px;
            max-width: 1100px;
            margin: 0 auto;
          }
          .pando-value-card {
            background: rgba(255,255,255,0.03);
            padding: 40px 32px;
            border: 1px solid rgba(90,52,28,0.15);
            transition: background 0.35s;
            position: relative;
          }
          .pando-value-card::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 2px;
            background: #b8864e;
            transform: scaleX(0);
            transition: transform 0.35s;
            transform-origin: left;
          }
          .pando-value-card:hover { background: rgba(184,134,78,0.08); }
          .pando-value-card:hover::after { transform: scaleX(1); }
          @media (max-width: 800px) {
            .pando-values-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 600px) {
            .pando-values-section { padding: 60px 24px !important; }
          }
        `}</style>

        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.62rem",
            fontWeight: 500,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: "#b8864e",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}>
            <span style={{ display: "block", width: 28, height: 1, background: "#b8864e" }} />
            Why Pando
            <span style={{ display: "block", width: 28, height: 1, background: "#b8864e" }} />
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            fontWeight: 300,
            color: "#f5ebe0",
            lineHeight: 1.25,
          }}>
            Every pair tells a story<br />of <em>dedication.</em>
          </h2>
        </div>

        <div className="pando-values-grid">
          {[
            {
              num: "01",
              title: "Heritage Craft",
              text: "Every pair is hand-lasted and hand-stitched by master craftsmen who have practiced their art for decades in Marikina.",
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d4a96a" strokeWidth="1.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
            },
            {
              num: "02",
              title: "Premium Materials",
              text: "We source only full-grain leather and natural materials, ensuring your shoes develop a rich patina and last for years.",
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d4a96a" strokeWidth="1.2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2 2 4-4" />
                </svg>
              ),
            },
            {
              num: "03",
              title: "Community First",
              text: "By choosing Pando, you support local Marikina artisans and help preserve a tradition that defines this city's identity.",
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d4a96a" strokeWidth="1.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
          ].map((v) => (
            <div key={v.num} className="pando-value-card">
              <p style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "0.58rem",
                fontWeight: 500,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#b8864e",
                opacity: 0.7,
                marginBottom: 18,
              }}>
                {v.num}
              </p>
              <div style={{ color: "#d4a96a", opacity: 0.85, marginBottom: 16 }}>
                {v.icon}
              </div>
              <h3 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1.1rem",
                fontWeight: 400,
                color: "#f0e4d2",
                marginBottom: 12,
                lineHeight: 1.3,
              }}>
                {v.title}
              </h3>
              <p style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "0.8rem",
                fontWeight: 300,
                color: "rgba(200,180,155,0.7)",
                lineHeight: 1.85,
              }}>
                {v.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}