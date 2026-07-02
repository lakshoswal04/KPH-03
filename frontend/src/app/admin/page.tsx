"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Input, labelClasses } from "@/components/ui/Input";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import type { Enquiry, Order, Survey, TokenResponse } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Enter your admin email"),
  password: z.string().min(6, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

const TABS = ["Enquiries", "Surveys", "Orders"] as const;
type Tab = (typeof TABS)[number];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("Enquiries");

  const enquiries = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: () => apiGet<Enquiry[]>("/admin/enquiries", token),
  });
  const surveys = useQuery({
    queryKey: ["admin", "surveys"],
    queryFn: () => apiGet<Survey[]>("/admin/surveys", token),
  });
  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => apiGet<Order[]>("/admin/orders", token),
  });

  const thClass =
    "px-4 py-3 text-left font-sans text-[11px] font-bold uppercase tracking-[2px] text-ivory-text/40";
  const tdClass = "px-4 py-3 font-sans text-sm text-ivory-text/85";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-5 py-2 font-sans text-[13px] font-semibold transition-colors duration-200",
                tab === t
                  ? "bg-orange text-white"
                  : "border border-ivory-text/15 text-muted hover:border-ivory-text/40 hover:text-ivory-text",
              )}
            >
              {t}
              {t === "Enquiries" && enquiries.data ? ` (${enquiries.data.length})` : ""}
              {t === "Surveys" && surveys.data ? ` (${surveys.data.length})` : ""}
              {t === "Orders" && orders.data ? ` (${orders.data.length})` : ""}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="font-sans text-sm font-semibold text-muted transition-colors hover:text-coral"
        >
          Log out
        </button>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-ivory-text/10 bg-card">
        {tab === "Enquiries" && (
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-ivory-text/10">
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Message</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(enquiries.data ?? []).map((e) => (
                <tr key={e.id} className="border-b border-ivory-text/5">
                  <td className={tdClass}>{formatDate(e.created_at)}</td>
                  <td className={tdClass}>{e.name}</td>
                  <td className={tdClass}>{e.phone}</td>
                  <td className={cn(tdClass, "max-w-[320px]")}>{e.message}</td>
                  <td className={tdClass}>{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "Surveys" && (
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-ivory-text/10">
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Locality</th>
                <th className={thClass}>Property</th>
                <th className={thClass}>Preferred Date</th>
              </tr>
            </thead>
            <tbody>
              {(surveys.data ?? []).map((s) => (
                <tr key={s.id} className="border-b border-ivory-text/5">
                  <td className={tdClass}>{formatDate(s.created_at)}</td>
                  <td className={tdClass}>{s.name}</td>
                  <td className={tdClass}>{s.phone}</td>
                  <td className={tdClass}>{s.locality}</td>
                  <td className={tdClass}>{s.property_type}</td>
                  <td className={tdClass}>{s.preferred_date ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "Orders" && (
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-ivory-text/10">
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>#</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Items</th>
                <th className={thClass}>Total</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(orders.data ?? []).map((o) => (
                <tr key={o.id} className="border-b border-ivory-text/5">
                  <td className={tdClass}>{formatDate(o.created_at)}</td>
                  <td className={tdClass}>{o.id}</td>
                  <td className={tdClass}>
                    {o.customer_name} · {o.phone}
                  </td>
                  <td className={cn(tdClass, "max-w-[280px]")}>
                    {o.items.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className={cn(tdClass, "text-gold")}>₹{formatINR(o.total_amount)}</td>
                  <td className={tdClass}>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 font-sans text-[11px] font-bold uppercase tracking-wider",
                        o.status === "paid"
                          ? "bg-mint/15 text-mint"
                          : o.status === "failed"
                            ? "bg-coral/15 text-coral"
                            : "bg-gold/15 text-gold",
                      )}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const token = useUiStore((s) => s.adminToken);
  const setToken = useUiStore((s) => s.setAdminToken);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const login = useMutation({
    mutationFn: (values: LoginValues) =>
      apiPost<LoginValues, TokenResponse>("/auth/login", values),
    onSuccess: (data) => setToken(data.access_token),
  });

  return (
    <main className="min-h-screen bg-canvas px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <p className="font-sans text-label font-bold uppercase text-gold">Staff Only</p>
      <h1 className="mt-4 font-display text-section-h2 font-black text-ivory-text">
        Admin<span className="text-orange">.</span>
      </h1>

      <div className="mt-12">
        {token ? (
          <Dashboard token={token} onLogout={() => setToken(null)} />
        ) : (
          <form
            onSubmit={handleSubmit((values) => login.mutate(values))}
            className="max-w-md rounded-[20px] bg-card p-8"
            noValidate
          >
            <div className="space-y-6">
              <div>
                <label htmlFor="ad-email" className={labelClasses}>
                  Email
                </label>
                <Input id="ad-email" type="email" placeholder="admin@…" {...register("email")} />
                {errors.email && (
                  <p className="mt-1.5 font-sans text-xs text-coral">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="ad-pass" className={labelClasses}>
                  Password
                </label>
                <Input id="ad-pass" type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && (
                  <p className="mt-1.5 font-sans text-xs text-coral">{errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={login.isPending}
                className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep disabled:opacity-60"
              >
                {login.isPending ? "Signing in…" : "Sign In"}
              </button>
              {login.isError && (
                <p className="font-sans text-sm text-coral">Incorrect email or password.</p>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
