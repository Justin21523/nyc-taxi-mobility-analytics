"use client";

import { Activity, Clock, DollarSign, MapPin, Plane, Receipt } from "lucide-react";

import { kpiTones } from "@/lib/client/theme";
import { useLocale } from "@/lib/client/i18n";
import { compactNumber, currency, decimal } from "@/lib/client/format";

const cards = [
  { key: "trip_count", label: "Trip count", icon: Activity, format: compactNumber },
  { key: "total_revenue", label: "Revenue", icon: DollarSign, format: currency },
  { key: "avg_total_amount", label: "Avg fare", icon: Receipt, format: (value: unknown) => `$${decimal(value)}` },
  { key: "avg_distance", label: "Avg distance", icon: MapPin, format: (value: unknown) => `${decimal(value)} mi` },
  { key: "avg_tip_rate_pct", label: "Avg tip", icon: Clock, format: (value: unknown) => `${decimal(value)}%` },
  { key: "airport_trip_share_pct", label: "Airport share", icon: Plane, format: (value: unknown) => `${decimal(value)}%` },
];

export function KpiCards({ overview }: { overview: Record<string, unknown> }) {
  const { t } = useLocale();
  return (
    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6" data-tour-id="overview-kpis">
      {cards.map((card, index) => {
        const tone = kpiTones[index % kpiTones.length];
        return (
        <div key={card.key} className="ui-card ui-card-hover overflow-hidden rounded-lg p-4">
          <div className="mb-3 h-1 w-16 rounded-full" style={{ background: tone.solid }} />
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">{t(card.label)}</span>
            <span className="grid h-8 w-8 place-items-center rounded-md" style={{ background: tone.soft, color: tone.text }}>
              <card.icon className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-app-text-primary">{card.format(overview[card.key])}</div>
        </div>
        );
      })}
    </section>
  );
}
