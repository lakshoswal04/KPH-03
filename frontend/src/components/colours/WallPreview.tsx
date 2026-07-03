"use client";

/* eslint-disable @next/next/no-img-element */
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// living-room.jpg is a large plain wall (upper ~58%) above a sofa with cushions.
// This mask paints the full wall so any shade — pale or bold — reads clearly,
// then fades out just above the cushions so the sofa keeps its natural colour.
const WALL_MASK =
  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 53%, rgba(0,0,0,0) 60%)";

function tintLayer(colour: string, extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: colour,
    mixBlendMode: "multiply",
    WebkitMaskImage: WALL_MASK,
    maskImage: WALL_MASK,
    ...extra,
  };
}

/** Realistic room preview: a photo whose wall repaints when a shade is picked,
 * with the same left-to-right brush wipe on change. */
export function WallPreview({ colour }: { colour: string }) {
  const [current, setCurrent] = useState(colour);
  const [wipe, setWipe] = useState<{ colour: string; active: boolean } | null>(null);
  const reduced = useReducedMotion();
  // Always track the newest requested colour so an in-flight wipe can retarget
  // and never leaves the preview frozen on a stale shade when shades are clicked
  // in quick succession.
  const latest = useRef(colour);

  useEffect(() => {
    latest.current = colour;
    if (colour === current) return;
    if (reduced) {
      setCurrent(colour);
      setWipe(null);
      return;
    }
    // (Re)start the wipe toward the newest colour, interrupting any in progress.
    setWipe({ colour, active: false });
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (latest.current === colour) setWipe({ colour, active: true });
      }),
    );
    return () => cancelAnimationFrame(raf);
  }, [colour, current, reduced]);

  const onWipeEnd = () => {
    // Commit whatever the newest colour is (the wipe may have been retargeted).
    setCurrent(latest.current);
    setWipe(null);
  };

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-[16px]">
      <img
        src="/room/living-room.jpg"
        alt="Living room preview"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Current wall tint */}
      <div className="absolute inset-0" style={tintLayer(current)} />
      {/* Incoming tint, revealed left-to-right */}
      {wipe && (
        <div
          className="absolute inset-0"
          onTransitionEnd={onWipeEnd}
          style={tintLayer(wipe.colour, {
            clipPath: wipe.active ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
            transition: wipe.active ? "clip-path 0.9s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          })}
        />
      )}
      {/* Shade label chip */}
      <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 font-sans text-[11px] font-semibold text-ink backdrop-blur-sm">
        Wall preview
      </span>
    </div>
  );
}
