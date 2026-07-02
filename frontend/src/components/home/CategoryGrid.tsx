"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRef } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { apiGet } from "@/lib/api";
import type { Category } from "@/types";

const MAX_TILT_DEG = 8;

function TiltCard({ category, index }: { category: Category; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -2 * MAX_TILT_DEG;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * MAX_TILT_DEG;
    el.style.transition = "transform 0.05s linear";
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
    el.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
  };

  return (
    <Reveal delay={index * 0.08}>
      <Link
        href="/products"
        ref={ref}
        data-tilt
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group block cursor-pointer rounded-2xl border p-7 shadow-card-warm transition-[background-color,border-color,box-shadow] duration-[250ms] ease-out hover:shadow-card-lift"
        style={
          {
            transformStyle: "preserve-3d",
            borderColor: "rgba(26,26,10,0.06)",
            "--accent": category.accent,
            background: "#FFFFFF",
          } as React.CSSProperties
        }
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 8%, white)";
          e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 30%, transparent)";
        }}
        onMouseOut={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          e.currentTarget.style.background = "#FFFFFF";
          e.currentTarget.style.borderColor = "rgba(26,26,10,0.06)";
        }}
      >
        <span
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full text-[28px] transition-transform duration-[250ms] group-hover:scale-110"
          style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
          aria-hidden="true"
        >
          {category.emoji}
        </span>
        <h3 className="mt-5 font-display text-[22px] font-bold text-ink">{category.name}</h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-ink-soft">
          {category.description}
        </p>
        <span className="mt-5 flex items-center justify-between">
          <span
            className="font-sans text-xs font-semibold uppercase tracking-[1px]"
            style={{ color: category.accent }}
          >
            {category.count_label}
          </span>
          <span className="text-ink-soft transition-transform duration-[250ms] group-hover:translate-x-1">
            →
          </span>
        </span>
      </Link>
    </Reveal>
  );
}

export function CategoryGrid() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/categories"),
  });

  return (
    <section className="bg-paper px-6 py-section-y md:px-section-x">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <Reveal>
          <p className="font-sans text-label font-bold uppercase text-orange">
            Explore the Range
          </p>
          <h2 className="mt-4 font-display text-section-h2 font-bold text-ink">
            Everything your
            <br />
            project needs<span className="text-orange">.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Link
            href="/products"
            className="relative font-sans text-sm font-semibold text-orange after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 after:bg-orange after:transition-transform after:duration-[250ms] hover:after:scale-x-100"
          >
            View All Products →
          </Link>
        </Reveal>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(categories ?? []).map((category, i) => (
          <TiltCard key={category.id} category={category} index={i} />
        ))}
      </div>
    </section>
  );
}
