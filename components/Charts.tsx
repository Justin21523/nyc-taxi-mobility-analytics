"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { chartGridColor, chartPalette } from "@/lib/client/theme";
import { numberValue } from "@/lib/client/format";
import { useLocale } from "@/lib/client/i18n";

type Row = Record<string, unknown>;

export function TimeSeriesChart({ data, keys }: { data: Row[]; keys: string[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
          <XAxis dataKey="pickup_hour" tick={{ fontSize: 11 }} minTickGap={36} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {keys.map((key, index) => (
            <Line key={key} type="monotone" dataKey={key} stroke={chartPalette[index % chartPalette.length]} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarList({ data, nameKey, valueKey }: { data: Row[]; nameKey: string; valueKey: string }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 11 }} width={120} />
          <Tooltip />
          <Bar dataKey={valueKey} fill={chartPalette[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FareScatter({ data }: { data: Row[] }) {
  const { t } = useLocale();
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
          <XAxis type="number" dataKey="trip_distance" name={t("Distance")} tick={{ fontSize: 11 }} />
          <YAxis type="number" dataKey="total_amount" name={t("Fare")} tick={{ fontSize: 11 }} />
          <ZAxis type="number" dataKey="tip_amount" range={[40, 180]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data} fill={chartPalette[1]} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HeatmapTable({ rows, xKey, yKey, valueKey }: { rows: Row[]; xKey: string; yKey: string; valueKey: string }) {
  const { t } = useLocale();
  const xValues = Array.from(new Set(rows.map((row) => String(row[xKey])))).sort((a, b) => Number(a) - Number(b));
  const yValues = Array.from(new Set(rows.map((row) => String(row[yKey]))));
  const lookup = new Map(rows.map((row) => [`${row[yKey]}::${row[xKey]}`, numberValue(row[valueKey])]));
  const max = Math.max(1, ...Array.from(lookup.values()));
  return (
    <div className="overflow-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-app-surface-muted p-2 text-left font-semibold text-app-text-secondary">{t(yKey.replaceAll("_", " "))}</th>
            {xValues.map((x) => (
              <th key={x} className="p-2 text-right font-semibold text-app-text-secondary">{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yValues.map((y) => (
            <tr key={y}>
              <td className="sticky left-0 bg-app-surface-muted p-2 font-medium text-app-text-secondary">{y}</td>
              {xValues.map((x) => {
                const value = lookup.get(`${y}::${x}`) ?? 0;
                const intensity = value / max;
                return (
                  <td key={x} className="p-2 text-right" style={{ backgroundColor: `rgb(255 ${Math.round(245 - 120 * intensity)} ${Math.round(210 - 120 * intensity)})` }}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SimpleTable({ rows, columns }: { rows: Row[]; columns?: string[] }) {
  const { t } = useLocale();
  const resolvedColumns = columns ?? Object.keys(rows[0] ?? {});
  return (
    <div className="overflow-auto rounded-md border border-app-border">
      <table className="ui-table min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-app-border">
            {resolvedColumns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide">{t(column.replaceAll("_", " "))}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="border-b border-app-border/60">
              {resolvedColumns.map((column) => (
                <td key={column} className="whitespace-nowrap px-3 py-2 text-app-text-secondary">{String(row[column] ?? "")}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className="px-3 py-8 text-center text-sm text-app-text-muted" colSpan={Math.max(1, resolvedColumns.length)}>{t("No rows match the current filters.")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function LinkedTable({ rows, columns, label = "Open" }: { rows: Row[]; columns?: string[]; label?: string }) {
  const { t } = useLocale();
  const resolvedColumns = columns ?? Object.keys(rows[0] ?? {}).filter((column) => !column.startsWith("__"));
  return (
    <div className="overflow-auto rounded-md border border-app-border">
      <table className="ui-table min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-app-border">
            {resolvedColumns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide">{t(column.replaceAll("_", " "))}</th>
            ))}
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">{t("Detail")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="border-b border-app-border/60">
              {resolvedColumns.map((column) => (
                <td key={column} className="whitespace-nowrap px-3 py-2 text-app-text-secondary">{String(row[column] ?? "")}</td>
              ))}
              <td className="whitespace-nowrap px-3 py-2">
                <Link className="font-medium text-brand-primary hover:text-brand-primary-active" href={String(row.__href ?? "#")}>{t(label)}</Link>
              </td>
            </tr>
          )) : (
            <tr>
              <td className="px-3 py-8 text-center text-sm text-app-text-muted" colSpan={Math.max(1, resolvedColumns.length + 1)}>{t("No rows match the current filters.")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function MetricBars({ data, nameKey, valueKey }: { data: Row[]; nameKey: string; valueKey: string }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={valueKey}>
            {data.map((_, index) => (
              <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
