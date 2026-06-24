import { Activity, Clock, DollarSign, MapPin, Plane, Receipt } from "lucide-react";

import { compactNumber, currency, decimal } from "@/lib/client/format";

const cards = [
  { key: "trip_count", label: "Trips", icon: Activity, format: compactNumber },
  { key: "total_revenue", label: "Revenue", icon: DollarSign, format: currency },
  { key: "avg_total_amount", label: "Avg fare", icon: Receipt, format: (value: unknown) => `$${decimal(value)}` },
  { key: "avg_distance", label: "Avg distance", icon: MapPin, format: (value: unknown) => `${decimal(value)} mi` },
  { key: "avg_tip_rate_pct", label: "Avg tip", icon: Clock, format: (value: unknown) => `${decimal(value)}%` },
  { key: "airport_trip_share_pct", label: "Airport share", icon: Plane, format: (value: unknown) => `${decimal(value)}%` },
];

export function KpiCards({ overview }: { overview: Record<string, unknown> }) {
  return (
    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">{card.label}</span>
            <card.icon className="h-4 w-4 text-teal-700" />
          </div>
          <div className="text-2xl font-semibold text-slate-950">{card.format(overview[card.key])}</div>
        </div>
      ))}
    </section>
  );
}

