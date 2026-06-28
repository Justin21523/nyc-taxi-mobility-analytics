import { SimpleTable } from "@/components/Charts";
import { EStackedBar } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { ScenarioControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { scenarioImpact } from "@/lib/server/queries";

export const dynamic = "force-static";

export default async function ScenarioPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const type = typeof params.type === "string" ? params.type : "airport_demand";
  const percent = Number(params.percent ?? 10);
  const result = await scenarioImpact(type, percent, filters);
  const revenueDelta = Number(result.estimated_revenue_delta ?? result.estimated_delta ?? 0);
  const tripDelta = Number(result.estimated_trip_delta ?? 0);
  const insights = [
    {
      titleEn: "Scenario output converts assumptions into impact",
      titleZh: "情境輸出把假設轉成影響",
      observationEn: `A ${percent}% ${type.replaceAll("_", " ")} scenario implies ${tripDelta.toFixed(1)} trip delta and ${revenueDelta.toFixed(1)} revenue delta.`,
      observationZh: `${percent}% 的 ${type.replaceAll("_", " ")} 情境，估計帶來 ${tripDelta.toFixed(1)} 筆行程變化與 ${revenueDelta.toFixed(1)} 收入變化。`,
      whyItMattersEn: "Scenario analysis makes the platform useful for planning, not just retrospective reporting.",
      whyItMattersZh: "情境分析讓平台可用於規劃，而不只是回顧報表。",
      nextStepEn: "Compare several percentages before treating the estimate as an operating target.",
      nextStepZh: "下一步比較不同百分比，再把估計值當作營運目標。",
      severity: revenueDelta >= 0 ? "positive" as const : "warning" as const,
    },
    {
      titleEn: "The estimate is directional",
      titleZh: "此估計是方向性分析",
      observationEn: "The simulator uses current filtered averages and does not model second-order effects.",
      observationZh: "模擬器使用目前篩選下的平均值，沒有建模二階效應。",
      whyItMattersEn: "This keeps the feature transparent while avoiding false precision.",
      whyItMattersZh: "這能保持透明，也避免過度精確的錯覺。",
      nextStepEn: "Use segment comparison if the scenario should apply only to one trip type.",
      nextStepZh: "若情境只適用於特定行程類型，下一步使用 segment comparison。",
      severity: "info" as const,
    },
  ];
  return (
    <>
      <PageHeader title="Scenario Simulator" subtitle="Estimate trip, revenue, and tip impact for business scenarios." filters={filters} />
      <ScenarioControls params={params} />
      <InsightPanel insights={insights} />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <div data-tour-id="scenario-impact">
        <Section title="Scenario impact">
          <SimpleTable rows={[result as Record<string, unknown>]} />
          {insights[0] ? <InsightCallout insight={insights[0]} /> : null}
        </Section>
        </div>
        <Section title="Before / after estimate">
          <EStackedBar
            data={[
              { metric: "Trips", base: Number(result.base?.trip_count ?? 0), delta: Number(result.estimated_trip_delta ?? 0) },
              { metric: "Revenue", base: Number(result.base?.total_revenue ?? 0), delta: Number(result.estimated_revenue_delta ?? result.estimated_delta ?? 0) },
              { metric: "Tips", base: 0, delta: Number(result.implied_tip_delta ?? 0) },
            ]}
            xKey="metric"
            seriesKeys={["base", "delta"]}
          />
        </Section>
      </div>
    </>
  );
}
