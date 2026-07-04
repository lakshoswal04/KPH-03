"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProductTab } from "@/types";

export interface Filters {
  tab: ProductTab | "all";
  subBrand: string;
  search: string;
  sort: string;
  inStock: boolean;
  priceMax: number;
}

const SORT_OPTIONS: { id: string; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price_asc", label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "name", label: "Name A–Z" },
  { id: "newest", label: "Newest" },
];

const PRICE_CAPS = [500, 1000, 2500, 5000];

const TAB_OPTIONS: { id: Filters["tab"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "interior", label: "Interior Paints" },
  { id: "exterior", label: "Exterior Paints" },
  { id: "enamels", label: "Enamels" },
  { id: "waterproofing", label: "Waterproofing" },
  { id: "wood", label: "Wood Finishes" },
  { id: "primers", label: "Primers & Putty" },
  { id: "tools", label: "Tools" },
  { id: "hardware", label: "Hardware" },
];

const SUB_BRANDS = ["ONE", "ONE PRO", "CALISTA", "STYLE", "ALLDRY", "ALLWOOD", "TOOLS", "HARDWARE"];

export function ProductFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange({ ...filters, tab: tab.id })}
            className={cn(
              "rounded-full px-5 py-2 font-sans text-[13px] font-semibold transition-colors duration-200",
              filters.tab === tab.id
                ? "bg-orange text-white"
                : "border border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-[280px] flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search products…"
            className="w-full rounded-full border border-ink/10 bg-ivory-text/5 py-2.5 pl-10 pr-4 font-sans text-sm text-ink placeholder:text-ink-faint focus:border-orange focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SUB_BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() =>
                onChange({ ...filters, subBrand: filters.subBrand === brand ? "" : brand })
              }
              className={cn(
                "rounded-full border px-3.5 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[1.5px] transition-colors duration-200",
                filters.subBrand === brand
                  ? "border-gold bg-gold text-ink"
                  : "border-ink/15 text-ink-soft hover:border-gold/60 hover:text-orange-deep",
              )}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          className="rounded-full border border-ink/15 bg-paper px-4 py-2 font-sans text-[13px] font-semibold text-ink focus:border-orange focus:outline-none"
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-2 font-sans text-[13px] font-semibold text-ink-soft">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ ...filters, inStock: e.target.checked })}
            className="accent-orange"
          />
          In stock only
        </label>

        <div className="flex flex-wrap gap-2">
          {PRICE_CAPS.map((cap) => (
            <button
              key={cap}
              type="button"
              onClick={() =>
                onChange({ ...filters, priceMax: filters.priceMax === cap ? 0 : cap })
              }
              className={cn(
                "rounded-full border px-3 py-1.5 font-sans text-[12px] font-semibold transition-colors",
                filters.priceMax === cap
                  ? "border-orange bg-orange/10 text-orange-deep"
                  : "border-ink/15 text-ink-soft hover:border-orange/50",
              )}
            >
              ≤ ₹{cap.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
