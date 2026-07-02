"use client";

import { cn } from "@/lib/utils";

interface ColourSwatchProps {
  hex: string;
  name: string;
  active?: boolean;
  size?: number;
  onSelect?: (hex: string) => void;
}

/** Circular shade swatch with hover tooltip; active state gets an ivory ring. */
export function ColourSwatch({ hex, name, active = false, size = 52, onSelect }: ColourSwatchProps) {
  return (
    <span className="group relative inline-block shrink-0">
      <button
        type="button"
        title={name}
        aria-label={`Select shade ${name}`}
        onClick={() => onSelect?.(hex)}
        className={cn(
          "swatch block rounded-full border-[3px] transition-transform duration-200 hover:scale-[1.15]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange",
        )}
        style={{
          width: size,
          height: size,
          background: hex,
          borderColor: active ? "var(--ivory)" : "transparent",
        }}
      />
      <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 font-sans text-[11px] font-medium text-ivory-text opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {name}
      </span>
    </span>
  );
}
