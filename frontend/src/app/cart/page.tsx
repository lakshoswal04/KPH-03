"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { useCart } from "@/hooks/useCart";
import { SUB_BRAND_ACCENTS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

export default function CartPage() {
  const { items, remove, setQuantity, total } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen bg-canvas px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">Your Order</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ivory-text">
          Cart<span className="text-orange">.</span>
        </h1>
      </Reveal>

      {!mounted ? null : items.length === 0 ? (
        <div className="mt-16 max-w-md">
          <p className="font-sans text-body text-muted">
            Your cart is empty. Browse the Birla Opus range and add what your project needs.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-btn bg-orange px-[34px] py-[15px] font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep"
          >
            Explore Products →
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map(({ product, quantity }) => {
              const accent = SUB_BRAND_ACCENTS[product.sub_brand] ?? "#C9A876";
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-5 rounded-xl border border-ivory-text/5 bg-card p-5"
                >
                  <span
                    className="h-14 w-11 shrink-0 rounded-[4px_4px_10px_10px]"
                    style={{
                      background: `linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, black) 100%)`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-sans text-[10px] font-bold uppercase tracking-[2px]"
                      style={{ color: accent }}
                    >
                      {product.sub_brand}
                    </p>
                    <Link
                      href={`/products/${product.slug}`}
                      className="block truncate font-display text-lg font-bold text-ivory-text transition-colors hover:text-orange"
                    >
                      {product.name}
                    </Link>
                    <p className="font-sans text-[13px] text-muted">
                      ₹{formatINR(product.price_low)} / {product.price_unit}
                    </p>
                  </div>
                  <div className="flex items-center rounded-btn border border-ivory-text/15">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      className="px-3 py-2 font-sans text-ivory-text transition-colors hover:text-orange"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-sans text-sm font-semibold text-ivory-text">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      className="px-3 py-2 font-sans text-ivory-text transition-colors hover:text-orange"
                    >
                      +
                    </button>
                  </div>
                  <p className="w-24 text-right font-sans text-base font-semibold text-gold">
                    ₹{formatINR(product.price_low * quantity)}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => remove(product.id)}
                    className="text-muted transition-colors hover:text-coral"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-[20px] bg-ink p-8 lg:sticky lg:top-[100px]">
            <h2 className="font-display text-2xl font-bold text-ivory-text">Summary</h2>
            <div className="mt-6 space-y-3 border-b border-ivory-text/10 pb-6">
              <div className="flex justify-between font-sans text-sm text-muted">
                <span>Items</span>
                <span>₹{formatINR(total)}</span>
              </div>
              <div className="flex justify-between font-sans text-sm text-muted">
                <span>Delivery (Pune)</span>
                <span className="text-mint">Free</span>
              </div>
            </div>
            <div className="mt-5 flex justify-between font-sans text-lg font-semibold text-ivory-text">
              <span>Total</span>
              <span className="text-gold">₹{formatINR(total)}</span>
            </div>
            <p className="mt-2 font-sans text-[12px] text-muted">
              Estimated from base prices — final billing confirmed on shade and pack size.
            </p>
            <Link
              href="/checkout"
              className="mt-6 block w-full rounded bg-orange p-4 text-center font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep"
            >
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
