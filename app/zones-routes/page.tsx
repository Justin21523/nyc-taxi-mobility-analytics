import { BarList, HeatmapTable, LinkedTable } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { odMatrix, routes, topZones } from "@/lib/server/queries";

export default async function ZonesRoutesPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const [pickupZones, dropoffZones, od, routeRows, revenueRoutes] = await Promise.all([
    topZones(filters, "pickup", 20),
    topZones(filters, "dropoff", 20),
    odMatrix(filters),
    routes(filters, 40),
    routes(filters, 25, "total_revenue"),
  ]);
  return (
    <>
      <PageHeader title="Zones & Routes" subtitle="Pickup/dropoff rankings, borough OD matrix, and route popularity." filters={filters} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Pickup zones">
          <BarList data={pickupZones} nameKey="zone" valueKey="trip_count" />
          <LinkedTable rows={pickupZones.slice(0, 10)} columns={["location_id", "borough", "zone", "trip_count", "total_revenue"]} hrefForRow={(row) => `/zones/${row.location_id}`} />
        </Section>
        <Section title="Dropoff zones">
          <BarList data={dropoffZones} nameKey="zone" valueKey="trip_count" />
          <LinkedTable rows={dropoffZones.slice(0, 10)} columns={["location_id", "borough", "zone", "trip_count", "total_revenue"]} hrefForRow={(row) => `/zones/${row.location_id}`} />
        </Section>
        <Section title="Borough-to-borough OD matrix">
          <HeatmapTable rows={od} xKey="dropoff_borough" yKey="pickup_borough" valueKey="trip_count" />
        </Section>
        <Section title="Route matrix">
          <HeatmapTable rows={routeRows} xKey="dropoff_zone" yKey="pickup_zone" valueKey="trip_count" />
        </Section>
        <section className="xl:col-span-2">
          <Section title="Top routes by revenue">
            <LinkedTable
              rows={revenueRoutes}
              hrefForRow={(row) => `/routes/drilldown?pickupZone=${encodeURIComponent(String(row.pickup_zone))}&dropoffZone=${encodeURIComponent(String(row.dropoff_zone))}`}
            />
          </Section>
        </section>
      </div>
    </>
  );
}
