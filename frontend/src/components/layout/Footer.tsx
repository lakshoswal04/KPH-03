import Link from "next/link";

import { PaintFan } from "@/components/ui/PaintFan";

const PRODUCT_LINKS = [
  "Interior Paints",
  "Exterior Paints",
  "Waterproofing",
  "Enamels",
  "Wood Finishes",
  "Wallpapers",
  "Tools",
  "Aerosols",
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
  { icon: "📞", text: "[YOUR PHONE NUMBER]" },
  { icon: "💬", text: "WhatsApp Us" },
  { icon: "✉", text: "[YOUR EMAIL ADDRESS]" },
  { icon: "📍", text: "[YOUR FULL ADDRESS], Shivajinagar, Pune" },
  { icon: "🕐", text: "[YOUR WEEKDAY HOURS]" },
  { icon: "🕐", text: "[YOUR WEEKEND HOURS]" },
];

const SOCIALS = ["Instagram", "Facebook", "YouTube", "WhatsApp"];

const SOCIAL_PATHS: Record<string, string> = {
  Instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  Facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  YouTube:
    "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  WhatsApp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
};

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
            {SOCIALS.map((name) => (
              <a
                key={name}
                href="#"
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
          {CONTACT_ITEMS.map((item) => (
            <p key={item.text} className="mb-2.5 flex gap-2 font-sans text-sm text-ink-soft">
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.text}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-ink/10 pt-7 sm:flex-row">
        <p className="font-sans text-xs text-ink/40">
          © 2025 Kamlesh Paints &amp; Hardware. All rights reserved.
        </p>
        <div className="flex gap-6">
          {["Privacy Policy", "Terms & Conditions", "Sitemap"].map((label) => (
            <a
              key={label}
              href="#"
              className="font-sans text-xs text-ink/40 transition-colors duration-200 hover:text-ink"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
