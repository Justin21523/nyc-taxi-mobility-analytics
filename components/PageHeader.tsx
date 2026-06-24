import { FilterBar } from "@/components/FilterBar";
import { KpiCards } from "@/components/KpiCards";
import { filterOptions, overview } from "@/lib/server/queries";
import type { Filters } from "@/lib/server/filters";

export async function PageHeader({ title, subtitle, filters }: { title: string; subtitle: string; filters: Filters }) {
  const [options, metrics] = await Promise.all([filterOptions(), overview(filters)]);
  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </header>
      <FilterBar options={options} />
      <KpiCards overview={metrics} />
    </>
  );
}

