import type { Config } from "tailwindcss";

// Complete design token system for Kamlesh Paints & Hardware.
// Every colour, font, and easing used by components lives here — never
// hardcode hex values inside components.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0B0B",
        orange: { DEFAULT: "#E8590C", deep: "#CC4E0A" },
        ivory: { DEFAULT: "#FAF7F0", text: "#F5F0E8" },
        ink: { DEFAULT: "#1A1A0A", soft: "#7A756E" },
        gold: "#C9A876",
        forest: "#1F3D2C",
        teal: "#0ABFBC",
        coral: "#FF4D6D",
        violet: "#7B2FBE",
        sun: "#F5C518",
        sage: "#A8C8A0",
        mint: "#2DD4A0",
        lilac: "#9B5FE8",
        card: { DEFAULT: "#1A1A1A", deep: "#111118", raised: "#1F1F1F" },
        testimonial: "#141414",
        whatsapp: "#25D366",
        muted: "rgba(245, 240, 232, 0.5)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "hero-h1": ["clamp(64px, 10vw, 130px)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
        "section-h2": ["clamp(38px, 5.5vw, 72px)", { lineHeight: "0.9", letterSpacing: "-0.02em" }],
        "cta-h2": ["clamp(48px, 8vw, 96px)", { lineHeight: "0.88", letterSpacing: "-0.02em" }],
        label: ["11px", { lineHeight: "1.4", letterSpacing: "3px" }],
        body: ["16px", { lineHeight: "1.75" }],
      },
      spacing: {
        nav: "72px",
        "section-y": "100px",
        "section-x": "80px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        wipe: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      borderRadius: {
        btn: "2px",
      },
      boxShadow: {
        "orange-glow": "0 10px 32px rgba(232, 89, 12, 0.45)",
        "orange-glow-lg": "0 12px 40px rgba(232, 89, 12, 0.5)",
        "card-lift": "0 20px 48px rgba(26, 26, 10, 0.1)",
        can: "inset -20px 0 40px rgba(0,0,0,0.4), inset 20px 0 20px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.7)",
        wa: "0 8px 28px rgba(37, 211, 102, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
