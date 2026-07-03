"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input, labelClasses } from "@/components/ui/Input";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPatch } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { Enquiry, Order, ProfileUpdatePayload, Survey, UserMe } from "@/types";

const detailsSchema = z.object({
  full_name: z.string().min(2, "Enter your name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email"),
});
type DetailsValues = z.infer<typeof detailsSchema>;

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-mint/20 text-emerald-700"
      : status === "failed"
        ? "bg-coral/15 text-coral"
        : "bg-marigold-soft/60 text-orange-deep";
  return (
    <span className={`rounded-full px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-wider ${tone}`}>
      {status}
    </span>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, setUser, logout, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace("/login?next=/profile");
  }, [mounted, isAuthenticated, router]);

  const orders = useQuery({
    queryKey: ["me-orders", token],
    queryFn: () => apiGet<Order[]>("/auth/me/orders", token!),
    enabled: Boolean(token),
  });
  const surveys = useQuery({
    queryKey: ["me-surveys", token],
    queryFn: () => apiGet<Survey[]>("/auth/me/surveys", token!),
    enabled: Boolean(token),
  });
  const enquiries = useQuery({
    queryKey: ["me-enquiries", token],
    queryFn: () => apiGet<Enquiry[]>("/auth/me/enquiries", token!),
    enabled: Boolean(token),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DetailsValues>({ resolver: zodResolver(detailsSchema) });

  useEffect(() => {
    if (user) reset({ full_name: user.full_name ?? "", phone: user.phone ?? "", email: user.email });
  }, [user, reset]);

  const save = useMutation({
    mutationFn: (values: DetailsValues) =>
      apiPatch<ProfileUpdatePayload, UserMe>("/auth/me", values, token!),
    onSuccess: (me) => {
      setUser(me);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (!mounted || !isAuthenticated || !user) {
    return <main className="min-h-screen bg-cream" />;
  }

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-sans text-label font-bold uppercase text-orange">Your account</p>
            <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
              Hello, {user.full_name?.split(" ")[0] ?? "there"}
              <span className="text-orange">.</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-2 rounded-btn border border-ink/15 px-5 py-2.5 font-sans text-[12px] font-bold uppercase tracking-[1.5px] text-ink-soft transition-colors hover:border-coral hover:text-coral"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      </Reveal>

      {user.is_admin && (
        <Link
          href="/admin"
          className="mt-6 inline-block font-sans text-sm font-semibold text-orange hover:opacity-75"
        >
          Go to admin dashboard →
        </Link>
      )}

      <div className="mt-12 grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* My details */}
        <form
          onSubmit={handleSubmit((v) => save.mutate(v))}
          className="h-fit rounded-[20px] bg-paper p-7 shadow-card-warm"
          noValidate
        >
          <h2 className="font-display text-2xl font-bold text-ink">My details</h2>
          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="pf-name" className={labelClasses}>Full Name</label>
              <Input id="pf-name" {...register("full_name")} />
              {errors.full_name && <p className="mt-1.5 font-sans text-xs text-coral">{errors.full_name.message}</p>}
            </div>
            <div>
              <label htmlFor="pf-phone" className={labelClasses}>Mobile Number</label>
              <Input id="pf-phone" type="tel" {...register("phone")} />
              {errors.phone && <p className="mt-1.5 font-sans text-xs text-coral">{errors.phone.message}</p>}
            </div>
            <div>
              <label htmlFor="pf-email" className={labelClasses}>Email</label>
              <Input id="pf-email" type="email" {...register("email")} />
              {errors.email && <p className="mt-1.5 font-sans text-xs text-coral">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={save.isPending || !isDirty}
              className="w-full rounded bg-orange p-3.5 font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
            </button>
            {save.isError && <p className="font-sans text-sm text-coral">Could not save — please try again.</p>}
          </div>
        </form>

        {/* Activity */}
        <div className="space-y-10">
          {/* Orders */}
          <section>
            <h2 className="font-display text-2xl font-bold text-ink">My orders</h2>
            <div className="mt-5 space-y-4">
              {orders.isLoading ? (
                <p className="font-sans text-sm text-ink-soft">Loading…</p>
              ) : orders.data && orders.data.length > 0 ? (
                orders.data.map((o) => (
                  <div key={o.id} className="rounded-2xl bg-paper p-6 shadow-card-warm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-display text-lg font-bold text-ink">Order #{o.id}</p>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="mt-1 font-sans text-[12px] text-ink-faint">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {o.items.map((it) => (
                        <li key={it.id} className="flex justify-between font-sans text-sm text-ink-soft">
                          <span>
                            {it.product_name}
                            {it.variant_label ? ` (${it.variant_label})` : ""} × {it.quantity}
                          </span>
                          <span className="text-ink">₹{formatINR(it.unit_price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-sans font-semibold text-ink">
                      <span>Total</span>
                      <span className="text-orange-deep">₹{formatINR(o.total_amount)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-paper/60 p-6 font-sans text-sm text-ink-soft">
                  No orders yet. <Link href="/products" className="font-semibold text-orange">Start shopping →</Link>
                </p>
              )}
            </div>
          </section>

          {/* Surveys */}
          <section>
            <h2 className="font-display text-2xl font-bold text-ink">My site-survey bookings</h2>
            <div className="mt-5 space-y-3">
              {surveys.data && surveys.data.length > 0 ? (
                surveys.data.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper p-5 shadow-card-warm">
                    <div>
                      <p className="font-sans font-semibold text-ink">{s.locality} · {s.property_type}</p>
                      <p className="font-sans text-[12px] text-ink-soft">{s.address}</p>
                    </div>
                    <StatusPill status={s.status} />
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-paper/60 p-6 font-sans text-sm text-ink-soft">
                  No bookings yet. <Link href="/survey" className="font-semibold text-orange">Book a free site survey →</Link>
                </p>
              )}
            </div>
          </section>

          {/* Enquiries */}
          <section>
            <h2 className="font-display text-2xl font-bold text-ink">My enquiries</h2>
            <div className="mt-5 space-y-3">
              {enquiries.data && enquiries.data.length > 0 ? (
                enquiries.data.map((e) => (
                  <div key={e.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-paper p-5 shadow-card-warm">
                    <p className="max-w-[80%] font-sans text-sm text-ink-soft">{e.message}</p>
                    <StatusPill status={e.status} />
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-paper/60 p-6 font-sans text-sm text-ink-soft">
                  No enquiries yet. <Link href="/contact" className="font-semibold text-orange">Ask us anything →</Link>
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
