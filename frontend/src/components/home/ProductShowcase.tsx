"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { apiGet } from "@/lib/api";
import { SUB_BRAND_ACCENTS } from "@/lib/constants";
import { cn, priceRange } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlistStore";
import { useUiStore } from "@/store/uiStore";
import type { Product, ProductList } from "@/types";

const TABS: { id: string; label: string }[] = [
  { id: "interior", label: "Interior Paints" },
  { id: "exterior", label: "Exterior Paints" },
  { id: "enamels", label: "Enamels" },
  { id: "waterproofing", label: "Waterproofing" },
  { id: "wood", label: "Wood Finishes" },
];

export function ProductImage({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const accent = SUB_BRAND_ACCENTS[product.sub_brand] ?? "#C9A876";
  // Labelled placeholder for products without a local packshot (e.g. tools),
  // and the fallback when a real image path fails to load.
  const placeholder = `https://placehold.co/300x300/${accent.replace("#", "")}/FFFFFF/png?text=${encodeURIComponent(product.name)}`;
  const [src, setSrc] = useState(product.image_url ?? placeholder);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={product.name}
      onError={() => src !== placeholder && setSrc(placeholder)}
      className={cn("object-contain drop-shadow-lg", className)}
    />
  );
}

function ShowcaseCard({ product }: { product: Product }) {
  const accent = SUB_BRAND_ACCENTS[product.sub_brand] ?? "#C9A876";
  const wished = useWishlistStore((s) => s.productIds.includes(product.id));
  const toggleWish = useWishlistStore((s) => s.toggle);

  return (
    <div className="group relative cursor-pointer rounded-2xl border border-ink/[0.07] bg-paper p-6 shadow-card-warm transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:border-orange/30 hover:shadow-card-lift">
      <button
        type="button"
        aria-label={wished ? "Remove from favourites" : "Add to favourites"}
        onClick={() => toggleWish(product.id)}
        className={cn(
          "absolute right-5 top-5 z-[1] transition-colors duration-200",
          wished ? "text-coral" : "text-ink-soft hover:text-ink",
        )}
      >
        <Heart size={18} fill={wished ? "currentColor" : "none"} />
      </button>
      <div className="flex gap-6">
        <div className="flex w-24 shrink-0 items-start justify-center transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-[1.06]">
          <ProductImage product={product} className="h-[110px] w-24" />
        </div>
        <div className="min-w-0">
          <p
            className="font-sans text-[10px] font-bold uppercase tracking-[2px]"
            style={{ color: accent }}
          >
            {product.sub_brand}
          </p>
          <h3 className="mt-1 font-display text-[20px] font-bold leading-[1.1] text-ink">
            {product.name}
          </h3>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-ink-soft">
            {product.description}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {product.features.map((feature) => (
          <Badge key={feature}>{feature}</Badge>
        ))}
      </div>
      <p className="mt-4 font-sans text-lg font-semibold text-orange-deep">
        {priceRange(product.price_low, product.price_high, product.price_unit)}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <AddToCartButton product={product} />
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
    <section className="bg-paper px-6 py-section-y md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">Our Products</p>
        <h2 className="mt-4 font-display text-section-h2 font-black text-ink">
          What we
          <br />
          carry<span className="text-orange">.</span>
        </h2>
      </Reveal>

      {/* Tab row */}
      <div className="mt-10 flex flex-wrap gap-8 border-b border-ink/10" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 py-2.5 font-sans text-[13px] font-semibold transition-colors duration-200",
              tab === t.id
                ? "border-orange text-ink"
                : "border-transparent text-ink-soft hover:text-ink",
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
