"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, .swatch, [data-tilt], [data-magnetic], input, select, textarea, label";

/** 12px orange dot that grows into a 30px ring over interactive elements.
 * Uses event delegation so dynamically rendered elements are covered. */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      cursor.classList.toggle("hovering", Boolean(target?.closest(INTERACTIVE)));
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, []);

  return <div id="cursor" ref={ref} className="left-[-100px] top-[-100px]" />;
}
