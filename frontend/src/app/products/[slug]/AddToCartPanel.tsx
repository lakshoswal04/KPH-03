"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types";

export function AddToCartPanel({ product }: { product: Product }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
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
        className="rounded-btn bg-orange px-8 py-[15px] font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep hover:shadow-orange-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange active:translate-y-0"
      >
        {added ? "Added ✓" : "Add to Cart"}
      </button>
      <Link
        href={`/contact?product=${product.slug}`}
        className="font-sans text-sm font-semibold text-orange transition-opacity hover:opacity-75"
      >
        Enquire about bulk pricing →
      </Link>
    </div>
  );
}
