"use client";

import { useWishlistStore } from "@/store/wishlistStore";

/** Favourites/wishlist convenience hook, mirroring useCart. */
export function useWishlist() {
  const productIds = useWishlistStore((s) => s.productIds);
  const toggle = useWishlistStore((s) => s.toggle);
  const has = useWishlistStore((s) => s.has);

  return { productIds, toggle, has, count: productIds.length };
}
