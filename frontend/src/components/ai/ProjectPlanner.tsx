"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input, Select, labelClasses } from "@/components/ui/Input";
import { apiPost } from "@/lib/api";
import type { ProjectPlanResponse } from "@/types";

const PROPERTY_TYPES = ["Flat / Apartment", "Bungalow / Row House", "Shop / Office", "Full Home"];
const TIMELINES = ["Within a week", "2–3 weeks", "1 month", "Flexible"];

const schema = z.object({
  property_type: z.string().min(1, "Pick a property type"),
  rooms: z.string().min(2, "List the rooms, e.g. 2 bedrooms, hall"),
  budget: z.string().min(1, "Enter an approximate budget"),
  timeline: z.string().min(1, "Pick a timeline"),
});

type FormValues = z.infer<typeof schema>;

export function ProjectPlanner() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { property_type: "", rooms: "", budget: "", timeline: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiPost<FormValues, ProjectPlanResponse>("/ai/project-plan", values),
  });

  return (
    <div className="rounded-[20px] bg-paper p-7 shadow-card-lift md:p-10">
      <h2 className="font-display text-[28px] font-bold text-ink">AI Project Planner</h2>
      <p className="mt-2 font-sans text-sm text-ink-soft">
        Describe your project and get a step-by-step Birla Opus painting plan.
      </p>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="mt-8 grid gap-6 sm:grid-cols-2"
        noValidate
      >
        <div>
          <label htmlFor="pp-type" className={labelClasses}>
            Property Type
          </label>
          <Select id="pp-type" {...register("property_type")}>
            <option value="">Select type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          {errors.property_type && (
            <p className="mt-1.5 font-sans text-xs text-coral">{errors.property_type.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="pp-timeline" className={labelClasses}>
            Timeline
          </label>
          <Select id="pp-timeline" {...register("timeline")}>
            <option value="">Select timeline</option>
            {TIMELINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          {errors.timeline && (
            <p className="mt-1.5 font-sans text-xs text-coral">{errors.timeline.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="pp-rooms" className={labelClasses}>
            Rooms
          </label>
          <Input id="pp-rooms" placeholder="e.g. 2 bedrooms, hall, kitchen" {...register("rooms")} />
          {errors.rooms && (
            <p className="mt-1.5 font-sans text-xs text-coral">{errors.rooms.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="pp-budget" className={labelClasses}>
            Budget
          </label>
          <Input id="pp-budget" placeholder="e.g. ₹40,000" {...register("budget")} />
          {errors.budget && (
            <p className="mt-1.5 font-sans text-xs text-coral">{errors.budget.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="sm:col-span-2 w-full rounded-btn bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-0 disabled:opacity-60"
        >
          {mutation.isPending ? "Planning…" : "Generate Plan"}
        </button>
      </form>

      {mutation.data && (
        <div className="mt-8 border-t border-ink/10 pt-8">
          {mutation.data.mock && (
            <p className="mb-4 rounded-lg border border-marigold/40 bg-marigold-soft/50 px-4 py-2.5 font-sans text-[12px] text-ink-soft">
              Showing a sample plan — connect a valid Gemini API key for a live AI-generated plan.
            </p>
          )}
          <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
            {mutation.data.plan}
          </p>
        </div>
      )}
      {mutation.isError && (
        <p className="mt-6 font-sans text-sm text-coral">
          Could not reach the planner — please try again.
        </p>
      )}
    </div>
  );
}
