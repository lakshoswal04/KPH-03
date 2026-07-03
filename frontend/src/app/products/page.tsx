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
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiGet<ProductList>("/products"),
  });

  const products = (data?.items ?? []).filter((p) => {
    if (filters.tab !== "all" && p.tab !== filters.tab) return false;
    if (filters.subBrand && p.sub_brand !== filters.subBrand) return false;
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    return true;
  });

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

      <div className="mt-10">
        {isLoading ? (
          <p className="py-20 text-center font-sans text-body text-ink-soft">Loading products…</p>
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
