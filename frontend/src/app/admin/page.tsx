"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { DashboardSection } from "@/components/admin/DashboardSection";
import {
  CustomersSection,
  EnquiriesSection,
  InsightsSection,
  InventorySection,
  OrdersSection,
  SurveysSection,
  WhatsappSection,
} from "@/components/admin/sections";
import { ProductImage } from "@/components/home/ProductShowcase";
import { Input, Select, Textarea, labelClasses } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { downloadCsv } from "@/lib/adminApi";
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";
import type { Category, Product, TokenResponse, UserMe } from "@/types";

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

const PRODUCT_TABS = ["interior", "exterior", "waterproofing", "wood", "tools", "hardware"];

const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  sub_brand: z.string().min(1, "Brand required"),
  tab: z.string().min(2, "Category required"),
  description: z.string().min(2, "Description required"),
  price_low: z.number().min(0),
  price_high: z.number().min(0),
  price_unit: z.string().min(1),
  stock: z.number().min(0).optional(),
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
          stock: editing.stock ?? 0,
          variantsText: editing.variants.map((v) => `${v.label}:${v.price}`).join(", "),
          category_id: editing.category_id ? String(editing.category_id) : "",
        }
      : {
          name: "", sub_brand: "", tab: "interior", description: "",
          price_low: 0, price_high: 0, price_unit: "L", stock: 0,
          variantsText: "", category_id: "",
        },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "products"] });

  const save = useMutation({
    mutationFn: (values: ProductValues) => {
      const body = {
        name: values.name, sub_brand: values.sub_brand, tab: values.tab,
        description: values.description, features: editing?.features ?? [],
        price_low: values.price_low, price_high: values.price_high,
        price_unit: values.price_unit, stock: values.stock ?? 0,
        variants: parseVariants(values.variantsText),
        category_id: values.category_id ? Number(values.category_id) : null,
      };
      return editing
        ? apiPatch<typeof body, Product>(`/admin/products/${editing.id}`, body, token)
        : apiPost<typeof body, Product>("/admin/products", body, token);
    },
    onSuccess: (p) => { invalidate(); setEditing(p); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/products/${id}`, token),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const duplicate = useMutation({
    mutationFn: (id: number) => apiPost<undefined, Product>(`/admin/products/${id}/duplicate`, undefined as never, token),
    onSuccess: (p) => { invalidate(); setEditing(p); },
  });
  const upload = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiUpload<Product>(`/admin/products/${id}/image`, fd, token);
    },
    onSuccess: (p) => { invalidate(); setEditing(p); },
  });
  const importCsv = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiUpload<{ updated: number }>("/admin/products/import", fd, token);
    },
    onSuccess: (r) => { invalidate(); alert(`Updated ${r.updated} products`); },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form
        onSubmit={handleSubmit((v) => save.mutate(v))}
        className="h-fit rounded-2xl border border-ink/10 bg-paper p-6 shadow-card-warm"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-ink">
            {editing ? "Edit product" : "New product"}
          </h3>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); reset(); }} className="font-sans text-[12px] font-semibold text-orange hover:opacity-75">
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
                {PRODUCT_TABS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className={labelClasses}>Category</label>
            <Select {...register("category_id")}>
              <option value="">— none —</option>
              {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <label className={labelClasses}>Description</label>
            <Textarea {...register("description")} placeholder="Short product description" />
          </div>
          <div className="grid grid-cols-4 gap-3">
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
              <Input {...register("price_unit")} placeholder="L" />
            </div>
            <div>
              <label className={labelClasses}>Stock</label>
              <Input type="number" {...register("stock", { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Variants (label:price, …)</label>
            <Input {...register("variantsText")} placeholder="1 L:320, 4 L:1240" />
          </div>
          <button type="submit" disabled={save.isPending} className="w-full rounded bg-orange p-3.5 font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:bg-orange-deep disabled:opacity-60">
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Create product"}
          </button>

          {editing && (
            <div className="space-y-3 rounded-xl border border-dashed border-ink/15 p-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0"><ProductImage product={editing} className="h-16 w-16" /></div>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate({ id: editing.id, file: f }); }} className="font-sans text-[12px]" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => duplicate.mutate(editing.id)} className="flex-1 rounded border border-ink/15 py-2 font-sans text-[12px] font-semibold text-ink-soft hover:border-orange hover:text-orange">Duplicate</button>
                <button type="button" onClick={() => { if (confirm(`Delete ${editing.name}?`)) remove.mutate(editing.id); }} className="flex-1 rounded border border-rose-200 py-2 font-sans text-[12px] font-semibold text-rose-600 hover:bg-rose-50">Delete</button>
              </div>
            </div>
          )}
        </div>
      </form>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="font-sans text-[13px] text-ink-soft">{products.data?.length ?? 0} products</p>
          <div className="flex gap-2">
            <button onClick={() => downloadCsv("/admin/products/export", "products.csv", token)} className="rounded-full border border-ink/15 px-3.5 py-1.5 font-sans text-[12px] font-semibold text-ink-soft hover:border-orange hover:text-orange">Export</button>
            <label className="cursor-pointer rounded-full border border-ink/15 px-3.5 py-1.5 font-sans text-[12px] font-semibold text-ink-soft hover:border-orange hover:text-orange">
              Import
              <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv.mutate(f); }} />
            </label>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-card-warm">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-ink/10 text-left">
              <tr>
                <th className="px-4 py-3 font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Product</th>
                <th className="px-4 py-3 font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Brand</th>
                <th className="px-4 py-3 font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Stock</th>
                <th className="px-4 py-3 font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Price</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(products.data ?? []).map((p) => (
                <tr key={p.id} className="border-b border-ink/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0"><ProductImage product={p} className="h-10 w-10" /></div>
                      <span className="font-sans text-sm text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-ink-soft">{p.sub_brand}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink-soft">{p.stock ?? 0}</td>
                  <td className="px-4 py-3 font-sans text-sm text-orange-deep">₹{formatINR(p.price_low)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setEditing(p)} className="font-sans text-[12px] font-semibold text-orange hover:opacity-75">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
    onError: (err: any) => {
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

