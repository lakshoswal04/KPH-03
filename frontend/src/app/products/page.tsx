"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ProductFilters, type Filters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Reveal } from "@/components/ui/Reveal";
import { apiGet } from "@/lib/api";
import type { ProductList, ProductTab } from "@/types";

const VALID_TABS: (ProductTab | "all")[] = [
  "all",
  "interior",
  "exterior",
  "waterproofing",
  "wood",
  "tools",
  "hardware",
];

function ProductsBrowser() {
  // Deep-link support: /products?tab=hardware pre-selects that filter.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as ProductTab | "all" | null;
  const [filters, setFilters] = useState<Filters>({
    tab: initialTab && VALID_TABS.includes(initialTab) ? initialTab : "all",
    subBrand: "",
    search: "",
    sort: "featured",
    inStock: false,
    priceMax: 0,
  });

  // Server-side filtering/sorting via the products API query params.
  const qs = new URLSearchParams();
  if (filters.tab !== "all") qs.set("tab", filters.tab);
  if (filters.subBrand) qs.set("sub_brand", filters.subBrand);
  if (filters.search) qs.set("search", filters.search);
  if (filters.sort) qs.set("sort", filters.sort);
  if (filters.inStock) qs.set("in_stock", "true");
  if (filters.priceMax > 0) qs.set("price_max", String(filters.priceMax));

  const { data, isLoading } = useQuery({
    queryKey: ["products", qs.toString()],
    queryFn: () => apiGet<ProductList>(`/products?${qs.toString()}`),
    placeholderData: (prev) => prev,
  });

  const products = data?.items ?? [];

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">Birla Opus Range</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
          Every product,
          <br />
          in stock<span className="text-orange">.</span>
        </h1>
        <p className="mt-6 max-w-[420px] font-sans text-body text-ink-soft">
          The complete Birla Opus catalogue — paints, waterproofing, wood finishes, tools, and
          hardware — ready for delivery across Pune.
        </p>
      </Reveal>

      <div className="mt-12">
        <ProductFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-6 font-sans text-[13px] text-ink-soft">
        {isLoading ? "Loading…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="py-20 text-center font-sans text-body text-ink-soft">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="py-20 text-center font-sans text-body text-ink-soft">
            No products match your filters.
          </p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream" />}>
      <ProductsBrowser />
    </Suspense>
  );
}
