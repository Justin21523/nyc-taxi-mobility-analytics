import Link from "next/link";

import { SavedViewForm } from "@/components/SavedViewForm";
import { Section } from "@/components/Section";
import { listSavedViews } from "@/lib/server/savedViews";

export default async function SavedViewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const currentPath = typeof params.path === "string" ? params.path : "/";
  const views = await listSavedViews();
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-950">Saved Views</h1>
        <p className="mt-1 text-sm text-slate-600">Save, reopen, and share URL-based dashboard states.</p>
      </header>
      <Section title="Save a view">
        <SavedViewForm currentPath={currentPath} />
      </Section>
      <Section title="Saved views">
        <div className="grid gap-2">
          {views.map((view) => (
            <div key={view.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
              <div>
                <div className="font-medium text-slate-900">{view.name}</div>
                <div className="text-slate-500">{view.path}</div>
              </div>
              <Link className="font-medium text-teal-700" href={view.path}>Open</Link>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

