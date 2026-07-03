"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { PaintBrush, PaintRoller } from "@/components/ui/FloatingProps";
import { Magnetic } from "@/components/ui/Magnetic";
import { PaintSplash } from "@/components/ui/PaintSplash";
import { EASE_OUT_EXPO } from "@/components/ui/Reveal";
import { useUiStore } from "@/store/uiStore";

const HERO_SWATCHES = [
  { hex: "#E8590C", name: "Kamlesh Orange" },
  { hex: "#A8C8A0", name: "Sage Green" },
  { hex: "#90B8D8", name: "Ocean Blue" },
  { hex: "#F5C518", name: "Sunflower" },
  { hex: "#D4537E", name: "Dusty Rose" },
];

const CATEGORY_PANELS = [
  { name: "Interior Paints", bg: "#F5C518", canBody: "#C79E0D" },
  { name: "Exterior Paints", bg: "#0ABFBC", canBody: "#088F8D" },
  { name: "Waterproofing", bg: "#FF4D6D", canBody: "#D63755" },
  { name: "Hardware", bg: "#7B2FBE", canBody: "#5C2390" },
];

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
      <div className="font-display text-[52px] font-bold leading-none text-ink">
        <span ref={ref}>0</span>
        {suffix}
      </div>
      <div className="mt-2 font-sans text-[11px] font-medium uppercase tracking-[2.5px] text-ink-soft">
        {label}
      </div>
    </div>
  );
}

/** Official One Pure Elegance bucket floating over a paint-splash burst.
 * Swatch clicks re-tint the splash behind the bucket. */
function HeroBucket() {
  const tint = useUiStore((s) => s.canColour);
  const setTint = useUiStore((s) => s.setCanColour);

  return (
    <div className="relative z-[1] flex flex-col items-center justify-center">
      <div className="relative flex h-[420px] w-full max-w-[480px] items-center justify-center md:h-[500px]">
        <PaintSplash
          tint={tint}
          className="absolute inset-0 h-full w-full"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/products/one-pure-elegance.png"
          alt="Birla Opus One Pure Elegance luxury emulsion bucket"
          className="bucket-float relative z-[1] w-[240px] drop-shadow-[0_36px_40px_rgba(26,26,10,0.35)] md:w-[300px]"
          data-splash-tint={tint}
        />
        {/* Decorative props */}
        <PaintRoller
          className="absolute -left-4 bottom-2 hidden md:block"
          sleeve={tint}
          size={110}
        />
        <PaintBrush className="absolute -right-2 top-6 hidden md:flex" bristleTip="#0ABFBC" />
      </div>

      {/* Swatch row — tints the splash */}
      <div className="mt-4 flex justify-center gap-3">
        {HERO_SWATCHES.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            title={swatch.name}
            aria-label={`Tint the splash ${swatch.name}`}
            onClick={() => setTint(swatch.hex)}
            className="swatch h-11 w-11 rounded-full border-[3px] shadow-card-warm transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            style={{
              background: swatch.hex,
              borderColor: tint === swatch.hex ? "var(--ink)" : "#FFFFFF",
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
    <section className="relative overflow-hidden bg-cream pt-nav" style={{ minHeight: "100vh" }}>
      {/* Soft warm glows */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute -left-[120px] -top-[120px] h-[520px] w-[520px] rounded-full bg-marigold/20 blur-[120px]" />
        <div className="absolute -bottom-[80px] right-[10%] h-[420px] w-[420px] rounded-full bg-orange/10 blur-[110px]" />
        <div className="absolute right-[35%] top-[10%] h-[300px] w-[300px] rounded-full bg-teal/10 blur-[100px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[52%_48%]">
        {/* Left column */}
        <div className="relative z-[1] px-6 py-14 md:py-16 lg:pb-[240px] lg:pl-20 lg:pr-0">
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
            <span className="font-sans text-label font-medium uppercase text-ink-soft">
              Authorised Dealer · Shivajinagar, Pune
            </span>
          </motion.div>

          <h1 className="mt-8 font-display text-hero-h1 text-ink">
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

          <motion.p className="mt-8 max-w-[400px] font-sans text-body text-ink-soft" {...fade(0.85)}>
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
              className="inline-block rounded-btn border-[1.5px] border-ink/25 px-[34px] py-[15px] font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-ink transition-colors duration-200 hover:border-ink/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
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

        {/* Right column — real bucket + splash */}
        <div className="relative z-[1] px-6 pb-14 lg:pb-[220px] lg:pr-14">
          <HeroBucket />
        </div>
      </div>

      {/* Category panel strip — z-[2] so it sits above the columns' empty
          bottom padding (which is z-[1]) and stays clickable on desktop. */}
      <div className="relative z-[2] grid grid-cols-2 md:grid-cols-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:h-[180px]">
        {CATEGORY_PANELS.map((panel) => (
          <Link
            key={panel.name}
            href="/products"
            className="group relative flex h-[150px] flex-col items-center justify-center pt-5 transition-[filter] duration-300 hover:brightness-[0.92] lg:h-full"
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
            <span className="font-display text-[17px] font-bold text-white drop-shadow-sm">
              {panel.name}
            </span>
            <span className="mt-1 font-sans text-[11px] font-semibold uppercase tracking-[2px] text-white/90">
              View Range →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
