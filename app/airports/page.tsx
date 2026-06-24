import { BarList, HeatmapTable, SimpleTable, TimeSeriesChart } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { airportAnalytics, airportFareComparison, airportHourlyDemand, airportRoutes } from "@/lib/server/queries";

export default async function AirportsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const [summary, routes, hourly, fareComparison] = await Promise.all([
    airportAnalytics(filters),
    airportRoutes(filters, 30),
    airportHourlyDemand(filters),
    airportFareComparison(filters),
  ]);
  return (
    <>
      <PageHeader title="Airport Analytics" subtitle="JFK, LGA, and EWR demand, routes, fare premium, and inbound/outbound split." filters={filters} />
      <div className="grid gap-5">
        <Section title="Airport summary">
          <SimpleTable rows={summary} />
        </Section>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Trips by airport">
            <BarList data={summary} nameKey="airport_zone" valueKey="trip_count" />
          </Section>
          <Section title="Airport vs non-airport fares">
            <SimpleTable rows={fareComparison} />
          </Section>
        </div>
        <Section title="Airport demand by hour">
          <TimeSeriesChart data={hourly.map((row) => ({ ...row, trip_count: row.trip_count }))} keys={["trip_count"]} />
        </Section>
        <Section title="Airport hourly heatmap">
          <HeatmapTable rows={hourly} xKey="pickup_hour" yKey="airport_zone" valueKey="trip_count" />
        </Section>
        <Section title="Top airport routes">
          <SimpleTable rows={routes} />
        </Section>
      </div>
    </>
  );
}
