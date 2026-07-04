import { apiDownload } from "@/lib/api";

// ---- Analytics ----
export interface Kpi {
  revenue: number;
  orders: number;
  customers: number;
  avg_order_value: number;
  enquiries: number;
  surveys: number;
  conversion_rate: number;
  returning_customers: number;
  pending_orders: number;
  revenue_change_pct: number;
}
export interface TrendPoint {
  label: string;
  revenue: number;
  orders: number;
}
export interface BestSeller {
  product_id: number;
  name: string;
  units: number;
  revenue: number;
}
export interface PaymentBreakdown {
  total_revenue: number;
  gst_collected: number;
  captured: number;
  pending: number;
  failed: number;
  refunded: number;
  by_method: Record<string, number>;
  by_status: Record<string, number>;
}

// ---- Inventory ----
export interface StockRow {
  id: number;
  name: string;
  sku: string | null;
  sub_brand: string;
  tab: string;
  stock: number;
  reserved: number;
  available: number;
  low_stock_threshold: number;
  status: "in_stock" | "low" | "out";
}
export interface InventorySummary {
  total_skus: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  total_units: number;
  reserved_units: number;
  restocked_30d: number;
  rows: StockRow[];
}

// ---- Customers ----
export interface CustomerRow {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  is_admin: boolean;
  orders: number;
  spent: number;
  created_at: string;
}
export interface ActivityItem {
  at: string;
  kind: string;
  detail: string;
}
export interface CustomerDetail {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  notes: string | null;
  addresses: unknown[];
  orders: number;
  spent: number;
  enquiries: number;
  surveys: number;
  timeline: ActivityItem[];
}

export interface Brand {
  id: number;
  slug: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  sort_order: number;
}

export const PERIODS = ["day", "week", "month", "quarter", "year"] as const;
export type Period = (typeof PERIODS)[number];

/** Trigger a browser download of a CSV export endpoint. */
export async function downloadCsv(path: string, filename: string, token?: string): Promise<void> {
  const blob = await apiDownload(path, token);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
