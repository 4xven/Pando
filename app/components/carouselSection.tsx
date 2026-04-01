"use client";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  badge: string;
  image: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Classic Oxford",
    price: 4250,
    category: "Formal",
    badge: "Men's",
    image: "/product1.jpg",
  },
  {
    id: 2,
    name: "Leather Derby",
    price: 4800,
    category: "Formal",
    badge: "Men's",
    image: "/product2.jpg",
  },
  {
    id: 3,
    name: "Chelsea Boots",
    price: 5200,
    category: "Formal",
    badge: "Men's",
    image: "/product3.jpg",
  },
  {
    id: 4,
    name: "Stiletto Heels",
    price: 2800,
    category: "Casual",
    badge: "Women's",
    image: "/product4.jpg",
  },
  {
    id: 5,
    name: "Pointed Flats",
    price: 2600,
    category: "Casual",
    badge: "Women's",
    image: "/product5.jpg",
  },
];

export default function CarouselSection() {
  const formatPrice = (price: number) =>
    "₱" + new Intl.NumberFormat("en-PH").format(price);

  return (
    <section style={{ padding: "60px 20px", background: "#E8DFD3" }}>
      
      {/* TITLE */}
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto 20px"
      }}>
        <h2 style={{
          fontSize: "1.8rem",
          fontWeight: 700,
          color: "#3C2415"
        }}>
          Featured Collection
        </h2>
      </div>

      {/* SCROLL CONTAINER */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          overflowX: "auto",
          display: "flex",
          gap: "20px",
          scrollSnapType: "x mandatory",
          paddingBottom: "10px",
        }}
        className="no-scrollbar"
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              minWidth: "280px",
              flex: "0 0 auto",
              scrollSnapAlign: "start",
              background: "#f3efea",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(60,36,21,0.08)",
            }}
          >
            {/* IMAGE */}
            <div style={{
              width: "100%",
              height: "180px",
              background: "#ddd"
            }}>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            </div>

            {/* CONTENT */}
            <div style={{ padding: "12px" }}>
              <h3 style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#3C2415"
              }}>
                {product.name}
              </h3>

              <p style={{
                fontSize: "0.75rem",
                color: "#8b6f5a",
                marginBottom: "6px"
              }}>
                {product.category}
              </p>

              <span style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#A0522D"
              }}>
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* HIDE SCROLLBAR */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}