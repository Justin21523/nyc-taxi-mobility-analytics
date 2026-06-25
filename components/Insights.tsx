"use client";

import Link from "next/link";
import { useLocale } from "@/lib/client/i18n";

export type InsightSeverity = "info" | "positive" | "warning" | "critical";

export type Insight = {
  titleEn: string;
  titleZh: string;
  observationEn: string;
  observationZh: string;
  whyItMattersEn: string;
  whyItMattersZh: string;
  nextStepEn: string;
  nextStepZh: string;
  severity?: InsightSeverity;
  href?: string;
};

const severityStyles: Record<InsightSeverity, string> = {
  info: "tone-info",
  positive: "tone-success",
  warning: "tone-warning",
  critical: "tone-error",
};

export function InsightPanel({ title = "Analyst Insights", insights }: { title?: string; insights: Insight[] }) {
  const { locale, t } = useLocale();
  if (!insights.length) return null;
  return (
    <section className="ui-panel rounded-lg p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-app-text-primary">{t(title)}</h2>
        <p className="text-xs text-app-text-muted">{t("Rule-based interpretation generated from the current filters. 根據目前篩選條件自動產生的分析解讀。")}</p>
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        {insights.map((insight) => (
          <InsightCard key={`${insight.titleEn}-${insight.observationEn}`} insight={insight} locale={locale} />
        ))}
      </div>
    </section>
  );
}

export function InsightCallout({ insight }: { insight: Insight }) {
  const { locale, t } = useLocale();
  return (
    <div className={`mt-4 rounded-md border p-3 text-sm ${severityStyles[insight.severity ?? "info"]}`}>
      <div className="font-semibold">{locale === "zh" ? insight.titleZh : insight.titleEn}</div>
      <p className="mt-2 text-app-text-secondary">{locale === "zh" ? insight.observationZh : insight.observationEn}</p>
      {insight.href ? <Link className="mt-2 inline-block font-semibold text-brand-primary-active" href={insight.href}>{t("Open related view")}</Link> : null}
    </div>
  );
}

function InsightCard({ insight, locale }: { insight: Insight; locale: "zh" | "en" }) {
  return (
    <article className={`rounded-md border p-3 ${severityStyles[insight.severity ?? "info"]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide">{insight.severity ?? "info"}</div>
      <h3 className="mt-2 text-sm font-semibold">{locale === "zh" ? insight.titleZh : insight.titleEn}</h3>
      <div className="mt-3 space-y-2 text-sm text-app-text-secondary">
        <p><span className="font-semibold">{locale === "zh" ? "觀察：" : "Observation:"}</span> {locale === "zh" ? insight.observationZh : insight.observationEn}</p>
        <p><span className="font-semibold">{locale === "zh" ? "意義：" : "Why it matters:"}</span> {locale === "zh" ? insight.whyItMattersZh : insight.whyItMattersEn}</p>
        <p><span className="font-semibold">{locale === "zh" ? "下一步：" : "Next step:"}</span> {locale === "zh" ? insight.nextStepZh : insight.nextStepEn}</p>
      </div>
      {insight.href ? <Link className="mt-3 inline-block text-sm font-semibold text-brand-primary-active" href={insight.href}>Open related view</Link> : null}
    </article>
  );
}
