"use client";

import { useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

const MAX_DISPLACEMENT = 8;

/** Magnetic hover: children drift up to 8px toward the cursor, spring back on leave. */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reduced) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const x = (dx / (rect.width / 2)) * MAX_DISPLACEMENT;
    const y = (dy / (rect.height / 2)) * MAX_DISPLACEMENT;
    el.style.transition = "transform 0.1s ease";
    el.style.transform = `translate(${x}px, ${y}px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    el.style.transform = "translate(0, 0)";
  };

  return (
    <div
      ref={ref}
      data-magnetic
      className={className ? `inline-block ${className}` : "inline-block"}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
