import { SimpleTable, TimeSeriesChart } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { filtersFromSearchParams, type SearchParams } from "@/lib/server/pageFilters";
import { forecast, forecastMetrics } from "@/lib/server/queries";

export default async function ForecastPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = await filtersFromSearchParams(Promise.resolve(params));
  const horizon = Number(params.horizon ?? 24);
  const window = Number(params.window ?? 24);
  const [rows, metrics] = await Promise.all([forecast(filters, horizon, window), forecastMetrics(filters, window)]);
  return (
    <>
      <PageHeader title="Forecast Lab" subtitle="Compare naive, moving average, and seasonal naive demand baselines." filters={filters} />
      <div className="grid gap-5">
        <Section title="Model comparison">
          <SimpleTable rows={metrics} />
        </Section>
        <Section title="Actual vs forecast baselines">
          <TimeSeriesChart data={rows.slice(-336)} keys={["actual", "naive_forecast", "moving_average_forecast", "seasonal_naive_forecast"]} />
        </Section>
      </div>
    </>
  );
}

