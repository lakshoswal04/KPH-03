"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input, labelClasses } from "@/components/ui/Input";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { RegisterPayload, TokenResponse, UserMe } from "@/types";

const schema = z.object({
  full_name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

function SignupForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/profile";
  const { setAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const signup = useMutation({
    mutationFn: async (values: FormValues) => {
      const { access_token } = await apiPost<RegisterPayload, TokenResponse>("/auth/register", values);
      const me = await apiGet<UserMe>("/auth/me", access_token);
      return { access_token, me };
    },
    onSuccess: ({ access_token, me }) => {
      setAuth(access_token, me);
      router.push(next);
    },
  });

  const emailTaken = signup.error instanceof ApiError && signup.error.status === 400;

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">Join us</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
          Create account<span className="text-orange">.</span>
        </h1>
        <p className="mt-4 max-w-[440px] font-sans text-body text-ink-soft">
          Sign up to track your orders, site-survey bookings, and enquiries in one place.
        </p>
      </Reveal>

      <form
        onSubmit={handleSubmit((values) => signup.mutate(values))}
        className="mt-10 max-w-md rounded-[20px] bg-paper p-8 shadow-card-warm"
        noValidate
      >
        <div className="space-y-6">
          <div>
            <label htmlFor="su-name" className={labelClasses}>Full Name</label>
            <Input id="su-name" placeholder="Your name" {...register("full_name")} />
            {errors.full_name && <p className="mt-1.5 font-sans text-xs text-coral">{errors.full_name.message}</p>}
          </div>
          <div>
            <label htmlFor="su-email" className={labelClasses}>Email</label>
            <Input id="su-email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="mt-1.5 font-sans text-xs text-coral">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="su-phone" className={labelClasses}>Mobile Number</label>
            <Input id="su-phone" type="tel" placeholder="10-digit mobile" {...register("phone")} />
            {errors.phone && <p className="mt-1.5 font-sans text-xs text-coral">{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="su-pass" className={labelClasses}>Password</label>
            <Input id="su-pass" type="password" placeholder="At least 6 characters" {...register("password")} />
            {errors.password && <p className="mt-1.5 font-sans text-xs text-coral">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={signup.isPending}
            className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep disabled:opacity-60"
          >
            {signup.isPending ? "Creating account…" : "Create Account"}
          </button>
          {signup.isError && (
            <p className="font-sans text-sm text-coral">
              {emailTaken ? "That email is already registered — try logging in." : "Could not create the account — please try again."}
            </p>
          )}
          <p className="font-sans text-sm text-ink-soft">
            Already have an account?{" "}
            <Link
              href={`/login${next !== "/profile" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-semibold text-orange hover:opacity-75"
            >
              Log in
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream" />}>
      <SignupForm />
    </Suspense>
  );
}
