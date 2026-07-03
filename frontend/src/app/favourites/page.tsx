"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import Link from "next/link";

import { ProductGrid } from "@/components/products/ProductGrid";
import { Reveal } from "@/components/ui/Reveal";
import { useWishlist } from "@/hooks/useWishlist";
import { apiGet } from "@/lib/api";
import type { ProductList } from "@/types";

export default function FavouritesPage() {
  const { productIds, count } = useWishlist();

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiGet<ProductList>("/products"),
  });

  const favourites = (data?.items ?? []).filter((p) => productIds.includes(p.id));

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">Saved for later</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
          Your favourites
          <span className="text-orange">.</span>
        </h1>
        <p className="mt-6 max-w-[440px] font-sans text-body text-ink-soft">
          {count > 0
            ? `${count} product${count > 1 ? "s" : ""} you've hearted. Add any of them to your cart when you're ready.`
            : "Tap the heart on any product to save it here for later."}
        </p>
      </Reveal>

      <div className="mt-12">
        {isLoading ? (
          <p className="py-20 text-center font-sans text-body text-ink-soft">Loading…</p>
        ) : favourites.length > 0 ? (
          <ProductGrid products={favourites} />
        ) : (
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-ink/15 bg-paper/60 py-20 text-center">
            <Heart size={40} className="text-coral" />
            <div>
              <p className="font-display text-xl font-bold text-ink">No favourites yet</p>
              <p className="mt-2 font-sans text-body text-ink-soft">
                Browse the range and tap the heart on any product to save it.
              </p>
            </div>
            <Link
              href="/products"
              className="rounded-btn bg-orange px-6 py-3 font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep"
            >
              Browse products
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
