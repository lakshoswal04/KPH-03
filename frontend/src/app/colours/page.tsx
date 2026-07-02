"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { WallPreview } from "@/components/colours/WallPreview";
import { Reveal } from "@/components/ui/Reveal";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Colour } from "@/types";

const FAMILIES = [
  "All",
  "Whites",
  "Yellows",
  "Oranges",
  "Reds",
  "Purples",
  "Blues",
  "Blue-Greens",
  "Greens",
  "Yellow-Greens",
  "Neutrals",
  "India Iconic",
];

function ColoursCatalogue() {
  const params = useSearchParams();
  const initialFamily = params.get("family") ?? "All";
  const [family, setFamily] = useState(
    FAMILIES.includes(initialFamily) ? initialFamily : "All",
  );
  const [selected, setSelected] = useState<Colour | null>(null);

  const { data: colours } = useQuery({
    queryKey: ["colours", "all"],
    queryFn: () => apiGet<Colour[]>("/colours"),
  });

  const visible = (colours ?? []).filter((c) => family === "All" || c.family === family);
  const preview = selected ?? visible[0] ?? null;

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">The Full Catalogue</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
          Find your
          <br />
          shade<span className="text-orange">.</span>
        </h1>
        <p className="mt-6 max-w-[420px] font-sans text-body text-ink-soft">
          Browse the Birla Opus families, tap any shade, and watch the wall repaint itself. Every
          shade is mixable in-store at Kamlesh.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[55%_45%]">
        <div>
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
                  <span className="block font-sans text-[13px] font-semibold text-ink">
                    {colour.name}
                  </span>
                  <span className="mt-0.5 block font-sans text-[11px] uppercase tracking-wider text-ink-soft">
                    {colour.family} · {colour.hex}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-[100px] lg:h-fit">
          {preview && (
            <>
              <WallPreview colour={preview.hex} />
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="font-display text-2xl font-bold text-ink">{preview.name}</p>
                  <p className="font-sans text-[12px] uppercase tracking-wider text-ink-soft">
                    {preview.family} · {preview.hex}
                  </p>
                </div>
                <a
                  href={`https://wa.me/91[YOUR WHATSAPP NUMBER]?text=${encodeURIComponent(`Hi Kamlesh Paints, I like the shade ${preview.name} (${preview.hex}). Please help me order it.`)}`}
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
