import type { Metadata } from "next";

import { ColourRecommender } from "@/components/ai/ColourRecommender";
import { PaintCalculator } from "@/components/home/PaintCalculator";
import { FloatingBucket, PaintBrush } from "@/components/ui/FloatingProps";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "AI Studio — Kamlesh Paints & Hardware",
  description:
    "Plan your painting project with AI: instant paint quantity estimates and Birla Opus shade recommendations tuned to your room, mood, and lighting.",
};

export default function AiStudioPage() {
  return (
    <main className="min-h-screen bg-cream pt-nav">
      <section className="relative px-6 pb-4 pt-[60px] md:px-section-x">
        <FloatingBucket
          src="/products/one-true-look.png"
          size={150}
          className="absolute right-[12%] top-16 hidden -rotate-6 lg:block"
        />
        <PaintBrush
          className="absolute right-[28%] top-40 hidden xl:flex"
          bristleTip="#F7BD16"
          size={110}
        />
        <Reveal>
          <p className="font-sans text-label font-bold uppercase text-orange">AI Studio</p>
          <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
            Plan smarter,
            <br />
            paint once<span className="text-orange">.</span>
          </h1>
          <p className="mt-6 max-w-[440px] font-sans text-body text-ink-soft">
            Two tools, zero guesswork — know exactly how much paint your project needs, and let AI
            shortlist Birla Opus shades for every room.
          </p>
        </Reveal>
      </section>

      <section className="px-6 pb-10 md:px-section-x">
        <div className="mx-auto max-w-[760px]">
          <ColourRecommender />
        </div>
      </section>

      <PaintCalculator />
    </main>
  );
}
