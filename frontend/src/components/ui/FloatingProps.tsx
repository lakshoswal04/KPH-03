/* Decorative animated painter props — pure CSS/HTML, pointer-events-none.
 * A paint roller with a coloured sleeve, a brush, and floating packshot buckets. */
/* eslint-disable @next/next/no-img-element */

export function PaintRoller({
  className,
  sleeve = "#E8590C",
  size = 150,
}: {
  className?: string;
  sleeve?: string;
  size?: number;
}) {
  return (
    <div
      className={`roller-drift pointer-events-none ${className ?? ""}`}
      style={{ width: size, height: size * 1.2 }}
      aria-hidden="true"
    >
      {/* Sleeve */}
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size * 0.42,
          background: `linear-gradient(180deg, color-mix(in srgb, ${sleeve} 82%, white) 0%, ${sleeve} 45%, color-mix(in srgb, ${sleeve} 70%, black) 100%)`,
          boxShadow: `0 ${size * 0.12}px ${size * 0.24}px rgba(26,26,10,0.18)`,
        }}
      >
        {/* Sleeve end cap */}
        <div
          className="absolute right-0 top-0 h-full rounded-full"
          style={{
            width: size * 0.12,
            background: "linear-gradient(180deg, #FFFFFF 0%, #D9D2C4 100%)",
          }}
        />
      </div>
      {/* Frame arm */}
      <div
        className="ml-[8%] rounded-b-md"
        style={{
          width: size * 0.055,
          height: size * 0.34,
          background: "linear-gradient(90deg, #9A938A, #C9C2B8)",
        }}
      />
      {/* Handle */}
      <div
        className="rounded-md"
        style={{
          width: size * 0.13,
          height: size * 0.4,
          marginLeft: size * 0.04,
          background: "linear-gradient(90deg, #C9820A, #F7BD16 45%, #C9820A)",
        }}
      />
    </div>
  );
}

export function PaintBrush({
  className,
  bristleTip = "#0ABFBC",
  size = 90,
}: {
  className?: string;
  bristleTip?: string;
  size?: number;
}) {
  return (
    <div
      className={`prop-float pointer-events-none flex flex-col items-center ${className ?? ""}`}
      style={{ width: size * 0.5 }}
      aria-hidden="true"
    >
      {/* Handle */}
      <div
        className="rounded-t-lg"
        style={{
          width: size * 0.22,
          height: size * 0.5,
          background: "linear-gradient(90deg, #B8742A, #E8A85C 45%, #B8742A)",
        }}
      />
      {/* Ferrule */}
      <div
        style={{
          width: size * 0.4,
          height: size * 0.16,
          background: "linear-gradient(180deg, #E8E4DC, #A9A399)",
        }}
      />
      {/* Bristles dipped in paint */}
      <div
        className="rounded-b-lg"
        style={{
          width: size * 0.4,
          height: size * 0.42,
          background: `linear-gradient(180deg, #E8DCC0 0%, #E8DCC0 45%, ${bristleTip} 60%, ${bristleTip} 100%)`,
        }}
      />
    </div>
  );
}

export function FloatingBucket({
  className,
  src,
  size = 110,
  delay = 0,
}: {
  className?: string;
  src: string;
  size?: number;
  delay?: number;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`prop-float pointer-events-none select-none drop-shadow-xl ${className ?? ""}`}
      style={{ width: size, animationDelay: `${delay}s` }}
    />
  );
}
