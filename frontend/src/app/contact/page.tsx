"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input, Textarea, labelClasses } from "@/components/ui/Input";
import { Reveal } from "@/components/ui/Reveal";
import { apiPost } from "@/lib/api";
import type { Enquiry, EnquiryPayload } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  message: z.string().min(5, "Tell us what you need"),
});

type FormValues = z.infer<typeof schema>;

const INFO = [
  { icon: "📞", label: "Call us", value: "[YOUR PHONE NUMBER]" },
  { icon: "✉", label: "Email", value: "[YOUR EMAIL ADDRESS]" },
  { icon: "📍", label: "Visit the shop", value: "[YOUR FULL ADDRESS], Shivajinagar, Pune" },
  { icon: "🕐", label: "Weekdays", value: "[YOUR WEEKDAY HOURS]" },
  { icon: "🕐", label: "Weekends", value: "[YOUR WEEKEND HOURS]" },
];

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: EnquiryPayload = { ...values, email: values.email || null };
      return apiPost<EnquiryPayload, Enquiry>("/enquiries", payload);
    },
  });

  return (
    <main className="min-h-screen bg-canvas px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[45%_55%] lg:gap-20">
        <Reveal>
          <section id="about">
            <p className="font-sans text-label font-bold uppercase text-orange">
              About the Store
            </p>
            <h1 className="mt-4 font-display text-section-h2 font-black text-ivory-text">
              Talk to
              <br />
              Kamlesh<span className="text-orange">.</span>
            </h1>
            <p className="mt-6 max-w-[420px] font-sans text-body text-muted">
              For 25 years, Kamlesh Paints &amp; Hardware has served homeowners, painters, and
              contractors from Shivajinagar. We stock the complete Birla Opus range — exclusively —
              with free delivery across Pune.
            </p>
          </section>

          <div className="mt-10 space-y-5">
            {INFO.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <span className="text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <p className="font-sans text-[11px] font-bold uppercase tracking-[2px] text-ivory-text/40">
                    {item.label}
                  </p>
                  <p className="font-sans text-sm text-ivory-text">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          {mutation.isSuccess ? (
            <div className="rounded-[20px] bg-card p-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange text-3xl text-white">
                ✓
              </span>
              <h2 className="mt-6 font-display text-[32px] font-bold text-ivory-text">
                Enquiry received!
              </h2>
              <p className="mx-auto mt-3 max-w-[380px] font-sans text-sm text-muted">
                Thanks, {mutation.data.name}. We&apos;ll get back to you on {mutation.data.phone}{" "}
                shortly — usually within the hour during shop time.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              className="rounded-[20px] bg-card p-7 md:p-10"
              noValidate
            >
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ct-name" className={labelClasses}>
                      Your Name
                    </label>
                    <Input id="ct-name" placeholder="Full name" {...register("name")} />
                    {errors.name && (
                      <p className="mt-1.5 font-sans text-xs text-coral">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="ct-phone" className={labelClasses}>
                      Mobile Number
                    </label>
                    <Input
                      id="ct-phone"
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
                  <label htmlFor="ct-email" className={labelClasses}>
                    Email <span className="normal-case opacity-60">(optional)</span>
                  </label>
                  <Input id="ct-email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && (
                    <p className="mt-1.5 font-sans text-xs text-coral">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ct-message" className={labelClasses}>
                    How can we help?
                  </label>
                  <Textarea
                    id="ct-message"
                    placeholder="Products, quantities, bulk pricing, delivery…"
                    {...register("message")}
                  />
                  {errors.message && (
                    <p className="mt-1.5 font-sans text-xs text-coral">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory active:translate-y-0 disabled:opacity-60"
                >
                  {mutation.isPending ? "Sending…" : "Send Enquiry"}
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
