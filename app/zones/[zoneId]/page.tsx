import { BarList, SimpleTable, TimeSeriesChart } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { tripSearch, zoneDetail, zoneHourlyDemand, zoneInboundOutbound, zoneTopDestinations, zoneTopOrigins } from "@/lib/server/queries";

export default async function ZoneDrilldownPage({ params, searchParams }: { params: Promise<{ zoneId: string }>; searchParams: SearchParams }) {
  const [{ zoneId }, filters] = await Promise.all([params, filtersFromSearchParams(searchParams)]);
  const id = Number(zoneId);
  const [detail, flows, origins, destinations, hourly, trips] = await Promise.all([
    zoneDetail(id, filters),
    zoneInboundOutbound(id, filters),
    zoneTopOrigins(id, filters),
    zoneTopDestinations(id, filters),
    zoneHourlyDemand(id, filters),
    tripSearch(filters, { relatedZoneId: id, limit: 25 }),
  ]);
  return (
    <>
      <PageHeader title={`Zone Drilldown: ${detail.zone ?? zoneId}`} subtitle="Inbound/outbound trips, demand pattern, airport connection share, and top connected zones." filters={filters} />
      <div className="grid gap-5">
        <Section title="Zone KPIs">
          <SimpleTable rows={[detail]} />
        </Section>
        <div className="grid gap-5 xl:grid-cols-3">
          <Section title="Inbound / outbound split">
            <SimpleTable rows={flows} />
          </Section>
          <Section title="Top origins">
            <BarList data={origins} nameKey="zone" valueKey="trip_count" />
          </Section>
          <Section title="Top destinations">
            <BarList data={destinations} nameKey="zone" valueKey="trip_count" />
          </Section>
        </div>
        <Section title="Zone hourly demand">
          <TimeSeriesChart data={hourly} keys={["trip_count"]} />
        </Section>
        <Section title="Sample trips under current filters">
          <SimpleTable rows={trips} />
        </Section>
      </div>
    </>
  );
}
