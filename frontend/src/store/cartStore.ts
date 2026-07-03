import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem, Product, Variant } from "@/types";

/** A cart line is identified by product + chosen variant, so the same product
 * in two pack sizes is two lines. */
function lineKey(productId: number, variant: Variant | null): string {
  return `${productId}::${variant?.label ?? ""}`;
}

interface CartState {
  items: CartItem[];
  add: (product: Product, variant?: Variant | null, quantity?: number) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

export const cartLineKey = (item: CartItem): string =>
  lineKey(item.product.id, item.variant);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, variant = null, quantity = 1) =>
        set((state) => {
          // Default to the smallest pack when a variant isn't specified.
          const chosen = variant ?? product.variants?.[0] ?? null;
          const key = lineKey(product.id, chosen);
          const existing = state.items.find(
            (i) => lineKey(i.product.id, i.variant) === key,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                lineKey(i.product.id, i.variant) === key
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { product, variant: chosen, quantity }] };
        }),
      remove: (key) =>
        set((state) => ({
          items: state.items.filter((i) => lineKey(i.product.id, i.variant) !== key),
        })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => lineKey(i.product.id, i.variant) !== key)
              : state.items.map((i) =>
                  lineKey(i.product.id, i.variant) === key ? { ...i, quantity } : i,
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "kph-cart" },
  ),
);
