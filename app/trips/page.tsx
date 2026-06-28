import { SimpleTable } from "@/components/Charts";
import { InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { TripExplorerControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { tripSearch } from "@/lib/server/queries";

export const dynamic = "force-static";

export default async function TripsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const fareBucket = typeof params.fareBucket === "string" ? params.fareBucket : "default";
  const [minFare, maxFare] = fareBucket !== "default" ? fareBucket.split("-").map(Number) : [null, null];
  const rows = await tripSearch(filters, {
    limit: Number(params.limit ?? 100),
    pickupZone: typeof params.pickupZone === "string" ? params.pickupZone : null,
    dropoffZone: typeof params.dropoffZone === "string" ? params.dropoffZone : null,
    minFare: params.minFare ? Number(params.minFare) : minFare,
    maxFare: params.maxFare ? Number(params.maxFare) : maxFare,
    sortBy: typeof params.sortBy === "string" ? params.sortBy : "pickup_datetime",
    sortDir: typeof params.sortDir === "string" ? params.sortDir : "desc",
  });
  const first = rows[0] as Record<string, unknown> | undefined;
  const insights = [
    {
      titleEn: "Trip Explorer validates aggregate patterns",
      titleZh: "Trip Explorer 用明細驗證彙總趨勢",
      observationEn: `The current explorer returns ${rows.length} trip-level sample row(s).`,
      observationZh: `目前明細探索器回傳 ${rows.length} 筆 sample 行程。`,
      whyItMattersEn: "Trip samples help explain whether an aggregate insight is driven by real rows or outliers.",
      whyItMattersZh: "明細樣本能協助判斷彙總洞察是否由真實行程或離群值造成。",
      nextStepEn: "Sort by fare, distance, or pickup time to audit the current filter result.",
      nextStepZh: "下一步依車資、距離或上車時間排序，審核目前篩選結果。",
      severity: "info" as const,
    },
    {
      titleEn: "Latest visible trip anchors the sample",
      titleZh: "最新可見行程提供樣本錨點",
      observationEn: `The first row pickup time is ${String(first?.pickup_datetime ?? "n/a")}.`,
      observationZh: `第一筆行程上車時間為 ${String(first?.pickup_datetime ?? "n/a")}。`,
      whyItMattersEn: "A visible timestamp makes it easier to connect records with freshness and partitions.",
      whyItMattersZh: "可見時間戳能把明細資料和 freshness、partition 連起來。",
      nextStepEn: "Export the current trip CSV when you need a reproducible audit sample.",
      nextStepZh: "需要可重現稽核樣本時，下一步匯出目前 trip CSV。",
      severity: "info" as const,
    },
  ];
  return (
    <>
      <PageHeader title="Trip Explorer" subtitle="Sortable trip-level sample with the global filters applied." filters={filters} />
      <TripExplorerControls params={params} />
      <InsightPanel insights={insights} />
      <div data-tour-id="trips-table">
      <Section title="Trips">
        <SimpleTable rows={rows} />
      </Section>
      </div>
    </>
  );
}
