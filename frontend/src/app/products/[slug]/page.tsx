import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartPanel } from "./AddToCartPanel";

import { Badge } from "@/components/ui/Badge";
import { SUB_BRAND_ACCENTS } from "@/lib/constants";
import { priceRange } from "@/lib/utils";
import type { Product, ProductList } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Server-rendered with ISR so every product page is indexable.
export const revalidate = 300;
export const dynamicParams = true;

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products`);
    if (!res.ok) return [];
    const data = (await res.json()) as ProductList;
    return data.items.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await fetchProduct(params.slug);
  if (!product) return { title: "Product not found — Kamlesh Paints & Hardware" };
  return {
    title: `${product.name} — Birla Opus at Kamlesh Paints, Pune`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await fetchProduct(params.slug);
  if (!product) notFound();

  const accent = SUB_BRAND_ACCENTS[product.sub_brand] ?? "#C9A876";
  const imageUrl =
    product.image_url ??
    `https://placehold.co/720x540/${accent.replace("#", "")}/FFFFFF?text=${encodeURIComponent(product.name)}`;

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+48px)] md:px-section-x">
      <nav className="font-sans text-[13px] text-ink-soft" aria-label="Breadcrumb">
        <Link href="/products" className="transition-colors hover:text-orange">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-10 grid grid-cols-1 gap-14 lg:grid-cols-2">
        <div
          className="flex items-center justify-center overflow-hidden rounded-[24px] border border-ink/5 p-10 shadow-card-warm"
          style={{
            background: `radial-gradient(circle at 50% 42%, #FFFFFF 0%, color-mix(in srgb, ${accent} 14%, #FFF9EE) 100%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.name}
            className="bucket-float max-h-[440px] w-auto object-contain drop-shadow-[0_28px_32px_rgba(26,26,10,0.28)]"
          />
        </div>

        <div>
          <p
            className="font-sans text-[11px] font-bold uppercase tracking-[3px]"
            style={{ color: accent }}
          >
            Birla Opus · {product.sub_brand}
          </p>
          <h1 className="mt-3 font-display text-[clamp(34px,4.5vw,56px)] font-black leading-[0.95] text-ink">
            {product.name}
          </h1>
          <p className="mt-5 max-w-[480px] font-sans text-body text-ink-soft">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {product.features.map((feature) => (
              <Badge key={feature}>{feature}</Badge>
            ))}
          </div>

          <p className="mt-8 font-sans text-[26px] font-semibold text-orange-deep">
            {priceRange(product.price_low, product.price_high, product.price_unit)}
          </p>
          <p className="mt-1 font-sans text-[13px] text-ink-soft">
            Final price depends on pack size and shade. Free delivery within Pune.
          </p>

          <AddToCartPanel product={product} />
        </div>
      </div>
    </main>
  );
}
