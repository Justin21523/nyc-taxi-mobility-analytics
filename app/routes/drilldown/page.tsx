import { FareScatter, SimpleTable, TimeSeriesChart } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { routeDetail, routeFareDistribution, routeHourlyDemand, routes, tripSearch } from "@/lib/server/queries";

export default async function RouteDrilldownPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const fallback = await routes(filters, 1);
  const first = fallback[0] as Record<string, unknown> | undefined;
  const pickupZone = typeof params.pickupZone === "string" ? params.pickupZone : String(first?.pickup_zone ?? "");
  const dropoffZone = typeof params.dropoffZone === "string" ? params.dropoffZone : String(first?.dropoff_zone ?? "");
  const [detail, hourly, fares, trips] = await Promise.all([
    routeDetail(pickupZone, dropoffZone, filters),
    routeHourlyDemand(pickupZone, dropoffZone, filters),
    routeFareDistribution(pickupZone, dropoffZone, filters),
    tripSearch(filters, { pickupZone, dropoffZone, limit: 25 }),
  ]);
  return (
    <>
      <PageHeader title="Route Drilldown" subtitle={`${pickupZone} to ${dropoffZone}: route-level mobility, fares, and trip samples.`} filters={filters} />
      <div className="grid gap-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Selected route">
            <SimpleTable rows={[detail.route as Record<string, unknown>]} />
          </Section>
          <Section title="System comparison under filters">
            <SimpleTable rows={[detail.system as Record<string, unknown>]} />
          </Section>
        </div>
        <Section title="Route hourly demand">
          <TimeSeriesChart data={hourly} keys={["trip_count"]} />
        </Section>
        <Section title="Route fare distribution">
          <FareScatter data={fares} />
        </Section>
        <Section title="Sample trips on selected route">
          <SimpleTable rows={trips} />
        </Section>
      </div>
    </>
  );
}

