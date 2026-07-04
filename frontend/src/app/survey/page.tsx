"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input, Select, Textarea, labelClasses } from "@/components/ui/Input";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/hooks/useAuth";
import { apiPost, apiUpload } from "@/lib/api";
import type { Survey, SurveyPayload } from "@/types";

const PROPERTY_TYPES = ["Flat / Apartment", "Bungalow / Row House", "Shop / Office", "Building / Society"];
const TIME_SLOTS = ["Morning (9am–12pm)", "Afternoon (12pm–4pm)", "Evening (4pm–7pm)"];

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().min(5, "Enter the property address"),
  locality: z.string().min(2, "Enter your locality, e.g. Kothrud"),
  property_type: z.string().min(1, "Select the property type"),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  "Our expert visits your property and inspects every wall and surface",
  "You get product recommendations for each area — damp walls, facades, wood",
  "A written, no-obligation quote with exact quantities and pricing",
];

export default function SurveyPage() {
  const { token, user } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { property_type: "" },
  });

  useEffect(() => {
    if (user) {
      if (user.full_name) setValue("name", user.full_name);
      if (user.phone) setValue("phone", user.phone);
      if (user.email) setValue("email", user.email);
    }
  }, [user, setValue]);

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ url: string }>("/surveys/upload", fd);
      setImages((prev) => [...prev, res.url]);
    } finally {
      setUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: SurveyPayload = {
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        address: values.address,
        locality: values.locality,
        property_type: values.property_type,
        preferred_date: values.preferred_date || null,
        preferred_time: values.preferred_time || null,
        notes: values.notes || null,
        reference_images: images,
      };
      return apiPost<SurveyPayload, Survey>("/surveys", payload, token || undefined);
    },
  });

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[45%_55%] lg:gap-20">
        <Reveal>
          <p className="font-sans text-label font-bold uppercase text-ink/45">
            Free Service
          </p>
          <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
            Book your free
            <br />
            site survey<span className="text-orange">.</span>
          </h1>
          <p className="mt-6 max-w-[420px] font-sans text-body text-ink/60">
            Available across all of Pune. Usually confirmed within 2 hours — no obligation, no
            charge.
          </p>
          <ol className="mt-10 space-y-5">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange font-sans text-[13px] font-bold text-white">
                  {i + 1}
                </span>
                <p className="font-sans text-sm leading-relaxed text-ink/75">{step}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.15}>
          {mutation.isSuccess ? (
            <div className="rounded-[20px] bg-paper shadow-card-lift p-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange text-3xl text-white">
                ✓
              </span>
              <h2 className="mt-6 font-display text-[32px] font-bold text-ink">
                Survey booked!
              </h2>
              <p className="mx-auto mt-3 max-w-[380px] font-sans text-sm text-ink-soft">
                Thanks, {mutation.data.name}. We&apos;ll call {mutation.data.phone} within 2 hours
                to confirm your visit in {mutation.data.locality}.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              className="rounded-[20px] bg-paper shadow-card-lift p-7 md:p-10"
              noValidate
            >
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sv-name" className={labelClasses}>
                      Your Name
                    </label>
                    <Input id="sv-name" placeholder="Full name" {...register("name")} />
                    {errors.name && (
                      <p className="mt-1.5 font-sans text-xs text-coral">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="sv-phone" className={labelClasses}>
                      Mobile Number
                    </label>
                    <Input
                      id="sv-phone"
                      type="tel"
                      placeholder="10-digit mobile"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="mt-1.5 font-sans text-xs text-coral">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="sv-address" className={labelClasses}>
                    Property Address
                  </label>
                  <Input
                    id="sv-address"
                    placeholder="Flat / building, street"
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="mt-1.5 font-sans text-xs text-coral">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sv-locality" className={labelClasses}>
                      Locality
                    </label>
                    <Input id="sv-locality" placeholder="e.g. Kothrud" {...register("locality")} />
                    {errors.locality && (
                      <p className="mt-1.5 font-sans text-xs text-coral">
                        {errors.locality.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="sv-type" className={labelClasses}>
                      Property Type
                    </label>
                    <Select id="sv-type" {...register("property_type")}>
                      <option value="">Select type</option>
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                    {errors.property_type && (
                      <p className="mt-1.5 font-sans text-xs text-coral">
                        {errors.property_type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="sv-email" className={labelClasses}>
                    Email <span className="normal-case opacity-60">(optional)</span>
                  </label>
                  <Input id="sv-email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && (
                    <p className="mt-1.5 font-sans text-xs text-coral">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sv-date" className={labelClasses}>
                      Preferred Date <span className="normal-case opacity-60">(optional)</span>
                    </label>
                    <Input id="sv-date" type="date" {...register("preferred_date")} />
                  </div>
                  <div>
                    <label htmlFor="sv-time" className={labelClasses}>
                      Preferred Time <span className="normal-case opacity-60">(optional)</span>
                    </label>
                    <Select id="sv-time" {...register("preferred_time")}>
                      <option value="">Any time</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label htmlFor="sv-notes" className={labelClasses}>
                    Anything we should know? <span className="normal-case opacity-60">(optional)</span>
                  </label>
                  <Textarea
                    id="sv-notes"
                    placeholder="Damp walls, leaking roof, number of rooms…"
                    {...register("notes")}
                  />
                </div>

                <div>
                  <label className={labelClasses}>
                    Reference photos <span className="normal-case opacity-60">(optional)</span>
                  </label>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    {images.map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={img} src={img} alt="reference" className="h-16 w-16 rounded-lg object-cover" />
                    ))}
                    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-ink/25 text-2xl text-ink-soft hover:border-orange hover:text-orange">
                      +
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadImage(f);
                        }}
                      />
                    </label>
                  </div>
                  {uploading && <p className="mt-1 font-sans text-xs text-ink-soft">Uploading…</p>}
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-0 disabled:opacity-60"
                >
                  {mutation.isPending ? "Booking…" : "Book My Free Survey"}
                </button>
                {mutation.isError && (
                  <p className="font-sans text-sm text-coral">
                    Something went wrong — please try again or call us directly.
                  </p>
                )}
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </main>
  );
}
