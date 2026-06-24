import { BarList, SimpleTable, TimeSeriesChart } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { airportTrips, dailyRevenue, peakHours, topZones } from "@/lib/server/queries";

export default async function OverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const [daily, pickupZones, airport, peak] = await Promise.all([
    dailyRevenue(filters),
    topZones(filters, "pickup", 15),
    airportTrips(filters),
    peakHours(filters),
  ]);
  return (
    <>
      <PageHeader title="Overview" subtitle="Filterable mobility, revenue, fare, and airport trip summary." filters={filters} />
      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Section title="Daily trips and revenue">
          <TimeSeriesChart data={daily.map((row) => ({ ...row, pickup_hour: row.trip_date }))} keys={["trip_count", "total_revenue"]} />
        </Section>
        <Section title="Peak summary">
          <SimpleTable rows={[peak]} />
        </Section>
        <Section title="Top pickup zones">
          <BarList data={pickupZones} nameKey="zone" valueKey="trip_count" />
        </Section>
        <Section title="Airport trips">
          <SimpleTable rows={[airport]} />
        </Section>
      </div>
    </>
  );
}

