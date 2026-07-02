const TICKER_TEXT =
  "Birla Opus Dealer · One Series · Calista Range · Style Collection · Alldry Waterproofing · Allwood Finishes · Interior Paints · Exterior Paints · Enamels · Wood Finishes · Wallpapers · Painting Tools · Free Delivery in Pune · Free Site Survey · ";

function TickerRun() {
  const parts = TICKER_TEXT.split("·");
  return (
    <span className="flex items-center">
      {parts.map((part, i) =>
        part.trim() === "" ? null : (
          <span key={i} className="flex items-center">
            <span className="px-2">{part.trim()}</span>
            <span className="px-1 opacity-50">·</span>
          </span>
        ),
      )}
    </span>
  );
}

export function BrandTicker() {
  return (
    <section
      aria-label="Birla Opus product ranges"
      className="flex h-[68px] w-full items-center overflow-hidden bg-orange"
    >
      <div className="ticker-track font-sans text-[12px] font-bold uppercase tracking-[3px] text-canvas">
        <TickerRun />
        <TickerRun />
      </div>
    </section>
  );
}
