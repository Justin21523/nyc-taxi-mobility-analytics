import { SimpleTable } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { warehouseCatalog } from "@/lib/server/reports";

export default async function DataQualityPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const catalog = await warehouseCatalog();
  const checks = (catalog.dataQuality as { checks?: Record<string, unknown>[] } | null)?.checks ?? [];
  return (
    <>
      <PageHeader title="Data Quality Explorer" subtitle="Pipeline quality checks, freshness, schema compatibility, and benchmark status." filters={filters} />
      <div className="grid gap-5">
        <Section title="DQ checks">
          <SimpleTable rows={checks} />
        </Section>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Freshness">
            <SimpleTable rows={[catalog.freshness as Record<string, unknown>]} />
          </Section>
          <Section title="Query latency benchmark">
            <SimpleTable rows={Object.entries((catalog.benchmark ?? {}) as Record<string, { latency_ms: number }>).map(([query, value]) => ({ query, latency_ms: value.latency_ms }))} />
          </Section>
        </div>
        <Section title="Schema compatibility">
          <SimpleTable rows={catalog.schema as Record<string, unknown>[]} />
        </Section>
      </div>
    </>
  );
}

