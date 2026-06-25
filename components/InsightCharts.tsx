"use client";

import type { EChartsOption } from "echarts";

import { chartAxisColor, chartGridColor, chartNegative, chartPalette, chartPositive, heatmapPalette } from "@/lib/client/theme";
import { numberValue } from "@/lib/client/format";
import { EChart } from "@/components/ECharts";

type Row = Record<string, unknown>;

function label(value: unknown) {
  return String(value ?? "");
}

export function EComposedSeries({ data, xKey, series }: { data: Row[]; xKey: string; series: { key: string; name?: string; type?: "line" | "bar" | "area" }[] }) {
  const option: EChartsOption = {
    color: chartPalette,
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { top: 48, left: 56, right: 24, bottom: 58 },
    dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 18 }],
    xAxis: { type: "category", data: data.map((row) => label(row[xKey])), axisLabel: { fontSize: 10, color: chartAxisColor }, axisLine: { lineStyle: { color: chartGridColor } } },
    yAxis: { type: "value", axisLabel: { fontSize: 10, color: chartAxisColor }, splitLine: { lineStyle: { color: chartGridColor } } },
    series: series.map((item) => ({
      name: item.name ?? item.key.replaceAll("_", " "),
      type: item.type === "bar" ? "bar" : "line",
      smooth: item.type !== "bar",
      areaStyle: item.type === "area" ? {} : undefined,
      showSymbol: false,
      data: data.map((row) => numberValue(row[item.key])),
    })),
  };
  return <EChart option={option} empty={!data.length} />;
}

export function EHorizontalBar({ data, nameKey, valueKey, limit = 20 }: { data: Row[]; nameKey: string; valueKey: string; limit?: number }) {
  const rows = data.slice(0, limit).reverse();
  const option: EChartsOption = {
    color: [chartPalette[0]],
    tooltip: { trigger: "axis" },
    grid: { left: 128, right: 28, top: 18, bottom: 28 },
    xAxis: { type: "value", axisLabel: { fontSize: 10, color: chartAxisColor }, splitLine: { lineStyle: { color: chartGridColor } } },
    yAxis: { type: "category", data: rows.map((row) => label(row[nameKey])), axisLabel: { fontSize: 10, color: chartAxisColor } },
    series: [{ type: "bar", data: rows.map((row) => numberValue(row[valueKey])), itemStyle: { borderRadius: [0, 4, 4, 0] } }],
  };
  return <EChart option={option} empty={!data.length} />;
}

export function EDonut({ data, nameKey, valueKey }: { data: Row[]; nameKey: string; valueKey: string }) {
  const option: EChartsOption = {
    color: chartPalette,
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["46%", "72%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        data: data.map((row) => ({ name: label(row[nameKey]), value: numberValue(row[valueKey]) })),
      },
    ],
  };
  return <EChart option={option} empty={!data.length} />;
}

export function ETreemap({ data, nameKey, valueKey }: { data: Row[]; nameKey: string; valueKey: string }) {
  const option: EChartsOption = {
    color: chartPalette,
    tooltip: { trigger: "item" },
    series: [
      {
        type: "treemap",
        roam: false,
        breadcrumb: { show: false },
        label: { fontSize: 11 },
        data: data.map((row) => ({ name: label(row[nameKey]), value: numberValue(row[valueKey]) })),
      },
    ],
  };
  return <EChart option={option} empty={!data.length} />;
}

export function EBubble({ data, xKey, yKey, sizeKey, nameKey }: { data: Row[]; xKey: string; yKey: string; sizeKey: string; nameKey: string }) {
  const option: EChartsOption = {
    color: [chartPalette[1]],
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const row = data[(params as { dataIndex: number }).dataIndex];
        return `${label(row[nameKey])}<br/>${xKey}: ${row[xKey]}<br/>${yKey}: ${row[yKey]}<br/>${sizeKey}: ${row[sizeKey]}`;
      },
    },
    grid: { left: 60, right: 28, top: 24, bottom: 48 },
    xAxis: { type: "value", name: xKey.replaceAll("_", " "), axisLabel: { fontSize: 10, color: chartAxisColor }, splitLine: { lineStyle: { color: chartGridColor } } },
    yAxis: { type: "value", name: yKey.replaceAll("_", " "), axisLabel: { fontSize: 10, color: chartAxisColor }, splitLine: { lineStyle: { color: chartGridColor } } },
    series: [
      {
        type: "scatter",
        symbolSize: (value) => Math.max(8, Math.sqrt(Number((value as number[])[2])) / 2),
        data: data.map((row) => [numberValue(row[xKey]), numberValue(row[yKey]), numberValue(row[sizeKey])]),
      },
    ],
  };
  return <EChart option={option} empty={!data.length} />;
}

export function EHeatmap({ rows, xKey, yKey, valueKey }: { rows: Row[]; xKey: string; yKey: string; valueKey: string }) {
  const xValues = Array.from(new Set(rows.map((row) => label(row[xKey])))).sort((a, b) => Number(a) - Number(b));
  const yValues = Array.from(new Set(rows.map((row) => label(row[yKey]))));
  const values = rows.map((row) => [xValues.indexOf(label(row[xKey])), yValues.indexOf(label(row[yKey])), numberValue(row[valueKey])]);
  const max = Math.max(1, ...values.map((row) => Number(row[2])));
  const option: EChartsOption = {
    tooltip: { position: "top" },
    grid: { top: 32, left: 96, right: 24, bottom: 56 },
    xAxis: { type: "category", data: xValues, splitArea: { show: true }, axisLabel: { fontSize: 10, color: chartAxisColor } },
    yAxis: { type: "category", data: yValues, splitArea: { show: true }, axisLabel: { fontSize: 10, color: chartAxisColor } },
    visualMap: { min: 0, max, calculable: true, orient: "horizontal", left: "center", bottom: 0, inRange: { color: heatmapPalette } },
    series: [{ type: "heatmap", data: values, label: { show: false } }],
  };
  return <EChart option={option} empty={!rows.length} />;
}

export function ERadar({ data, nameKey, metrics }: { data: Row[]; nameKey: string; metrics: string[] }) {
  const maxima = metrics.map((metric) => Math.max(1, ...data.map((row) => numberValue(row[metric]))));
  const option: EChartsOption = {
    color: chartPalette,
    tooltip: {},
    legend: { bottom: 0 },
    radar: { indicator: metrics.map((metric, index) => ({ name: metric.replaceAll("_", " "), max: maxima[index] })) },
    series: [
      {
        type: "radar",
        data: data.map((row) => ({ name: label(row[nameKey]), value: metrics.map((metric) => numberValue(row[metric])) })),
      },
    ],
  };
  return <EChart option={option} empty={!data.length} />;
}

export function EWaterfall({ data, nameKey, valueKey }: { data: Row[]; nameKey: string; valueKey: string }) {
  const option: EChartsOption = {
    color: [chartPositive, chartNegative],
    tooltip: { trigger: "axis" },
    grid: { left: 56, right: 24, top: 28, bottom: 72 },
    xAxis: { type: "category", data: data.map((row) => label(row[nameKey])), axisLabel: { rotate: 25, fontSize: 10 } },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: data.map((row) => numberValue(row[valueKey])),
        itemStyle: { color: (params) => (Number(params.value) >= 0 ? chartPositive : chartNegative) },
      },
    ],
  };
  return <EChart option={option} empty={!data.length} />;
}

export function EStackedBar({ data, xKey, seriesKeys }: { data: Row[]; xKey: string; seriesKeys: string[] }) {
  const option: EChartsOption = {
    color: chartPalette,
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { top: 48, left: 56, right: 24, bottom: 48 },
    xAxis: { type: "category", data: data.map((row) => label(row[xKey])), axisLabel: { fontSize: 10 } },
    yAxis: { type: "value" },
    series: seriesKeys.map((key) => ({ name: key.replaceAll("_", " "), type: "bar", stack: "total", data: data.map((row) => numberValue(row[key])) })),
  };
  return <EChart option={option} empty={!data.length} />;
}

export function ESankey({ data, sourceKey, targetKey, valueKey }: { data: Row[]; sourceKey: string; targetKey: string; valueKey: string }) {
  const names = Array.from(new Set(data.flatMap((row) => [label(row[sourceKey]), label(row[targetKey])])));
  const option: EChartsOption = {
    tooltip: { trigger: "item" },
    series: [
      {
        type: "sankey",
        nodeAlign: "justify",
        emphasis: { focus: "adjacency" },
        data: names.map((name) => ({ name })),
        links: data.map((row) => ({ source: label(row[sourceKey]), target: label(row[targetKey]), value: numberValue(row[valueKey]) })),
        lineStyle: { color: "gradient", curveness: 0.5 },
      },
    ],
  };
  return <EChart option={option} empty={!data.length} />;
}
