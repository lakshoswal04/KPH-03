"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { WallPreview } from "@/components/colours/WallPreview";
import { Reveal } from "@/components/ui/Reveal";
import { apiGet } from "@/lib/api";
import { whatsappHref } from "@/lib/business";
import { cn } from "@/lib/utils";
import type { Colour } from "@/types";

const FAMILIES = [
  "All",
  "Whites",
  "Yellows",
  "Yellow-Greens",
  "Greens",
  "Blue-Greens",
  "Blues",
  "Purples",
  "Reds",
  "Oranges",
  "Neutrals",
];

const PAGE_SIZE = 120;

function ColoursCatalogue() {
  const params = useSearchParams();
  const initialFamily = params.get("family") ?? "All";
  const [family, setFamily] = useState(
    FAMILIES.includes(initialFamily) ? initialFamily : "All",
  );
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Colour | null>(null);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch.trim()), 250);
    return () => clearTimeout(t);
  }, [rawSearch]);

  // Reset paging whenever the filter changes.
  useEffect(() => setLimit(PAGE_SIZE), [family, search]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (family !== "All") p.set("family", family);
    if (search) p.set("search", search);
    p.set("limit", String(limit));
    return p.toString();
  }, [family, search, limit]);

  const { data: colours, isFetching } = useQuery({
    queryKey: ["colours", qs],
    queryFn: () => apiGet<Colour[]>(`/colours?${qs}`),
    placeholderData: keepPreviousData,
  });

  const visible = colours ?? [];
  const preview = selected ?? visible[0] ?? null;
  const canLoadMore = visible.length >= limit;

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">The Full Catalogue</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
          Find your
          <br />
          shade<span className="text-orange">.</span>
        </h1>
        <p className="mt-6 max-w-[460px] font-sans text-body text-ink-soft">
          Browse all 2,322 Birla Opus shades by family or search by name and code. Tap any shade
          to preview it on a wall. Every colour is mixable in-store at Kamlesh.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[55%_45%]">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2.5">
              {FAMILIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFamily(f)}
                  className={cn(
                    "rounded-full px-4 py-1.5 font-sans text-[12px] font-semibold transition-colors duration-200",
                    family === f
                      ? "bg-orange text-white"
                      : "border border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-5">
            <input
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Search by shade name or code (e.g. Indigo, BB 5018)…"
              className="w-full rounded-full border border-ink/15 bg-paper px-5 py-2.5 font-sans text-[13px] text-ink placeholder:text-ink-faint focus:border-orange focus:outline-none"
            />
            {isFetching && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-sans text-[11px] text-ink-faint">
                loading…
              </span>
            )}
          </div>

          {visible.length === 0 && !isFetching ? (
            <p className="mt-10 font-sans text-[14px] text-ink-soft">
              No shades match “{search}”. Try another name or code.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((colour) => (
                <button
                  key={colour.id}
                  type="button"
                  onClick={() => setSelected(colour)}
                  className={cn(
                    "swatch group overflow-hidden rounded-xl border text-left transition-[transform,border-color] duration-200 hover:-translate-y-1",
                    preview?.id === colour.id
                      ? "border-ink"
                      : "border-ink/10 hover:border-ink/40",
                  )}
                >
                  <span className="block h-20 w-full" style={{ background: colour.hex }} />
                  <span className="block p-3">
                    <span className="block truncate font-sans text-[13px] font-semibold text-ink">
                      {colour.name}
                    </span>
                    <span className="mt-0.5 block font-sans text-[11px] uppercase tracking-wider text-ink-soft">
                      {colour.code ? `${colour.code} · ` : ""}
                      {colour.hex}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {canLoadMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE_SIZE)}
                disabled={isFetching}
                className="rounded-full border border-ink/20 px-6 py-2.5 font-sans text-[13px] font-semibold text-ink transition-colors hover:border-orange hover:text-orange disabled:opacity-50"
              >
                {isFetching ? "Loading…" : "Load more shades"}
              </button>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-[100px] lg:h-fit">
          {preview && (
            <>
              <WallPreview colour={preview.hex} />
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="font-display text-2xl font-bold text-ink">{preview.name}</p>
                  <p className="font-sans text-[12px] uppercase tracking-wider text-ink-soft">
                    {preview.code ? `${preview.code} · ` : ""}
                    {preview.family} · {preview.hex}
                  </p>
                </div>
                <a
                  href={whatsappHref(`Hi Kamlesh Paints, I like the shade ${preview.name}${preview.code ? ` (${preview.code})` : ""} — ${preview.hex}. Please help me order it.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm font-semibold text-orange transition-opacity hover:opacity-75"
                >
                  Ask about this shade →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ColoursPage() {
  return (
    <Suspense>
      <ColoursCatalogue />
    </Suspense>
  );
}
