import { SimpleTable } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { warehouseCatalog } from "@/lib/server/reports";

export default async function WarehousePage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const catalog = await warehouseCatalog();
  return (
    <>
      <PageHeader title="Warehouse Explorer" subtitle="Inspect DuckDB catalog, partitioned Parquet files, row counts, and benchmarks." filters={filters} />
      <div className="grid gap-5">
        <Section title="Warehouse freshness">
          <SimpleTable rows={[catalog.freshness as Record<string, unknown>]} />
        </Section>
        <Section title="Partitions">
          <SimpleTable rows={catalog.partitions} />
        </Section>
        <Section title="Table and view catalog">
          <SimpleTable rows={catalog.tables as Record<string, unknown>[]} />
        </Section>
      </div>
    </>
  );
}

