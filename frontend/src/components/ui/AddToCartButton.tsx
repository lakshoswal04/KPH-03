"use client";

import { useState } from "react";

import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import type { Product, Variant } from "@/types";

/** Add-to-cart button with a transient "Added ✓" confirmation so the click
 * always gives visible feedback. Adds the smallest pack unless a variant is given. */
export function AddToCartButton({
  product,
  variant = null,
  quantity = 1,
  label = "Add to Cart",
  className,
}: {
  product: Product;
  variant?: Variant | null;
  quantity?: number;
  label?: string;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const onClick = () => {
    add(product, variant, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className={cn(
        "rounded-btn px-5 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[1.5px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange active:translate-y-0",
        added ? "bg-mint" : "bg-orange hover:bg-orange-deep",
        className,
      )}
    >
      {added ? "Added ✓" : label}
    </button>
  );
}
