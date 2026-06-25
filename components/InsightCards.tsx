"use client";

import { kpiTones } from "@/lib/client/theme";
import { useLocale } from "@/lib/client/i18n";
import { compactNumber, currency, decimal } from "@/lib/client/format";

type Card = {
  label: string;
  value: unknown;
  format?: "number" | "currency" | "decimal" | "percent" | "text";
  helper?: string;
};

export function InsightCards({ cards }: { cards: Card[] }) {
  const { t } = useLocale();
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const tone = kpiTones[index % kpiTones.length];
        return (
        <div key={card.label} className="ui-card ui-card-hover rounded-lg p-4">
          <div className="mb-3 h-1 w-12 rounded-full" style={{ background: tone.solid }} />
          <div className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">{t(card.label)}</div>
          <div className="mt-2 text-2xl font-semibold text-app-text-primary">{formatValue(card.value, card.format)}</div>
          {card.helper ? <div className="mt-1 text-xs text-app-text-muted">{card.helper}</div> : null}
        </div>
        );
      })}
    </div>
  );
}

function formatValue(value: unknown, format: Card["format"] = "number") {
  if (value === null || value === undefined || value === "") return "n/a";
  if (format === "currency") return currency(value);
  if (format === "decimal") return decimal(value);
  if (format === "percent") return `${decimal(value)}%`;
  if (format === "text") return String(value);
  return compactNumber(value);
}
