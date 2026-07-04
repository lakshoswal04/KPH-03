import { PaintFan } from "@/components/ui/PaintFan";
import { PaintSplash } from "@/components/ui/PaintSplash";
import { FloatingBucket } from "@/components/ui/FloatingProps";

const STATS = [
  { value: "2,300+", label: "Birla Opus Shades" },
  { value: "25 Yrs", label: "Serving Pune" },
  { value: "Free", label: "Delivery in Pune" },
];

/** Marketing/brand column shown beside the login & signup forms (lg+ only). */
export function AuthBrandPanel({
  headline,
  benefits,
}: {
  headline: string;
  benefits: string[];
}) {
  return (
    <div className="relative hidden overflow-hidden rounded-[24px] bg-gradient-to-br from-marigold-soft/70 via-cream to-paper p-10 lg:flex lg:flex-col lg:justify-between">
      {/* Warm glow blobs */}
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-marigold/25 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-orange/15 blur-[100px]" />
      {/* Splash + floating props */}
      <PaintSplash className="pointer-events-none absolute -right-16 top-10 h-[360px] w-[360px] opacity-40" tint="#E8590C" />
      <FloatingBucket
        src="/products/one-pure-elegance.png"
        size={150}
        className="absolute right-10 top-24 -rotate-6"
      />
      <FloatingBucket
        src="/products/one-true-look.png"
        size={110}
        delay={0.8}
        className="absolute right-24 top-[290px] rotate-6"
      />

      {/* Top: brand mark */}
      <div className="relative z-[1] flex items-center gap-3">
        <PaintFan size={40} />
        <div>
          <p className="font-display text-lg font-bold text-ink">Kamlesh Paints &amp; Hardware</p>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[2px] text-orange">
            Authorised Birla Opus Dealer
          </p>
        </div>
      </div>

      {/* Middle: headline + benefits */}
      <div className="relative z-[1] max-w-[320px]">
        <h2 className="font-display text-[34px] font-black leading-[1.05] text-ink">{headline}</h2>
        <ul className="mt-6 space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2.5 font-sans text-sm text-ink-soft">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange text-[11px] font-bold text-white">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: trust stats */}
      <div className="relative z-[1] flex gap-8 border-t border-ink/10 pt-6">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="font-display text-2xl font-bold text-ink">{s.value}</p>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[1.5px] text-ink-soft">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
