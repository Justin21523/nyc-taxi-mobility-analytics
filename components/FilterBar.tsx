"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";

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

  return (
    <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <SlidersHorizontal className="h-4 w-4 text-teal-700" />
        Filters
      </div>
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        <label className="text-xs font-medium text-slate-600">
          Start
          <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm" type="date" defaultValue={searchParams.get("startDate") ?? options.minDate} onChange={(event) => setParam("startDate", event.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          End
          <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm" type="date" defaultValue={searchParams.get("endDate") ?? options.maxDate} onChange={(event) => setParam("endDate", event.target.value)} />
        </label>
        <Select label="Pickup borough" value={searchParams.get("pickupBorough") ?? "All"} options={["All", ...options.boroughs]} onChange={(value) => setParam("pickupBorough", value)} />
        <Select label="Dropoff borough" value={searchParams.get("dropoffBorough") ?? "All"} options={["All", ...options.boroughs]} onChange={(value) => setParam("dropoffBorough", value)} />
        <Select label="Payment" value={searchParams.get("paymentType") ?? "All"} options={["All", ...options.paymentTypes]} onChange={(value) => setParam("paymentType", value)} />
        <label className="text-xs font-medium text-slate-600">
          Min distance
          <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm" type="number" min="0" step="0.5" defaultValue={searchParams.get("minDistance") ?? "0"} onChange={(event) => setParam("minDistance", event.target.value)} />
        </label>
        <label className="flex items-end gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
          <input type="checkbox" defaultChecked={searchParams.get("airportOnly") === "true"} onChange={(event) => setParam("airportOnly", String(event.target.checked))} />
          Airport only
        </label>
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-medium text-slate-600">
      {label}
      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

