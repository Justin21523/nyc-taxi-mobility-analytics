"use client";

import Link from "next/link";
import { Activity, BarChart3, Bookmark, CarTaxiFront, Database, FlaskConical, Gauge, GitBranch, Map, Plane, Route, Search, ShieldCheck, Siren, Split, WalletCards } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { stripBasePath } from "@/lib/client/basePath";
import { moduleForPath, moduleTones, type ModuleKey } from "@/lib/client/theme";
import { LocaleToggle, useLocale } from "@/lib/client/i18n";

const navItems = [
  { href: "/", label: "Overview", icon: Gauge, module: "dashboard" },
  { href: "/demand", label: "Demand", icon: Activity, module: "analysis" },
  { href: "/zones-routes", label: "Zones & Routes", icon: Route, module: "analysis" },
  { href: "/airports", label: "Airports", icon: Plane, module: "analysis" },
  { href: "/segments", label: "Segments", icon: Split, module: "analysis" },
  { href: "/anomalies", label: "Anomalies", icon: Siren, module: "analysis" },
  { href: "/data-quality", label: "Data Quality", icon: ShieldCheck, module: "dataQuality" },
  { href: "/journey", label: "Pipeline Journey", icon: GitBranch, module: "analysis" },
  { href: "/warehouse", label: "Warehouse", icon: Database, module: "dataQuality" },
  { href: "/scenario", label: "Scenario", icon: FlaskConical, module: "analysis" },
  { href: "/saved-views", label: "Saved Views", icon: Bookmark, module: "dashboard" },
  { href: "/fares-tips", label: "Fares & Tips", icon: WalletCards, module: "analysis" },
  { href: "/trips", label: "Trip Explorer", icon: Search, module: "analysis" },
  { href: "/forecast", label: "Forecast Lab", icon: BarChart3, module: "mlModels" },
  { href: "/map", label: "Zone Map", icon: Map, module: "analysis" },
] satisfies { href: string; label: string; icon: typeof Gauge; module: ModuleKey }[];

const groups = [
  { label: "Explore", items: navItems.slice(0, 6) },
  { label: "Platform", items: navItems.slice(6, 11) },
  { label: "Analysis Tools", items: navItems.slice(11) },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const appPathname = stripBasePath(pathname);
  const { t } = useLocale();
  const activeModule = moduleTones[moduleForPath(appPathname)];
  return (
    <div className="min-h-screen text-app-text-primary">
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-app-border bg-app-surface-elevated/95 shadow-[8px_0_30px_rgb(15_23_42/4%)] lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-app-border px-5">
          <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: activeModule.soft, color: activeModule.text }}>
            <CarTaxiFront className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-app-text-primary">NYC Taxi Mobility</div>
            <div className="text-xs text-app-text-muted">{t("Analytics Platform")}</div>
          </div>
        </div>
        <div className="border-b border-app-border px-5 py-3">
          <LocaleToggle />
        </div>
        <nav className="space-y-5 px-3 py-4 pb-32">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-app-text-muted">{t(group.label)}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.href === "/" ? appPathname === "/" : appPathname.startsWith(item.href);
                  const tone = moduleTones[item.module];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition"
                      style={{
                        background: active ? tone.soft : "transparent",
                        color: active ? tone.text : "var(--color-text-secondary)",
                        border: active ? `1px solid ${tone.border}` : "1px solid transparent",
                      }}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md transition" style={{ background: active ? "#fff" : tone.soft, color: tone.text }}>
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span>{t(item.label)}</span>
                      {active ? <span className="absolute right-2 h-5 w-1 rounded-full" style={{ background: tone.solid }} /> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
