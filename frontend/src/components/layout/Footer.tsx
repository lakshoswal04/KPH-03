import Link from "next/link";

import { PaintFan } from "@/components/ui/PaintFan";
import { BUSINESS, mailHref, telHref, whatsappHref } from "@/lib/business";

const PRODUCT_LINKS = [
  "Interior Paints",
  "Exterior Paints",
  "Waterproofing",
  "Enamels",
  "Wood Finishes",
  "Tools",
  "Hardware",
];

const SERVICE_LINKS = [
  { label: "Free Site Survey", href: "/survey" },
  { label: "Colour Consultation", href: "/ai-studio" },
  { label: "Paint Calculator", href: "/#calculator" },
  { label: "Home Delivery Pune", href: "/contact" },
  { label: "Bulk Orders", href: "/contact" },
  { label: "Contractor Pricing", href: "/contact" },
];

const CONTACT_ITEMS = [
  { icon: "📞", text: BUSINESS.phoneDisplay, href: telHref },
  { icon: "💬", text: "WhatsApp Us", href: whatsappHref("Hi Kamlesh Paints, I'd like to know more.") },
  { icon: "✉", text: BUSINESS.email, href: mailHref },
  { icon: "📍", text: BUSINESS.address, href: undefined },
  { icon: "🕐", text: BUSINESS.hours.weekday, href: undefined },
  { icon: "🕐", text: BUSINESS.hours.weekend, href: undefined },
];

// Only real, working contact actions (no dead social handles).
const SOCIAL_PATHS: Record<string, string> = {
  WhatsApp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  Call: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  Email: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
};

const SOCIAL_LINKS = [
  { name: "WhatsApp", href: whatsappHref("Hi Kamlesh Paints, I'd like to know more.") },
  { name: "Call", href: telHref },
  { name: "Email", href: mailHref },
];

export function Footer() {
  return (
    <footer className="border-t-4 border-marigold bg-paper px-6 pb-8 pt-[60px] md:px-section-x">
      <div className="mb-12 grid grid-cols-1 gap-[60px] md:grid-cols-[2fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <PaintFan size={48} />
          <h3 className="mt-4 font-display text-[22px] font-bold text-ink">
            Kamlesh Paints &amp; Hardware
          </h3>
          <p className="mt-1 font-sans text-[12px] font-medium uppercase tracking-[2px] text-orange">
            Authorised Birla Opus Dealer
          </p>
          <p className="mt-1 font-sans text-sm text-ink-soft">Shivajinagar, Pune</p>
          <div className="mt-6 flex gap-3">
            {SOCIAL_LINKS.map(({ name, href }) => (
              <a
                key={name}
                href={href}
                target={name === "WhatsApp" ? "_blank" : undefined}
                rel={name === "WhatsApp" ? "noopener noreferrer" : undefined}
                aria-label={name}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-cream text-ink transition-colors duration-200 hover:border-orange hover:bg-orange hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={SOCIAL_PATHS[name]} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="mb-5 font-sans text-label font-bold uppercase text-ink/40">Products</h4>
          {PRODUCT_LINKS.map((label) => (
            <Link
              key={label}
              href="/products"
              className="mb-2.5 block font-sans text-sm text-ink-soft transition-colors duration-200 hover:text-orange"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Services */}
        <div>
          <h4 className="mb-5 font-sans text-label font-bold uppercase text-ink/40">Services</h4>
          {SERVICE_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="mb-2.5 block font-sans text-sm text-ink-soft transition-colors duration-200 hover:text-orange"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-5 font-sans text-label font-bold uppercase text-ink/40">Contact</h4>
          {CONTACT_ITEMS.map((item) =>
            item.href ? (
              <a
                key={item.text}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="mb-2.5 flex gap-2 font-sans text-sm text-ink-soft transition-colors duration-200 hover:text-orange"
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.text}</span>
              </a>
            ) : (
              <p key={item.text} className="mb-2.5 flex gap-2 font-sans text-sm text-ink-soft">
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.text}</span>
              </p>
            ),
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-ink/10 pt-7 sm:flex-row">
        <p className="font-sans text-xs text-ink/40">
          © 2025 Kamlesh Paints &amp; Hardware. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link href="/contact" className="font-sans text-xs text-ink/40 transition-colors duration-200 hover:text-ink">
            Contact
          </Link>
          <Link href="/survey" className="font-sans text-xs text-ink/40 transition-colors duration-200 hover:text-ink">
            Book a Survey
          </Link>
          <Link href="/products" className="font-sans text-xs text-ink/40 transition-colors duration-200 hover:text-ink">
            Shop
          </Link>
        </div>
      </div>
    </footer>
  );
}
