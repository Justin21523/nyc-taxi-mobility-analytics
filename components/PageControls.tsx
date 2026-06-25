import { ControlSelect, NumberStepper, QueryControlPanel } from "@/components/Controls";
import { filterOptions, routes } from "@/lib/server/queries";
import type { Filters } from "@/lib/server/filters";

type Option = {
  value: string;
  label: string;
  description?: string;
};

function option(value: string, label = value, description?: string): Option {
  return { value, label, description };
}

export async function TripExplorerControls({ params }: { params: Record<string, string | string[] | undefined> }) {
  const options = await filterOptions();
  const zoneOptions = [option("All", "Any zone"), ...options.zones.map((zone) => option(zone.zone, zone.zone, `${zone.borough} / ${zone.service_zone}`))];
  const fareBucket = typeof params.fareBucket === "string" ? params.fareBucket : "default";
  return (
    <QueryControlPanel>
      <ControlSelect label="Pickup zone" param="pickupZone" value={String(params.pickupZone ?? "All")} options={zoneOptions} />
      <ControlSelect label="Dropoff zone" param="dropoffZone" value={String(params.dropoffZone ?? "All")} options={zoneOptions} />
      <ControlSelect label="Fare bucket" param="fareBucket" value={fareBucket} options={options.controlOptions.fareBuckets} />
      <ControlSelect label="Sort by" param="sortBy" value={String(params.sortBy ?? "pickup_datetime")} options={options.controlOptions.tripSorts} />
      <ControlSelect label="Sort direction" param="sortDir" value={String(params.sortDir ?? "desc")} options={options.controlOptions.sortDirections} />
      <NumberStepper label="Rows" param="limit" value={String(params.limit ?? "100")} options={options.controlOptions.limits} />
    </QueryControlPanel>
  );
}

export async function SegmentControls({ params }: { params: Record<string, string | string[] | undefined> }) {
  const options = await filterOptions();
  const segments = options.segments.map((segment) => option(segment.id, segment.label));
  return (
    <QueryControlPanel>
      <ControlSelect label="Left segment" param="left" value={String(params.left ?? "airport")} options={segments} />
      <ControlSelect label="Right segment" param="right" value={String(params.right ?? "non_airport")} options={segments} />
      <NumberStepper label="Top routes" param="topN" value={String(params.topN ?? "10")} options={options.controlOptions.topNs} />
    </QueryControlPanel>
  );
}

export async function MapControls({ params }: { params: Record<string, string | string[] | undefined> }) {
  const options = await filterOptions();
  const zoneOptions = [option("All", "No selected zone"), ...options.zones.map((zone) => option(String(zone.location_id), zone.zone, `${zone.borough} / ${zone.service_zone}`))];
  return (
    <QueryControlPanel>
      <ControlSelect label="Zone type" param="kind" value={String(params.kind ?? "pickup")} options={options.controlOptions.mapKinds} />
      <ControlSelect label="Map metric" param="valueColumn" value={String(params.valueColumn ?? "trip_count")} options={options.controlOptions.mapValues} />
      <ControlSelect label="Jump to zone" param="zoneId" value={String(params.zoneId ?? "All")} options={zoneOptions} />
      <NumberStepper label="Ranking size" param="topN" value={String(params.topN ?? "50")} options={options.controlOptions.topNs} />
    </QueryControlPanel>
  );
}

export async function AirportControls({ params }: { params: Record<string, string | string[] | undefined> }) {
  const options = await filterOptions();
  return (
    <QueryControlPanel>
      <ControlSelect label="Airport" param="airportZone" value={String(params.airportZone ?? "All")} options={options.controlOptions.airportZones} />
      <NumberStepper label="Top routes" param="topN" value={String(params.topN ?? "15")} options={options.controlOptions.topNs} />
      <ControlSelect
        label="Route metric"
        param="chartMetric"
        value={String(params.chartMetric ?? "trip_count")}
        options={[option("trip_count", "Trips"), option("total_revenue", "Revenue"), option("avg_total_amount", "Average fare"), option("avg_distance", "Average distance")]}
      />
    </QueryControlPanel>
  );
}

export async function ForecastControls({ params }: { params: Record<string, string | string[] | undefined> }) {
  const options = await filterOptions();
  return (
    <QueryControlPanel>
      <ControlSelect label="Forecast horizon" param="horizon" value={String(params.horizon ?? "24")} options={options.controlOptions.forecastHorizons} />
      <ControlSelect label="Moving average window" param="window" value={String(params.window ?? "24")} options={options.controlOptions.forecastWindows} />
      <ControlSelect
        label="Chart metric"
        param="chartMetric"
        value={String(params.chartMetric ?? "all")}
        options={[option("all", "All models"), option("naive_forecast", "Naive"), option("moving_average_forecast", "Moving average"), option("seasonal_naive_forecast", "Seasonal naive")]}
      />
    </QueryControlPanel>
  );
}

export async function ScenarioControls({ params }: { params: Record<string, string | string[] | undefined> }) {
  const options = await filterOptions();
  return (
    <QueryControlPanel>
      <ControlSelect label="Scenario" param="type" value={String(params.type ?? "airport_demand")} options={options.controlOptions.scenarioTypes} />
      <ControlSelect label="Impact percent" param="percent" value={String(params.percent ?? "10")} options={options.controlOptions.scenarioPercents} />
    </QueryControlPanel>
  );
}

export async function RouteControls({ filters, params }: { filters: Filters; params: Record<string, string | string[] | undefined> }) {
  const routeRows = await routes(filters, 80);
  const routeOptions = routeRows.map((row) => {
    const pickup = String(row.pickup_zone);
    const dropoff = String(row.dropoff_zone);
    return option(`${pickup}|||${dropoff}`, `${pickup} -> ${dropoff}`, `${row.trip_count} trips / $${row.total_revenue}`);
  });
  const current = params.pickupZone && params.dropoffZone ? `${params.pickupZone}|||${params.dropoffZone}` : routeOptions[0]?.value ?? "";
  return (
    <QueryControlPanel>
      <RouteSelect value={String(current)} options={routeOptions} />
    </QueryControlPanel>
  );
}

function RouteSelect({ value, options }: { value: string; options: Option[] }) {
  return <ControlSelect label="Selected route" param="route" value={value} options={options} />;
}

export async function TopNControls({ params, includeMetric = true }: { params: Record<string, string | string[] | undefined>; includeMetric?: boolean }) {
  const options = await filterOptions();
  return (
    <QueryControlPanel>
      <NumberStepper label="Top N" param="topN" value={String(params.topN ?? "20")} options={options.controlOptions.topNs} />
      {includeMetric ? <ControlSelect label="Rank by" param="orderBy" value={String(params.orderBy ?? "trip_count")} options={options.controlOptions.routeSorts} /> : null}
      <ControlSelect
        label="Chart focus"
        param="chartMetric"
        value={String(params.chartMetric ?? "trip_count")}
        options={[option("trip_count", "Trips"), option("total_revenue", "Revenue"), option("avg_total_amount", "Average fare"), option("avg_distance", "Average distance")]}
      />
    </QueryControlPanel>
  );
}

export async function AnomalyControls({ params, anomalies }: { params: Record<string, string | string[] | undefined>; anomalies: Record<string, unknown>[] }) {
  const options = anomalies.map((row) => option(String(row.pickup_hour), String(row.pickup_hour), `Severity ${row.severity_score}`));
  return (
    <QueryControlPanel>
      <ControlSelect label="Anomaly hour" param="hour" value={String(params.hour ?? options[0]?.value ?? "")} options={options} />
    </QueryControlPanel>
  );
}
