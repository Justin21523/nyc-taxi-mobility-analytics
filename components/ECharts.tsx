"use client";

import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/client/i18n";

export function EChart({ option, height = 360, empty = false }: { option: EChartsOption; height?: number; empty?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");
  const { t } = useLocale();

  useEffect(() => {
    if (!ref.current || empty) return;
    let chart: echarts.ECharts | null = null;
    let observer: ResizeObserver | null = null;
    setError("");
    try {
      chart = echarts.init(ref.current, null, { renderer: "canvas" });
      chart.setOption(option, true);
      observer = new ResizeObserver(() => chart?.resize());
      observer.observe(ref.current);
      window.setTimeout(() => chart?.resize(), 0);
    } catch (caught) {
      window.setTimeout(() => setError(caught instanceof Error ? caught.message : t("Chart rendering failed.")), 0);
    }
    return () => {
      observer?.disconnect();
      chart?.dispose();
    };
  }, [option, empty, t]);

  if (empty) {
    return <ChartFallback height={height} title={t("No data available")} message={t("No rows match the current filters. Try widening the date range or clearing a filter.")} />;
  }

  if (error) {
    return <ChartFallback height={height} title={t("Chart rendering issue")} message={error} />;
  }

  return <div ref={ref} style={{ height }} className="w-full" />;
}

function ChartFallback({ height, title, message }: { height: number; title: string; message: string }) {
  return (
    <div style={{ minHeight: height }} className="ui-empty flex items-center justify-center rounded-md px-4 text-center">
      <div>
        <div className="text-sm font-semibold text-app-text-secondary">{title}</div>
        <div className="mt-1 max-w-sm text-sm text-app-text-muted">{message}</div>
      </div>
    </div>
  );
}
