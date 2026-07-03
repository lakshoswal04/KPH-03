"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { ProductImage } from "@/components/home/ProductShowcase";
import { Input, Select, Textarea, labelClasses } from "@/components/ui/Input";
import { apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import type { Category, Enquiry, Order, Product, TokenResponse } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Enter your admin email"),
  password: z.string().min(6, "Enter your password"),
});
type LoginValues = z.infer<typeof loginSchema>;

const TABS = ["Enquiries", "Surveys", "Orders", "Products"] as const;
type Tab = (typeof TABS)[number];

const ENQUIRY_STATUSES = ["new", "in_progress", "handled", "closed"];
const SURVEY_STATUSES = ["new", "scheduled", "done", "cancelled"];
const ORDER_STATUSES = ["created", "paid", "shipped", "delivered", "cancelled"];

const PRODUCT_TABS = ["interior", "exterior", "waterproofing", "wood", "tools", "hardware"];

interface Survey {
  id: number;
  name: string;
  phone: string;
  locality: string;
  property_type: string;
  preferred_date: string | null;
  status: string;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function StatusSelect({
  value,
  options,
  onChange,
  pending,
}: {
  value: string;
  options: string[];
  onChange: (next: string) => void;
  pending: boolean;
}) {
  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-ink/15 bg-cream px-3 py-1.5 font-sans text-[12px] font-semibold text-ink focus:border-orange focus:outline-none disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ---- Product create/edit + image upload ----
const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  sub_brand: z.string().min(1, "Brand required"),
  tab: z.string().min(2, "Category required"),
  description: z.string().min(2, "Description required"),
  price_low: z.number().min(0),
  price_high: z.number().min(0),
  price_unit: z.string().min(1),
  variantsText: z.string().optional(),
  category_id: z.string().optional(),
});
type ProductValues = z.infer<typeof productSchema>;

function parseVariants(text: string | undefined) {
  if (!text?.trim()) return [];
  return text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((pair) => {
      const [label, price] = pair.split(":").map((s) => s.trim());
      return { label, price: Number(price) || 0 };
    })
    .filter((v) => v.label);
}

function ProductManager({ token }: { token: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);

  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => apiGet<Product[]>("/admin/products", token),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/categories"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    values: editing
      ? {
          name: editing.name,
          sub_brand: editing.sub_brand,
          tab: editing.tab,
          description: editing.description,
          price_low: editing.price_low,
          price_high: editing.price_high,
          price_unit: editing.price_unit,
          variantsText: editing.variants.map((v) => `${v.label}:${v.price}`).join(", "),
          category_id: editing.category_id ? String(editing.category_id) : "",
        }
      : {
          name: "",
          sub_brand: "",
          tab: "interior",
          description: "",
          price_low: 0,
          price_high: 0,
          price_unit: "L",
          variantsText: "",
          category_id: "",
        },
  });

  const save = useMutation({
    mutationFn: (values: ProductValues) => {
      const body = {
        name: values.name,
        sub_brand: values.sub_brand,
        tab: values.tab,
        description: values.description,
        features: editing?.features ?? [],
        price_low: values.price_low,
        price_high: values.price_high,
        price_unit: values.price_unit,
        variants: parseVariants(values.variantsText),
        category_id: values.category_id ? Number(values.category_id) : null,
      };
      return editing
        ? apiPatch<typeof body, Product>(`/admin/products/${editing.id}`, body, token)
        : apiPost<typeof body, Product>("/admin/products", body, token);
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      setEditing(p);
    },
  });

  const upload = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiUpload<Product>(`/admin/products/${id}/image`, fd, token);
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      setEditing(p);
    },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* Editor */}
      <form
        onSubmit={handleSubmit((v) => save.mutate(v))}
        className="h-fit rounded-2xl border border-ink/10 bg-paper p-6 shadow-card-warm"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-ink">
            {editing ? "Edit product" : "New product"}
          </h3>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                reset();
              }}
              className="font-sans text-[12px] font-semibold text-orange hover:opacity-75"
            >
              + New
            </button>
          )}
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className={labelClasses}>Name</label>
            <Input {...register("name")} placeholder="e.g. One Pure Elegance" />
            {errors.name && <p className="mt-1 text-xs text-coral">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>Sub-brand</label>
              <Input {...register("sub_brand")} placeholder="ONE / TOOLS…" />
            </div>
            <div>
              <label className={labelClasses}>Category tab</label>
              <Select {...register("tab")}>
                {PRODUCT_TABS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className={labelClasses}>Category</label>
            <Select {...register("category_id")}>
              <option value="">— none —</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelClasses}>Description</label>
            <Textarea {...register("description")} placeholder="Short product description" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClasses}>Price low</label>
              <Input type="number" {...register("price_low", { valueAsNumber: true })} />
            </div>
            <div>
              <label className={labelClasses}>Price high</label>
              <Input type="number" {...register("price_high", { valueAsNumber: true })} />
            </div>
            <div>
              <label className={labelClasses}>Unit</label>
              <Input {...register("price_unit")} placeholder="L / unit" />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Variants (label:price, …)</label>
            <Input {...register("variantsText")} placeholder="1 L:320, 4 L:1240, 10 L:3010" />
          </div>
          <button
            type="submit"
            disabled={save.isPending}
            className="w-full rounded bg-orange p-3.5 font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:bg-orange-deep disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Create product"}
          </button>

          {/* Image upload — only after the product exists */}
          {editing && (
            <div className="rounded-xl border border-dashed border-ink/15 p-4">
              <label className={labelClasses}>Product image</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0">
                  <ProductImage product={editing} className="h-16 w-16" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload.mutate({ id: editing.id, file });
                  }}
                  className="font-sans text-xs text-ink-soft"
                />
              </div>
              {upload.isPending && <p className="mt-2 text-xs text-ink-soft">Uploading…</p>}
            </div>
          )}
          {save.isError && <p className="text-sm text-coral">Could not save — check the fields.</p>}
        </div>
      </form>

      {/* Product list */}
      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-card-warm">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-ink/10">
            <tr>
              <th className="px-4 py-3 text-left font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Product</th>
              <th className="px-4 py-3 text-left font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Brand</th>
              <th className="px-4 py-3 text-left font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">From</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(products.data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0">
                      <ProductImage product={p} className="h-10 w-10" />
                    </div>
                    <span className="font-sans text-sm text-ink">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-sans text-sm text-ink-soft">{p.sub_brand}</td>
                <td className="px-4 py-3 font-sans text-sm text-orange-deep">₹{formatINR(p.price_low)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="font-sans text-[12px] font-semibold text-orange hover:opacity-75"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("Enquiries");
  const qc = useQueryClient();

  const enquiries = useQuery({ queryKey: ["admin", "enquiries"], queryFn: () => apiGet<Enquiry[]>("/admin/enquiries", token) });
  const surveys = useQuery({ queryKey: ["admin", "surveys"], queryFn: () => apiGet<Survey[]>("/admin/surveys", token) });
  const orders = useQuery({ queryKey: ["admin", "orders"], queryFn: () => apiGet<Order[]>("/admin/orders", token) });

  const patch = useMutation({
    mutationFn: ({ kind, id, status }: { kind: string; id: number; status: string }) =>
      apiPatch<{ status: string }, unknown>(`/admin/${kind}/${id}`, { status }, token),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["admin", v.kind] }),
  });

  const thClass = "px-4 py-3 text-left font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40";
  const tdClass = "px-4 py-3 font-sans text-sm text-ink/85";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-5 py-2 font-sans text-[13px] font-semibold transition-colors duration-200",
                tab === t ? "bg-orange text-white" : "border border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink",
              )}
            >
              {t}
              {t === "Enquiries" && enquiries.data ? ` (${enquiries.data.length})` : ""}
              {t === "Surveys" && surveys.data ? ` (${surveys.data.length})` : ""}
              {t === "Orders" && orders.data ? ` (${orders.data.length})` : ""}
            </button>
          ))}
        </div>
        <button type="button" onClick={onLogout} className="font-sans text-sm font-semibold text-ink-soft transition-colors hover:text-coral">
          Log out
        </button>
      </div>

      <div className="mt-8">
        {tab === "Enquiries" && (
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-card-warm">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-ink/10">
                <tr>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Phone</th>
                  <th className={thClass}>Product</th>
                  <th className={thClass}>Message</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(enquiries.data ?? []).map((e) => (
                  <tr key={e.id} className="border-b border-ink/5">
                    <td className={tdClass}>{formatDate(e.created_at)}</td>
                    <td className={tdClass}>{e.name}</td>
                    <td className={tdClass}>{e.phone}</td>
                    <td className={tdClass}>{e.product_name ?? "—"}</td>
                    <td className={cn(tdClass, "max-w-[300px]")}>{e.message}</td>
                    <td className={tdClass}>
                      <StatusSelect
                        value={e.status}
                        options={ENQUIRY_STATUSES}
                        pending={patch.isPending}
                        onChange={(status) => patch.mutate({ kind: "enquiries", id: e.id, status })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Surveys" && (
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-card-warm">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-ink/10">
                <tr>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Phone</th>
                  <th className={thClass}>Locality</th>
                  <th className={thClass}>Property</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(surveys.data ?? []).map((s) => (
                  <tr key={s.id} className="border-b border-ink/5">
                    <td className={tdClass}>{formatDate(s.created_at)}</td>
                    <td className={tdClass}>{s.name}</td>
                    <td className={tdClass}>{s.phone}</td>
                    <td className={tdClass}>{s.locality}</td>
                    <td className={tdClass}>{s.property_type}</td>
                    <td className={tdClass}>
                      <StatusSelect
                        value={s.status}
                        options={SURVEY_STATUSES}
                        pending={patch.isPending}
                        onChange={(status) => patch.mutate({ kind: "surveys", id: s.id, status })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Orders" && (
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-card-warm">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-ink/10">
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
                  <tr key={o.id} className="border-b border-ink/5">
                    <td className={tdClass}>{formatDate(o.created_at)}</td>
                    <td className={tdClass}>{o.id}</td>
                    <td className={tdClass}>{o.customer_name} · {o.phone}</td>
                    <td className={cn(tdClass, "max-w-[260px]")}>
                      {o.items.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")}
                    </td>
                    <td className={cn(tdClass, "text-orange-deep")}>₹{formatINR(o.total_amount)}</td>
                    <td className={tdClass}>
                      <StatusSelect
                        value={o.status}
                        options={ORDER_STATUSES}
                        pending={patch.isPending}
                        onChange={(status) => patch.mutate({ kind: "orders", id: o.id, status })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Products" && <ProductManager token={token} />}
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
    mutationFn: (values: LoginValues) => apiPost<LoginValues, TokenResponse>("/auth/login", values),
    onSuccess: (data) => setToken(data.access_token),
  });

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <p className="font-sans text-label font-bold uppercase text-orange-deep">Staff Only</p>
      <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
        Admin<span className="text-orange">.</span>
      </h1>

      <div className="mt-12">
        {token ? (
          <Dashboard token={token} onLogout={() => setToken(null)} />
        ) : (
          <form
            onSubmit={handleSubmit((values) => login.mutate(values))}
            className="max-w-md rounded-[20px] bg-paper shadow-card-warm p-8"
            noValidate
          >
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
              <button
                type="submit"
                disabled={login.isPending}
                className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep disabled:opacity-60"
              >
                {login.isPending ? "Signing in…" : "Sign In"}
              </button>
              {login.isError && <p className="font-sans text-sm text-coral">Incorrect email or password.</p>}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
