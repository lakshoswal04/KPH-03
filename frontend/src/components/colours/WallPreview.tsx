"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

// Shades dark enough that the sofa silhouette must dim to stay readable.
const DARK_WALLS = ["#4A4A5A", "#1A1A2E"];

/** CSS-drawn living room whose wall repaints with a brush-stroke wipe.
 * Drive it by passing the currently selected shade hex. */
export function WallPreview({ colour }: { colour: string }) {
  const [current, setCurrent] = useState(colour);
  const [wipe, setWipe] = useState<{ colour: string; active: boolean } | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (colour === current || wipe) return;
    if (reduced) {
      setCurrent(colour);
      return;
    }
    setWipe({ colour, active: false });
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setWipe({ colour, active: true })),
    );
    return () => cancelAnimationFrame(raf);
  }, [colour, current, wipe, reduced]);

  const onWipeEnd = () => {
    if (!wipe) return;
    setCurrent(wipe.colour);
    setWipe(null);
  };

  const isDark = DARK_WALLS.includes(wipe?.active ? wipe.colour : current);

  return (
    <div
      className="relative h-[360px] w-full overflow-hidden rounded-[20px]"
      style={{ background: current }}
    >
      {/* Brush-stroke wipe overlay */}
      {wipe && (
        <div
          className="absolute inset-0 z-[5]"
          onTransitionEnd={onWipeEnd}
          style={{
            background: wipe.colour,
            clipPath: wipe.active ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
            transition: wipe.active ? "clip-path 0.9s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        />
      )}

      {/* Room furniture sits above the wipe so only the wall repaints */}
      <div className="absolute inset-0 z-[6]">
        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-[rgba(160,130,90,0.6)]" />
        {/* Window */}
        <div className="absolute left-[14%] top-[15%] h-[110px] w-20 rounded border-[3px] border-white/50 bg-[rgba(200,230,255,0.4)] before:absolute before:left-0 before:right-0 before:top-1/2 before:h-[3px] before:bg-white/50 after:absolute after:bottom-0 after:left-1/2 after:top-0 after:w-[3px] after:bg-white/50" />
        {/* Sofa */}
        <div
          className="absolute bottom-[35%] left-1/2 -translate-x-1/2 transition-opacity duration-500"
          style={{ opacity: isDark ? 0.35 : 1 }}
        >
          <div className="mx-auto h-[30px] w-[180px] rounded-t-xl bg-[#3A2A1E]" />
          <div className="h-[70px] w-[220px] rounded-t-xl bg-[#3A2A1E]" />
        </div>
        {/* Plants */}
        <div className="absolute bottom-[35%] left-[12%]">
          <div className="mx-auto h-8 w-6 rounded-[50%] bg-[#3E5C3A]" />
          <div className="mx-auto -mt-2 h-8 w-8 rounded-[50%] bg-[#4A6B45]" />
          <div className="mx-auto h-6 w-3 rounded-b bg-[#7A5C3E]" />
        </div>
        <div className="absolute bottom-[35%] right-[12%]">
          <div className="mx-auto h-10 w-7 rounded-[50%] bg-[#4A6B45]" />
          <div className="mx-auto h-7 w-4 rounded-b bg-[#7A5C3E]" />
        </div>
      </div>
    </div>
  );
}
