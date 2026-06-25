import { BarList, SimpleTable } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { compareSegments, segmentPresets } from "@/lib/server/queries";

export default async function SegmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const left = typeof params.left === "string" ? params.left : "airport";
  const right = typeof params.right === "string" ? params.right : "non_airport";
  const comparison = await compareSegments(left, right, filters);
  return (
    <>
      <PageHeader title="Segment Comparison" subtitle="Compare two mobility segments side by side and quantify lift." filters={filters} />
      <div className="grid gap-5">
        <Section title="Segment presets">
          <SimpleTable rows={segmentPresets} />
        </Section>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title={`Left: ${left}`}>
            <SimpleTable rows={[comparison.leftMetrics]} />
          </Section>
          <Section title={`Right: ${right}`}>
            <SimpleTable rows={[comparison.rightMetrics]} />
          </Section>
        </div>
        <Section title="Segment lift">
          <SimpleTable rows={comparison.lift} />
        </Section>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Left route mix">
            <BarList data={comparison.leftRoutes.map((row) => ({ ...row, route: `${row.pickup_zone} -> ${row.dropoff_zone}` }))} nameKey="route" valueKey="trip_count" />
          </Section>
          <Section title="Right route mix">
            <BarList data={comparison.rightRoutes.map((row) => ({ ...row, route: `${row.pickup_zone} -> ${row.dropoff_zone}` }))} nameKey="route" valueKey="trip_count" />
          </Section>
        </div>
      </div>
    </>
  );
}

