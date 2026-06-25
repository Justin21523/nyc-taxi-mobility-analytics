import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { SimpleTable } from "@/components/Charts";
import { EDonut, EHorizontalBar, ESankey } from "@/components/InsightCharts";
import { InsightCards } from "@/components/InsightCards";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { MapControls } from "@/components/PageControls";
import { ZoneMap } from "@/components/ZoneMap";
import { mapInsights } from "@/lib/server/insights";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { topZones, zoneGeojson, zoneNetwork } from "@/lib/server/queries";

export default async function MapPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const kind = typeof params.kind === "string" ? params.kind : "pickup";
  const valueColumn = typeof params.valueColumn === "string" ? params.valueColumn : "trip_count";
  const topN = Number(params.topN ?? 50);
  const selectedZoneId = typeof params.zoneId === "string" ? Number(params.zoneId) : null;
  const [geojson, rows, network] = await Promise.all([
    zoneGeojson(filters, kind, valueColumn),
    topZones(filters, kind, topN),
    selectedZoneId ? zoneNetwork(selectedZoneId, filters, 10) : Promise.resolve(null),
  ]);
  const selected = selectedZoneId ? rows.find((row) => Number(row.location_id) === selectedZoneId) : null;
  const selectedDetail = (network?.detail as Record<string, unknown> | undefined) ?? selected;
  const insights = mapInsights(rows, network, valueColumn);
  return (
    <>
      <PageHeader title="Zone Map" subtitle="NYC taxi zone choropleth by pickup/dropoff demand or revenue." filters={filters} />
      <MapControls params={params} />
      <div className="grid gap-5">
        <InsightPanel insights={insights} />
        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <div data-tour-id="zone-map">
            <Section title="Taxi zone choropleth">
              <ZoneMap geojson={geojson as Record<string, unknown> | null} selectedZoneId={selectedZoneId} />
              {insights[0] ? <InsightCallout insight={insights[0]} /> : null}
            </Section>
          </div>
          <div className="grid gap-5">
            <div data-tour-id="zone-network">
            <Section title="Selected zone">
              {selectedDetail ? (
                <>
                  <InsightCards cards={[
                    { label: "Zone", value: selectedDetail.zone, format: "text" },
                    { label: "Trips", value: selectedDetail.trip_count },
                    { label: "Revenue", value: selectedDetail.total_revenue, format: "currency" },
                    { label: "Airport link", value: selectedDetail.airport_connection_share_pct ?? 0, format: "percent" },
                  ]} />
                  {network ? <EDonut data={network.flows} nameKey="direction" valueKey="trip_count" /> : null}
                </>
              ) : (
                <p className="text-sm text-app-text-secondary">Select a zone from the dropdown or click a zone on the map.</p>
              )}
            </Section>
            </div>
          </div>
        </div>
        {network ? (
          <div className="grid gap-5 xl:grid-cols-3">
            <Section title="Inbound origins">
              <EHorizontalBar data={network.origins} nameKey="zone" valueKey="trip_count" limit={10} />
            </Section>
            <Section title="Outbound destinations">
              <EHorizontalBar data={network.destinations} nameKey="zone" valueKey="trip_count" limit={10} />
            </Section>
            <Section title="Zone flow network">
              <ESankey data={network.links} sourceKey="source" targetKey="target" valueKey="trip_count" />
            </Section>
          </div>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <Section title="Zone ranking">
            <EHorizontalBar data={rows} nameKey="zone" valueKey={valueColumn} limit={topN} />
          </Section>
          <Section title="Top zones table">
            <SimpleTable rows={selected ? [selected] : rows.slice(0, 5)} />
          </Section>
        </div>
        <Section title="Zone metrics">
          <SimpleTable rows={rows} />
        </Section>
      </div>
    </>
  );
}
