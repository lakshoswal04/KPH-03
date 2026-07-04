import type { Metadata } from "next";

import { ColourRecommender } from "@/components/ai/ColourRecommender";
import { ProjectPlanner } from "@/components/ai/ProjectPlanner";
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
            Three tools, zero guesswork — estimate exactly how much paint your project needs, let AI
            shortlist Birla Opus shades, and get a step-by-step project plan.
          </p>
        </Reveal>
      </section>

      <section className="px-6 pb-10 md:px-section-x">
        <div className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-2">
          <ColourRecommender />
          <ProjectPlanner />
        </div>
      </section>

      <PaintCalculator />
    </main>
  );
}
