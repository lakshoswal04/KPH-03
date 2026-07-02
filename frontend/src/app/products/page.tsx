"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ProductFilters, type Filters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Reveal } from "@/components/ui/Reveal";
import { apiGet } from "@/lib/api";
import type { ProductList } from "@/types";

export default function ProductsPage() {
  const [filters, setFilters] = useState<Filters>({ tab: "all", subBrand: "", search: "" });

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
    <main className="min-h-screen bg-canvas px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">Birla Opus Range</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ivory-text">
          Every product,
          <br />
          in stock<span className="text-orange">.</span>
        </h1>
        <p className="mt-6 max-w-[420px] font-sans text-body text-muted">
          The complete Birla Opus catalogue — paints, waterproofing, wood finishes, and tools —
          ready for delivery across Pune.
        </p>
      </Reveal>

      <div className="mt-12">
        <ProductFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-10">
        {isLoading ? (
          <p className="py-20 text-center font-sans text-body text-muted">Loading products…</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </main>
  );
}
