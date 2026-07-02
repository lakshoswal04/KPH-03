"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { useCart } from "@/hooks/useCart";
import { apiGet } from "@/lib/api";
import { SUB_BRAND_ACCENTS } from "@/lib/constants";
import { cn, priceRange } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import type { Product, ProductList } from "@/types";

const TABS: { id: string; label: string }[] = [
  { id: "interior", label: "Interior Paints" },
  { id: "exterior", label: "Exterior Paints" },
  { id: "waterproofing", label: "Waterproofing" },
  { id: "wood", label: "Wood Finishes" },
];

function MiniCan({ accent }: { accent: string }) {
  return (
    <div className="transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-[1.06]">
      <div className="mx-auto h-1.5 w-9 rounded-sm bg-ivory-text/25" />
      <div
        className="h-[100px] w-20 rounded-[6px_6px_14px_14px]"
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%), linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, black) 100%)`,
        }}
      />
    </div>
  );
}

function ShowcaseCard({ product }: { product: Product }) {
  const { add } = useCart();
  const accent = SUB_BRAND_ACCENTS[product.sub_brand] ?? "#C9A876";

  return (
    <div className="group cursor-pointer rounded-xl border border-ivory-text/5 bg-card p-6 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-1.5 hover:border-orange/40 hover:bg-card-raised">
      <div className="flex gap-6">
        <MiniCan accent={accent} />
        <div className="min-w-0">
          <p
            className="font-sans text-[10px] font-bold uppercase tracking-[2px]"
            style={{ color: accent }}
          >
            {product.sub_brand}
          </p>
          <h3 className="mt-1 font-display text-[20px] font-bold leading-[1.1] text-ivory-text">
            {product.name}
          </h3>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">
            {product.description}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {product.features.map((feature) => (
          <Badge key={feature}>{feature}</Badge>
        ))}
      </div>
      <p className="mt-4 font-sans text-lg font-semibold text-gold">
        {priceRange(product.price_low, product.price_high, product.price_unit)}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => add(product)}
          className="rounded-btn bg-orange px-5 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[1.5px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange active:translate-y-0"
        >
          Add to Cart
        </button>
        <Link
          href={`/products/${product.slug}`}
          className="font-sans text-[13px] font-semibold text-orange transition-opacity hover:opacity-75"
        >
          Enquire →
        </Link>
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const tab = useUiStore((s) => s.showcaseTab);
  const setTab = useUiStore((s) => s.setShowcaseTab);

  const { data } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiGet<ProductList>("/products"),
  });

  const visible = (data?.items ?? []).filter((p) => p.tab === tab);

  return (
    <section className="bg-card-deep px-6 py-section-y md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-gold">Our Products</p>
        <h2 className="mt-4 font-display text-section-h2 font-black text-ivory-text">
          What we
          <br />
          carry<span className="text-orange">.</span>
        </h2>
      </Reveal>

      {/* Tab row */}
      <div className="mt-10 flex flex-wrap gap-8 border-b border-ivory-text/10" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 py-2.5 font-sans text-[13px] font-semibold transition-colors duration-200",
              tab === t.id
                ? "border-orange text-ivory-text"
                : "border-transparent text-muted hover:text-ivory-text/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Product grid — active panel fades in */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          {visible.map((product) => (
            <ShowcaseCard key={product.id} product={product} />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
