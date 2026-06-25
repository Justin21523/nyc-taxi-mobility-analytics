import { SimpleTable } from "@/components/Charts";
import { EBubble, EDonut, EHorizontalBar, EStackedBar } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { TopNControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { faresTipsInsights } from "@/lib/server/insights";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { fareDistribution, fareSummary, routes, tipBehavior } from "@/lib/server/queries";

export default async function FaresTipsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const topN = Number(params.topN ?? 20);
  const chartMetric = typeof params.chartMetric === "string" ? params.chartMetric : "total_revenue";
  const [fares, summary, tips, revenueRoutes] = await Promise.all([
    fareDistribution(filters, 2000),
    fareSummary(filters),
    tipBehavior(filters),
    routes(filters, topN, "total_revenue"),
  ]);
  const fareBucketLookup = new Map<string, { distance_bucket: string; trips: number; tips: number }>();
  fares.forEach((row) => {
    const bucket = String(row.distance_bucket);
    const current = fareBucketLookup.get(bucket) ?? { distance_bucket: bucket, trips: 0, tips: 0 };
    fareBucketLookup.set(bucket, { ...current, trips: current.trips + 1, tips: current.tips + Number(row.tip_amount ?? 0) });
  });
  const fareBucketRows = Array.from(fareBucketLookup.values()) as Record<string, unknown>[];
  const insights = faresTipsInsights(fares, summary, tips, revenueRoutes);
  return (
    <>
      <PageHeader title="Fares & Tips" subtitle="Fare distribution, tip behavior, revenue metrics, and high-value routes." filters={filters} />
      <TopNControls params={params} />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <InsightPanel insights={insights} />
        </div>
        <div data-tour-id="fares-scatter">
        <Section title="Fare vs distance">
          <EBubble data={fares.map((row, index) => ({ ...row, trip: `Trip ${index + 1}` }))} xKey="trip_distance" yKey="total_amount" sizeKey="tip_amount" nameKey="trip" />
          {insights[2] ? <InsightCallout insight={insights[2]} /> : null}
        </Section>
        </div>
        <div data-tour-id="tips-payment">
        <Section title="Tip behavior by payment type">
          <EDonut data={tips} nameKey="payment_type" valueKey="total_tips" />
        </Section>
        </div>
        <Section title="Revenue by pickup borough">
          <EHorizontalBar data={summary} nameKey="pickup_borough" valueKey={chartMetric} />
        </Section>
        <Section title="Fare bucket mix">
          <EStackedBar data={fareBucketRows} xKey="distance_bucket" seriesKeys={["trips", "tips"]} />
        </Section>
        <Section title="Top routes by revenue">
          <SimpleTable rows={revenueRoutes} />
        </Section>
      </div>
    </>
  );
}
