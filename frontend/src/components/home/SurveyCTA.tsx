"use client";

import Link from "next/link";

import { FloatingBucket, PaintRoller } from "@/components/ui/FloatingProps";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";

export function SurveyCTA() {
  return (
    <section className="relative overflow-hidden bg-marigold px-6 py-[120px] md:px-section-x">
      {/* Soft white glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-0 top-0 h-[400px] w-[400px]"
          style={{ background: "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.35), transparent 55%)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-[340px] w-[340px]"
          style={{ background: "radial-gradient(circle at 85% 80%, rgba(255,255,255,0.28), transparent 55%)" }}
        />
      </div>

      {/* Floating painter props */}
      <PaintRoller
        className="absolute -left-6 bottom-10 hidden lg:block"
        sleeve="#E8590C"
        size={130}
      />
      <FloatingBucket
        src="/products/calista-ever-clear.png"
        size={130}
        className="absolute right-8 top-12 hidden -rotate-6 lg:block"
        delay={0.8}
      />
      <FloatingBucket
        src="/products/alldry-wall-n-roof-12.png"
        size={100}
        className="absolute bottom-14 right-[16%] hidden rotate-3 xl:block"
        delay={1.6}
      />

      <div className="relative mx-auto max-w-[700px] text-center">
        <p className="font-sans text-label font-bold uppercase text-ink/60">Free Service</p>
        <h2 className="mt-5 font-display text-cta-h2 font-black text-ink">
          <Reveal from={{ x: -50 }}>
            <span className="block">Unsure where</span>
          </Reveal>
          <Reveal from={{ x: 50 }}>
            <span className="block">to start?</span>
          </Reveal>
        </h2>
        <p className="mx-auto mt-6 max-w-[480px] font-sans text-body text-ink/75">
          Book a FREE expert site survey. We&apos;ll visit your Pune property, inspect every wall
          and surface, recommend the right Birla Opus products for each area, and give you a
          no-obligation written quote.
        </p>
        <div className="mt-10">
          <Magnetic>
            <Link
              href="/survey"
              className="inline-block rounded-btn bg-orange px-12 py-[18px] font-sans text-[13px] font-bold uppercase tracking-[2px] text-white transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep hover:shadow-orange-glow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Book Your Free Site Survey →
            </Link>
          </Magnetic>
        </div>
        <p className="mt-4 font-sans text-[13px] text-ink/60">
          Available across all of Pune · Usually confirmed within 2 hours
        </p>
      </div>
    </section>
  );
}
