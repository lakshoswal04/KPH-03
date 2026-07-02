"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input, Textarea, labelClasses } from "@/components/ui/Input";
import { Reveal } from "@/components/ui/Reveal";
import { useCart } from "@/hooks/useCart";
import { apiPost } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type {
  OrderCreatePayload,
  OrderCreateResponse,
  PaymentVerifyPayload,
  PaymentVerifyResponse,
} from "@/types";

const schema = z.object({
  customer_name: z.string().min(2, "Enter your name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().min(5, "Enter your delivery address"),
});

type FormValues = z.infer<typeof schema>;

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill: { name: string; contact: string; email?: string };
  theme: { color: string };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [paidOrderId, setPaidOrderId] = useState<number | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const verifyMutation = useMutation({
    mutationFn: (payload: PaymentVerifyPayload) =>
      apiPost<PaymentVerifyPayload, PaymentVerifyResponse>("/orders/verify", payload),
    onSuccess: (data) => {
      setPaidOrderId(data.order_id);
      clear();
    },
    onError: () => setPayError("Payment verification failed. If money was deducted, contact us."),
  });

  const orderMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: OrderCreatePayload = {
        ...values,
        email: values.email || null,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      };
      return apiPost<OrderCreatePayload, OrderCreateResponse>("/orders", payload);
    },
    onSuccess: async (order, values) => {
      setPayError(null);
      if (order.mock) {
        // Dev mode: no Razorpay keys — complete the flow with the mock signature.
        verifyMutation.mutate({
          order_id: order.order_id,
          razorpay_order_id: order.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
        return;
      }
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setPayError("Could not load Razorpay. Check your connection and try again.");
        return;
      }
      new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Kamlesh Paints & Hardware",
        description: `Order #${order.order_id}`,
        order_id: order.razorpay_order_id,
        prefill: { name: values.customer_name, contact: values.phone, email: values.email || undefined },
        theme: { color: "#E8590C" },
        handler: (response) =>
          verifyMutation.mutate({
            order_id: order.order_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
      }).open();
    },
    onError: () => setPayError("Could not create the order — please try again."),
  });

  if (paidOrderId !== null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-nav">
        <div className="max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange text-3xl text-white">
            ✓
          </span>
          <h1 className="mt-6 font-display text-[40px] font-black text-ink">
            Order confirmed<span className="text-orange">.</span>
          </h1>
          <p className="mt-3 font-sans text-body text-ink-soft">
            Order #{paidOrderId} is paid and being packed. We&apos;ll call you to confirm the
            delivery slot — free delivery anywhere in Pune.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-btn bg-orange px-[34px] py-[15px] font-sans text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep"
          >
            Continue Shopping →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 pb-section-y pt-[calc(72px+60px)] md:px-section-x">
      <Reveal>
        <p className="font-sans text-label font-bold uppercase text-orange">Almost there</p>
        <h1 className="mt-4 font-display text-section-h2 font-black text-ink">
          Checkout<span className="text-orange">.</span>
        </h1>
      </Reveal>

      {items.length === 0 ? (
        <p className="mt-16 font-sans text-body text-ink-soft">
          Your cart is empty —{" "}
          <Link href="/products" className="font-semibold text-orange">
            add some products
          </Link>{" "}
          first.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit((values) => orderMutation.mutate(values))}
            className="h-fit rounded-[20px] bg-paper shadow-card-warm p-7 md:p-10"
            noValidate
          >
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-name" className={labelClasses}>
                    Your Name
                  </label>
                  <Input id="co-name" placeholder="Full name" {...register("customer_name")} />
                  {errors.customer_name && (
                    <p className="mt-1.5 font-sans text-xs text-coral">
                      {errors.customer_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="co-phone" className={labelClasses}>
                    Mobile Number
                  </label>
                  <Input id="co-phone" type="tel" placeholder="10-digit mobile" {...register("phone")} />
                  {errors.phone && (
                    <p className="mt-1.5 font-sans text-xs text-coral">{errors.phone.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="co-email" className={labelClasses}>
                  Email <span className="normal-case opacity-60">(optional)</span>
                </label>
                <Input id="co-email" type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && (
                  <p className="mt-1.5 font-sans text-xs text-coral">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="co-address" className={labelClasses}>
                  Delivery Address (Pune only)
                </label>
                <Textarea
                  id="co-address"
                  placeholder="Flat / building, street, locality, pincode"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="mt-1.5 font-sans text-xs text-coral">{errors.address.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={orderMutation.isPending || verifyMutation.isPending}
                className="w-full rounded bg-orange p-4 font-sans text-sm font-bold uppercase tracking-[2px] text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-0 disabled:opacity-60"
              >
                {orderMutation.isPending || verifyMutation.isPending
                  ? "Processing…"
                  : `Pay ₹${formatINR(total)} with Razorpay`}
              </button>
              {payError && <p className="font-sans text-sm text-coral">{payError}</p>}
              <p className="font-sans text-[12px] text-ink-soft">
                Payments are processed securely by Razorpay and verified on our server. In dev mode
                (no keys configured) a mock payment completes the flow.
              </p>
            </div>
          </form>

          <aside className="h-fit rounded-[20px] bg-paper shadow-card-lift p-8 lg:sticky lg:top-[100px]">
            <h2 className="font-display text-2xl font-bold text-ink">Your items</h2>
            <div className="mt-6 space-y-3 border-b border-ink/10 pb-6">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between gap-4 font-sans text-sm">
                  <span className="text-ink-soft">
                    {product.name} × {quantity}
                  </span>
                  <span className="shrink-0 text-ink">
                    ₹{formatINR(product.price_low * quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between font-sans text-lg font-semibold text-ink">
              <span>Total</span>
              <span className="text-orange-deep">₹{formatINR(total)}</span>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
