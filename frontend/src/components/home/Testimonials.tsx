"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

import { Reveal } from "@/components/ui/Reveal";

const TESTIMONIALS = [
  {
    quote:
      "I was worried about dampness in my living room walls for years. The team recommended Alldry Wall Fix 4 and it has been completely dry through two monsoons. Brilliant product and excellent guidance from Kamlesh.",
    name: "Rajesh Patil",
    role: "Homeowner, Kothrud, Pune",
  },
  {
    quote:
      "As a contractor I need reliable stock and honest pricing. Kamlesh is my go-to for all Birla Opus materials. Quick billing, consistent availability, and they always have the full range in stock.",
    name: "Suresh Mane",
    role: "Painting Contractor, Hadapsar",
  },
  {
    quote:
      "We used One Pure Elegance for our entire 3BHK renovation. The finish is absolutely stunning — smooth as silk and still looking fresh two years later. Worth every rupee.",
    name: "Priya Deshpande",
    role: "Homeowner, Baner, Pune",
  },
  {
    quote:
      "The free site survey was genuinely helpful. The expert came within a day, measured everything properly, and gave us a detailed quote with product names and quantities. No other shop offers this.",
    name: "Amit Joshi",
    role: "Builder, Wakad",
  },
  {
    quote:
      "Got the Allwood Italian PU for my modular kitchen shutters. The finish looks like it came straight from a furniture showroom. Couldn't believe the quality — highly recommend.",
    name: "Sneha Kulkarni",
    role: "Interior Designer, Aundh, Pune",
  },
];

function Stars() {
  return (
    <div className="flex gap-[3px] text-base text-orange" aria-label="5 star rating">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: i * 0.08, duration: 0.3, type: "spring", stiffness: 300 }}
          aria-hidden="true"
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) =>
    trackRef.current?.scrollBy({ left: direction * 384, behavior: "smooth" });

  return (
    <section id="testimonials" className="bg-canvas px-6 py-section-y md:px-section-x">
      <div className="flex items-end justify-between gap-6">
        <Reveal>
          <p className="font-sans text-label font-bold uppercase text-gold">What Customers Say</p>
          <h2 className="mt-4 font-display text-section-h2 font-bold text-ivory-text">
            Real words from
            <br />
            Pune homes<span className="text-orange">.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Scroll testimonials left"
              onClick={() => scroll(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory-text/15 font-sans text-base font-bold text-ivory-text transition-colors duration-200 hover:border-orange hover:bg-orange"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Scroll testimonials right"
              onClick={() => scroll(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory-text/15 font-sans text-base font-bold text-ivory-text transition-colors duration-200 hover:border-orange hover:bg-orange"
            >
              →
            </button>
          </div>
        </Reveal>
      </div>

      <div
        ref={trackRef}
        id="testimonial-track"
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6"
      >
        {TESTIMONIALS.map((t) => (
          <article
            key={t.name}
            className="min-w-[320px] snap-start rounded-xl border border-ivory-text/[0.07] bg-testimonial p-8 transition-[border-color,transform] duration-[250ms] hover:-translate-y-1 hover:border-orange/25 md:min-w-[360px]"
          >
            <Stars />
            <blockquote className="mt-5 font-display text-xl font-light italic leading-normal text-ivory-text">
              “{t.quote}”
            </blockquote>
            <hr className="my-6 border-ivory-text/[0.08]" />
            <p className="font-sans text-sm font-semibold text-ivory-text">{t.name}</p>
            <p className="mt-0.5 font-sans text-xs text-muted">{t.role}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
