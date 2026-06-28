import { SimpleTable } from "@/components/Charts";
import { EComposedSeries, EDonut, EHeatmap, EHorizontalBar, EStackedBar } from "@/components/InsightCharts";
import { InsightCards } from "@/components/InsightCards";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { AirportControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { airportAnalytics, airportFareComparison, airportHourlyDemand, airportRoutes } from "@/lib/server/queries";
import { airportInsights } from "@/lib/server/insights";

export const dynamic = "force-static";

export default async function AirportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const topN = Number(params.topN ?? 15);
  const airportZone = typeof params.airportZone === "string" ? params.airportZone : "All";
  const chartMetric = typeof params.chartMetric === "string" ? params.chartMetric : "trip_count";
  const [summary, routes, hourly, fareComparison] = await Promise.all([
    airportAnalytics(filters, airportZone),
    airportRoutes(filters, topN, airportZone),
    airportHourlyDemand(filters, airportZone),
    airportFareComparison(filters),
  ]);
  const totals = summary.reduce<{ trips: number; revenue: number; avgFareNumerator: number; avgDistanceNumerator: number }>((acc, row) => ({
    trips: acc.trips + Number(row.trip_count ?? 0),
    revenue: acc.revenue + Number(row.total_revenue ?? 0),
    avgFareNumerator: acc.avgFareNumerator + Number(row.avg_total_amount ?? 0) * Number(row.trip_count ?? 0),
    avgDistanceNumerator: acc.avgDistanceNumerator + Number(row.avg_distance ?? 0) * Number(row.trip_count ?? 0),
  }), { trips: 0, revenue: 0, avgFareNumerator: 0, avgDistanceNumerator: 0 });
  const hasData = summary.length > 0;
  const insights = airportInsights(summary, routes, fareComparison, airportZone);
  return (
    <>
      <PageHeader title="Airport Analytics" subtitle="JFK, LGA, and EWR demand, routes, fare premium, and inbound/outbound split." filters={filters} />
      <AirportControls params={params} />
      <div className="grid gap-5">
        <InsightPanel insights={insights} />
        {hasData ? (
          <InsightCards cards={[
            { label: "Airport trips", value: totals.trips },
            { label: "Airport revenue", value: totals.revenue, format: "currency" },
            { label: "Weighted avg fare", value: totals.trips ? totals.avgFareNumerator / totals.trips : 0, format: "currency" },
            { label: "Weighted avg distance", value: totals.trips ? totals.avgDistanceNumerator / totals.trips : 0, format: "decimal", helper: "miles" },
          ]} />
        ) : (
          <Section title="No airport trips under current filters">
            <p className="text-sm text-app-text-secondary">Try selecting All airports or clearing global filters.</p>
          </Section>
        )}
        <div className="grid gap-5 xl:grid-cols-2">
          <div data-tour-id="airport-summary">
          <Section title="Airport trip share">
            <EDonut data={summary} nameKey="airport_zone" valueKey="trip_count" />
          </Section>
          </div>
          <Section title="Inbound / outbound profile">
            <EStackedBar data={summary} xKey="airport_zone" seriesKeys={["inbound_share_pct", "outbound_share_pct"]} />
          </Section>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <Section title="Airport demand by hour">
            <EComposedSeries data={hourly.map((row) => ({ ...row, trip_count: row.trip_count }))} xKey="pickup_hour" series={[{ key: "trip_count", type: "area" }]} />
          </Section>
          <div data-tour-id="airport-routes">
          <Section title="Top airport routes">
            <EHorizontalBar data={routes.map((row) => ({ ...row, route: `${row.pickup_zone} -> ${row.dropoff_zone}` }))} nameKey="route" valueKey={chartMetric} limit={topN} />
            <InsightCallout insight={insights[0]} />
          </Section>
          </div>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Airport hourly heatmap">
            <EHeatmap rows={hourly} xKey="pickup_hour" yKey="airport_zone" valueKey="trip_count" />
          </Section>
          <Section title="Airport vs non-airport fares">
            <EStackedBar data={fareComparison} xKey="segment" seriesKeys={["trip_count", "avg_total_amount", "avg_distance"]} />
          </Section>
        </div>
        <Section title="Route detail table">
          <SimpleTable rows={routes} />
        </Section>
      </div>
    </>
  );
}
