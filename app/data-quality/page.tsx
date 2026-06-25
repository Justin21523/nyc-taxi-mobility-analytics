import { SimpleTable } from "@/components/Charts";
import { EDonut, EHorizontalBar } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { warehouseCatalog } from "@/lib/server/reports";

export default async function DataQualityPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await filtersFromSearchParams(searchParams);
  const catalog = await warehouseCatalog();
  const checks = (catalog.dataQuality as { checks?: Record<string, unknown>[] } | null)?.checks ?? [];
  const statusLookup = new Map<string, { status: string; count: number }>();
  checks.forEach((row) => {
    const status = row.passed ? "passed" : "failed";
    const current = statusLookup.get(status) ?? { status, count: 0 };
    statusLookup.set(status, { ...current, count: current.count + 1 });
  });
  const statusMix = Array.from(statusLookup.values()) as Record<string, unknown>[];
  const latencyRows = Object.entries((catalog.benchmark ?? {}) as Record<string, { latency_ms: number }>).map(([query, value]) => ({ query, latency_ms: value.latency_ms }));
  const failedChecks = statusLookup.get("failed")?.count ?? 0;
  const slowest = [...latencyRows].sort((a, b) => b.latency_ms - a.latency_ms)[0];
  const insights = [
    {
      titleEn: failedChecks ? "Data quality needs attention" : "Data quality checks are passing",
      titleZh: failedChecks ? "資料品質需要處理" : "資料品質檢查通過",
      observationEn: `${failedChecks} check(s) are failing out of ${checks.length}.`,
      observationZh: `目前 ${checks.length} 個檢查中有 ${failedChecks} 個未通過。`,
      whyItMattersEn: "Quality status tells users whether dashboard numbers are trustworthy.",
      whyItMattersZh: "品質狀態會影響使用者是否能信任儀表板數據。",
      nextStepEn: "Inspect failed checks before using downstream analytics.",
      nextStepZh: "下一步先檢查未通過項目，再使用下游分析。",
      severity: failedChecks ? "warning" as const : "positive" as const,
    },
    {
      titleEn: "Freshness defines the valid analysis window",
      titleZh: "新鮮度定義可分析期間",
      observationEn: `Latest pickup time is ${String((catalog.freshness as Record<string, unknown>)?.latest_pickup_datetime ?? "n/a")}.`,
      observationZh: `最新上車時間為 ${String((catalog.freshness as Record<string, unknown>)?.latest_pickup_datetime ?? "n/a")}。`,
      whyItMattersEn: "Freshness prevents users from mistaking sample data for current operations.",
      whyItMattersZh: "新鮮度可避免使用者把 sample data 誤解為即時營運資料。",
      nextStepEn: "Run ingestion again if the latest partition is missing.",
      nextStepZh: "若最新分區缺失，下一步重新執行 ingestion。",
      severity: "info" as const,
    },
    {
      titleEn: "Latency shows which query path is most expensive",
      titleZh: "延遲指出最昂貴的查詢路徑",
      observationEn: slowest ? `${slowest.query} is the slowest benchmark at ${slowest.latency_ms} ms.` : "No benchmark rows are available.",
      observationZh: slowest ? `${slowest.query} 是目前最慢 benchmark，約 ${slowest.latency_ms} ms。` : "目前沒有 benchmark 資料。",
      whyItMattersEn: "Slow queries are candidates for pre-aggregation or caching.",
      whyItMattersZh: "慢查詢是預聚合或快取的優先候選。",
      nextStepEn: "Compare latency with warehouse partitions to identify optimization targets.",
      nextStepZh: "下一步把延遲和 warehouse partitions 一起比較，找出優化目標。",
      severity: slowest && slowest.latency_ms > 100 ? "warning" as const : "positive" as const,
    },
  ];
  return (
    <>
      <PageHeader title="Data Quality Explorer" subtitle="Pipeline quality checks, freshness, schema compatibility, and benchmark status." filters={filters} />
      <div className="grid gap-5">
        <div data-tour-id="dq-status">
          <InsightPanel insights={insights} />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
          <Section title="DQ status mix">
            <EDonut data={statusMix} nameKey="status" valueKey="count" />
          </Section>
          <div data-tour-id="dq-checks">
          <Section title="DQ checks">
            <SimpleTable rows={checks} />
          </Section>
          </div>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Freshness">
            <SimpleTable rows={[catalog.freshness as Record<string, unknown>]} />
          </Section>
          <div data-tour-id="warehouse-latency">
          <Section title="Query latency benchmark">
            <EHorizontalBar data={latencyRows} nameKey="query" valueKey="latency_ms" />
            <SimpleTable rows={latencyRows} />
            {insights[2] ? <InsightCallout insight={insights[2]} /> : null}
          </Section>
          </div>
        </div>
        <Section title="Schema compatibility">
          <SimpleTable rows={catalog.schema as Record<string, unknown>[]} />
        </Section>
      </div>
    </>
  );
}
