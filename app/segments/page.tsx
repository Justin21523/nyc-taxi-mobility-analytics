import { SimpleTable } from "@/components/Charts";
import { EComposedSeries, EHorizontalBar, ERadar, ETreemap, EWaterfall } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { SegmentControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { segmentInsights } from "@/lib/server/insights";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { compareSegments, segmentPresets } from "@/lib/server/queries";

export default async function SegmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const left = typeof params.left === "string" ? params.left : "airport";
  const right = typeof params.right === "string" ? params.right : "non_airport";
  const topN = Number(params.topN ?? 10);
  const comparison = await compareSegments(left, right, filters, topN);
  const insights = segmentInsights(comparison);
  return (
    <>
      <PageHeader title="Segment Comparison" subtitle="Compare two mobility segments side by side and quantify lift." filters={filters} />
      <SegmentControls params={params} />
      <div className="grid gap-5">
        <InsightPanel insights={insights} />
        <Section title="Segment presets">
          <SimpleTable rows={segmentPresets} />
        </Section>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title={`Left: ${left}`}>
            <SimpleTable rows={[comparison.leftMetrics]} />
          </Section>
          <Section title={`Right: ${right}`}>
            <SimpleTable rows={[comparison.rightMetrics]} />
          </Section>
        </div>
        <Section title="Segment KPI radar">
          <ERadar data={[{ segment: left, ...comparison.leftMetrics }, { segment: right, ...comparison.rightMetrics }]} nameKey="segment" metrics={["trip_count", "total_revenue", "avg_total_amount", "avg_distance", "avg_tip_rate_pct"]} />
        </Section>
        <Section title="Demand pattern comparison">
          <EComposedSeries
            data={comparison.leftDemand.map((row, index) => ({ pickup_hour: row.pickup_hour, left: row.trip_count, right: comparison.rightDemand[index]?.trip_count ?? 0 }))}
            xKey="pickup_hour"
            series={[{ key: "left", type: "bar" }, { key: "right", type: "line" }]}
          />
        </Section>
        <div data-tour-id="segments-lift">
        <Section title="Segment lift">
          <EWaterfall data={comparison.lift} nameKey="metric" valueKey="lift_pct" />
          <SimpleTable rows={comparison.lift} />
          {insights[1] ? <InsightCallout insight={insights[1]} /> : null}
        </Section>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <div data-tour-id="segments-mix">
          <Section title="Left route mix">
            <ETreemap data={comparison.leftRoutes.map((row) => ({ ...row, route: `${row.pickup_zone} -> ${row.dropoff_zone}` }))} nameKey="route" valueKey="trip_count" />
          </Section>
          </div>
          <Section title="Right route mix">
            <EHorizontalBar data={comparison.rightRoutes.map((row) => ({ ...row, route: `${row.pickup_zone} -> ${row.dropoff_zone}` }))} nameKey="route" valueKey="trip_count" limit={topN} />
          </Section>
        </div>
      </div>
    </>
  );
}
