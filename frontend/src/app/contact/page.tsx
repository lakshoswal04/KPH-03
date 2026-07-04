"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input, Select, Textarea, labelClasses } from "@/components/ui/Input";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost } from "@/lib/api";
import { BUSINESS, mailHref, telHref, whatsappHref } from "@/lib/business";
import type { Enquiry, EnquiryPayload, Product } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  budget: z.string().optional(),
  message: z.string().min(5, "Tell us what you need"),
});

const BUDGETS = ["Under ₹10,000", "₹10,000 – ₹25,000", "₹25,000 – ₹50,000", "₹50,000 – ₹1,00,000", "Above ₹1,00,000"];

type FormValues = z.infer<typeof schema>;

const INFO = [
  { icon: "📞", label: "Call us", value: BUSINESS.phoneDisplay, href: telHref },
  { icon: "💬", label: "WhatsApp", value: "Chat with us", href: whatsappHref("Hi Kamlesh Paints, I'd like to know more.") },
  { icon: "✉", label: "Email", value: BUSINESS.email, href: mailHref },
  { icon: "📍", label: "Visit the shop", value: BUSINESS.address, href: undefined },
  { icon: "🕐", label: "Weekdays", value: BUSINESS.hours.weekday, href: undefined },
  { icon: "🕐", label: "Weekends", value: BUSINESS.hours.weekend, href: undefined },
];

function ContactForm() {
  const { token, user } = useAuth();
  const productSlug = useSearchParams().get("product");

  // Resolve ?product=<slug> so the enquiry carries the product context.
  const { data: product } = useQuery({
    queryKey: ["product", productSlug],
    queryFn: () => apiGet<Product>(`/products/${productSlug}`),
    enabled: Boolean(productSlug),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? { message: `I'd like bulk pricing / details for ${product.name}.` }
      : undefined,
  });

  useEffect(() => {
    if (user) {
      if (user.full_name) setValue("name", user.full_name);
      if (user.phone) setValue("phone", user.phone);
      if (user.email) setValue("email", user.email);
    }
  }, [user, setValue]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: EnquiryPayload = {
        name: values.name,
        phone: values.phone,
        message: values.message,
        email: values.email || null,
        budget: values.budget || null,
        product_id: product?.id ?? null,
        source: "website",
      };
      return apiPost<EnquiryPayload, Enquiry>("/enquiries", payload, token || undefined);
    },
  });

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[45%_55%] lg:gap-20">
        <Reveal>
          <section id="about">
            <p className="font-sans text-label font-bold uppercase text-orange">
              About the Store
            </p>
            <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
              Talk to
              <br />
              Kamlesh<span className="text-orange">.</span>
            </h1>
            <p className="mt-6 max-w-[420px] font-sans text-body text-ink-soft">
              For 25 years, Kamlesh Paints &amp; Hardware has served homeowners, painters, and
              contractors from Shivajinagar. We stock the complete Birla Opus range — exclusively —
              with free delivery across Pune.
            </p>
          </section>

          <div className="mt-10 space-y-5">
            {INFO.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-start gap-4 transition-colors hover:text-orange"
                >
                  <span className="text-lg" aria-hidden="true">{item.icon}</span>
                  <div>
                    <p className="font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">
                      {item.label}
                    </p>
                    <p className="font-sans text-sm text-ink">{item.value}</p>
                  </div>
                </a>
              ) : (
                <div key={item.label} className="flex items-start gap-4">
                  <span className="text-lg" aria-hidden="true">{item.icon}</span>
                  <div>
                    <p className="font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">
                      {item.label}
                    </p>
                    <p className="font-sans text-sm text-ink">{item.value}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          {mutation.isSuccess ? (
            <div className="rounded-[20px] bg-paper shadow-card-warm p-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange text-3xl text-white">
                ✓
              </span>
              <h2 className="mt-6 font-display text-[32px] font-bold text-ink">
                Enquiry received!
              </h2>
              <p className="mx-auto mt-3 max-w-[380px] font-sans text-sm text-ink-soft">
                Thanks, {mutation.data.name}. We&apos;ll get back to you on {mutation.data.phone}{" "}
                shortly — usually within the hour during shop time.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              className="rounded-[20px] bg-paper shadow-card-warm p-7 md:p-10"
              noValidate
            >
              {product && (
                <div className="mb-6 flex items-center gap-3 rounded-xl bg-marigold-soft/50 px-4 py-3">
                  <span className="text-lg" aria-hidden="true">🪣</span>
                  <p className="font-sans text-sm text-ink">
                    Enquiring about <span className="font-bold">{product.name}</span>
                  </p>
                </div>
              )}
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
                  <label htmlFor="ct-budget" className={labelClasses}>
                    Estimated budget <span className="normal-case opacity-60">(optional)</span>
                  </label>
                  <Select id="ct-budget" {...register("budget")}>
                    <option value="">Not sure yet</option>
                    {BUDGETS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Select>
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
                  className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-0 disabled:opacity-60"
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

export default function ContactPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream" />}>
      <ContactForm />
    </Suspense>
  );
}
