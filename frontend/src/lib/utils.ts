export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN");
}

export function priceRange(low: number, high: number, unit: string): string {
  // Hardware/tools priced per pack use unit "unit" — show a "From" price instead
  // of an awkward "/ unit" suffix.
  if (unit === "unit") return `From ₹${formatINR(low)}`;
  // Single-pack products have no range — avoid "₹898 – ₹898 / L".
  if (low === high) return `₹${formatINR(low)} / ${unit}`;
  return `₹${formatINR(low)} – ₹${formatINR(high)} / ${unit}`;
}
