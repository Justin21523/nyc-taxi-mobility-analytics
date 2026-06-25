import { SimpleTable } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { scenarioImpact } from "@/lib/server/queries";

export default async function ScenarioPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const type = typeof params.type === "string" ? params.type : "airport_demand";
  const percent = Number(params.percent ?? 10);
  const result = await scenarioImpact(type, percent, filters);
  return (
    <>
      <PageHeader title="Scenario Simulator" subtitle="Estimate trip, revenue, and tip impact for business scenarios." filters={filters} />
      <Section title="Scenario impact">
        <SimpleTable rows={[result as Record<string, unknown>]} />
      </Section>
    </>
  );
}

