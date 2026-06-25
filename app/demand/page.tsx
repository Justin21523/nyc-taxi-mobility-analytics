import { SimpleTable } from "@/components/Charts";
import { EComposedSeries, EHeatmap, EHorizontalBar } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { demandAnomalies, hourlyDemand, peakHours, seasonality } from "@/lib/server/queries";
import { demandInsights } from "@/lib/server/insights";

export default async function DemandPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const [demand, heatmap, peak, anomalies] = await Promise.all([
    hourlyDemand(filters, 2000),
    seasonality(filters),
    peakHours(filters),
    demandAnomalies(filters),
  ]);
  const insights = demandInsights(demand, heatmap, peak, anomalies);
  return (
    <>
      <PageHeader title="Demand" subtitle="Hourly demand, weekday/hour patterns, peak hours, and anomaly baseline." filters={filters} />
      <div className="grid gap-5">
        <InsightPanel insights={insights.slice(0, 3)} />
        <div data-tour-id="demand-timeseries">
          <Section title="Hourly demand">
            <EComposedSeries data={demand} xKey="pickup_hour" series={[{ key: "trip_count", type: "area" }]} />
            <InsightCallout insight={insights[3]} />
          </Section>
        </div>
        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <div data-tour-id="demand-heatmap">
          <Section title="Weekday/hour heatmap">
            <EHeatmap rows={heatmap} xKey="pickup_hour" yKey="weekday" valueKey="trip_count" />
          </Section>
          </div>
          <Section title="Peak and off-peak analysis">
            <SimpleTable rows={[peak]} />
          </Section>
        </div>
        <Section title="Rolling anomaly baseline">
          <EComposedSeries data={anomalies.slice(-336)} xKey="pickup_hour" series={[{ key: "trip_count", type: "bar" }, { key: "rolling_mean", type: "line" }, { key: "upper_band", type: "line" }, { key: "lower_band", type: "line" }]} />
        </Section>
        <Section title="Largest anomaly hours">
          <EHorizontalBar data={anomalies.filter((row) => row.is_anomaly).map((row) => ({ ...row, anomaly_delta: Math.abs(Number(row.trip_count ?? 0) - Number(row.rolling_mean ?? 0)) }))} nameKey="pickup_hour" valueKey="anomaly_delta" limit={15} />
        </Section>
      </div>
    </>
  );
}
