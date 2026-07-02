// Organic paint-splash burst (SVG), like the reference site's hero backdrop.
// Layered blobs + flecks in the brand accent palette; tint one layer via `tint`.

interface PaintSplashProps {
  className?: string;
  /** Hex for the dominant (front) splash layer — swappable at runtime. */
  tint?: string;
}

export function PaintSplash({ className, tint = "#E8590C" }: PaintSplashProps) {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ transition: "color 0.9s cubic-bezier(0.4,0,0.2,1)", color: tint }}
    >
      {/* Back layer — teal */}
      <path
        d="M310 88c72-30 168 2 196 74 20 52-8 96 24 148 30 49 12 118-42 146-60 31-104-10-168 16-62 25-138 20-176-34-36-51-4-102-40-158-32-50-16-120 40-146 54-25 96 14 166-46z"
        fill="#0ABFBC"
        opacity="0.85"
        transform="rotate(14 300 300)"
      />
      {/* Mid layer — yellow */}
      <path
        d="M296 110c64-26 148 4 172 66 18 46-8 84 20 130 26 43 10 104-38 128-52 27-90-8-146 14-54 22-120 17-153-30-31-45-3-89-34-138-28-44-14-105 35-128 47-22 84 12 144-42z"
        fill="#F5C518"
        opacity="0.9"
        transform="rotate(-8 300 300) scale(0.92) translate(28 34)"
      />
      {/* Front layer — tintable */}
      <path
        d="M288 138c54-22 124 3 144 55 15 39-6 71 17 109 22 36 8 87-32 107-43 23-75-6-122 12-45 18-100 14-128-25-26-38-2-74-28-116-24-37-12-88 29-107 39-18 70 10 120-35z"
        fill="currentColor"
        transform="scale(0.9) translate(36 44)"
      />
      {/* Flecks */}
      <circle cx="112" cy="132" r="14" fill="#7B2FBE" opacity="0.8" />
      <circle cx="500" cy="180" r="10" fill="#F5C518" />
      <circle cx="470" cy="470" r="16" fill="#0ABFBC" opacity="0.8" />
      <circle cx="120" cy="452" r="9" fill="currentColor" />
      <circle cx="540" cy="330" r="7" fill="#FF4D6D" />
      <circle cx="72" cy="300" r="7" fill="#FF4D6D" opacity="0.9" />
      <circle cx="300" cy="52" r="8" fill="#7B2FBE" opacity="0.7" />
    </svg>
  );
}
