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

export type ProductTab = "interior" | "exterior" | "waterproofing" | "wood";

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
  image_url: string | null;
  category_id: number | null;
}

export interface ProductList {
  items: Product[];
  total: number;
}

export interface Colour {
  id: number;
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
}

export interface SurveyPayload {
  name: string;
  phone: string;
  address: string;
  locality: string;
  property_type: string;
  preferred_date?: string | null;
  notes?: string | null;
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

export interface RecommendedColour {
  name: string;
  hex: string;
  reason: string;
}

export interface ColourRecommendResponse {
  recommendations: RecommendedColour[];
  mock: boolean;
}

export interface ProjectPlanResponse {
  plan: string;
  mock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderCreatePayload {
  customer_name: string;
  phone: string;
  email?: string | null;
  address: string;
  items: { product_id: number; quantity: number }[];
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
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  total_amount: number;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
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
