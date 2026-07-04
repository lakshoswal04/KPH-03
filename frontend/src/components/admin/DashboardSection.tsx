"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionHeader, StatCard, money } from "@/components/admin/ui";
import { apiGet } from "@/lib/api";
import type { BestSeller, Kpi, PaymentBreakdown, Period, TrendPoint } from "@/lib/adminApi";
import { PERIODS } from "@/lib/adminApi";

const PIE = ["#E8590C", "#F5C518", "#2A9D8F", "#8E7DBE", "#E07A5F"];

export function DashboardSection({ token }: { token: string }) {
  const [period, setPeriod] = useState<Period>("month");
  const auth = token;

  const kpi = useQuery({
    queryKey: ["adm-kpi", period],
    queryFn: () => apiGet<Kpi>(`/admin/dashboard/summary?period=${period}`, auth),
  });
  const sales = useQuery({
    queryKey: ["adm-sales", period],
    queryFn: () => apiGet<TrendPoint[]>(`/admin/dashboard/sales?period=${period}`, auth),
  });
  const best = useQuery({
    queryKey: ["adm-best", period],
    queryFn: () => apiGet<BestSeller[]>(`/admin/dashboard/best-sellers?period=${period}`, auth),
  });
  const pay = useQuery({
    queryKey: ["adm-pay", period],
    queryFn: () => apiGet<PaymentBreakdown>(`/admin/dashboard/payments?period=${period}`, auth),
  });

  const k = kpi.data;
  const methodData = Object.entries(pay.data?.by_method ?? {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-8">
      <SectionHeader title="Dashboard">
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3.5 py-1.5 font-sans text-[12px] font-semibold capitalize transition-colors ${
                period === p ? "bg-orange text-white" : "border border-ink/15 text-ink-soft hover:border-orange/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </SectionHeader>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={money(k?.revenue ?? 0)}
          sub={
            k ? (
              <span className={k.revenue_change_pct >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {k.revenue_change_pct >= 0 ? "▲" : "▼"} {Math.abs(k.revenue_change_pct)}% vs prev
              </span>
            ) : null
          }
          accent="#E8590C"
        />
        <StatCard label="Orders" value={String(k?.orders ?? 0)} sub={`${k?.pending_orders ?? 0} pending`} />
        <StatCard label="Avg order value" value={money(k?.avg_order_value ?? 0)} />
        <StatCard label="Customers" value={String(k?.customers ?? 0)} sub={`${k?.returning_customers ?? 0} returning`} />
        <StatCard label="Conversion" value={`${k?.conversion_rate ?? 0}%`} sub="orders / leads" />
        <StatCard label="Enquiries" value={String(k?.enquiries ?? 0)} />
        <StatCard label="Surveys" value={String(k?.surveys ?? 0)} />
        <StatCard label="GST collected" value={money(pay.data?.gst_collected ?? 0)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card-warm lg:col-span-2">
          <p className="font-sans text-[13px] font-bold text-ink">Revenue trend</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales.data ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8590C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E8590C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9a9a88" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9a9a88" width={48} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#E8590C" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card-warm">
          <p className="font-sans text-[13px] font-bold text-ink">Revenue by method</p>
          <div className="mt-4 h-[260px]">
            {methodData.length === 0 ? (
              <p className="pt-20 text-center font-sans text-[13px] text-ink-soft">No payments yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {methodData.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card-warm">
        <p className="font-sans text-[13px] font-bold text-ink">Best sellers (units)</p>
        <div className="mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={best.data ?? []} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9a9a88" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} stroke="#9a9a88" />
              <Tooltip />
              <Bar dataKey="units" fill="#F5C518" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
