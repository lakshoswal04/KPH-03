"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/hooks/useCart";
import { cn, formatINR } from "@/lib/utils";
import type { Product } from "@/types";

export function AddToCartPanel({ product }: { product: Product }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [variantIdx, setVariantIdx] = useState(0);

  const variants = product.variants ?? [];
  const selected = variants[variantIdx] ?? null;
  const unitPrice = selected?.price ?? product.price_low;
  const sizeLabel = product.price_unit === "unit" ? "Size" : "Pack size";

  const onAdd = () => {
    add(product, selected, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-8">
      {variants.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 font-sans text-label font-bold uppercase text-ink-soft">
            {sizeLabel}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {variants.map((v, i) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setVariantIdx(i)}
                className={cn(
                  "rounded-btn border px-4 py-2.5 font-sans text-sm font-semibold transition-colors duration-200",
                  i === variantIdx
                    ? "border-orange bg-orange text-white"
                    : "border-ink/15 text-ink hover:border-orange/60",
                )}
              >
                {v.label}
                <span className={cn("ml-2 text-[12px]", i === variantIdx ? "text-white/80" : "text-ink-soft")}>
                  ₹{formatINR(v.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-btn border border-ink/15">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-3 font-sans text-ink transition-colors hover:text-orange"
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center font-sans text-sm font-semibold text-ink">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(500, q + 1))}
            className="px-4 py-3 font-sans text-ink transition-colors hover:text-orange"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            "rounded-btn px-8 py-[15px] font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-orange-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange active:translate-y-0",
            added ? "bg-mint" : "bg-orange hover:bg-orange-deep",
          )}
        >
          {added ? "Added ✓" : `Add to Cart · ₹${formatINR(unitPrice * quantity)}`}
        </button>
        <Link
          href={`/contact?product=${product.slug}`}
          className="font-sans text-sm font-semibold text-orange transition-opacity hover:opacity-75"
        >
          Enquire about bulk pricing →
        </Link>
      </div>
    </div>
  );
}
