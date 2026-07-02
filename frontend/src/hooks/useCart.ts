"use client";

import { useCartStore } from "@/store/cartStore";

export function useCart() {
  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clear = useCartStore((s) => s.clear);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  // Unit price mirrors the backend: price_low per unit; server recomputes anyway.
  const total = items.reduce((sum, i) => sum + i.product.price_low * i.quantity, 0);

  return { items, add, remove, setQuantity, clear, count, total };
}
