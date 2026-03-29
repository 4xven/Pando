import Header from "./components/shared/header";
import Hero from "./components/hero";
import CollectionSection from "./components/collectSection";
import Footer from "./components/shared/footer";
import AboutSection from "./components/about";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />

      <CollectionSection

        heading="For Men"
        description="The Men's collection features a sleek and refined design that reflects confidence and sophistication. With structured layouts, rich earthy tones, and bold presentation, the section highlights timeless footwear styles crafted for both comfort and class. The clean composition keeps the focus on quality and detail, creating a strong and modern shopping experience."
        image="/male.png"
      />

      {/* WOMEN */}
      <CollectionSection

        heading="For Women"
        description="The Women's collection embraces elegance and simplicity with a soft, graceful presentation. Light tones, balanced spacing, and smooth rounded elements enhance the refined look of the footwear. The minimal layout allows each design to stand out beautifully, offering a stylish and seamless browsing experience."
        image="/female.png"
        reverse
      />

  

      <Footer />
    </main>
  );
}
