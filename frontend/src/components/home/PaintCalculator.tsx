"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Link from "next/link";

import { Input, Select, labelClasses } from "@/components/ui/Input";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { apiPost } from "@/lib/api";
import { whatsappHref } from "@/lib/business";
import { cn, formatINR } from "@/lib/utils";
import type { BudgetRequest, BudgetResponse } from "@/types";

const ROOM_TYPES = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Bathroom",
  "Dining Room",
  "Full Home (2BHK)",
  "Full Home (3BHK)",
];

const GRADES = [
  { value: "style", label: "Style — Economy" },
  { value: "calista", label: "Calista — Premium" },
  { value: "one", label: "One — Luxury" },
] as const;

const TRUST_ITEMS = ["Accurate to the litre", "Full material + labour + GST", "Send results to WhatsApp"];

const calcSchema = z.object({
  roomType: z.string().min(1, "Select a room type"),
  area: z.number("Enter your floor area").positive("Enter your floor area").max(100000),
  coats: z.number().int().min(1).max(3),
  grade: z.enum(["style", "calista", "one"]),
  primer: z.boolean(),
  putty: z.boolean(),
});

type CalcForm = z.infer<typeof calcSchema>;

// Client-side mirror of the backend calc_service, used if the API is unreachable.
function calculateLocally(
  area: number,
  coats: number,
  grade: CalcForm["grade"],
  primer: boolean,
  putty: boolean,
): BudgetResponse {
  const wall = Math.round(area * 3.2 * 0.8);
  const litres = Math.ceil((wall / 120) * coats);
  const rates = { style: [150, 200], calista: [220, 360], one: [320, 520] } as const;
  const [low, high] = rates[grade];
  const paintLow = litres * low;
  const paintHigh = litres * high;
  const primerL = primer ? Math.ceil(wall / 120) : 0;
  const primerCost = primerL * 180;
  const puttyKg = putty ? Math.ceil(wall / 15) : 0;
  const puttyCost = puttyKg * 22;
  const consumables = Math.round(wall * 1.2);
  const labourLow = Math.round(wall * 10);
  const labourHigh = Math.round(wall * 16);
  const matLow = paintLow + primerCost + puttyCost + consumables;
  const matHigh = paintHigh + primerCost + puttyCost + consumables;
  const gstLow = Math.round(matLow * 0.18);
  const gstHigh = Math.round(matHigh * 0.18);
  return {
    wall_area: wall, paint_litres: litres, primer_litres: primerL, putty_kg: puttyKg,
    breakdown: [
      { label: "Paint", low: paintLow, high: paintHigh },
      { label: "Primer", low: primerCost, high: primerCost },
      { label: "Putty", low: puttyCost, high: puttyCost },
      { label: "Consumables", low: consumables, high: consumables },
      { label: "Labour", low: labourLow, high: labourHigh },
      { label: "GST (18%)", low: gstLow, high: gstHigh },
    ],
    material_low: matLow, material_high: matHigh, labour_low: labourLow, labour_high: labourHigh,
    gst_low: gstLow, gst_high: gstHigh,
    total_low: matLow + labourLow + gstLow, total_high: matHigh + labourHigh + gstHigh,
    recommended: [],
  };
}

export function PaintCalculator() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CalcForm>({
    resolver: zodResolver(calcSchema),
    defaultValues: { roomType: "", coats: 2, grade: "calista", primer: true, putty: true },
  });

  const coats = watch("coats");
  const primer = watch("primer");
  const putty = watch("putty");

  const mutation = useMutation({
    mutationFn: async (form: CalcForm) => {
      const payload: BudgetRequest = {
        area: form.area, coats: form.coats, grade: form.grade,
        primer: form.primer, putty: form.putty,
      };
      try {
        return await apiPost<BudgetRequest, BudgetResponse>("/ai/budget", payload);
      } catch {
        return calculateLocally(form.area, form.coats, form.grade, form.primer, form.putty);
      }
    },
  });

  const result = mutation.data;
  const waText = result
    ? `Hi Kamlesh Paints, my estimate: ${result.paint_litres} L paint, total ₹${formatINR(result.total_low)} – ₹${formatINR(result.total_high)} (incl. GST). Please help me order.`
    : "";

  return (
    <section id="calculator" className="bg-marigold-soft/60 px-6 py-section-y md:px-section-x">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[45%_55%] lg:gap-20">
        {/* Left column */}
        <Reveal>
          <p className="font-sans text-label font-bold uppercase text-orange">Smart Planning</p>
          <h2 className="mt-4 font-display text-section-h2 font-black text-ink">
            Know your
            <br />
            budget<span className="text-orange">.</span>
          </h2>
          <p className="mt-6 max-w-[340px] font-sans text-body text-ink-soft">
            Enter your room details and get an instant estimate of exactly how much Birla Opus
            paint you need and what it will cost. No guesswork.
          </p>
          <ul className="mt-8 space-y-3">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-3 font-sans text-sm font-semibold text-ink">
                <span className="text-orange" aria-hidden="true">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Right column — calculator card */}
        <Reveal delay={0.15}>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="rounded-[24px] bg-paper p-7 shadow-card-lift md:p-10"
            noValidate
          >
            <div className="space-y-6">
              <div>
                <label htmlFor="calc-room" className={labelClasses}>
                  Room Type
                </label>
                <Select id="calc-room" {...register("roomType")}>
                  <option value="">Select room type</option>
                  {ROOM_TYPES.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </Select>
                {errors.roomType && (
                  <p className="mt-1.5 font-sans text-xs text-coral">{errors.roomType.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="calc-area" className={labelClasses}>
                  Floor Area
                </label>
                <div className="relative">
                  <Input
                    id="calc-area"
                    type="number"
                    placeholder="e.g. 120"
                    inputMode="numeric"
                    {...register("area", { valueAsNumber: true })}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-sans text-xs uppercase tracking-wider text-ink-faint">
                    sq ft
                  </span>
                </div>
                {errors.area && (
                  <p className="mt-1.5 font-sans text-xs text-coral">{errors.area.message}</p>
                )}
              </div>

              <div>
                <span className={labelClasses}>Number of Coats</span>
                <div className="flex gap-3">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValue("coats", n)}
                      className={cn(
                        "rounded-full px-5 py-2 font-sans text-[13px] font-semibold transition-colors duration-200",
                        coats === n
                          ? "bg-orange text-white"
                          : "border border-ink/15 text-ink-soft hover:border-ink/40",
                      )}
                    >
                      {n} coat{n > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="calc-grade" className={labelClasses}>
                  Paint Grade
                </label>
                <Select id="calc-grade" {...register("grade")}>
                  {GRADES.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-sans text-[13px] font-semibold transition-colors",
                  primer ? "border-orange bg-orange/10 text-orange-deep" : "border-ink/15 text-ink-soft",
                )}>
                  <input type="checkbox" {...register("primer")} className="accent-orange" />
                  Include primer
                </label>
                <label className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-sans text-[13px] font-semibold transition-colors",
                  putty ? "border-orange bg-orange/10 text-orange-deep" : "border-ink/15 text-ink-soft",
                )}>
                  <input type="checkbox" {...register("putty")} className="accent-orange" />
                  Include putty
                </label>
              </div>

              <Magnetic className="block w-full">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="mt-2 w-full rounded-btn bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-0 disabled:opacity-60"
                >
                  {mutation.isPending ? "Calculating…" : "Calculate"}
                </button>
              </Magnetic>
            </div>

            {/* Result area — animates open */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-8 border-t border-ink/10 pt-8">
                    <p className="font-sans text-sm text-ink-soft">
                      {result.paint_litres} L paint
                      {result.primer_litres ? ` · ${result.primer_litres} L primer` : ""}
                      {result.putty_kg ? ` · ${result.putty_kg} kg putty` : ""} · {result.wall_area} sq ft wall
                    </p>
                    <p className="mt-2 font-display text-[38px] font-bold leading-tight text-ink">
                      ₹{formatINR(result.total_low)} – ₹{formatINR(result.total_high)}
                    </p>
                    <p className="mt-1 font-sans text-xs text-ink-soft">Total estimate incl. GST &amp; labour</p>

                    <div className="mt-5 space-y-1.5">
                      {result.breakdown.map((b) => (
                        <div key={b.label} className="flex justify-between font-sans text-[13px]">
                          <span className="text-ink-soft">{b.label}</span>
                          <span className="text-ink">
                            {b.low === b.high ? `₹${formatINR(b.low)}` : `₹${formatINR(b.low)} – ₹${formatINR(b.high)}`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {result.recommended.length > 0 && (
                      <div className="mt-6">
                        <p className="font-sans text-[11px] font-bold uppercase tracking-wide text-ink-soft">Recommended products</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {result.recommended.map((p) => (
                            <Link key={p.id} href={`/products/${p.slug}`} className="rounded-full border border-ink/15 px-3 py-1.5 font-sans text-[12px] font-semibold text-ink-soft transition-colors hover:border-orange hover:text-orange">
                              {p.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <a
                      href={whatsappHref(waText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-block font-sans text-sm font-semibold text-orange transition-opacity hover:opacity-75"
                    >
                      Send this estimate to WhatsApp →
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
