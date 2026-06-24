import { HeatmapTable, SimpleTable, TimeSeriesChart } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { demandAnomalies, hourlyDemand, peakHours, seasonality } from "@/lib/server/queries";

export default async function DemandPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const [demand, heatmap, peak, anomalies] = await Promise.all([
    hourlyDemand(filters, 2000),
    seasonality(filters),
    peakHours(filters),
    demandAnomalies(filters),
  ]);
  return (
    <>
      <PageHeader title="Demand" subtitle="Hourly demand, weekday/hour patterns, peak hours, and anomaly baseline." filters={filters} />
      <div className="grid gap-5">
        <Section title="Hourly demand">
          <TimeSeriesChart data={demand} keys={["trip_count"]} />
        </Section>
        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <Section title="Weekday/hour heatmap">
            <HeatmapTable rows={heatmap} xKey="pickup_hour" yKey="weekday" valueKey="trip_count" />
          </Section>
          <Section title="Peak and off-peak analysis">
            <SimpleTable rows={[peak]} />
          </Section>
        </div>
        <Section title="Rolling anomaly baseline">
          <TimeSeriesChart data={anomalies.slice(-336)} keys={["trip_count", "rolling_mean", "upper_band", "lower_band"]} />
        </Section>
      </div>
    </>
  );
}

