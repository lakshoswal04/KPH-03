"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ProductImage } from "@/components/home/ProductShowcase";
import { Input, Select, Textarea, labelClasses } from "@/components/ui/Input";
import { downloadCsv } from "@/lib/adminApi";
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { Category, Product } from "@/types";

const PRODUCT_TABS = [
  "interior", "exterior", "enamels", "waterproofing", "wood", "primers", "tools", "hardware",
];

interface Variant { label: string; price: number }
interface Faq { q: string; a: string }
interface FormState {
  name: string; sub_brand: string; tab: string; category_id: string;
  description: string; summary: string;
  price_low: number; price_high: number; price_unit: string;
  stock: number; low_stock_threshold: number;
  is_active: boolean; is_featured: boolean;
  features: string[]; benefits: string[]; suitable_surfaces: string[]; uses: string[]; pack_sizes: string[];
  coverage: string; finish: string; drying_time: string; application_method: string;
  coats: string; interior_exterior: string;
  tech_specs: [string, string][]; faqs: Faq[];
  maintenance: string; safety_tips: string;
  variants: Variant[];
  image_url: string | null; images: string[];
  seo_title: string; seo_description: string;
}

const EMPTY: FormState = {
  name: "", sub_brand: "", tab: "interior", category_id: "",
  description: "", summary: "",
  price_low: 0, price_high: 0, price_unit: "L",
  stock: 0, low_stock_threshold: 5,
  is_active: true, is_featured: false,
  features: [], benefits: [], suitable_surfaces: [], uses: [], pack_sizes: [],
  coverage: "", finish: "", drying_time: "", application_method: "",
  coats: "", interior_exterior: "",
  tech_specs: [], faqs: [],
  maintenance: "", safety_tips: "",
  variants: [],
  image_url: null, images: [],
  seo_title: "", seo_description: "",
};

function fromProduct(p: Product): FormState {
  return {
    name: p.name, sub_brand: p.sub_brand, tab: p.tab,
    category_id: p.category_id ? String(p.category_id) : "",
    description: p.description, summary: p.summary ?? "",
    price_low: p.price_low, price_high: p.price_high, price_unit: p.price_unit,
    stock: p.stock ?? 0, low_stock_threshold: p.low_stock_threshold ?? 5,
    is_active: p.is_active ?? true, is_featured: p.is_featured ?? false,
    features: p.features ?? [], benefits: p.benefits ?? [],
    suitable_surfaces: p.suitable_surfaces ?? [], uses: p.uses ?? [],
    pack_sizes: p.pack_sizes ?? [],
    coverage: p.coverage ?? "", finish: p.finish ?? "", drying_time: p.drying_time ?? "",
    application_method: p.application_method ?? "", coats: p.coats ?? "",
    interior_exterior: p.interior_exterior ?? "",
    tech_specs: Object.entries(p.tech_specs ?? {}),
    faqs: p.faqs ?? [],
    maintenance: p.maintenance ?? "", safety_tips: p.safety_tips ?? "",
    variants: p.variants ?? [],
    image_url: p.image_url ?? null, images: p.images ?? [],
    seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "",
  };
}

function toPayload(f: FormState) {
  return {
    name: f.name.trim(), sub_brand: f.sub_brand.trim(), tab: f.tab,
    category_id: f.category_id ? Number(f.category_id) : null,
    description: f.description.trim(), summary: f.summary.trim() || null,
    price_low: Number(f.price_low) || 0, price_high: Number(f.price_high) || 0,
    price_unit: f.price_unit || "L",
    stock: Number(f.stock) || 0, low_stock_threshold: Number(f.low_stock_threshold) || 0,
    is_active: f.is_active, is_featured: f.is_featured,
    features: f.features, benefits: f.benefits, suitable_surfaces: f.suitable_surfaces,
    uses: f.uses, pack_sizes: f.pack_sizes,
    coverage: f.coverage.trim() || null, finish: f.finish.trim() || null,
    drying_time: f.drying_time.trim() || null,
    application_method: f.application_method.trim() || null,
    coats: f.coats.trim() || null, interior_exterior: f.interior_exterior.trim() || null,
    tech_specs: Object.fromEntries(f.tech_specs.filter(([k]) => k.trim())),
    faqs: f.faqs.filter((q) => q.q.trim() && q.a.trim()),
    maintenance: f.maintenance.trim() || null, safety_tips: f.safety_tips.trim() || null,
    variants: f.variants.filter((v) => v.label.trim()),
    image_url: f.image_url, images: f.images,
    seo_title: f.seo_title.trim() || null, seo_description: f.seo_description.trim() || null,
  };
}

// ---- Small reusable editors ----
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-cream/40 p-4">
      <p className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[1.5px] text-ink/45">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TagEditor({ label, tags, onChange, placeholder }: {
  label: string; tags: string[]; onChange: (t: string[]) => void; placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  };
  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-ink/15 bg-paper p-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-2.5 py-1 font-sans text-[12px] font-medium text-orange-deep">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-orange-deep/60 hover:text-orange-deep">✕</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={placeholder ?? "Type and press Enter"}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 font-sans text-[13px] focus:outline-none"
        />
      </div>
    </div>
  );
}

function KeyValueEditor({ rows, onChange }: { rows: [string, string][]; onChange: (r: [string, string][]) => void }) {
  return (
    <div>
      <label className={labelClasses}>Technical specs</label>
      <div className="space-y-2">
        {rows.map(([k, v], i) => (
          <div key={i} className="flex gap-2">
            <Input value={k} placeholder="e.g. Warranty" onChange={(e) => { const r = [...rows]; r[i] = [e.target.value, v]; onChange(r); }} />
            <Input value={v} placeholder="e.g. 6 years" onChange={(e) => { const r = [...rows]; r[i] = [k, e.target.value]; onChange(r); }} />
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="shrink-0 rounded-lg border border-ink/15 px-3 text-ink-soft hover:border-rose-300 hover:text-rose-500">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...rows, ["", ""]])} className="font-sans text-[12px] font-semibold text-orange hover:opacity-75">+ Add spec</button>
      </div>
    </div>
  );
}

function FaqEditor({ faqs, onChange }: { faqs: Faq[]; onChange: (f: Faq[]) => void }) {
  return (
    <div>
      <label className={labelClasses}>FAQs</label>
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-ink/12 bg-paper p-2.5">
            <div className="flex gap-2">
              <Input value={f.q} placeholder="Question" onChange={(e) => { const r = [...faqs]; r[i] = { ...f, q: e.target.value }; onChange(r); }} />
              <button type="button" onClick={() => onChange(faqs.filter((_, j) => j !== i))} className="shrink-0 rounded-lg border border-ink/15 px-3 text-ink-soft hover:border-rose-300 hover:text-rose-500">✕</button>
            </div>
            <Textarea value={f.a} placeholder="Answer" onChange={(e) => { const r = [...faqs]; r[i] = { ...f, a: e.target.value }; onChange(r); }} />
          </div>
        ))}
        <button type="button" onClick={() => onChange([...faqs, { q: "", a: "" }])} className="font-sans text-[12px] font-semibold text-orange hover:opacity-75">+ Add FAQ</button>
      </div>
    </div>
  );
}

function VariantEditor({ variants, onChange }: { variants: Variant[]; onChange: (v: Variant[]) => void }) {
  return (
    <div>
      <label className={labelClasses}>Pack sizes & prices</label>
      <div className="space-y-2">
        {variants.map((v, i) => (
          <div key={i} className="flex gap-2">
            <Input value={v.label} placeholder="e.g. 1 L" onChange={(e) => { const r = [...variants]; r[i] = { ...v, label: e.target.value }; onChange(r); }} />
            <Input type="number" value={v.price} placeholder="₹" onChange={(e) => { const r = [...variants]; r[i] = { ...v, price: Number(e.target.value) || 0 }; onChange(r); }} />
            <button type="button" onClick={() => onChange(variants.filter((_, j) => j !== i))} className="shrink-0 rounded-lg border border-ink/15 px-3 text-ink-soft hover:border-rose-300 hover:text-rose-500">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...variants, { label: "", price: 0 }])} className="font-sans text-[12px] font-semibold text-orange hover:opacity-75">+ Add pack size</button>
      </div>
    </div>
  );
}

export function ProductManager({ token }: { token: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const products = useQuery({ queryKey: ["admin", "products"], queryFn: () => apiGet<Product[]>("/admin/products", token) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/categories") });

  useEffect(() => { setForm(editing ? fromProduct(editing) : EMPTY); }, [editing]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "products"] });

  const save = useMutation({
    mutationFn: () => {
      const body = toPayload(form);
      return editing
        ? apiPatch<typeof body, Product>(`/admin/products/${editing.id}`, body, token)
        : apiPost<typeof body, Product>("/admin/products", body, token);
    },
    onSuccess: (p) => { invalidate(); setEditing(p); },
    onError: (e: Error) => alert(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/products/${id}`, token),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const duplicate = useMutation({
    mutationFn: (id: number) => apiPost<undefined, Product>(`/admin/products/${id}/duplicate`, undefined as never, token),
    onSuccess: (p) => { invalidate(); setEditing(p); },
  });

  async function uploadImage(file: File, asPrimary: boolean) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await apiUpload<{ url: string }>("/admin/uploads/image", fd, token);
      if (asPrimary || !form.image_url) set("image_url", url);
      else set("images", [...form.images, url]);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[440px_1fr]">
      {/* ---- Form ---- */}
      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className="h-fit space-y-4 rounded-2xl border border-ink/10 bg-paper p-6 shadow-card-warm"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-ink">{editing ? "Edit product" : "New product"}</h3>
          {editing && (
            <button type="button" onClick={() => setEditing(null)} className="font-sans text-[12px] font-semibold text-orange hover:opacity-75">+ New</button>
          )}
        </div>

        <Section title="Basics">
          <div>
            <label className={labelClasses}>Name</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. One Pure Elegance" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>Sub-brand</label>
              <Input value={form.sub_brand} onChange={(e) => set("sub_brand", e.target.value)} placeholder="ONE / CALISTA…" />
            </div>
            <div>
              <label className={labelClasses}>Category tab</label>
              <Select value={form.tab} onChange={(e) => set("tab", e.target.value)}>
                {PRODUCT_TABS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className={labelClasses}>Category</label>
            <Select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">— none —</option>
              {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <label className={labelClasses}>Short description</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="One-line product description shown on cards" />
          </div>
          <div>
            <label className={labelClasses}>Summary (detail page intro)</label>
            <Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Optional longer intro for the product page" />
          </div>
        </Section>

        <Section title="Media">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 shrink-0 rounded-lg border border-ink/10 bg-cream p-1">
              {form.image_url
                ? // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image_url} alt="primary" className="h-full w-full object-contain" />
                : <div className="flex h-full w-full items-center justify-center text-center font-sans text-[10px] text-ink-faint">No image</div>}
            </div>
            <div className="flex-1 space-y-2">
              <label className="block cursor-pointer rounded-lg border border-dashed border-ink/25 px-3 py-2 text-center font-sans text-[12px] font-semibold text-ink-soft hover:border-orange hover:text-orange">
                {uploading ? "Uploading…" : form.image_url ? "Replace primary image" : "Upload primary image"}
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, true); e.target.value = ""; }} />
              </label>
              {form.image_url && (
                <button type="button" onClick={() => set("image_url", null)} className="font-sans text-[11px] font-semibold text-rose-500 hover:opacity-75">Remove primary</button>
              )}
            </div>
          </div>
          {/* Gallery */}
          <div>
            <label className={labelClasses}>Gallery images</label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((img) => (
                <div key={img} className="relative h-14 w-14 rounded-lg border border-ink/10 bg-cream p-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-contain" />
                  <button type="button" onClick={() => set("images", form.images.filter((x) => x !== img))} className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] text-white">✕</button>
                </div>
              ))}
              <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-ink/25 font-sans text-[18px] text-ink-soft hover:border-orange hover:text-orange">
                +
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, false); e.target.value = ""; }} />
              </label>
            </div>
          </div>
        </Section>

        <Section title="Pricing & packs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClasses}>Price low</label>
              <Input type="number" value={form.price_low} onChange={(e) => set("price_low", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClasses}>Price high</label>
              <Input type="number" value={form.price_high} onChange={(e) => set("price_high", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClasses}>Unit</label>
              <Input value={form.price_unit} onChange={(e) => set("price_unit", e.target.value)} placeholder="L / kg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>Stock</label>
              <Input type="number" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClasses}>Low-stock alert at</label>
              <Input type="number" value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", Number(e.target.value))} />
            </div>
          </div>
          <VariantEditor variants={form.variants} onChange={(v) => set("variants", v)} />
        </Section>

        <Section title="Specifications">
          <TagEditor label="Feature chips" tags={form.features} onChange={(t) => set("features", t)} placeholder="e.g. Anti-bacterial" />
          <TagEditor label="Key benefits" tags={form.benefits} onChange={(t) => set("benefits", t)} />
          <TagEditor label="Suitable surfaces" tags={form.suitable_surfaces} onChange={(t) => set("suitable_surfaces", t)} />
          <TagEditor label="Pack sizes (labels)" tags={form.pack_sizes} onChange={(t) => set("pack_sizes", t)} placeholder="e.g. 1L, 4L, 10L" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClasses}>Coverage</label><Input value={form.coverage} onChange={(e) => set("coverage", e.target.value)} placeholder="140-160 sq ft/L" /></div>
            <div><label className={labelClasses}>Finish</label><Input value={form.finish} onChange={(e) => set("finish", e.target.value)} placeholder="Soft Sheen" /></div>
            <div><label className={labelClasses}>Coats</label><Input value={form.coats} onChange={(e) => set("coats", e.target.value)} placeholder="2 (after primer)" /></div>
            <div><label className={labelClasses}>Drying time</label><Input value={form.drying_time} onChange={(e) => set("drying_time", e.target.value)} placeholder="Recoat after 4-6 hrs" /></div>
            <div><label className={labelClasses}>Application</label><Input value={form.application_method} onChange={(e) => set("application_method", e.target.value)} placeholder="Brush / Roller" /></div>
            <div>
              <label className={labelClasses}>Interior / Exterior</label>
              <Select value={form.interior_exterior} onChange={(e) => set("interior_exterior", e.target.value)}>
                <option value="">—</option>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="both">Both</option>
              </Select>
            </div>
          </div>
          <KeyValueEditor rows={form.tech_specs} onChange={(r) => set("tech_specs", r)} />
        </Section>

        <Section title="Content & FAQs">
          <FaqEditor faqs={form.faqs} onChange={(f) => set("faqs", f)} />
          <div><label className={labelClasses}>Maintenance</label><Textarea value={form.maintenance} onChange={(e) => set("maintenance", e.target.value)} /></div>
          <div><label className={labelClasses}>Safety tips</label><Textarea value={form.safety_tips} onChange={(e) => set("safety_tips", e.target.value)} /></div>
        </Section>

        <Section title="SEO & visibility">
          <div><label className={labelClasses}>SEO title</label><Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} /></div>
          <div><label className={labelClasses}>SEO description</label><Textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} /></div>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 font-sans text-[13px] text-ink"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active</label>
            <label className="flex items-center gap-2 font-sans text-[13px] text-ink"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured</label>
          </div>
        </Section>

        <button type="submit" disabled={save.isPending || uploading} className="w-full rounded bg-orange p-3.5 font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:bg-orange-deep disabled:opacity-60">
          {save.isPending ? "Saving…" : editing ? "Save changes" : "Create product"}
        </button>

        {editing && (
          <div className="flex gap-2">
            <button type="button" onClick={() => duplicate.mutate(editing.id)} className="flex-1 rounded border border-ink/15 py-2 font-sans text-[12px] font-semibold text-ink-soft hover:border-orange hover:text-orange">Duplicate</button>
            <button type="button" onClick={() => { if (confirm(`Delete ${editing.name}?`)) remove.mutate(editing.id); }} className="flex-1 rounded border border-rose-200 py-2 font-sans text-[12px] font-semibold text-rose-600 hover:bg-rose-50">Delete</button>
          </div>
        )}
      </form>

      {/* ---- List ---- */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="font-sans text-[13px] text-ink-soft">{products.data?.length ?? 0} products</p>
          <div className="flex gap-2">
            <button onClick={() => downloadCsv("/admin/products/export", "products.csv", token)} className="rounded-full border border-ink/15 px-3.5 py-1.5 font-sans text-[12px] font-semibold text-ink-soft hover:border-orange hover:text-orange">Export</button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-card-warm">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-ink/10 text-left">
              <tr>
                <th className="px-4 py-3 font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Product</th>
                <th className="px-4 py-3 font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Tab</th>
                <th className="px-4 py-3 font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Stock</th>
                <th className="px-4 py-3 font-sans text-[11px] font-bold uppercase tracking-[2px] text-ink/40">Price</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(products.data ?? []).map((p) => (
                <tr key={p.id} className={editing?.id === p.id ? "border-b border-ink/5 bg-orange/5" : "border-b border-ink/5"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0"><ProductImage product={p} className="h-10 w-10" /></div>
                      <div>
                        <span className="block font-sans text-sm text-ink">{p.name}</span>
                        <span className="block font-sans text-[11px] text-ink-soft">{p.sub_brand}{p.is_featured ? " · ★" : ""}{p.is_active === false ? " · hidden" : ""}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-ink-soft">{p.tab}</td>
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
