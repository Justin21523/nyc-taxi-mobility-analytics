import { LinkedTable, SimpleTable } from "@/components/Charts";
import { EBubble, EComposedSeries, ESankey, EStackedBar } from "@/components/InsightCharts";
import { InsightCards } from "@/components/InsightCards";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { AnomalyControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { anomalyInsights } from "@/lib/server/insights";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { anomalyDetail, anomalyRows } from "@/lib/server/queries";

export const dynamic = "force-static";

export default async function AnomaliesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const anomalies = await anomalyRows(filters);
  const selectedHour = typeof params.hour === "string" ? params.hour : String(anomalies[0]?.pickup_hour ?? "");
  const detail = selectedHour ? await anomalyDetail(selectedHour, filters) : null;
  const selected = anomalies.find((row) => String(row.pickup_hour) === selectedHour) ?? anomalies[0];
  const insights = anomalyInsights(anomalies, selected, detail);
  return (
    <>
      <PageHeader title="Anomaly Investigation" subtitle="Investigate abnormal demand hours, affected zones, route mix, and revenue impact." filters={filters} />
      {anomalies.length ? <AnomalyControls params={params} anomalies={anomalies} /> : null}
      <div className="grid gap-5">
        <InsightPanel insights={insights} />
        {selected ? (
          <InsightCards cards={[
            { label: "Anomaly hours", value: anomalies.length },
            { label: "Selected severity", value: selected.severity_score, format: "decimal" },
            { label: "Actual trips", value: selected.actual_trip_count },
            { label: "Expected trips", value: selected.expected_trip_count, format: "decimal" },
          ]} />
        ) : (
          <Section title="No anomalies under current filters">
            <p className="text-sm text-app-text-secondary">The rolling baseline did not flag abnormal demand for this filter set. Try widening the date range or clearing filters.</p>
          </Section>
        )}
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div data-tour-id="anomaly-table">
          <Section title="Anomaly hours">
            <LinkedTable rows={anomalies.map((row) => ({ ...row, __href: `/anomalies?hour=${encodeURIComponent(String(row.pickup_hour))}` }))} label="Investigate" />
            {insights[1] ? <InsightCallout insight={insights[1]} /> : null}
          </Section>
          </div>
          <Section title="Actual vs expected">
            <EBubble data={anomalies} xKey="expected_trip_count" yKey="actual_trip_count" sizeKey="severity_score" nameKey="pickup_hour" />
          </Section>
        </div>
        {detail ? (
          <div className="grid gap-5">
            <Section title="Selected anomaly summary">
              <EComposedSeries
                data={[
                  { period: "Selected hour", ...(detail.summary as Record<string, unknown>) },
                  { period: "Previous 24h", ...(detail.previous24h as Record<string, unknown>) },
                  { period: "Same hour yesterday", ...(detail.sameHourYesterday as Record<string, unknown>) },
                ]}
                xKey="period"
                series={[{ key: "trip_count", type: "bar" }, { key: "total_revenue", type: "line" }]}
              />
              <SimpleTable rows={[detail.summary, detail.previous24h, detail.sameHourYesterday]} />
            </Section>
            <div className="grid gap-5 xl:grid-cols-2">
              <div data-tour-id="anomaly-detail">
              <Section title="Affected zones">
                <EStackedBar data={detail.affectedZones} xKey="pickup_zone" seriesKeys={["trip_count", "total_revenue"]} />
              </Section>
              </div>
              <Section title="Affected routes">
                <ESankey data={detail.affectedRoutes} sourceKey="pickup_zone" targetKey="dropoff_zone" valueKey="trip_count" />
                <SimpleTable rows={detail.affectedRoutes} />
              </Section>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
