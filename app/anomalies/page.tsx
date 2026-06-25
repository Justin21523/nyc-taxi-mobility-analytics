import { BarList, LinkedTable, SimpleTable } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { anomalyDetail, anomalyRows } from "@/lib/server/queries";

export default async function AnomaliesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const anomalies = await anomalyRows(filters);
  const selectedHour = typeof params.hour === "string" ? params.hour : String(anomalies[0]?.pickup_hour ?? "");
  const detail = selectedHour ? await anomalyDetail(selectedHour, filters) : null;
  return (
    <>
      <PageHeader title="Anomaly Investigation" subtitle="Investigate abnormal demand hours, affected zones, route mix, and revenue impact." filters={filters} />
      <div className="grid gap-5">
        <Section title="Anomaly hours">
          <LinkedTable rows={anomalies.map((row) => ({ ...row, __href: `/anomalies?hour=${encodeURIComponent(String(row.pickup_hour))}` }))} label="Investigate" />
        </Section>
        {detail ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <Section title="Selected anomaly summary">
              <SimpleTable rows={[detail.summary, detail.previous24h, detail.sameHourYesterday]} />
            </Section>
            <Section title="Affected zones">
              <BarList data={detail.affectedZones} nameKey="pickup_zone" valueKey="trip_count" />
            </Section>
            <section className="xl:col-span-2">
              <Section title="Affected routes">
                <SimpleTable rows={detail.affectedRoutes} />
              </Section>
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
}
