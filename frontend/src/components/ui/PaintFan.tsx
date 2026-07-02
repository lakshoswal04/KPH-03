// Paint fan-deck logo: six thin blades arranged radially from a centre pivot.
const BLADES = ["#E8590C", "#F5C518", "#0ABFBC", "#FF4D6D", "#7B2FBE", "#A8C8A0"];

export function PaintFan({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      {BLADES.map((colour, i) => (
        <rect
          key={colour}
          x="21.5"
          y="12"
          width="5"
          height="26"
          rx="2.5"
          fill={colour}
          transform={`rotate(${-62.5 + i * 25} 24 40)`}
        />
      ))}
      <circle cx="24" cy="40" r="3" fill="#1A1A0A" />
    </svg>
  );
}
