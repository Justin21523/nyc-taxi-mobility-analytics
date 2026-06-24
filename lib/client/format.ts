export function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export function compactNumber(value: unknown): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(numberValue(value));
}

export function currency(value: unknown): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(numberValue(value));
}

export function decimal(value: unknown, digits = 2): string {
  return numberValue(value).toFixed(digits);
}

