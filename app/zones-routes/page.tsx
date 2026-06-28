import { LinkedTable } from "@/components/Charts";
import { EBubble, EHeatmap, EHorizontalBar, ETreemap } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { TopNControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { odMatrix, routes, topZones } from "@/lib/server/queries";
import { zonesRoutesInsights } from "@/lib/server/insights";

export const dynamic = "force-static";

export default async function ZonesRoutesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const topN = Number(params.topN ?? 20);
  const chartMetric = typeof params.chartMetric === "string" ? params.chartMetric : "trip_count";
  const orderBy = params.orderBy === "total_revenue" ? "total_revenue" : "trip_count";
  const [pickupZones, dropoffZones, od, routeRows, revenueRoutes] = await Promise.all([
    topZones(filters, "pickup", topN),
    topZones(filters, "dropoff", topN),
    odMatrix(filters),
    routes(filters, 50, orderBy),
    routes(filters, topN, "total_revenue"),
  ]);
  const insights = zonesRoutesInsights(pickupZones, dropoffZones, od, routeRows, revenueRoutes);
  return (
    <>
      <PageHeader title="Zones & Routes" subtitle="Pickup/dropoff rankings, borough OD matrix, and route popularity." filters={filters} />
      <TopNControls params={params} />
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="xl:col-span-2">
          <InsightPanel insights={insights} />
        </section>
        <div data-tour-id="zones-ranking">
        <Section title="Pickup zones">
          <EHorizontalBar data={pickupZones} nameKey="zone" valueKey={chartMetric} limit={topN} />
          <InsightCallout insight={insights[0]} />
          <LinkedTable rows={pickupZones.slice(0, 10).map((row) => ({ ...row, __href: `/zones/${row.location_id}` }))} columns={["location_id", "borough", "zone", "trip_count", "total_revenue"]} />
        </Section>
        </div>
        <Section title="Dropoff zones">
          <ETreemap data={dropoffZones} nameKey="zone" valueKey={chartMetric} />
          <LinkedTable rows={dropoffZones.slice(0, 10).map((row) => ({ ...row, __href: `/zones/${row.location_id}` }))} columns={["location_id", "borough", "zone", "trip_count", "total_revenue"]} />
        </Section>
        <div data-tour-id="route-matrix">
        <Section title="Borough-to-borough OD matrix">
          <EHeatmap rows={od} xKey="dropoff_borough" yKey="pickup_borough" valueKey="trip_count" />
        </Section>
        </div>
        <Section title="Route matrix">
          <EHeatmap rows={routeRows} xKey="dropoff_zone" yKey="pickup_zone" valueKey="trip_count" />
        </Section>
        <Section title="Route value bubble chart">
          <EBubble data={routeRows.map((row) => ({ ...row, route: `${row.pickup_zone} -> ${row.dropoff_zone}` }))} xKey="trip_count" yKey="total_revenue" sizeKey="avg_total_amount" nameKey="route" />
        </Section>
        <section className="xl:col-span-2">
          <Section title="Top routes by revenue">
            <LinkedTable
              rows={revenueRoutes.map((row) => ({ ...row, __href: `/routes/drilldown?pickupZone=${encodeURIComponent(String(row.pickup_zone))}&dropoffZone=${encodeURIComponent(String(row.dropoff_zone))}` }))}
            />
          </Section>
        </section>
      </div>
    </>
  );
}
