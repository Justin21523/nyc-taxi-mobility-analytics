import { SimpleTable } from "@/components/Charts";
import { EBubble, EComposedSeries, ERadar } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { RouteSwitcher } from "@/components/DrilldownControls";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { routeDetail, routeFareDistribution, routeHourlyDemand, routes, tripSearch } from "@/lib/server/queries";

export default async function RouteDrilldownPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const fallback = await routes(filters, 1);
  const first = fallback[0] as Record<string, unknown> | undefined;
  const [routePickup, routeDropoff] = typeof params.route === "string" ? params.route.split("|||") : ["", ""];
  const pickupZone = routePickup || (typeof params.pickupZone === "string" ? params.pickupZone : String(first?.pickup_zone ?? ""));
  const dropoffZone = routeDropoff || (typeof params.dropoffZone === "string" ? params.dropoffZone : String(first?.dropoff_zone ?? ""));
  const [detail, hourly, fares, trips] = await Promise.all([
    routeDetail(pickupZone, dropoffZone, filters),
    routeHourlyDemand(pickupZone, dropoffZone, filters),
    routeFareDistribution(pickupZone, dropoffZone, filters),
    tripSearch(filters, { pickupZone, dropoffZone, limit: 25 }),
  ]);
  const route = detail.route as Record<string, unknown>;
  const system = detail.system as Record<string, unknown>;
  const routeFare = Number(route.avg_total_amount ?? 0);
  const systemFare = Number(system.avg_total_amount ?? 0);
  const insights = [
    {
      titleEn: routeFare >= systemFare ? "Selected route is above system fare average" : "Selected route is below system fare average",
      titleZh: routeFare >= systemFare ? "此路線高於系統平均車資" : "此路線低於系統平均車資",
      observationEn: `${pickupZone} to ${dropoffZone} averages ${routeFare.toFixed(2)} vs system ${systemFare.toFixed(2)}.`,
      observationZh: `${pickupZone} 到 ${dropoffZone} 平均車資為 ${routeFare.toFixed(2)}，系統平均為 ${systemFare.toFixed(2)}。`,
      whyItMattersEn: "Route fare premium helps separate high-value corridors from high-volume corridors.",
      whyItMattersZh: "路線車資溢價能區分高價值走廊與高流量走廊。",
      nextStepEn: "Check fare distribution to see whether the average is broad-based or outlier-driven.",
      nextStepZh: "下一步查看車資分布，確認平均值是否由離群值推動。",
      severity: routeFare >= systemFare ? "positive" as const : "info" as const,
    },
    {
      titleEn: "Hourly pattern explains when the route matters",
      titleZh: "小時模式解釋路線何時重要",
      observationEn: `The route hourly chart contains ${hourly.length} time point(s) under current filters.`,
      observationZh: `目前篩選下，此路線小時圖包含 ${hourly.length} 個時間點。`,
      whyItMattersEn: "Time context shows whether the corridor is a steady flow or a short peak.",
      whyItMattersZh: "時間脈絡能判斷此走廊是穩定流量或短時間尖峰。",
      nextStepEn: "Use the demand page if the route peak appears unusual.",
      nextStepZh: "若路線尖峰看起來異常，下一步到 demand page 比較。",
      severity: "info" as const,
    },
  ];
  return (
    <>
      <PageHeader title="Route Drilldown" subtitle={`${pickupZone} to ${dropoffZone}: route-level mobility, fares, and trip samples.`} filters={filters} />
      <RouteSwitcher filters={filters} current={`${pickupZone}|||${dropoffZone}`} />
      <div className="grid gap-5">
        <InsightPanel insights={insights} />
        <div className="grid gap-5 xl:grid-cols-2">
          <div data-tour-id="route-drilldown">
          <Section title="Selected route">
            <SimpleTable rows={[detail.route as Record<string, unknown>]} />
          </Section>
          </div>
          <Section title="System comparison under filters">
            <ERadar data={[{ segment: "Route", ...(detail.route as Record<string, unknown>) }, { segment: "System", ...(detail.system as Record<string, unknown>) }]} nameKey="segment" metrics={["trip_count", "total_revenue", "avg_total_amount", "avg_distance", "avg_tip_rate_pct"]} />
          </Section>
        </div>
        <Section title="Route hourly demand">
          <EComposedSeries data={hourly} xKey="pickup_hour" series={[{ key: "trip_count", type: "area" }]} />
        </Section>
        <Section title="Route fare distribution">
          <EBubble data={fares.map((row, index) => ({ ...row, trip: `Trip ${index + 1}` }))} xKey="trip_distance" yKey="total_amount" sizeKey="tip_amount" nameKey="trip" />
          {insights[0] ? <InsightCallout insight={insights[0]} /> : null}
        </Section>
        <Section title="Sample trips on selected route">
          <SimpleTable rows={trips} />
        </Section>
      </div>
    </>
  );
}
