import { ControlSelect, QueryControlPanel } from "@/components/Controls";
import { filterOptions, routes } from "@/lib/server/queries";
import type { Filters } from "@/lib/server/filters";

export async function ZoneSwitcher({ currentZoneId }: { currentZoneId: number }) {
  const options = await filterOptions();
  return (
    <QueryControlPanel>
      <ControlSelect
        label="Switch zone"
        param="zonePath"
        value={String(currentZoneId)}
        options={options.zones.map((zone) => ({
          value: String(zone.location_id),
          label: zone.zone,
          description: `${zone.borough} / ${zone.service_zone}`,
        }))}
      />
    </QueryControlPanel>
  );
}

export async function RouteSwitcher({ filters, current }: { filters: Filters; current: string }) {
  const routeRows = await routes(filters, 100);
  return (
    <QueryControlPanel>
      <ControlSelect
        label="Switch route"
        param="route"
        value={current}
        options={routeRows.map((row) => {
          const pickup = String(row.pickup_zone);
          const dropoff = String(row.dropoff_zone);
          return {
            value: `${pickup}|||${dropoff}`,
            label: `${pickup} -> ${dropoff}`,
            description: `${row.trip_count} trips / $${row.total_revenue}`,
          };
        })}
      />
    </QueryControlPanel>
  );
}

