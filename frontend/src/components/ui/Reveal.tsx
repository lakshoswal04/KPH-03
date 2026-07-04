"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Extra initial offset, e.g. { x: -50 } for slide-ins. Defaults to y: 32. */
  from?: { x?: number; y?: number };
}

/** Standard scroll reveal: opacity 0→1, translateY(32px)→0, 0.6s ease-out-expo,
 * triggered at 12% visibility, once. */
export function Reveal({ children, delay = 0, className, from }: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: from?.x ?? 0, y: from?.y ?? (from?.x !== undefined ? 0 : 32) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}
