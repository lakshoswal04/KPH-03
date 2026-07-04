export interface Category {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  accent: string;
  background: string;
  count_label: string;
  sort_order: number;
}

export type ProductTab =
  | "interior"
  | "exterior"
  | "enamels"
  | "waterproofing"
  | "wood"
  | "primers"
  | "tools"
  | "hardware";

export interface Variant {
  label: string;
  price: number;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  sub_brand: string;
  tab: ProductTab;
  description: string;
  features: string[];
  price_low: number;
  price_high: number;
  price_unit: string;
  variants: Variant[];
  image_url: string | null;
  category_id: number | null;

  // Extended catalogue fields (optional — empty until officially sourced).
  brand_id?: number | null;
  summary?: string | null;
  benefits?: string[];
  suitable_surfaces?: string[];
  uses?: string[];
  coverage?: string | null;
  finish?: string | null;
  drying_time?: string | null;
  application_method?: string | null;
  coats?: string | null;
  pack_sizes?: string[];
  interior_exterior?: string | null;
  tech_specs?: Record<string, string>;
  faqs?: Faq[];
  maintenance?: string | null;
  safety_tips?: string | null;
  images?: string[];
  recommended_primer_id?: number | null;
  recommended_putty_id?: number | null;
  related_product_ids?: number[];
  seo_title?: string | null;
  seo_description?: string | null;
  sku?: string | null;
  price?: number | null;
  stock?: number;
  reserved?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  is_featured?: boolean;
  available_stock?: number;
}

export interface ProductList {
  items: Product[];
  total: number;
}

export interface Colour {
  id: number;
  code: string | null;
  name: string;
  hex: string;
  family: string;
  is_explorer_shade: boolean;
  sort_order: number;
}

export interface ColourFamily {
  family: string;
  hex: string;
  count: number;
}

export interface EnquiryPayload {
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  product_id?: number | null;
  budget?: string | null;
  source?: string;
}

export interface SurveyPayload {
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  locality: string;
  property_type: string;
  preferred_date?: string | null;
  preferred_time?: string | null;
  notes?: string | null;
  reference_images?: string[];
}

export interface CalcRequest {
  area: number;
  coats: number;
  grade: "style" | "calista" | "one";
}

export interface CalcResponse {
  litres: number;
  cost_low: number;
  cost_high: number;
  labour_low: number;
  labour_high: number;
}

export interface BudgetRequest {
  area: number;
  coats: number;
  grade: "style" | "calista" | "one";
  primer: boolean;
  putty: boolean;
}

export interface BudgetLine {
  label: string;
  low: number;
  high: number;
}

export interface BudgetRecommendedProduct {
  id: number;
  slug: string;
  name: string;
  sub_brand: string;
  image_url: string | null;
  price_low: number;
}

export interface BudgetResponse {
  wall_area: number;
  paint_litres: number;
  primer_litres: number;
  putty_kg: number;
  breakdown: BudgetLine[];
  material_low: number;
  material_high: number;
  labour_low: number;
  labour_high: number;
  gst_low: number;
  gst_high: number;
  total_low: number;
  total_high: number;
  recommended: BudgetRecommendedProduct[];
}

export interface RecommendedColour {
  name: string;
  hex: string;
  reason: string;
}

export interface ColourRecommendResponse {
  recommendations: RecommendedColour[];
  mock: boolean;
}

export interface PlanStep {
  title: string;
  detail: string;
}

export interface ProjectPlanResponse {
  steps: PlanStep[];
  summary: string;
  mock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  /** Selected pack/size; null when the product has no variants. */
  variant: Variant | null;
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
  variant_label?: string | null;
}

export interface OrderCreatePayload {
  customer_name: string;
  phone: string;
  email?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  coupon_code?: string | null;
  payment_method?: string | null;
  idempotency_key?: string | null;
  items: OrderItemPayload[];
}

export interface QuoteRequest {
  items: OrderItemPayload[];
  coupon_code?: string | null;
}

export interface QuoteResponse {
  subtotal: number;
  discount: number;
  gst_amount: number;
  delivery_charge: number;
  total: number;
  coupon_code: string | null;
  coupon_message: string | null;
  warnings: string[];
}

export interface OrderCreateResponse {
  order_id: number;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  mock: boolean;
}

export interface PaymentVerifyPayload {
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerifyResponse {
  order_id: number;
  status: string;
  invoice_url?: string | null;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  user_id?: number | null;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  subtotal?: number | null;
  gst_amount?: number;
  delivery_charge?: number;
  discount?: number;
  coupon_code?: string | null;
  total_amount: number;
  status: string;
  payment_method?: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  invoice_id?: number | null;
  created_at: string;
  items: OrderItem[];
}

export interface Enquiry {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  product_id: number | null;
  product_name?: string | null;
  status: string;
  created_at: string;
}

export interface Survey {
  id: number;
  name: string;
  phone: string;
  address: string;
  locality: string;
  property_type: string;
  preferred_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserMe {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ProfileUpdatePayload {
  full_name?: string;
  phone?: string;
  email?: string;
}
