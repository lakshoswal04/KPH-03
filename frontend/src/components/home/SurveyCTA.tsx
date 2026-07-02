"use client";

import Link from "next/link";

import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";

export function SurveyCTA() {
  return (
    <section className="relative overflow-hidden bg-forest px-6 py-[120px] md:px-section-x">
      {/* Radial glow circles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-0 top-0 h-[400px] w-[400px]"
          style={{ background: "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.04), transparent 50%)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-[300px] w-[300px]"
          style={{ background: "radial-gradient(circle at 85% 80%, rgba(255,255,255,0.03), transparent 50%)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2"
          style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02), transparent 60%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[700px] text-center">
        <p className="font-sans text-label font-bold uppercase text-ivory-text/45">Free Service</p>
        <h2 className="mt-5 font-display text-cta-h2 font-black text-ivory-text">
          <Reveal from={{ x: -50 }}>
            <span className="block">Unsure where</span>
          </Reveal>
          <Reveal from={{ x: 50 }}>
            <span className="block">to start?</span>
          </Reveal>
        </h2>
        <p className="mx-auto mt-6 max-w-[480px] font-sans text-body text-ivory-text/60">
          Book a FREE expert site survey. We&apos;ll visit your Pune property, inspect every wall
          and surface, recommend the right Birla Opus products for each area, and give you a
          no-obligation written quote.
        </p>
        <div className="mt-10">
          <Magnetic>
            <Link
              href="/survey"
              className="inline-block rounded-btn bg-orange px-12 py-[18px] font-sans text-[13px] font-bold uppercase tracking-[2px] text-white transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep hover:shadow-orange-glow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
            >
              Book Your Free Site Survey →
            </Link>
          </Magnetic>
        </div>
        <p className="mt-4 font-sans text-[13px] text-ivory-text/45">
          Available across all of Pune · Usually confirmed within 2 hours
        </p>
      </div>
    </section>
  );
}
