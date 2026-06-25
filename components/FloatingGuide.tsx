"use client";

import { ArrowLeft, ArrowRight, Bot, LocateFixed, Play, RotateCcw, X } from "lucide-react";

import { guideSteps } from "@/lib/client/guideSteps";
import { useLocale } from "@/lib/client/i18n";
import { useGuide } from "@/components/GuideProvider";

export function FloatingGuide() {
  const { active, index, step, highlight, start, next, previous, skip, restart } = useGuide();
  const { locale } = useLocale();
  const isFirst = index === 0;
  const isLast = index === guideSteps.length - 1;
  const title = locale === "zh" ? step.titleZh : step.titleEn;
  const body = locale === "zh" ? step.bodyZh : step.bodyEn;
  const action = locale === "zh" ? step.actionLabelZh : step.actionLabelEn;

  return (
    <>
      {active && highlight ? (
        <div
          className="pointer-events-none absolute z-40 rounded-xl border-2 border-brand-accent shadow-[0_0_0_9999px_rgb(15_23_42/20%),0_0_32px_rgb(245_158_11/45%)]"
          style={{ top: highlight.top - 8, left: highlight.left - 8, width: highlight.width + 16, height: highlight.height + 16 }}
        >
          <span className="guide-spark guide-spark-a" />
          <span className="guide-spark guide-spark-b" />
          <span className="guide-spark guide-spark-c" />
        </div>
      ) : null}
      <aside className="fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-app-border bg-app-surface-elevated px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary-active">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-app-text-primary">{locale === "zh" ? "導覽小幫手" : "Guide Assistant"}</div>
              <div className="text-xs text-app-text-muted">Guided analytics demo</div>
            </div>
          </div>
          {active ? (
            <button className="ui-button-secondary rounded-md p-2" type="button" onClick={skip} aria-label="Close guide">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {active ? (
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full border border-brand-primary-soft bg-brand-primary-soft px-2.5 py-1 text-xs font-semibold text-brand-primary-active">
                Step {index + 1} / {guideSteps.length}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">{step.category} / {step.technicalTerm}</span>
            </div>
            <h3 className="text-base font-semibold text-app-text-primary">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-app-text-secondary">{body}</p>
            <div className="mt-4 rounded-lg border border-app-border bg-app-surface-muted p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-app-text-muted">
                <LocateFixed className="h-4 w-4 text-brand-primary" />
                {locale === "zh" ? "目前任務" : "Current task"}
              </div>
              <div className="mt-1 text-sm font-medium text-app-text-primary">{action}</div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button className="ui-button-secondary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-40" type="button" onClick={previous} disabled={isFirst}>
                <ArrowLeft className="h-4 w-4" />
                {locale === "zh" ? "上一步" : "Previous"}
              </button>
              <button className="ui-button-primary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold" type="button" onClick={isLast ? restart : next}>
                {isLast ? <RotateCcw className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                {isLast ? (locale === "zh" ? "重新開始" : "Restart") : (locale === "zh" ? "下一步" : "Next")}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm leading-6 text-app-text-secondary">{locale === "zh" ? "開始一段面試展示導覽：我會帶你從 KPI、Data Quality、Pipeline Journey、地圖到 Forecast，一步步解釋成果。" : "Start an interview-ready walkthrough across KPI, Data Quality, Pipeline Journey, map analysis, and Forecast."}</p>
            <button className="ui-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold" type="button" onClick={start}>
              <Play className="h-4 w-4" />
              {locale === "zh" ? "開始導覽" : "Start guide"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
