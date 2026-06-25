import Link from "next/link";
import { Activity, BarChart3, Bookmark, CarTaxiFront, Database, FlaskConical, Gauge, Map, Plane, Route, Search, ShieldCheck, Siren, Split, WalletCards } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Overview", icon: Gauge },
  { href: "/demand", label: "Demand", icon: Activity },
  { href: "/zones-routes", label: "Zones & Routes", icon: Route },
  { href: "/airports", label: "Airports", icon: Plane },
  { href: "/segments", label: "Segments", icon: Split },
  { href: "/anomalies", label: "Anomalies", icon: Siren },
  { href: "/data-quality", label: "Data Quality", icon: ShieldCheck },
  { href: "/warehouse", label: "Warehouse", icon: Database },
  { href: "/scenario", label: "Scenario", icon: FlaskConical },
  { href: "/saved-views", label: "Saved Views", icon: Bookmark },
  { href: "/fares-tips", label: "Fares & Tips", icon: WalletCards },
  { href: "/trips", label: "Trip Explorer", icon: Search },
  { href: "/forecast", label: "Forecast Lab", icon: BarChart3 },
  { href: "/map", label: "Zone Map", icon: Map },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <CarTaxiFront className="h-7 w-7 text-teal-700" />
          <div>
            <div className="text-sm font-semibold text-slate-950">NYC Taxi Mobility</div>
            <div className="text-xs text-slate-500">Analytics Platform</div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
