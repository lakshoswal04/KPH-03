"use client";

import { MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { apiPost } from "@/lib/api";
import { whatsappHref } from "@/lib/business";
import { cn, formatINR } from "@/lib/utils";

interface ProductCard {
  id: number;
  slug: string;
  name: string;
  sub_brand: string;
  tab: string;
  image_url: string | null;
  price_low: number;
  price_unit: string;
}
interface ColourCard {
  id: number;
  code: string | null;
  name: string;
  hex: string;
  family: string;
}
interface ChatResponse {
  reply: string;
  products: ProductCard[];
  colours: ColourCard[];
  escalate: boolean;
  mock: boolean;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  products?: ProductCard[];
  colours?: ColourCard[];
  escalate?: boolean;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! 👋 I'm the Kamlesh Paints assistant. Ask me about Birla Opus paints, waterproofing, colours, prices, or delivery across Pune.",
};

const SUGGESTIONS = [
  "Which paint is best for a bathroom?",
  "Show me blue shades",
  "Waterproofing for my roof",
  "What are your shop timings?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const history = messages
      .filter((m) => m !== GREETING)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const res = await apiPost<{ message: string; history: typeof history }, ChatResponse>(
        "/ai/chat",
        { message: trimmed, history },
      );
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.reply,
          products: res.products,
          colours: res.colours,
          escalate: res.escalate,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't reach our system just now. Please message us on WhatsApp and we'll help right away.",
          escalate: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Launcher — stacked above the WhatsApp button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with us"}
        className="group fixed bottom-[96px] right-8 z-[91] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-orange shadow-card-lift transition-transform duration-200 hover:-translate-y-0.5"
      >
        {open ? (
          <X size={26} className="text-white" />
        ) : (
          <MessageCircle size={26} className="text-white" />
        )}
        {!open && (
          <span className="pointer-events-none absolute right-[68px] whitespace-nowrap rounded-full bg-ink px-3.5 py-2 font-sans text-[13px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Ask Kamlesh Paints
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-[168px] right-4 z-[91] flex h-[min(560px,70vh)] w-[min(384px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[20px] border border-ink/10 bg-cream shadow-card-lift md:right-8">
          {/* Header */}
          <div className="flex items-center justify-between bg-orange px-5 py-4">
            <div>
              <p className="font-display text-[17px] font-black text-white">Kamlesh Paints</p>
              <p className="font-sans text-[11px] text-white/85">Birla Opus assistant · replies instantly</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-white/90 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className="max-w-[85%] space-y-2">
                  <div
                    className={cn(
                      "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 font-sans text-[13.5px] leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-sm bg-ink text-white"
                        : "rounded-bl-sm bg-paper text-ink shadow-card-warm",
                    )}
                  >
                    {renderText(m.content)}
                  </div>

                  {/* Product cards */}
                  {m.products && m.products.length > 0 && (
                    <div className="space-y-1.5">
                      {m.products.slice(0, 3).map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-xl border border-ink/10 bg-paper p-2 transition-colors hover:border-orange"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image_url ?? `https://placehold.co/80x80/EDE6D8/8A7A5C/png?text=${encodeURIComponent(p.name)}`}
                            alt={p.name}
                            className="h-11 w-11 shrink-0 rounded-lg object-contain"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-sans text-[13px] font-semibold text-ink">{p.name}</p>
                            <p className="font-sans text-[11px] text-ink-soft">
                              {p.sub_brand} · from ₹{formatINR(p.price_low)}/{p.price_unit}
                            </p>
                          </div>
                          <span className="font-sans text-[11px] font-semibold text-orange">View →</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Colour swatches */}
                  {m.colours && m.colours.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.colours.slice(0, 6).map((c) => (
                        <Link
                          key={c.id}
                          href={`/colours?family=${encodeURIComponent(c.family)}`}
                          onClick={() => setOpen(false)}
                          title={`${c.name}${c.code ? ` (${c.code})` : ""} · ${c.hex}`}
                          className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper py-1 pl-1 pr-2.5 transition-colors hover:border-orange"
                        >
                          <span className="h-5 w-5 rounded-full border border-ink/10" style={{ background: c.hex }} />
                          <span className="font-sans text-[11px] font-medium text-ink">{c.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Escalation to WhatsApp */}
                  {m.role === "assistant" && m.escalate && (
                    <a
                      href={whatsappHref(`Hi Kamlesh Paints, I asked your website assistant: "${lastUserBefore(messages, i)}"`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full bg-whatsapp px-3.5 py-1.5 font-sans text-[12px] font-semibold text-white"
                    >
                      Chat with our team on WhatsApp →
                    </a>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-paper px-4 py-3 shadow-card-warm">
                  <span className="flex gap-1">
                    <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
                  </span>
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-ink/15 bg-paper px-3 py-1.5 font-sans text-[12px] font-medium text-ink-soft transition-colors hover:border-orange hover:text-orange"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-ink/10 bg-paper px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about paints, colours, prices…"
              className="min-w-0 flex-1 rounded-full border border-ink/15 bg-cream px-4 py-2.5 font-sans text-[13px] text-ink placeholder:text-ink-faint focus:border-orange focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange text-white transition-opacity hover:bg-orange-deep disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft"
      style={{ animationDelay: delay }}
    />
  );
}

// Render **bold** segments from the model's markdown-ish reply.
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function lastUserBefore(messages: Msg[], index: number): string {
  for (let i = index - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}
