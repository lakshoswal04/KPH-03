"use client";

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Light form fields: warm cream fill on white cards, orange focus ring.
const fieldClasses =
  "w-full rounded-lg border border-ink/10 bg-cream px-4 py-3 font-sans text-sm text-ink " +
  "placeholder:text-ink-faint focus:border-orange focus:outline-none transition-colors duration-200";

export const labelClasses =
  "mb-2 block font-sans text-label font-bold uppercase text-ink-soft";

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
