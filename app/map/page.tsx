import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { SimpleTable } from "@/components/Charts";
import { ZoneMap } from "@/components/ZoneMap";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { topZones, zoneGeojson } from "@/lib/server/queries";

export default async function MapPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const kind = typeof params.kind === "string" ? params.kind : "pickup";
  const valueColumn = typeof params.valueColumn === "string" ? params.valueColumn : "trip_count";
  const [geojson, rows] = await Promise.all([zoneGeojson(filters, kind, valueColumn), topZones(filters, kind, 50)]);
  return (
    <>
      <PageHeader title="Zone Map" subtitle="NYC taxi zone choropleth by pickup/dropoff demand or revenue." filters={filters} />
      <div className="grid gap-5">
        <Section title="Taxi zone choropleth">
          <ZoneMap geojson={geojson as Record<string, unknown> | null} />
        </Section>
        <Section title="Zone metrics">
          <SimpleTable rows={rows} />
        </Section>
      </div>
    </>
  );
}
