"use client";

import type { ReactNode } from "react";

import { cn, formatINR } from "@/lib/utils";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card-warm">
      <p className="font-sans text-[11px] font-bold uppercase tracking-[1.5px] text-ink-soft">
        {label}
      </p>
      <p className="mt-2 font-display text-[26px] font-black text-ink" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-1 font-sans text-[12px] text-ink-soft">{sub}</p>}
    </div>
  );
}

export function money(n: number): string {
  return `₹${formatINR(n)}`;
}

const PILL: Record<string, string> = {
  // orders
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-violet-100 text-violet-700",
  out_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  refunded: "bg-slate-200 text-slate-700",
  // stock
  in_stock: "bg-emerald-100 text-emerald-700",
  low: "bg-amber-100 text-amber-700",
  out: "bg-rose-100 text-rose-700",
  // generic
  new: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  replied: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-200 text-slate-600",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold capitalize",
        PILL[status] ?? "bg-ink/8 text-ink-soft",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function StatusSelect({
  value,
  options,
  onChange,
  pending,
}: {
  value: string;
  options: string[];
  onChange: (next: string) => void;
  pending?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-ink/15 bg-cream px-3 py-1.5 font-sans text-[12px] font-semibold text-ink focus:border-orange focus:outline-none disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}

/** Horizontally scrollable table wrapper that never breaks the page layout. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/8 bg-paper">
      <table className="w-full min-w-[640px] font-sans text-[13px]">{children}</table>
    </div>
  );
}

export function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-[24px] font-black text-ink">{title}</h2>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
