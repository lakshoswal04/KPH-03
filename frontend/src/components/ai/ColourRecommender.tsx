"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input, Select, labelClasses } from "@/components/ui/Input";
import { apiPost } from "@/lib/api";
import type { ColourRecommendResponse } from "@/types";

const ROOMS = ["Bedroom", "Living Room", "Kitchen", "Bathroom", "Dining Room", "Kids' Room", "Office"];
const LIGHTING = ["Natural / bright", "Moderate", "Low light"];

const schema = z.object({
  room_type: z.string().min(1, "Pick a room"),
  mood: z.string().min(2, "Describe the mood you want"),
  lighting: z.string().min(1, "Pick the lighting"),
});

type FormValues = z.infer<typeof schema>;

export function ColourRecommender() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { room_type: "", mood: "", lighting: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiPost<FormValues, ColourRecommendResponse>("/ai/recommend-colours", values),
  });

  return (
    <div className="rounded-[20px] bg-paper shadow-card-lift p-7 md:p-10">
      <h2 className="font-display text-[28px] font-bold text-ink">
        AI Colour Recommender
      </h2>
      <p className="mt-2 font-sans text-sm text-ink-soft">
        Tell us the room and the feeling you want — get three Birla Opus shades chosen for it.
      </p>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="mt-8 space-y-6"
        noValidate
      >
        <div>
          <label htmlFor="rec-room" className={labelClasses}>
            Room
          </label>
          <Select id="rec-room" {...register("room_type")}>
            <option value="">Select room</option>
            {ROOMS.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </Select>
          {errors.room_type && (
            <p className="mt-1.5 font-sans text-xs text-coral">{errors.room_type.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="rec-mood" className={labelClasses}>
            Mood
          </label>
          <Input
            id="rec-mood"
            placeholder="e.g. calm and cosy, energetic, luxury"
            {...register("mood")}
          />
          {errors.mood && (
            <p className="mt-1.5 font-sans text-xs text-coral">{errors.mood.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="rec-light" className={labelClasses}>
            Lighting
          </label>
          <Select id="rec-light" {...register("lighting")}>
            <option value="">Select lighting</option>
            {LIGHTING.map((light) => (
              <option key={light} value={light}>
                {light}
              </option>
            ))}
          </Select>
          {errors.lighting && (
            <p className="mt-1.5 font-sans text-xs text-coral">{errors.lighting.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-0 disabled:opacity-60"
        >
          {mutation.isPending ? "Thinking…" : "Recommend Shades"}
        </button>
      </form>

      {mutation.data && (
        <div className="mt-8 border-t border-ink/10 pt-8">
          {mutation.data.mock && (
            <p className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2.5 font-sans text-[12px] text-orange-deep">
              Dev mode: showing curated picks — connect a Gemini API key for live AI
              recommendations.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            {mutation.data.recommendations.map((rec) => (
              <div
                key={rec.name}
                className="overflow-hidden rounded-xl border border-ink/10"
              >
                <div className="h-20" style={{ background: rec.hex }} />
                <div className="p-4">
                  <p className="font-sans text-sm font-semibold text-ink">{rec.name}</p>
                  <p className="font-sans text-[11px] uppercase tracking-wider text-ink-soft">
                    {rec.hex}
                  </p>
                  <p className="mt-2 font-sans text-[12px] leading-relaxed text-ink-soft">
                    {rec.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {mutation.isError && (
        <p className="mt-6 font-sans text-sm text-coral">
          Could not reach the recommender — please try again.
        </p>
      )}
    </div>
  );
}
