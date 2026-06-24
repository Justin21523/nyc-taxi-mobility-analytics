import { BarList, FareScatter, MetricBars, SimpleTable } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { fareDistribution, fareSummary, routes, tipBehavior } from "@/lib/server/queries";

export default async function FaresTipsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const [fares, summary, tips, revenueRoutes] = await Promise.all([
    fareDistribution(filters, 2000),
    fareSummary(filters),
    tipBehavior(filters),
    routes(filters, 25, "total_revenue"),
  ]);
  return (
    <>
      <PageHeader title="Fares & Tips" subtitle="Fare distribution, tip behavior, revenue metrics, and high-value routes." filters={filters} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Fare vs distance">
          <FareScatter data={fares} />
        </Section>
        <Section title="Tip behavior by payment type">
          <MetricBars data={tips} nameKey="payment_type" valueKey="avg_tip_rate_pct" />
        </Section>
        <Section title="Revenue by pickup borough">
          <BarList data={summary} nameKey="pickup_borough" valueKey="total_revenue" />
        </Section>
        <Section title="Top routes by revenue">
          <SimpleTable rows={revenueRoutes} />
        </Section>
      </div>
    </>
  );
}

