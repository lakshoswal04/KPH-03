// Single source of truth for Kamlesh Paints & Hardware contact details.
// Update here and every page + the WhatsApp button stays in sync.

export const BUSINESS = {
  name: "Kamlesh Paints & Hardware",
  tagline: "Authorised Birla Opus Dealer",
  phoneDisplay: "+91 98504 20090",
  phoneDial: "+919850420090",
  whatsapp: "919850420090", // digits only, for wa.me links
  email: "kamlesh6678@gmail.com",
  address: "FC Road, Dnyaneshwar Paduka Chowk, Shivajinagar, Pune",
  hours: {
    weekday: "Mon–Sat · 9:00 AM – 8:00 PM",
    weekend: "Sunday · 9:00 AM – 7:00 PM",
  },
} as const;

/** wa.me link, optionally pre-filled with a message. */
export function whatsappHref(text?: string): string {
  const base = `https://wa.me/${BUSINESS.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const telHref = `tel:${BUSINESS.phoneDial}`;
export const mailHref = `mailto:${BUSINESS.email}`;
