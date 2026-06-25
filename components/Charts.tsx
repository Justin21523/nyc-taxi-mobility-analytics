"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { numberValue } from "@/lib/client/format";

type Row = Record<string, unknown>;

export function TimeSeriesChart({ data, keys }: { data: Row[]; keys: string[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="pickup_hour" tick={{ fontSize: 11 }} minTickGap={36} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {keys.map((key, index) => (
            <Line key={key} type="monotone" dataKey={key} stroke={["#0f766e", "#f97316", "#2563eb", "#7c3aed"][index % 4]} dot={false} strokeWidth={2} />
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 11 }} width={120} />
          <Tooltip />
          <Bar dataKey={valueKey} fill="#0f766e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FareScatter({ data }: { data: Row[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" dataKey="trip_distance" name="Distance" tick={{ fontSize: 11 }} />
          <YAxis type="number" dataKey="total_amount" name="Fare" tick={{ fontSize: 11 }} />
          <ZAxis type="number" dataKey="tip_amount" range={[40, 180]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data} fill="#2563eb" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HeatmapTable({ rows, xKey, yKey, valueKey }: { rows: Row[]; xKey: string; yKey: string; valueKey: string }) {
  const xValues = Array.from(new Set(rows.map((row) => String(row[xKey])))).sort((a, b) => Number(a) - Number(b));
  const yValues = Array.from(new Set(rows.map((row) => String(row[yKey]))));
  const lookup = new Map(rows.map((row) => [`${row[yKey]}::${row[xKey]}`, numberValue(row[valueKey])]));
  const max = Math.max(1, ...Array.from(lookup.values()));
  return (
    <div className="overflow-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white p-2 text-left font-semibold text-slate-600">{yKey}</th>
            {xValues.map((x) => (
              <th key={x} className="p-2 text-right font-semibold text-slate-600">{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yValues.map((y) => (
            <tr key={y}>
              <td className="sticky left-0 bg-white p-2 font-medium text-slate-700">{y}</td>
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
  const resolvedColumns = columns ?? Object.keys(rows[0] ?? {});
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {resolvedColumns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase text-slate-500">{column.replaceAll("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100">
              {resolvedColumns.map((column) => (
                <td key={column} className="whitespace-nowrap px-3 py-2 text-slate-700">{String(row[column] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LinkedTable({ rows, columns, label = "Open" }: { rows: Row[]; columns?: string[]; label?: string }) {
  const resolvedColumns = columns ?? Object.keys(rows[0] ?? {}).filter((column) => !column.startsWith("__"));
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {resolvedColumns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase text-slate-500">{column.replaceAll("_", " ")}</th>
            ))}
            <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100">
              {resolvedColumns.map((column) => (
                <td key={column} className="whitespace-nowrap px-3 py-2 text-slate-700">{String(row[column] ?? "")}</td>
              ))}
              <td className="whitespace-nowrap px-3 py-2">
                <Link className="font-medium text-teal-700 hover:text-teal-900" href={String(row.__href ?? "#")}>{label}</Link>
              </td>
            </tr>
          ))}
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={valueKey}>
            {data.map((_, index) => (
              <Cell key={index} fill={["#0f766e", "#2563eb", "#f97316", "#7c3aed", "#64748b"][index % 5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
