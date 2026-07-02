export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN");
}

export function priceRange(low: number, high: number, unit: string): string {
  return `₹${formatINR(low)} – ₹${formatINR(high)} / ${unit}`;
}
