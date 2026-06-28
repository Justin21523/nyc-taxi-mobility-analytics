import { SimpleTable } from "@/components/Charts";
import { EDonut, EHorizontalBar } from "@/components/InsightCharts";
import { InsightCards } from "@/components/InsightCards";
import { InsightPanel } from "@/components/Insights";
import { SavedViewActions } from "@/components/SavedViewActions";
import { SavedViewForm } from "@/components/SavedViewForm";
import { Section } from "@/components/Section";
import { savedViewsInsights } from "@/lib/server/insights";
import { listSavedViews } from "@/lib/server/savedViews";

export const dynamic = "force-static";

export default async function SavedViewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const currentPath = typeof params.path === "string" ? params.path : "/";
  const views = await listSavedViews();
  const grouped = new Map<string, number>();
  views.forEach((view) => {
    const area = view.path.split("?")[0] || "/";
    grouped.set(area, (grouped.get(area) ?? 0) + 1);
  });
  const groupedRows = Array.from(grouped.entries()).map(([area, count]) => ({ area, count }));
  const latest = views[0];
  const insights = savedViewsInsights(views, groupedRows, latest);
  return (
    <div className="grid gap-5">
      <header className="ui-panel rounded-lg p-5">
        <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Dashboard</div>
        <h1 className="mt-3 text-2xl font-semibold text-app-text-primary">Saved Views</h1>
        <p className="mt-1 text-sm text-app-text-secondary">Save, reopen, and share URL-based dashboard states.</p>
      </header>
      <Section title="Save a view">
        <SavedViewForm currentPath={currentPath} />
      </Section>
      <InsightPanel insights={insights} />
      <InsightCards cards={[
        { label: "Saved views", value: views.length },
        { label: "Dashboard areas", value: groupedRows.length },
        { label: "Latest saved", value: latest ? new Date(latest.createdAt).toLocaleDateString("en-US") : "None", format: "text" },
        { label: "Current target", value: currentPath, format: "text" },
      ]} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Saved view destination mix">
          <EDonut data={groupedRows} nameKey="area" valueKey="count" />
        </Section>
        <Section title="Most used dashboard areas">
          <EHorizontalBar data={groupedRows} nameKey="area" valueKey="count" />
        </Section>
      </div>
      <Section title="Quick presets">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {[
            { name: "Airport operations", path: "/airports?airportZone=All&topN=15" },
            { name: "Demand anomalies", path: "/anomalies" },
            { name: "Zone network", path: "/map?kind=pickup&valueColumn=trip_count&zoneId=4" },
            { name: "Revenue routes", path: "/zones-routes?orderBy=total_revenue&chartMetric=total_revenue" },
          ].map((preset) => (
            <div key={preset.path} className="ui-card ui-card-hover rounded-md p-3 text-sm">
              <div className="font-semibold text-app-text-primary">{preset.name}</div>
              <div className="mt-1 break-all text-xs text-app-text-muted">{preset.path}</div>
              <SavedViewActions id="" path={preset.path} />
            </div>
          ))}
        </div>
      </Section>
      <div data-tour-id="saved-views">
      <Section title="Saved views">
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {views.map((view) => (
            <div key={view.id} className="ui-card ui-card-hover rounded-md p-3 text-sm">
              <div>
                <div className="font-medium text-app-text-primary">{view.name}</div>
                <div className="mt-1 break-all text-app-text-muted">{view.path}</div>
                <div className="mt-1 text-xs text-app-text-muted">{new Date(view.createdAt).toLocaleString("en-US")}</div>
              </div>
              <div className="mt-3">
                <SavedViewActions id={view.id} path={view.path} />
              </div>
            </div>
          ))}
        </div>
        <SimpleTable rows={views} />
      </Section>
      </div>
    </div>
  );
}
