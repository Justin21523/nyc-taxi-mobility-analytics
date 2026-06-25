import { SimpleTable } from "@/components/Charts";
import { EComposedSeries, EHorizontalBar } from "@/components/InsightCharts";
import { InsightCallout, InsightPanel } from "@/components/Insights";
import { PageHeader } from "@/components/PageHeader";
import { ForecastControls } from "@/components/PageControls";
import { Section } from "@/components/Section";
import { forecastInsights } from "@/lib/server/insights";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { forecast, forecastMetrics } from "@/lib/server/queries";

export default async function ForecastPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const horizon = Number(params.horizon ?? 24);
  const window = Number(params.window ?? 24);
  const chartMetric = typeof params.chartMetric === "string" ? params.chartMetric : "all";
  const [rows, metrics] = await Promise.all([forecast(filters, horizon, window), forecastMetrics(filters, window)]);
  const series = chartMetric === "all"
    ? ["actual", "naive_forecast", "moving_average_forecast", "seasonal_naive_forecast"]
    : ["actual", chartMetric];
  const insights = forecastInsights(metrics, rows, horizon, window);
  return (
    <>
      <PageHeader title="Forecast Lab" subtitle="Compare naive, moving average, and seasonal naive demand baselines." filters={filters} />
      <ForecastControls params={params} />
      <div className="grid gap-5">
        <InsightPanel insights={insights} />
        <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
          <div data-tour-id="forecast-evaluation">
            <Section title="Model comparison">
              <EHorizontalBar data={metrics.map((row) => ({ ...row, metric_label: row.model }))} nameKey="metric_label" valueKey="mae" />
              <SimpleTable rows={metrics} />
              {insights[0] ? <InsightCallout insight={insights[0]} /> : null}
            </Section>
          </div>
          <div data-tour-id="forecast-chart">
          <Section title="Actual vs forecast baselines">
            <EComposedSeries data={rows.slice(-336)} xKey="pickup_hour" series={series.map((key) => ({ key, type: key === "actual" ? "bar" as const : "line" as const }))} />
          </Section>
          </div>
        </div>
        <Section title="Forecast rows">
          <SimpleTable rows={rows.slice(-24)} />
        </Section>
      </div>
    </>
  );
}
