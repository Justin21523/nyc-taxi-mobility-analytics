import { SimpleTable } from "@/components/Charts";
import { EComposedSeries, EDonut, EHorizontalBar } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { TopNControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { airportTrips, dailyRevenue, fareSummary, peakHours, tipBehavior, topZones } from "@/lib/server/queries";
import { overviewInsights } from "@/lib/server/insights";

export default async function OverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const topN = Number(params.topN ?? 20);
  const chartMetric = typeof params.chartMetric === "string" ? params.chartMetric : "trip_count";
  const [daily, pickupZones, airport, peak, fares, tips] = await Promise.all([
    dailyRevenue(filters),
    topZones(filters, "pickup", topN),
    airportTrips(filters),
    peakHours(filters),
    fareSummary(filters),
    tipBehavior(filters),
  ]);
  const insights = overviewInsights({}, daily, pickupZones, airport, fares, tips);
  return (
    <>
      <PageHeader title="Overview" subtitle="Filterable mobility, revenue, fare, and airport trip summary." filters={filters} />
      <TopNControls params={params} includeMetric={false} />
      <div data-tour-id="overview-insights">
        <InsightPanel insights={insights.slice(0, 3)} />
      </div>
      <div className="grid gap-5">
        <div data-tour-id="overview-daily">
        <Section title="Daily trips and revenue">
          <EComposedSeries data={daily} xKey="trip_date" series={[{ key: "trip_count", type: "bar" }, { key: "total_revenue", type: "line" }]} />
          <InsightCallout insight={insights[2]} />
        </Section>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          <div data-tour-id="overview-zones">
          <Section title="Top pickup zones">
            <EHorizontalBar data={pickupZones} nameKey="zone" valueKey={chartMetric} />
          </Section>
          </div>
          <Section title="Revenue by pickup borough">
            <EHorizontalBar data={fares} nameKey="pickup_borough" valueKey="total_revenue" />
          </Section>
          <Section title="Tip mix by payment type">
            <EDonut data={tips} nameKey="payment_type" valueKey="total_tips" />
          </Section>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Peak summary">
            <SimpleTable rows={[peak]} />
          </Section>
          <Section title="Airport trips under filters">
            <SimpleTable rows={[airport]} />
          </Section>
        </div>
      </div>
    </>
  );
}
