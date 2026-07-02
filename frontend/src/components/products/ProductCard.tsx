"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/home/ProductShowcase";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/hooks/useCart";
import { SUB_BRAND_ACCENTS } from "@/lib/constants";
import { cn, priceRange } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const wished = useWishlistStore((s) => s.productIds.includes(product.id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const accent = SUB_BRAND_ACCENTS[product.sub_brand] ?? "#C9A876";

  return (
    <div className="group relative rounded-xl border border-ink/5 bg-paper shadow-card-warm p-6 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-1.5 hover:border-orange/40 hover:bg-paper">
      <button
        type="button"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => toggleWish(product.id)}
        className={cn(
          "absolute right-5 top-5 transition-colors duration-200",
          wished ? "text-coral" : "text-ink-soft hover:text-ink",
        )}
      >
        <Heart size={18} fill={wished ? "currentColor" : "none"} />
      </button>

      <div className="mx-auto flex h-[130px] w-fit items-center transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-[1.06]">
        <ProductImage product={product} className="h-[130px] w-28" />
      </div>

      <p className="mt-5 font-sans text-[10px] font-bold uppercase tracking-[2px]" style={{ color: accent }}>
        {product.sub_brand}
      </p>
      <Link href={`/products/${product.slug}`} className="mt-1 block">
        <h3 className="font-display text-[20px] font-bold leading-[1.1] text-ink transition-colors duration-200 group-hover:text-orange">
          {product.name}
        </h3>
      </Link>
      <p className="mt-2 line-clamp-2 font-sans text-[13px] leading-relaxed text-ink-soft">
        {product.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {product.features.slice(0, 3).map((feature) => (
          <Badge key={feature}>{feature}</Badge>
        ))}
      </div>
      <p className="mt-4 font-sans text-lg font-semibold text-orange-deep">
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
          View →
        </Link>
      </div>
    </div>
  );
}
