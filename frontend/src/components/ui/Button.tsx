"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Magnetic } from "./Magnetic";

type Variant = "primary" | "outline-light" | "outline-current";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  magnetic?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-bold text-[13px] uppercase tracking-[1.5px] rounded-btn px-[34px] py-[15px] " +
  "transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange active:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-orange text-white hover:bg-orange-deep hover:-translate-y-0.5 hover:shadow-orange-glow",
  "outline-light":
    "bg-transparent text-ink border-[1.5px] border-ink/25 hover:border-ink/70",
  "outline-current":
    "bg-transparent border-[1.5px] border-current font-semibold text-[12px] px-5 py-[9px] hover:bg-orange hover:text-white hover:border-orange",
};

export function Button({
  variant = "primary",
  magnetic = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const button = (
    <button className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
  return magnetic ? <Magnetic>{button}</Magnetic> : button;
}
