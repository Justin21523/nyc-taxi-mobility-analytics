import { FilterBar } from "@/components/FilterBar";
import { KpiCards } from "@/components/KpiCards";
import { LocalizedText } from "@/components/LocalizedText";
import { moduleForTitle, moduleTones, type ModuleKey } from "@/lib/client/theme";
import { filterOptions, overview } from "@/lib/server/queries";
import type { Filters } from "@/lib/server/filters";

export async function PageHeader({ title, subtitle, filters, module }: { title: string; subtitle: string; filters: Filters; module?: ModuleKey }) {
  const [options, metrics] = await Promise.all([filterOptions(), overview(filters)]);
  const tone = moduleTones[module ?? moduleForTitle(title)];
  const Icon = tone.icon;
  return (
    <>
      <header className="ui-panel mb-5 overflow-hidden rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg" style={{ background: tone.soft, color: tone.text, border: `1px solid ${tone.border}` }}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: tone.soft, color: tone.text, border: `1px solid ${tone.border}` }}>
                {tone.label}
              </div>
              <LocalizedText text={title} as="h1" className="text-2xl font-semibold text-app-text-primary" />
              <LocalizedText text={subtitle} as="p" className="mt-1 max-w-4xl text-sm leading-6 text-app-text-secondary" />
            </div>
          </div>
          <div className="hidden h-16 w-1 rounded-full sm:block" style={{ background: `linear-gradient(180deg, ${tone.solid}, var(--color-accent))` }} />
        </div>
      </header>
      <FilterBar options={options} />
      <KpiCards overview={metrics} />
    </>
  );
}
