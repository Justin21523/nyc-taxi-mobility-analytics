"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { FilterChips, SearchableSelect, optionsFromStrings } from "@/components/Controls";
import { useLocale } from "@/lib/client/i18n";

type FilterOptions = {
  boroughs: string[];
  paymentTypes: string[];
  minDate: string;
  maxDate: string;
};

export function FilterBar({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value || value === "All" || value === "0" || value === "false") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  function setDatePreset(value: string) {
    const next = new URLSearchParams(params);
    if (value === "all") {
      next.delete("startDate");
      next.delete("endDate");
    } else if (value === "latest") {
      next.set("startDate", options.maxDate);
      next.set("endDate", options.maxDate);
    } else if (value === "first") {
      next.set("startDate", options.minDate);
      next.set("endDate", options.minDate);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <>
      <section className="ui-panel mb-3 rounded-lg p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-app-text-primary">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-primary-soft text-brand-primary-active">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <div>{t("Global filters")}</div>
            <div className="text-xs font-normal text-app-text-muted">{t("Applies to dashboard charts, exports, and saved views.")}</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-8">
          <SearchableSelect
            label="Date preset"
            value="default"
            options={[
              { value: "default", label: "Custom range" },
              { value: "all", label: "All dates" },
              { value: "latest", label: "Latest day" },
              { value: "first", label: "First day" },
            ]}
            onChange={setDatePreset}
          />
          <label className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
            {t("Start")}
            <input className="ui-input mt-1 w-full rounded-md px-2 py-2 text-sm" type="date" defaultValue={searchParams.get("startDate") ?? options.minDate} onChange={(event) => setParam("startDate", event.target.value)} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
            {t("End")}
            <input className="ui-input mt-1 w-full rounded-md px-2 py-2 text-sm" type="date" defaultValue={searchParams.get("endDate") ?? options.maxDate} onChange={(event) => setParam("endDate", event.target.value)} />
          </label>
          <SearchableSelect label="Pickup borough" value={searchParams.get("pickupBorough") ?? "All"} options={optionsFromStrings(options.boroughs)} onChange={(value) => setParam("pickupBorough", value)} />
          <SearchableSelect label="Dropoff borough" value={searchParams.get("dropoffBorough") ?? "All"} options={optionsFromStrings(options.boroughs)} onChange={(value) => setParam("dropoffBorough", value)} />
          <SearchableSelect label="Payment" value={searchParams.get("paymentType") ?? "All"} options={optionsFromStrings(options.paymentTypes)} onChange={(value) => setParam("paymentType", value)} />
          <SearchableSelect
            label="Min distance"
            value={searchParams.get("minDistance") ?? "0"}
            options={[
              { value: "0", label: "Any distance" },
              { value: "1", label: "1+ miles" },
              { value: "2", label: "2+ miles" },
              { value: "5", label: "5+ miles" },
              { value: "10", label: "10+ miles" },
            ]}
            onChange={(value) => setParam("minDistance", value)}
          />
          <label className="ui-input flex min-h-10 items-end gap-2 rounded-md px-3 py-2 text-sm font-medium text-app-text-secondary">
            <input className="accent-brand-primary" type="checkbox" defaultChecked={searchParams.get("airportOnly") === "true"} onChange={(event) => setParam("airportOnly", String(event.target.checked))} />
            {t("Airport only")}
          </label>
        </div>
      </section>
      <FilterChips
        labels={{
          startDate: searchParams.get("startDate"),
          endDate: searchParams.get("endDate"),
          pickupBorough: searchParams.get("pickupBorough"),
          dropoffBorough: searchParams.get("dropoffBorough"),
          paymentType: searchParams.get("paymentType"),
          minDistance: searchParams.get("minDistance"),
          airportOnly: searchParams.get("airportOnly") === "true",
        }}
      />
    </>
  );
}
