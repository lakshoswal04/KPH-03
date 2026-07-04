"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { Faq, Product } from "@/types";

/** Ordered spec rows rendered only when the product has an official value. */
function specRows(p: Product): [string, string][] {
  const rows: [string, string | null | undefined][] = [
    ["Finish", p.finish],
    ["Coverage", p.coverage],
    ["Coats", p.coats],
    ["Drying time", p.drying_time],
    ["Application", p.application_method],
    ["Interior / Exterior", p.interior_exterior],
    ["Pack sizes", p.pack_sizes?.join(", ") || null],
    ["Suitable surfaces", p.suitable_surfaces?.join(", ") || null],
    ["SKU", p.sku],
  ];
  const extra = Object.entries(p.tech_specs ?? {});
  return [...rows, ...extra].filter(([, v]) => Boolean(v)) as [string, string][];
}

export function ProductSpecs({ product }: { product: Product }) {
  const rows = specRows(product);
  if (rows.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-[26px] font-black text-ink">Specifications</h2>
      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/8">
        <table className="w-full font-sans text-[14px]">
          <tbody>
            {rows.map(([label, value], i) => (
              <tr key={label} className={i % 2 ? "bg-paper" : "bg-cream/40"}>
                <th className="w-[42%] px-5 py-3 text-left font-semibold text-ink-soft align-top">
                  {label}
                </th>
                <td className="px-5 py-3 text-ink">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ProductBenefits({ product }: { product: Product }) {
  const benefits = product.benefits ?? [];
  const uses = product.uses ?? [];
  if (benefits.length === 0 && uses.length === 0) return null;
  return (
    <section className="mt-14 grid gap-8 sm:grid-cols-2">
      {benefits.length > 0 && (
        <div>
          <h2 className="font-display text-[22px] font-black text-ink">Benefits</h2>
          <ul className="mt-4 space-y-2">
            {benefits.map((b) => (
              <li key={b} className="flex gap-2 font-sans text-[14px] text-ink-soft">
                <span className="mt-1 text-orange">✓</span> {b}
              </li>
            ))}
          </ul>
        </div>
      )}
      {uses.length > 0 && (
        <div>
          <h2 className="font-display text-[22px] font-black text-ink">Uses</h2>
          <ul className="mt-4 space-y-2">
            {uses.map((u) => (
              <li key={u} className="flex gap-2 font-sans text-[14px] text-ink-soft">
                <span className="mt-1 text-orange">•</span> {u}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ProductFaqs({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-[26px] font-black text-ink">Frequently asked questions</h2>
      <div className="mt-5 divide-y divide-ink/8 rounded-2xl border border-ink/8">
        {faqs.map((f, i) => (
          <div key={f.q}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={open === i}
            >
              <span className="font-sans text-[15px] font-semibold text-ink">{f.q}</span>
              <ChevronDown
                size={18}
                className={cn("shrink-0 text-ink-soft transition-transform", open === i && "rotate-180")}
              />
            </button>
            {open === i && (
              <p className="px-5 pb-5 font-sans text-[14px] leading-relaxed text-ink-soft">{f.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
