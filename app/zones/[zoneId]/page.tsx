import { SimpleTable } from "@/components/Charts";
import { EComposedSeries, EDonut, EHorizontalBar } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { ZoneSwitcher } from "@/components/DrilldownControls";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { tripSearch, zoneDetail, zoneHourlyDemand, zoneInboundOutbound, zoneTopDestinations, zoneTopOrigins } from "@/lib/server/queries";

export default async function ZoneDrilldownPage({ params, searchParams }: { params: Promise<{ zoneId: string }>; searchParams: SearchParams }) {
  const [routeParams, queryParams] = await Promise.all([params, searchParams]);
  const filters = await filtersFromSearchParams(Promise.resolve(queryParams));
  const id = Number(typeof queryParams.zonePath === "string" ? queryParams.zonePath : routeParams.zoneId);
  const [detail, flows, origins, destinations, hourly, trips] = await Promise.all([
    zoneDetail(id, filters),
    zoneInboundOutbound(id, filters),
    zoneTopOrigins(id, filters),
    zoneTopDestinations(id, filters),
    zoneHourlyDemand(id, filters),
    tripSearch(filters, { relatedZoneId: id, limit: 25 }),
  ]);
  const inbound = flows.find((row) => row.direction === "inbound");
  const outbound = flows.find((row) => row.direction === "outbound");
  const topOrigin = origins[0];
  const topDestination = destinations[0];
  const insights = [
    {
      titleEn: "Zone flow balance explains local role",
      titleZh: "區域流量平衡解釋本地角色",
      observationEn: `${detail.zone ?? id} has ${Number(inbound?.trip_count ?? 0)} inbound and ${Number(outbound?.trip_count ?? 0)} outbound trips.`,
      observationZh: `${detail.zone ?? id} 有 ${Number(inbound?.trip_count ?? 0)} 筆進入與 ${Number(outbound?.trip_count ?? 0)} 筆離開行程。`,
      whyItMattersEn: "Inbound/outbound balance shows whether the zone behaves like an origin, destination, or hub.",
      whyItMattersZh: "進出平衡可判斷區域像來源、目的地，或樞紐。",
      nextStepEn: "Compare top origins and destinations to understand the surrounding network.",
      nextStepZh: "下一步比較主要來源與目的地，理解周邊網絡。",
      severity: "info" as const,
    },
    {
      titleEn: "Connected nodes define the zone network",
      titleZh: "連結節點定義區域網絡",
      observationEn: `${String(topOrigin?.zone ?? "n/a")} is the top origin and ${String(topDestination?.zone ?? "n/a")} is the top destination.`,
      observationZh: `${String(topOrigin?.zone ?? "n/a")} 是主要來源，${String(topDestination?.zone ?? "n/a")} 是主要目的地。`,
      whyItMattersEn: "The connected-node view explains mobility relationships behind the map color.",
      whyItMattersZh: "連結節點視角能解釋地圖顏色背後的移動關係。",
      nextStepEn: "Open Zone Map to compare this node against citywide rankings.",
      nextStepZh: "下一步打開 Zone Map，和全市排名比較。",
      severity: "info" as const,
    },
  ];
  return (
    <>
      <PageHeader title={`Zone Drilldown: ${detail.zone ?? id}`} subtitle="Inbound/outbound trips, demand pattern, airport connection share, and top connected zones." filters={filters} />
      <ZoneSwitcher currentZoneId={id} />
      <div className="grid gap-5">
        <InsightPanel insights={insights} />
        <div data-tour-id="zone-drilldown">
        <Section title="Zone KPIs">
          <SimpleTable rows={[detail]} />
        </Section>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          <Section title="Inbound / outbound split">
            <EDonut data={flows} nameKey="direction" valueKey="trip_count" />
            <SimpleTable rows={flows} />
            {insights[0] ? <InsightCallout insight={insights[0]} /> : null}
          </Section>
          <Section title="Top origins">
            <EHorizontalBar data={origins} nameKey="zone" valueKey="trip_count" />
          </Section>
          <Section title="Top destinations">
            <EHorizontalBar data={destinations} nameKey="zone" valueKey="trip_count" />
          </Section>
        </div>
        <Section title="Zone hourly demand">
          <EComposedSeries data={hourly} xKey="pickup_hour" series={[{ key: "trip_count", type: "area" }]} />
        </Section>
        <Section title="Sample trips under current filters">
          <SimpleTable rows={trips} />
        </Section>
      </div>
    </>
  );
}
