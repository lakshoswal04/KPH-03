import { BrandTicker } from "@/components/home/BrandTicker";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ColourExplorer } from "@/components/home/ColourExplorer";
import { HeroSection } from "@/components/home/HeroSection";
import { PaintCalculator } from "@/components/home/PaintCalculator";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { SurveyCTA } from "@/components/home/SurveyCTA";
import { Testimonials } from "@/components/home/Testimonials";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <BrandTicker />
      <CategoryGrid />
      <ColourExplorer />
      <ProductShowcase />
      <PaintCalculator />
      <SurveyCTA />
      <Testimonials />
    </main>
  );
}
