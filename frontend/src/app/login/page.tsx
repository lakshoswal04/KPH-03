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
import { apiGet, apiPost } from "@/lib/api";
import type { TokenResponse, UserMe } from "@/types";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/profile";
  const { setAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const login = useMutation({
    mutationFn: async (values: FormValues) => {
      const { access_token } = await apiPost<FormValues, TokenResponse>("/auth/login", values);
      const me = await apiGet<UserMe>("/auth/me", access_token);
      return { access_token, me };
    },
    onSuccess: ({ access_token, me }) => {
      setAuth(access_token, me);
      router.push(next);
    },
  });

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">Welcome back</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
          Log in<span className="text-orange">.</span>
        </h1>
      </Reveal>

      <form
        onSubmit={handleSubmit((values) => login.mutate(values))}
        className="mt-12 max-w-md rounded-[20px] bg-paper p-8 shadow-card-warm"
        noValidate
      >
        <div className="space-y-6">
          <div>
            <label htmlFor="lg-email" className={labelClasses}>Email</label>
            <Input id="lg-email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="mt-1.5 font-sans text-xs text-coral">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="lg-pass" className={labelClasses}>Password</label>
            <Input id="lg-pass" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="mt-1.5 font-sans text-xs text-coral">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep disabled:opacity-60"
          >
            {login.isPending ? "Signing in…" : "Log In"}
          </button>
          {login.isError && (
            <p className="font-sans text-sm text-coral">Incorrect email or password.</p>
          )}
          <p className="font-sans text-sm text-ink-soft">
            New to Kamlesh Paints?{" "}
            <Link
              href={`/signup${next !== "/profile" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-semibold text-orange hover:opacity-75"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream" />}>
      <LoginForm />
    </Suspense>
  );
}
