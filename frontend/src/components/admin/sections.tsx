"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  SectionHeader,
  StatCard,
  StatusPill,
  StatusSelect,
  TableWrap,
  formatDate,
  money,
} from "@/components/admin/ui";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { downloadCsv } from "@/lib/adminApi";
import type { CustomerDetail, CustomerRow, InventorySummary } from "@/lib/adminApi";
import type { Order } from "@/types";

const ORDER_STATUSES = [
  "pending", "confirmed", "packed", "shipped", "out_for_delivery",
  "delivered", "cancelled", "refunded",
];
const ENQUIRY_STATUSES = ["new", "assigned", "in_progress", "replied", "closed", "archived"];
const SURVEY_STATUSES = ["pending", "assigned", "scheduled", "in_progress", "completed", "cancelled"];

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-ink/15 px-3.5 py-1.5 font-sans text-[12px] font-semibold text-ink-soft hover:border-orange hover:text-orange"
    >
      Export CSV
    </button>
  );
}

// ==================== Inventory ====================
export function InventorySection({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["adm-inv"],
    queryFn: () => apiGet<InventorySummary>("/admin/inventory", token),
  });
  const adjust = useMutation({
    mutationFn: (v: { id: number; change: number }) =>
      apiPost(`/admin/inventory/${v.id}/adjust`, { change: v.change, reason: "restock" }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adm-inv"] }),
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Inventory" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="SKUs" value={String(data?.total_skus ?? 0)} />
        <StatCard label="Low stock" value={String(data?.low_stock ?? 0)} accent="#B45309" />
        <StatCard label="Out of stock" value={String(data?.out_of_stock ?? 0)} accent="#BE123C" />
        <StatCard label="Units in stock" value={String(data?.total_units ?? 0)} sub={`${data?.reserved_units ?? 0} reserved`} />
      </div>
      <TableWrap>
        <thead className="bg-cream/60 text-left text-ink-soft">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Available</th>
            <th className="px-4 py-3">Reserved</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Restock</th>
          </tr>
        </thead>
        <tbody>
          {(data?.rows ?? []).map((r) => (
            <tr key={r.id} className="border-t border-ink/5">
              <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
              <td className="px-4 py-3 text-ink-soft">{r.sku}</td>
              <td className="px-4 py-3 font-semibold text-ink">{r.available}</td>
              <td className="px-4 py-3 text-ink-soft">{r.reserved}</td>
              <td className="px-4 py-3"><StatusPill status={r.status} /></td>
              <td className="px-4 py-3">
                <button
                  onClick={() => adjust.mutate({ id: r.id, change: 10 })}
                  className="rounded-full bg-ink px-3 py-1 font-sans text-[11px] font-semibold text-white hover:bg-orange-deep"
                >
                  +10
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ==================== Orders ====================
export function OrdersSection({ token }: { token: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const { data } = useQuery({
    queryKey: ["adm-orders", status],
    queryFn: () => apiGet<Order[]>(`/admin/orders${status ? `?status=${status}` : ""}`, token),
  });
  const update = useMutation({
    mutationFn: (v: { id: number; status: string }) =>
      apiPatch(`/admin/orders/${v.id}`, { status: v.status }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adm-orders"] }),
    onError: (e: Error) => alert(e.message),
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Orders">
        <StatusSelect value={status || "all"} options={["all", ...ORDER_STATUSES]} onChange={(s) => setStatus(s === "all" ? "" : s)} />
        <ExportBtn onClick={() => downloadCsv("/admin/orders/export", "orders.csv", token)} />
      </SectionHeader>
      <TableWrap>
        <thead className="bg-cream/60 text-left text-ink-soft">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((o) => (
            <tr key={o.id} className="border-t border-ink/5">
              <td className="px-4 py-3 font-semibold text-ink">{o.id}</td>
              <td className="px-4 py-3 text-ink">
                {o.customer_name}
                <span className="block text-[11px] text-ink-soft">{o.phone}</span>
              </td>
              <td className="px-4 py-3 font-semibold text-ink">{money(o.total_amount)}</td>
              <td className="px-4 py-3">
                <StatusSelect value={o.status} options={ORDER_STATUSES} onChange={(s) => update.mutate({ id: o.id, status: s })} pending={update.isPending} />
              </td>
              <td className="px-4 py-3 text-ink-soft">{formatDate(o.created_at)}</td>
              <td className="px-4 py-3">
                {o.invoice_id ? (
                  <a href={`${API}/uploads/invoice-KPH-${new Date(o.created_at).getFullYear()}-${String(o.invoice_id).padStart(5, "0")}.html`} target="_blank" rel="noreferrer" className="font-semibold text-orange hover:underline">
                    Print
                  </a>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ==================== Customers ====================
export function CustomersSection({ token }: { token: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const { data } = useQuery({
    queryKey: ["adm-cust", search],
    queryFn: () => apiGet<CustomerRow[]>(`/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`, token),
  });
  const detail = useQuery({
    queryKey: ["adm-cust-detail", selected],
    queryFn: () => apiGet<CustomerDetail>(`/admin/customers/${selected}`, token),
    enabled: selected !== null,
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Customers">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="rounded-full border border-ink/15 px-4 py-1.5 font-sans text-[13px] focus:border-orange focus:outline-none" />
      </SectionHeader>
      <TableWrap>
        <thead className="bg-cream/60 text-left text-ink-soft">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Orders</th>
            <th className="px-4 py-3">Spent</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((c) => (
            <tr key={c.id} className="border-t border-ink/5">
              <td className="px-4 py-3 font-medium text-ink">{c.full_name ?? "—"}{c.is_admin && <span className="ml-2 rounded bg-orange/10 px-1.5 py-0.5 text-[10px] font-bold text-orange">ADMIN</span>}</td>
              <td className="px-4 py-3 text-ink-soft">{c.email}<span className="block text-[11px]">{c.phone}</span></td>
              <td className="px-4 py-3 text-ink">{c.orders}</td>
              <td className="px-4 py-3 font-semibold text-ink">{money(c.spent)}</td>
              <td className="px-4 py-3"><button onClick={() => setSelected(c.id)} className="font-semibold text-orange hover:underline">View</button></td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      {selected !== null && detail.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-[22px] font-black text-ink">{detail.data.full_name ?? detail.data.email}</h3>
                <p className="font-sans text-[13px] text-ink-soft">{detail.data.email} · {detail.data.phone ?? "no phone"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-ink-soft hover:text-ink">✕</button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatCard label="Orders" value={String(detail.data.orders)} />
              <StatCard label="Spent" value={money(detail.data.spent)} />
              <StatCard label="Enquiries" value={String(detail.data.enquiries)} />
            </div>
            <p className="mt-5 font-sans text-[12px] font-bold uppercase tracking-wide text-ink-soft">Activity</p>
            <ul className="mt-2 space-y-2">
              {detail.data.timeline.map((t, i) => (
                <li key={i} className="flex gap-3 font-sans text-[13px]">
                  <span className="w-24 shrink-0 text-ink-faint">{new Date(t.at).toLocaleDateString("en-IN")}</span>
                  <span className="text-ink-soft"><span className="font-semibold capitalize text-ink">{t.kind}: </span>{t.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Enquiries ====================
interface AdminEnquiry {
  id: number; name: string; phone: string; email: string | null; message: string;
  product_name?: string | null; budget?: string | null; source?: string;
  status: string; reply?: string | null; archived?: boolean; followups?: { at: string; note: string }[];
  created_at: string;
}
export function EnquiriesSection({ token }: { token: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const { data } = useQuery({
    queryKey: ["adm-enq", status],
    queryFn: () => apiGet<AdminEnquiry[]>(`/admin/enquiries${status ? `?status=${status}` : ""}`, token),
  });
  const update = useMutation({
    mutationFn: (v: { id: number; body: Record<string, unknown> }) => apiPatch(`/admin/enquiries/${v.id}`, v.body, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adm-enq"] }); setReplyFor(null); setReplyText(""); },
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Enquiries">
        <StatusSelect value={status || "all"} options={["all", ...ENQUIRY_STATUSES]} onChange={(s) => setStatus(s === "all" ? "" : s)} />
        <ExportBtn onClick={() => downloadCsv("/admin/enquiries/export", "enquiries.csv", token)} />
      </SectionHeader>
      <div className="space-y-3">
        {(data ?? []).map((e) => (
          <div key={e.id} className="rounded-2xl border border-ink/8 bg-paper p-4 shadow-card-warm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-sans font-semibold text-ink">{e.name} <span className="font-normal text-ink-soft">· {e.phone}</span></p>
                <p className="mt-1 font-sans text-[13px] text-ink-soft">{e.message}</p>
                <p className="mt-1 font-sans text-[11px] text-ink-faint">
                  {e.product_name ? `Product: ${e.product_name} · ` : ""}{e.budget ? `Budget: ${e.budget} · ` : ""}{formatDate(e.created_at)}
                </p>
                {e.reply && <p className="mt-2 rounded bg-emerald-50 px-3 py-2 font-sans text-[12px] text-emerald-800">Replied: {e.reply}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusSelect value={e.status} options={ENQUIRY_STATUSES} onChange={(s) => update.mutate({ id: e.id, body: { status: s } })} />
                <div className="flex gap-2">
                  <button onClick={() => { setReplyFor(replyFor === e.id ? null : e.id); setReplyText(e.reply ?? ""); }} className="font-sans text-[12px] font-semibold text-orange">Reply</button>
                  <button onClick={() => update.mutate({ id: e.id, body: { archived: !e.archived } })} className="font-sans text-[12px] font-semibold text-ink-soft">{e.archived ? "Unarchive" : "Archive"}</button>
                </div>
              </div>
            </div>
            {replyFor === e.id && (
              <div className="mt-3 flex gap-2">
                <input value={replyText} onChange={(ev) => setReplyText(ev.target.value)} placeholder="Type reply (emailed to customer)…" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 font-sans text-[13px] focus:border-orange focus:outline-none" />
                <button onClick={() => update.mutate({ id: e.id, body: { reply: replyText } })} className="rounded-lg bg-orange px-4 font-sans text-[12px] font-semibold text-white">Send</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== WhatsApp leads ====================
interface WaLead {
  id: number; phone: string; name: string | null; intent: string | null;
  budget: string | null; location: string | null; stage: string; status: string; created_at: string;
}
export function WhatsappSection({ token }: { token: string }) {
  const { data } = useQuery({
    queryKey: ["adm-wa"],
    queryFn: () => apiGet<WaLead[]>("/whatsapp/leads", token),
  });
  return (
    <div className="space-y-6">
      <SectionHeader title="WhatsApp leads" />
      {(data?.length ?? 0) === 0 ? (
        <p className="font-sans text-[13px] text-ink-soft">No WhatsApp conversations yet. Leads captured by the bot appear here.</p>
      ) : (
        <TableWrap>
          <thead className="bg-cream/60 text-left text-ink-soft">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((l) => (
              <tr key={l.id} className="border-t border-ink/5">
                <td className="px-4 py-3 font-medium text-ink">{l.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{l.phone}</td>
                <td className="px-4 py-3 text-ink-soft">{l.intent ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{l.location ?? "—"}</td>
                <td className="px-4 py-3"><StatusPill status={l.status} /></td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

// ==================== AI Insights ====================
interface Insights {
  forecast: { method: string; daily_avg: number; next_30d: number; confidence: string };
  slow_moving: { id: number; name: string; stock: number; sold: number }[];
  cross_sell: { a: string; b: string; count: number }[];
  high_value_customers: { id: number; name: string; orders: number; spent: number }[];
  segmentation: { new: number; returning: number; dormant: number; total_buyers: number };
  restock: { id: number; name: string; available: number; sold_recent: number; suggested_reorder: number }[];
  summary: string;
  mock: boolean;
}
export function InsightsSection({ token }: { token: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["adm-insights"],
    queryFn: () => apiGet<Insights>("/admin/dashboard/insights", token),
  });
  if (isLoading || !data) return <p className="font-sans text-ink-soft">Computing insights…</p>;
  const seg = data.segmentation;
  return (
    <div className="space-y-6">
      <SectionHeader title="AI Business Insights" />
      <div className="rounded-2xl border border-orange/20 bg-orange/5 p-5">
        <p className="font-sans text-[11px] font-bold uppercase tracking-wide text-orange-deep">
          Summary {data.mock && <span className="text-ink-faint">(offline template)</span>}
        </p>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-ink">{data.summary}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Forecast (30d)" value={money(data.forecast.next_30d)} sub={`${data.forecast.confidence} confidence`} accent="#E8590C" />
        <StatCard label="Returning buyers" value={String(seg.returning)} sub={`${seg.new} new`} />
        <StatCard label="Dormant" value={String(seg.dormant)} sub="90+ days" />
        <StatCard label="Restock needed" value={String(data.restock.length)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card-warm">
          <p className="font-sans text-[13px] font-bold text-ink">Restock recommendations</p>
          {data.restock.length === 0 ? (
            <p className="mt-3 font-sans text-[13px] text-ink-soft">All best-sellers are well stocked.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.restock.map((r) => (
                <li key={r.id} className="flex justify-between font-sans text-[13px]">
                  <span className="text-ink">{r.name}</span>
                  <span className="text-ink-soft">{r.available} left · reorder {r.suggested_reorder}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card-warm">
          <p className="font-sans text-[13px] font-bold text-ink">Frequently bought together</p>
          {data.cross_sell.length === 0 ? (
            <p className="mt-3 font-sans text-[13px] text-ink-soft">Not enough multi-item orders yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.cross_sell.map((c, i) => (
                <li key={i} className="flex justify-between font-sans text-[13px]">
                  <span className="text-ink">{c.a} + {c.b}</span>
                  <span className="text-ink-soft">{c.count}×</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card-warm">
          <p className="font-sans text-[13px] font-bold text-ink">High-value customers</p>
          <ul className="mt-3 space-y-2">
            {data.high_value_customers.map((c) => (
              <li key={c.id} className="flex justify-between font-sans text-[13px]">
                <span className="text-ink">{c.name}</span>
                <span className="text-ink-soft">{money(c.spent)} · {c.orders} orders</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card-warm">
          <p className="font-sans text-[13px] font-bold text-ink">Slow-moving stock</p>
          <ul className="mt-3 space-y-2">
            {data.slow_moving.slice(0, 8).map((s) => (
              <li key={s.id} className="flex justify-between font-sans text-[13px]">
                <span className="text-ink">{s.name}</span>
                <span className="text-ink-soft">{s.sold} sold · {s.stock} in stock</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ==================== Surveys ====================
interface AdminSurvey {
  id: number; name: string; phone: string; locality: string; property_type: string;
  preferred_date: string | null; preferred_time?: string | null; status: string;
  reference_images?: string[]; scheduled_at?: string | null; created_at: string;
}
export function SurveysSection({ token }: { token: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const { data } = useQuery({
    queryKey: ["adm-surv", status],
    queryFn: () => apiGet<AdminSurvey[]>(`/admin/surveys${status ? `?status=${status}` : ""}`, token),
  });
  const update = useMutation({
    mutationFn: (v: { id: number; body: Record<string, unknown> }) => apiPatch(`/admin/surveys/${v.id}`, v.body, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adm-surv"] }),
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Site surveys">
        <StatusSelect value={status || "all"} options={["all", ...SURVEY_STATUSES]} onChange={(s) => setStatus(s === "all" ? "" : s)} />
        <ExportBtn onClick={() => downloadCsv("/admin/surveys/export", "surveys.csv", token)} />
      </SectionHeader>
      <div className="space-y-3">
        {(data ?? []).map((s) => (
          <div key={s.id} className="rounded-2xl border border-ink/8 bg-paper p-4 shadow-card-warm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-sans font-semibold text-ink">{s.name} <span className="font-normal text-ink-soft">· {s.phone}</span></p>
                <p className="mt-1 font-sans text-[13px] text-ink-soft">{s.locality} · {s.property_type}</p>
                <p className="mt-1 font-sans text-[11px] text-ink-faint">
                  Preferred: {s.preferred_date ?? "any"} {s.preferred_time ?? ""} · {formatDate(s.created_at)}
                </p>
                {s.reference_images && s.reference_images.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {s.reference_images.map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={img} src={img} alt="reference" className="h-14 w-14 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusSelect value={s.status} options={SURVEY_STATUSES} onChange={(v) => update.mutate({ id: s.id, body: { status: v } })} />
                <input type="datetime-local" onChange={(e) => update.mutate({ id: s.id, body: { scheduled_at: new Date(e.target.value).toISOString() } })} className="rounded-lg border border-ink/15 px-2 py-1 font-sans text-[12px] focus:border-orange focus:outline-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
