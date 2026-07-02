"use client";

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Field styling from the PRD calculator card: translucent ivory on dark surfaces.
const fieldClasses =
  "w-full rounded-lg border border-ivory-text/10 bg-ivory-text/5 px-4 py-3 font-sans text-sm text-ivory-text " +
  "placeholder:text-muted focus:border-orange focus:outline-none transition-colors duration-200";

export const labelClasses =
  "mb-2 block font-sans text-label font-bold uppercase text-ivory-text/50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(fieldClasses, className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(fieldClasses, "appearance-none", className)} {...rest}>
        {children}
      </select>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(fieldClasses, "min-h-[110px]", className)} {...rest} />;
  },
);
