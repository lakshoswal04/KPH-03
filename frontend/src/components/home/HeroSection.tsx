"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Magnetic } from "@/components/ui/Magnetic";
import { EASE_OUT_EXPO } from "@/components/ui/Reveal";
import { useUiStore } from "@/store/uiStore";

const HERO_SWATCHES = [
  { hex: "#A8C8A0", name: "Sage Green" },
  { hex: "#90B8D8", name: "Ocean Blue" },
  { hex: "#F5C518", name: "Sunflower" },
  { hex: "#E8C4A0", name: "Warm Sand" },
  { hex: "#D4537E", name: "Dusty Rose" },
];

const CATEGORY_PANELS = [
  { name: "Interior Paints", bg: "#F5C518", canBody: "#C79E0D" },
  { name: "Exterior Paints", bg: "#0ABFBC", canBody: "#088F8D" },
  { name: "Waterproofing", bg: "#FF4D6D", canBody: "#D63755" },
  { name: "Hardware", bg: "#7B2FBE", canBody: "#5C2390" },
];

const LABEL_DOTS = ["#E8590C", "#0ABFBC", "#F5C518", "#FF4D6D", "#7B2FBE"];

const STATS = [
  { value: 2300, suffix: "+", format: (n: number) => n.toLocaleString("en-IN"), label: "Birla Opus Shades" },
  { value: 145, suffix: "+", format: (n: number) => String(n), label: "Products in Stock" },
  { value: 25, suffix: " Yrs", format: (n: number) => String(n), label: "Serving Pune" },
];

/** Count-up stat: requestAnimationFrame with easeOutExpo over 1.8s, IO-triggered. */
function StatCounter({ value, suffix, format, label }: (typeof STATS)[number]) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = format(value);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / 1800, 1);
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          el.textContent = format(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, format, reduced]);

  return (
    <div>
      <div className="font-display text-[52px] font-bold leading-none text-ivory-text">
        <span ref={ref}>0</span>
        {suffix}
      </div>
      <div className="mt-2 font-sans text-[11px] font-medium uppercase tracking-[2.5px] text-muted">
        {label}
      </div>
    </div>
  );
}

/** CSS 3D paint can that rocks + floats, and repaints itself with a
 * left-to-right brush wipe when a swatch is clicked. */
function PaintCan() {
  const canColour = useUiStore((s) => s.canColour);
  const setCanColour = useUiStore((s) => s.setCanColour);
  const [wipe, setWipe] = useState<{ colour: string; active: boolean } | null>(null);
  const reduced = useReducedMotion();

  const pick = (hex: string) => {
    if (hex === canColour || wipe) return;
    if (reduced) {
      setCanColour(hex);
      return;
    }
    setWipe({ colour: hex, active: false });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setWipe({ colour: hex, active: true })),
    );
  };

  const onWipeEnd = () => {
    if (!wipe) return;
    setCanColour(wipe.colour);
    setWipe(null);
  };

  const bodyGradient = (colour: string) =>
    `linear-gradient(90deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.35) 100%),
     linear-gradient(180deg, ${colour} 0%, color-mix(in srgb, ${colour} 75%, black) 100%)`;

  return (
    <div className="relative z-[1] flex flex-col items-center justify-center">
      {/* Scene */}
      <div className="relative h-[360px] w-[260px]" style={{ perspective: "800px" }}>
        <div
          className="can-group left-1/2 h-full w-full -translate-x-1/2"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Handle */}
          <div className="absolute left-1/2 top-[44px] h-9 w-[72px] -translate-x-1/2 rounded-t-[72px] border-[5px] border-b-0 border-[#888888]" />
          {/* Lid */}
          <div
            className="absolute left-1/2 top-[76px] h-5 w-[170px] -translate-x-1/2"
            style={{
              background: "linear-gradient(180deg, #AAAAAA 0%, #777777 100%)",
              borderRadius: "85px / 10px",
            }}
          />
          {/* Body */}
          <div
            className="absolute bottom-10 left-1/2 h-[220px] w-[160px] -translate-x-1/2 overflow-hidden rounded-[8px_8px_20px_20px] shadow-can"
            style={{ background: bodyGradient(canColour) }}
          >
            {/* Wipe overlay */}
            {wipe && (
              <div
                className="absolute inset-0"
                onTransitionEnd={onWipeEnd}
                style={{
                  background: bodyGradient(wipe.colour),
                  clipPath: wipe.active ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                  transition: wipe.active
                    ? "clip-path 0.9s cubic-bezier(0.4, 0, 0.2, 1)"
                    : "none",
                }}
              />
            )}
            {/* Label */}
            <div className="absolute left-1/2 top-1/2 flex h-[90px] w-[130px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded bg-ivory">
              <span className="font-sans text-[9px] font-bold uppercase tracking-wide text-ink">
                Birla Opus
              </span>
              <span className="font-display text-[13px] font-bold leading-tight text-ink">
                ONE PURE
              </span>
              <span className="font-display text-[13px] font-bold leading-tight text-ink">
                ELEGANCE
              </span>
              <span className="mt-1.5 flex gap-1">
                {LABEL_DOTS.map((dot) => (
                  <span
                    key={dot}
                    className="h-2 w-2 rounded-full"
                    style={{ background: dot }}
                  />
                ))}
              </span>
            </div>
          </div>
          {/* Ground shadow */}
          <div className="absolute bottom-2 left-1/2 h-5 w-[140px] -translate-x-1/2 rounded-full bg-black/40 blur-[12px]" />
        </div>
      </div>

      {/* Swatch row */}
      <div className="mt-6 flex justify-center gap-3">
        {HERO_SWATCHES.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            title={swatch.name}
            aria-label={`Paint the can ${swatch.name}`}
            onClick={() => pick(swatch.hex)}
            className="swatch h-11 w-11 rounded-full border-[3px] transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            style={{
              background: swatch.hex,
              borderColor: canColour === swatch.hex ? "var(--ivory)" : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Word({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.span>
  );
}

export function HeroSection() {
  const reduced = useReducedMotion();
  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: EASE_OUT_EXPO, delay },
        };

  return (
    <section className="relative overflow-hidden bg-canvas pt-nav" style={{ minHeight: "100vh" }}>
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute -left-[100px] -top-[150px] h-[700px] w-[700px] rounded-full bg-orange/10 blur-[140px]" />
        <div className="absolute -bottom-[100px] -right-[100px] h-[600px] w-[600px] rounded-full bg-teal/[0.07] blur-[120px]" />
        <div className="absolute right-[20%] top-[30%] h-[500px] w-[500px] rounded-full bg-violet/[0.06] blur-[100px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%]">
        {/* Left column */}
        <div className="relative z-[1] px-6 py-16 md:py-20 lg:pb-[260px] lg:pl-20 lg:pr-0">
          <motion.div
            className="flex items-center gap-4"
            {...(reduced
              ? {}
              : {
                  initial: { opacity: 0, x: -30 },
                  animate: { opacity: 1, x: 0 },
                  transition: { duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.1 },
                })}
          >
            <span className="inline-block h-[1.5px] w-8 bg-orange" />
            <span className="font-sans text-label font-medium uppercase text-muted">
              Authorised Dealer · Shivajinagar, Pune
            </span>
          </motion.div>

          <h1 className="mt-8 font-display text-hero-h1 text-ivory-text">
            <span className="block font-light italic">
              <Word delay={0.2}>Colour</Word> <Word delay={0.27}>is</Word>
            </span>
            <span className="block whitespace-nowrap font-black not-italic">
              <Word delay={0.5}>Everything</Word>
              <Word delay={0.57}>
                <span className="text-orange">.</span>
              </Word>
            </span>
          </h1>

          <motion.p className="mt-8 max-w-[380px] font-sans text-body text-muted" {...fade(0.85)}>
            Premium Birla Opus paints, waterproofing solutions, and painting tools — stocked and
            delivered across all of Pune.
          </motion.p>

          <motion.div className="mt-10 flex flex-wrap gap-4" {...fade(1)}>
            <Magnetic>
              <Link
                href="/colours"
                className="inline-block rounded-btn bg-orange px-[34px] py-[15px] font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep hover:shadow-orange-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
              >
                Explore Colours →
              </Link>
            </Magnetic>
            <Link
              href="/survey"
              className="inline-block rounded-btn border-[1.5px] border-ivory-text/30 px-[34px] py-[15px] font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-ivory-text transition-colors duration-200 hover:border-ivory-text/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            >
              Book Free Site Survey
            </Link>
          </motion.div>

          <div className="mt-14 flex flex-wrap gap-12">
            {STATS.map((stat) => (
              <StatCounter key={stat.label} {...stat} />
            ))}
          </div>
        </div>

        {/* Right column — 3D can */}
        <div className="relative z-[1] px-6 pb-16 lg:pb-[220px] lg:pr-10">
          <PaintCan />
        </div>
      </div>

      {/* Category panel strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:h-[180px]">
        {CATEGORY_PANELS.map((panel) => (
          <Link
            key={panel.name}
            href="/products"
            className="group relative flex h-[150px] flex-col items-center justify-center pt-5 transition-[filter] duration-300 hover:brightness-[0.88] lg:h-full"
            style={{ background: panel.bg, overflow: "visible" }}
          >
            {/* Mini can icon floating above the panel edge */}
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 transition-transform duration-300 group-hover:-translate-y-2">
              <span className="mx-auto block h-2 w-8 rounded-sm bg-black/30" />
              <span
                className="block h-10 w-7 rounded-[4px_4px_8px_8px]"
                style={{ background: panel.canBody }}
              />
            </span>
            <span className="font-display text-[17px] font-bold text-white">{panel.name}</span>
            <span className="mt-1 font-sans text-[11px] font-semibold uppercase tracking-[2px] text-white/80">
              View Range →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
