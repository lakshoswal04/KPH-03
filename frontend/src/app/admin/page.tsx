"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { DashboardSection } from "@/components/admin/DashboardSection";
import { ProductManager } from "@/components/admin/ProductManager";
import {
  CustomersSection,
  EnquiriesSection,
  InsightsSection,
  InventorySection,
  OrdersSection,
  SurveysSection,
  WhatsappSection,
} from "@/components/admin/sections";
import { Input, labelClasses } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TokenResponse, UserMe } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Enter your admin email"),
  password: z.string().min(6, "Enter your password"),
});
type LoginValues = z.infer<typeof loginSchema>;

const SECTIONS = [
  "Dashboard", "Insights", "Orders", "Products", "Inventory", "Customers",
  "Enquiries", "Surveys", "WhatsApp",
] as const;
type Section = (typeof SECTIONS)[number];


function AdminShell({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [section, setSection] = useState<Section>("Dashboard");
  return (
    <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
      <nav className="flex flex-row flex-wrap gap-1.5 lg:flex-col">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={cn(
              "rounded-lg px-4 py-2 text-left font-sans text-[14px] font-semibold transition-colors",
              section === s ? "bg-orange text-white" : "text-ink-soft hover:bg-orange/10 hover:text-orange-deep",
            )}
          >
            {s}
          </button>
        ))}
        <button onClick={onLogout} className="mt-2 rounded-lg px-4 py-2 text-left font-sans text-[14px] font-semibold text-ink-soft transition-colors hover:text-coral">
          Log out
        </button>
      </nav>

      <div className="min-w-0">
        {section === "Dashboard" && <DashboardSection token={token} />}
        {section === "Insights" && <InsightsSection token={token} />}
        {section === "Orders" && <OrdersSection token={token} />}
        {section === "Products" && <ProductManager token={token} />}
        {section === "Inventory" && <InventorySection token={token} />}
        {section === "Customers" && <CustomersSection token={token} />}
        {section === "Enquiries" && <EnquiriesSection token={token} />}
        {section === "Surveys" && <SurveysSection token={token} />}
        {section === "WhatsApp" && <WhatsappSection token={token} />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { token, user, isAuthenticated, setAuth, logout } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const login = useMutation({
    mutationFn: async (values: LoginValues) => {
      setLoginError(null);
      const { access_token } = await apiPost<LoginValues, TokenResponse>("/auth/login", values);
      const me = await apiGet<UserMe>("/auth/me", access_token);
      if (!me.is_admin) {
        throw new Error("This account does not have admin privileges.");
      }
      return { access_token, me };
    },
    onSuccess: ({ access_token, me }) => {
      setAuth(access_token, me);
    },
    onError: (err: Error) => {
      setLoginError(err?.message || "Incorrect email or password.");
    },
  });

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <p className="font-sans text-label font-bold uppercase text-orange-deep">Staff Only</p>
      <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
        Admin<span className="text-orange">.</span>
      </h1>

      <div className="mt-10">
        {isAuthenticated && token && user?.is_admin ? (
          <AdminShell token={token} onLogout={logout} />
        ) : isAuthenticated && token && !user?.is_admin ? (
          <div className="max-w-md rounded-[20px] bg-paper shadow-card-warm p-8 text-center space-y-4">
            <p className="font-sans text-base text-ink">
              You are currently logged in as <strong className="font-bold">{user?.email}</strong>, which is a regular user account without administrator access.
            </p>
            <button
              onClick={logout}
              className="w-full rounded bg-orange p-3.5 font-sans text-sm font-bold uppercase tracking-[2px] text-white hover:bg-orange-deep transition-colors"
            >
              Log Out & Sign In as Admin
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => login.mutate(values))} className="max-w-md rounded-[20px] bg-paper shadow-card-warm p-8" noValidate>
            <div className="space-y-6">
              <div>
                <label htmlFor="ad-email" className={labelClasses}>Email</label>
                <Input id="ad-email" type="email" placeholder="admin@…" {...register("email")} />
                {errors.email && <p className="mt-1.5 font-sans text-xs text-coral">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="ad-pass" className={labelClasses}>Password</label>
                <Input id="ad-pass" type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="mt-1.5 font-sans text-xs text-coral">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={login.isPending} className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep disabled:opacity-60">
                {login.isPending ? "Signing in…" : "Sign In"}
              </button>
              {(login.isError || loginError) && (
                <p className="font-sans text-sm text-coral">{loginError || "Incorrect email or password."}</p>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

