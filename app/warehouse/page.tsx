import { SimpleTable } from "@/components/Charts";
import { EDonut, EHorizontalBar } from "@/components/InsightCharts";
import { InsightCards } from "@/components/InsightCards";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { warehouseInsights } from "@/lib/server/insights";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { warehouseCatalog } from "@/lib/server/reports";

export default async function WarehousePage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const catalog = await warehouseCatalog();
  const tableLookup = new Map<string, { type: string; count: number }>();
  (catalog.tables as Record<string, unknown>[]).forEach((row) => {
    const type = String(row.table_type ?? "unknown");
    const current = tableLookup.get(type) ?? { type, count: 0 };
    tableLookup.set(type, { ...current, count: current.count + 1 });
  });
  const tableMix = Array.from(tableLookup.values()) as Record<string, unknown>[];
  const schemaLookup = new Map<string, { data_type: string; count: number }>();
  (catalog.schema as Record<string, unknown>[]).forEach((row) => {
    const dataType = String(row.data_type ?? "unknown");
    const current = schemaLookup.get(dataType) ?? { data_type: dataType, count: 0 };
    schemaLookup.set(dataType, { ...current, count: current.count + 1 });
  });
  const schemaMix = Array.from(schemaLookup.values()) as Record<string, unknown>[];
  const latencyRows = Object.entries((catalog.benchmark ?? {}) as Record<string, { latency_ms: number }>).map(([query, value]) => ({ query, latency_ms: value.latency_ms }));
  const evaluationRows = Object.entries((catalog.evaluation ?? {}) as Record<string, Record<string, unknown>>)
    .filter(([, value]) => typeof value === "object")
    .map(([model, value]) => ({ model, ...value }));
  const insights = warehouseInsights(catalog);
  return (
    <>
      <PageHeader title="Warehouse Explorer" subtitle="Inspect DuckDB catalog, partitioned Parquet files, row counts, and benchmarks." filters={filters} />
      <div className="grid gap-5">
        <InsightPanel insights={insights} />
        <InsightCards cards={[
          { label: "Warehouse rows", value: (catalog.freshness as Record<string, unknown>).row_count },
          { label: "Partitions", value: (catalog.summary as Record<string, unknown>).partition_count },
          { label: "Catalog objects", value: (catalog.summary as Record<string, unknown>).table_count },
          { label: "Parquet size", value: (catalog.summary as Record<string, unknown>).parquet_size_mb, format: "decimal", helper: "MB" },
        ]} />
        <div className="grid gap-5 xl:grid-cols-2">
          <div data-tour-id="warehouse-partitions">
            <Section title="Rows by partition">
              <EHorizontalBar data={catalog.partitions.map((row) => ({ ...row, partition: `${row.year}-${String(row.month).padStart(2, "0")}` }))} nameKey="partition" valueKey="row_count" />
              <SimpleTable rows={catalog.partitions} />
              {insights[1] ? <InsightCallout insight={insights[1]} /> : null}
            </Section>
          </div>
          <Section title="Partition file size">
            <EHorizontalBar data={catalog.partitions.map((row) => ({ ...row, partition: `${row.year}-${String(row.month).padStart(2, "0")}` }))} nameKey="partition" valueKey="file_size_mb" />
          </Section>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          <Section title="Catalog object mix">
            <EDonut data={tableMix} nameKey="type" valueKey="count" />
          </Section>
          <Section title="Schema type mix">
            <EDonut data={schemaMix} nameKey="data_type" valueKey="count" />
          </Section>
          <div data-tour-id="warehouse-latency">
          <Section title="Query latency benchmark">
            <EHorizontalBar data={latencyRows} nameKey="query" valueKey="latency_ms" />
          </Section>
          </div>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Warehouse freshness">
            <SimpleTable rows={[catalog.freshness as Record<string, unknown>]} />
          </Section>
          <Section title="Forecast evaluation metrics">
            <SimpleTable rows={evaluationRows} />
          </Section>
        </div>
        <Section title="Table and view catalog">
          <SimpleTable rows={catalog.tables as Record<string, unknown>[]} />
        </Section>
        <Section title="Trip schema">
          <SimpleTable rows={catalog.schema as Record<string, unknown>[]} />
        </Section>
      </div>
    </>
  );
}
