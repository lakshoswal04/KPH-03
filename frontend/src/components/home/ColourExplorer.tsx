"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ColourSwatch } from "@/components/colours/ColourSwatch";
import { WallPreview } from "@/components/colours/WallPreview";
import { Reveal } from "@/components/ui/Reveal";
import { apiGet } from "@/lib/api";
import { useUiStore } from "@/store/uiStore";
import type { Colour } from "@/types";

// The eleven Birla Opus colour families — chip hexes fixed by the design spec.
const FAMILY_CHIPS = [
  { name: "Whites", hex: "#F5F0E8" },
  { name: "Yellows", hex: "#F5C518" },
  { name: "Oranges", hex: "#E8590C" },
  { name: "Reds", hex: "#E83232" },
  { name: "Purples", hex: "#9B2FBE" },
  { name: "Blues", hex: "#2F5DBE" },
  { name: "Blue-Greens", hex: "#0ABFBC" },
  { name: "Greens", hex: "#2DBE6C" },
  { name: "Yellow-Greens", hex: "#A0BE2D" },
  { name: "Neutrals", hex: "#8B7B6B" },
  { name: "India Iconic", hex: "#CC4040" },
];

export function ColourExplorer() {
  const wallColour = useUiStore((s) => s.wallColour);
  const setWallColour = useUiStore((s) => s.setWallColour);

  const { data: shades } = useQuery({
    queryKey: ["colours", "explorer"],
    queryFn: () => apiGet<Colour[]>("/colours?explorer_only=true"),
  });

  return (
    <section className="min-h-[90vh] bg-cream px-6 py-section-y md:px-section-x">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[45%_55%] lg:gap-20">
        {/* Left column — sticky */}
        <div className="lg:sticky lg:top-[100px] lg:h-fit">
          <Reveal>
            <p className="font-sans text-label font-bold uppercase text-orange">
              Colour is Everything
            </p>
            <h2 className="mt-4 font-display text-[clamp(38px,5vw,64px)] font-bold leading-[0.9] text-ink">
              2,300 shades<span className="text-orange">.</span>
            </h2>
            <p className="mt-6 max-w-[320px] font-sans text-body leading-[1.7] text-ink-soft">
              Every shade in the Birla Opus catalogue is available at Kamlesh. Browse by family or
              tell us the room and we&apos;ll recommend the right one.
            </p>
            <Link
              href="/colours"
              className="relative mt-6 inline-block font-sans text-sm font-semibold text-orange after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 after:bg-orange after:transition-transform after:duration-[250ms] hover:after:scale-x-100"
            >
              View Full Catalogue →
            </Link>

            {/* Colour family chips */}
            <div className="mt-10 flex max-w-[340px] flex-wrap gap-3">
              {FAMILY_CHIPS.map((chip) => (
                <span key={chip.name} className="group relative">
                  <Link
                    href={`/colours?family=${encodeURIComponent(chip.name)}`}
                    aria-label={`${chip.name} colour family`}
                    className="swatch block h-8 w-8 rounded-full border-2 border-white shadow-card-warm transition-[border-color,transform] duration-200 hover:scale-110 hover:border-ink"
                    style={{ background: chip.hex }}
                  />
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 font-sans text-[11px] font-medium text-ivory-text opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {chip.name}
                  </span>
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right column — wall preview + swatches */}
        <Reveal delay={0.15}>
          <div className="rounded-[24px] bg-paper p-3 shadow-card-warm">
            <WallPreview colour={wallColour} />
          </div>
          <div className="no-scrollbar mt-5 flex gap-2.5 overflow-x-auto pb-2">
            {(shades ?? []).map((shade) => (
              <ColourSwatch
                key={shade.id}
                hex={shade.hex}
                name={shade.name}
                active={wallColour === shade.hex}
                onSelect={setWallColour}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
