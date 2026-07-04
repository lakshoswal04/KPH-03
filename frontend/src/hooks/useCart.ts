"use client";

import { cartLineKey, useCartStore } from "@/store/cartStore";
import type { CartItem } from "@/types";

/** Unit price for a cart line: the chosen variant's price, else base price_low. */
export function lineUnitPrice(item: CartItem): number {
  return item.variant?.price ?? item.product.price_low;
}

export function useCart() {
  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clear = useCartStore((s) => s.clear);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + lineUnitPrice(i) * i.quantity, 0);

  return { items, add, remove, setQuantity, clear, count, total, keyOf: cartLineKey };
}
