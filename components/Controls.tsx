"use client";

import { Check, ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { useLocale } from "@/lib/client/i18n";

type Option = {
  value: string;
  label: string;
  description?: string;
};

type SearchableSelectProps = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchableSelect({ label, value, options, onChange, placeholder = "Search options" }: SearchableSelectProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value) ?? options[0];
  const filtered = options.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 80);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-text-muted">{t(label)}</label>
      <button
        type="button"
        className="ui-input flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm"
        onClick={() => setOpen((next) => !next)}
      >
        <span className="truncate">{selected?.label ? t(selected.label) : "Select"}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-app-text-muted" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-2 w-full min-w-72 rounded-lg border border-app-border bg-app-surface p-2 shadow-xl">
          <div className="mb-2 flex items-center gap-2 rounded-md border border-app-border bg-app-surface-muted px-2">
            <Search className="h-4 w-4 text-app-text-muted" />
            <input
              className="h-9 w-full border-0 bg-transparent text-sm outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(placeholder)}
            />
          </div>
          <div className="max-h-72 overflow-auto">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-brand-primary-soft/60"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span>
                  <span className="block font-medium text-app-text-primary">{t(option.label)}</span>
                  {option.description ? <span className="block text-xs text-app-text-muted">{t(option.description)}</span> : null}
                </span>
                {option.value === value ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function QueryControlPanel({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <section className="ui-panel mb-5 rounded-lg p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-app-text-primary">{t("Page controls")}</h2>
          <p className="text-xs text-app-text-muted">{t("Selections update the URL, exports, and saved views.")}</p>
        </div>
        <button
          type="button"
          className="ui-button-secondary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
          onClick={() => router.push(pathname)}
        >
          <RotateCcw className="h-4 w-4" />
          {t("Reset page")}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

export function useQuerySetter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "All" || value === "default") next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };
}

export function ControlSelect({ label, param, value, options }: { label: string; param: string; value: string; options: Option[] }) {
  const setQuery = useQuerySetter();
  return <SearchableSelect label={label} value={value} options={options} onChange={(next) => setQuery(param, next)} />;
}

export function NumberStepper({ label, param, value, options }: { label: string; param: string; value: string; options: Option[] }) {
  return <ControlSelect label={label} param={param} value={value} options={options} />;
}

export function FilterChips({ labels }: { labels: Record<string, string | number | boolean | null | undefined> }) {
  const setQuery = useQuerySetter();
  const { t } = useLocale();
  const entries = Object.entries(labels).filter(([, value]) => value !== null && value !== undefined && value !== "" && value !== "All" && value !== false && value !== 0);
  if (!entries.length) return null;
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <button
          key={key}
          type="button"
          className="ui-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
          onClick={() => setQuery(key, "")}
        >
          {t(key.replaceAll("_", " "))}: {String(value)}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}

export function optionsFromStrings(values: string[], allLabel = "All"): Option[] {
  return [{ value: "All", label: allLabel }, ...values.map((value) => ({ value, label: value }))];
}
