import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Feature pill used on product cards — thin outline, muted text. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border border-ink/10 bg-cream px-2.5 py-[3px] font-sans text-[11px] text-ink-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
