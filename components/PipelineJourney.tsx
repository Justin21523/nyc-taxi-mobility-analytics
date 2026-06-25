"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Database, FileUp, GitBranch, LineChart, ShieldCheck, Sparkles, Table2, WandSparkles } from "lucide-react";
import { useLocale } from "@/lib/client/i18n";

type JourneyStep = {
  id: string;
  label: string;
  title: string;
  technicalTerm: string;
  effect: string;
  meaning: string;
  visual: "raw" | "schema" | "cleaning" | "quality" | "partition" | "warehouse" | "analytics" | "geo" | "forecast" | "insights" | "export";
};

type UploadReport = {
  datasetId: string;
  fileName: string;
  fileType: string;
  rowCount: number;
  validRows: number;
  invalidRows: number;
  missingColumns: string[];
  dateRange: { minPickup: string | null; maxPickup: string | null };
  partitions: { year: number; month: number; row_count: number }[];
  summary: Record<string, unknown>;
  status: "ready" | "error";
  error?: string;
};

const steps: JourneyStep[] = [
  {
    id: "raw",
    label: "Raw Data",
    title: "原始資料進入平台",
    technicalTerm: "NYC TLC Parquet",
    effect: "每一筆 taxi trip 都先保留 pickup time、dropoff time、zone、fare、tip、distance 等欄位。",
    meaning: "這一步的重點是讓使用者知道分析不是憑空產生，而是從 trip-level records 開始。",
    visual: "raw",
  },
  {
    id: "schema",
    label: "Schema Mapping",
    title: "將 TLC schema 對齊平台欄位",
    technicalTerm: "Schema compatibility",
    effect: "PULocationID、DOLocationID、tpep/lpep datetime 等欄位會被映射到 canonical trip schema。",
    meaning: "這讓 yellow/green taxi 或使用者 CSV/Parquet 都能進入同一套分析流程。",
    visual: "schema",
  },
  {
    id: "cleaning",
    label: "Cleaning",
    title: "清理欄位與異常值",
    technicalTerm: "Schema normalization",
    effect: "時間欄位被轉成 timestamp，負車資、缺失 zone、無效距離會被標記或排除。",
    meaning: "清理過程會把不可信的行程和可分析行程分開，避免後面圖表被壞資料污染。",
    visual: "cleaning",
  },
  {
    id: "quality",
    label: "Quality Checks",
    title: "資料品質閘門",
    technicalTerm: "Data Quality Gate",
    effect: "row count、freshness、schema compatibility、invalid rows 都被轉成可展示的 quality status。",
    meaning: "這讓面試官看到你不是只會做 dashboard，也能建立可驗證的 data platform。",
    visual: "quality",
  },
  {
    id: "partition",
    label: "Partitioning",
    title: "依 year/month 建立分析分區",
    technicalTerm: "Partition strategy",
    effect: "上傳資料會產生可查詢 parquet dataset；sample warehouse 則保留 year/month partition。",
    meaning: "分區讓查詢、驗證與資料新鮮度檢查更清楚。",
    visual: "partition",
  },
  {
    id: "warehouse",
    label: "Warehouse Views",
    title: "註冊 DuckDB 查詢視圖",
    technicalTerm: "DuckDB views",
    effect: "datasetId 會切換到 uploaded trips view；沒有 datasetId 則使用 sample trips view。",
    meaning: "這讓 demo 能在 sample 與 uploaded data 之間切換，而不破壞原本 pipeline。",
    visual: "warehouse",
  },
  {
    id: "analytics",
    label: "Analytics",
    title: "產生分析特徵與聚合結果",
    technicalTerm: "Aggregations",
    effect: "trip records 被聚合成 hourly demand、daily revenue、route summary、zone ranking、fare features。",
    meaning: "這一步把明細資料變成可決策的城市移動訊號。",
    visual: "analytics",
  },
  {
    id: "geo",
    label: "Geospatial Join",
    title: "把 trip records 接上 NYC zones",
    technicalTerm: "Zone lookup join",
    effect: "pickup/dropoff location id 會 join 到 borough、zone、service zone。",
    meaning: "這一步讓明細行程能變成地圖、OD matrix 與 route network。",
    visual: "geo",
  },
  {
    id: "forecast",
    label: "Forecast",
    title: "建立可解釋的需求預測 baseline",
    technicalTerm: "Naive / Moving Average / Seasonal Naive",
    effect: "系統比較 actual demand 與多個 baseline，並用 MAE、RMSE、MAPE 衡量誤差。",
    meaning: "Forecast 不是追求複雜模型，而是先建立可信 baseline，之後才能合理評估 ML 改善。",
    visual: "forecast",
  },
  {
    id: "insights",
    label: "Insights",
    title: "把結果翻譯成使用者看得懂的洞察",
    technicalTerm: "Explainable Analytics",
    effect: "每張圖表旁邊都有 observation、why it matters、next step，讓數字變成可行動的敘事。",
    meaning: "這是作品集的重點：不是只呈現圖，而是讓使用者理解圖代表什麼。",
    visual: "insights",
  },
  {
    id: "export",
    label: "Export / Share",
    title: "輸出與分享分析結果",
    technicalTerm: "Report export",
    effect: "同一組 filters / datasetId 可以保存、分享或匯出 CSV/Markdown。",
    meaning: "這讓作品不只是 dashboard，而是可重現的分析工具。",
    visual: "export",
  },
];

const journeyEnglish: Record<string, { title: string; effect: string; meaning: string }> = {
  raw: {
    title: "Raw data enters the platform",
    effect: "Each taxi trip keeps pickup time, dropoff time, zone, fare, tip, and distance fields.",
    meaning: "This step shows that analytics starts from trip-level records, not from static charts.",
  },
  schema: {
    title: "Map TLC schema to platform fields",
    effect: "PULocationID, DOLocationID, and tpep/lpep datetime fields are mapped to the canonical trip schema.",
    meaning: "This lets yellow/green taxi data and user CSV/Parquet files enter the same analysis flow.",
  },
  cleaning: {
    title: "Clean fields and invalid values",
    effect: "Datetime fields become timestamps, while negative fares, missing zones, and invalid distances are marked or removed.",
    meaning: "Cleaning separates trusted trips from bad rows so downstream charts are not polluted.",
  },
  quality: {
    title: "Data quality gate",
    effect: "Row count, freshness, schema compatibility, and invalid rows are converted into a visible quality status.",
    meaning: "This proves the project is a verifiable data platform, not only a dashboard.",
  },
  partition: {
    title: "Create analytical partitions",
    effect: "Uploaded data becomes a queryable Parquet dataset; the sample warehouse keeps year/month partitions.",
    meaning: "Partitioning makes queries, validation, and freshness checks easier to explain.",
  },
  warehouse: {
    title: "Register DuckDB query views",
    effect: "datasetId switches queries to uploaded trips; without it, the app uses the sample trips view.",
    meaning: "This lets sample and uploaded data coexist without breaking the existing pipeline.",
  },
  analytics: {
    title: "Generate analytical features and aggregates",
    effect: "Trip records are aggregated into hourly demand, daily revenue, route summary, zone ranking, and fare features.",
    meaning: "This turns row-level records into decision-ready urban mobility signals.",
  },
  geo: {
    title: "Join trip records to NYC zones",
    effect: "Pickup/dropoff location ids are joined to borough, zone, and service zone.",
    meaning: "This enables maps, OD matrices, and route networks from raw trip records.",
  },
  forecast: {
    title: "Build explainable demand forecast baselines",
    effect: "The system compares actual demand with multiple baselines and evaluates error with MAE, RMSE, and MAPE.",
    meaning: "Forecasting starts with trusted baselines before claiming ML improvement.",
  },
  insights: {
    title: "Translate results into understandable insights",
    effect: "Each chart is paired with observation, why it matters, and next step so numbers become actionable.",
    meaning: "The portfolio value is not only visualization, but making the result understandable.",
  },
  export: {
    title: "Export and share analytical results",
    effect: "The same filters and datasetId can be saved, shared, or exported as CSV/Markdown.",
    meaning: "This turns the project from a dashboard into a reproducible analysis tool.",
  },
};

export function PipelineJourney() {
  const { locale, t } = useLocale();
  const [activeId, setActiveId] = useState(steps[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<UploadReport | null>(null);
  const active = useMemo(() => steps.find((step) => step.id === activeId) ?? steps[0], [activeId]);
  const activeCopy = locale === "zh" ? active : { ...active, ...journeyEnglish[active.id] };
  const sourceLabel = report?.status === "ready" ? `Uploaded dataset ${report.datasetId}` : file ? "Uploaded file pending" : "Sample NYC TLC data";

  return (
    <div className="grid gap-5">
      <section className="ui-panel rounded-xl p-5" data-tour-id="journey-tabs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-brand-primary-soft bg-brand-primary-soft px-2.5 py-1 text-xs font-semibold text-brand-primary-active">Pipeline Journey</div>
            <h1 className="mt-3 text-2xl font-semibold text-app-text-primary">{locale === "zh" ? "資料如何從原始行程變成可解釋洞察" : "How raw trips become explainable analytics"}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-app-text-secondary">{locale === "zh" ? "這個頁面用動畫展示 raw data、cleaning、quality checks、warehouse、analytics、forecast、insights 的完整路徑。若沒有上傳檔案，系統會使用 sample data 模擬整個 demo。" : "This page uses animation to explain the full path from raw data through cleaning, quality checks, warehouse, analytics, forecast, and insights. Without an upload, sample data is used."}</p>
          </div>
          <DataUploadDemo file={file} report={report} onFile={setFile} onReport={setReport} />
        </div>
        <div className="mt-5 grid gap-2 lg:grid-cols-4 xl:grid-cols-6">
          {steps.map((step, index) => (
            <button
              key={step.id}
              className="rounded-lg border px-3 py-3 text-left transition"
              style={{
                borderColor: activeId === step.id ? "var(--color-primary-hover)" : "var(--color-border)",
                background: activeId === step.id ? "var(--color-primary-soft)" : "var(--color-surface)",
                color: activeId === step.id ? "var(--color-primary-active)" : "var(--color-text-secondary)",
              }}
              type="button"
              onClick={() => setActiveId(step.id)}
            >
              <div className="text-xs font-semibold">0{index + 1}</div>
              <div className="mt-1 text-sm font-semibold">{step.label}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4" data-tour-id="journey-report">
        <ReportMetric label={t("Dataset")} value={report?.datasetId ?? "sample"} />
        <ReportMetric label={t("Rows")} value={report ? `${report.validRows} valid / ${report.rowCount} total` : "2,000 sample rows" } />
        <ReportMetric label={t("Invalid rows")} value={report ? String(report.invalidRows) : "sample DQ report"} />
        <ReportMetric label={t("Date range")} value={report ? `${report.dateRange.minPickup ?? "n/a"} -> ${report.dateRange.maxPickup ?? "n/a"}` : "sample range"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="ui-panel rounded-xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">{active.technicalTerm}</div>
              <h2 className="mt-1 text-xl font-semibold text-app-text-primary">{activeCopy.title}</h2>
            </div>
            <span className="rounded-full border border-app-border bg-app-surface-muted px-3 py-1 text-xs font-semibold text-app-text-secondary">{sourceLabel}</span>
          </div>
          <JourneyVisual step={active.visual} />
        </div>
        <div className="grid gap-4">
          <MeaningCard title={t("Actual effect")} icon="effect" body={activeCopy.effect} />
          <MeaningCard title={t("Why it matters")} icon="meaning" body={activeCopy.meaning} />
          <MeaningCard title={t("Demo talk track")} icon="demo" body={locale === "zh" ? `面試展示時，可以說：這一步把 ${active.technicalTerm} 轉成下一層可驗證、可分析、可解釋的資料產品。` : `In an interview, say: this step turns ${active.technicalTerm} into the next verifiable, analyzable, explainable data product layer.`} />
        </div>
      </section>
    </div>
  );
}

function DataUploadDemo({ file, report, onFile, onReport }: { file: File | null; report: UploadReport | null; onFile: (file: File | null) => void; onReport: (report: UploadReport | null) => void }) {
  const { t } = useLocale();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(nextFile: File | null) {
    onFile(nextFile);
    onReport(null);
    setError("");
    if (!nextFile) return;
    setUploading(true);
    const form = new FormData();
    form.set("file", nextFile);
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const payload = await response.json();
    setUploading(false);
    if (!response.ok) {
      setError(payload.error ?? payload.error?.message ?? payload.error ?? "Upload failed");
      if (payload.datasetId) onReport(payload as UploadReport);
      return;
    }
    onReport(payload as UploadReport);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("datasetId", payload.datasetId);
    window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}`);
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-app-border bg-app-surface-muted p-4" data-tour-id="journey-upload">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary-active">
          <FileUp className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-app-text-primary">{t("Data source")}</div>
          <div className="text-xs text-app-text-muted">{t("Uses sample data when no file is uploaded")}</div>
        </div>
      </div>
      <label className="mt-4 block cursor-pointer rounded-lg border border-dashed border-app-border-strong bg-app-surface px-3 py-4 text-center text-sm text-app-text-secondary hover:border-brand-primary-hover">
        <input
          className="sr-only"
          type="file"
          accept=".csv,.parquet"
          onChange={(event) => upload(event.target.files?.[0] ?? null)}
        />
        {uploading ? t("Processing upload...") : t("Choose CSV / Parquet file")}
      </label>
      {error ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700">{error}</div> : null}
      <div className="mt-3 rounded-lg border border-app-border bg-app-surface p-3 text-xs text-app-text-secondary">
        {report?.status === "ready" ? (
          <>
            <div className="font-semibold text-app-text-primary">{report.fileName}</div>
            <div className="mt-1">Dataset: {report.datasetId}</div>
            <div>Rows: {report.validRows} valid / {report.rowCount} total</div>
            <Link className="mt-2 inline-block font-semibold text-brand-primary" href={`/?datasetId=${report.datasetId}`}>{t("Apply to dashboard")}</Link>
          </>
        ) : file ? (
          <>
            <div className="font-semibold text-app-text-primary">{file.name}</div>
            <div className="mt-1">Size: {(file.size / 1024).toFixed(1)} KB</div>
            <div>Mode: real upload pipeline</div>
          </>
        ) : (
          <>
            <div className="font-semibold text-app-text-primary">sample_taxi_trips.parquet</div>
            <div className="mt-1">Mode: deterministic sample pipeline</div>
            <div>Rows: 2,000 sample trips</div>
          </>
        )}
      </div>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-card rounded-xl p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">{label}</div>
      <div className="mt-2 break-words text-sm font-semibold text-app-text-primary">{value}</div>
    </div>
  );
}

function MeaningCard({ title, body, icon }: { title: string; body: string; icon: "effect" | "meaning" | "demo" }) {
  const Icon = icon === "effect" ? CheckCircle2 : icon === "meaning" ? Sparkles : WandSparkles;
  return (
    <article className="ui-card ui-card-hover rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary-active">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-app-text-primary">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-app-text-secondary">{body}</p>
    </article>
  );
}

function JourneyVisual({ step }: { step: JourneyStep["visual"] }) {
  if (step === "forecast") return <ForecastRevealAnimation />;
  if (step === "quality") return <QualityGateAnimation />;
  if (step === "partition" || step === "warehouse") return <PartitionStackAnimation />;
  if (step === "schema" || step === "geo" || step === "export") return <PipelineFlowAnimation mode={step} />;
  return <PipelineFlowAnimation mode={step} />;
}

function PipelineFlowAnimation({ mode }: { mode: JourneyStep["visual"] }) {
  const { t } = useLocale();
  const nodes = [
    { label: "Raw rows", icon: Table2 },
    { label: "Clean fields", icon: ShieldCheck },
    { label: "Analytics", icon: BarChart3 },
    { label: "Insight", icon: Sparkles },
  ];
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-xl border border-app-border bg-[linear-gradient(135deg,#ffffff,#eef3f8)] p-6">
      <div className="absolute inset-x-10 top-1/2 h-1 rounded-full bg-brand-primary-soft" />
      {[0, 1, 2, 3, 4].map((item) => (
        <span key={item} className="journey-stream absolute top-[49%] h-3 w-3 rounded-full bg-brand-accent" style={{ animationDelay: `${item * 0.28}s` }} />
      ))}
      <div className="relative grid h-full gap-4 md:grid-cols-4">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          const emphasized = mode === "raw" ? index === 0 : mode === "cleaning" ? index === 1 : mode === "analytics" ? index === 2 : mode === "insights" ? index === 3 : true;
          return (
            <div key={node.label} className={`journey-float flex min-h-56 flex-col items-center justify-center rounded-xl border p-4 text-center ${emphasized ? "border-brand-primary bg-white" : "border-app-border bg-white/70"}`} style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-brand-primary-soft text-brand-primary-active">
                <Icon className="h-7 w-7" />
              </div>
              <div className="mt-3 text-sm font-semibold text-app-text-primary">{node.label}</div>
              <div className="mt-2 text-xs leading-5 text-app-text-muted">{t("Data is converted into a more useful signal at this layer.")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QualityGateAnimation() {
  const { t } = useLocale();
  return (
    <div className="grid min-h-[360px] gap-4 rounded-xl border border-app-border bg-app-surface-muted p-5 md:grid-cols-3">
      <div className="journey-pulse rounded-xl border border-app-border bg-white p-4">
        <Table2 className="h-8 w-8 text-brand-primary" />
        <div className="mt-3 font-semibold text-app-text-primary">{t("Incoming rows")}</div>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {Array.from({ length: 30 }).map((_, index) => <span key={index} className="h-3 rounded bg-app-border" />)}
        </div>
      </div>
      <div className="journey-pulse rounded-xl border border-amber-200 bg-amber-50 p-4" style={{ animationDelay: "0.3s" }}>
        <GitBranch className="h-8 w-8 text-amber-700" />
        <div className="mt-3 font-semibold text-app-text-primary">{t("Quality gate")}</div>
        <p className="mt-2 text-sm text-app-text-secondary">{t("schema, freshness, and invalid values are checked one by one.")}</p>
      </div>
      <div className="journey-pulse rounded-xl border border-emerald-200 bg-emerald-50 p-4" style={{ animationDelay: "0.6s" }}>
        <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        <div className="mt-3 font-semibold text-app-text-primary">{t("Trusted data")}</div>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {Array.from({ length: 24 }).map((_, index) => <span key={index} className="h-3 rounded bg-emerald-300" />)}
          {Array.from({ length: 6 }).map((_, index) => <span key={index} className="h-3 rounded bg-rose-300" />)}
        </div>
      </div>
    </div>
  );
}

function PartitionStackAnimation() {
  const { t } = useLocale();
  return (
    <div className="min-h-[360px] rounded-xl border border-app-border bg-[linear-gradient(135deg,#ffffff,#eef3f8)] p-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-brand-primary" />
        <div>
          <div className="font-semibold text-app-text-primary">{t("Partitioned analytical warehouse")}</div>
          <div className="text-sm text-app-text-muted">year/month partitions + DuckDB views</div>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {["year=2024/month=01", "year=2024/month=02", "hourly_demand", "route_summary"].map((label, index) => (
          <div key={label} className="journey-float rounded-xl border border-app-border bg-white p-4 shadow-sm" style={{ animationDelay: `${index * 0.18}s` }}>
            <div className="h-2 rounded-full bg-brand-primary" />
            <div className="mt-4 text-sm font-semibold text-app-text-primary">{label}</div>
            <div className="mt-3 space-y-2">
              <div className="h-2 rounded bg-app-border" />
              <div className="h-2 rounded bg-app-border" />
              <div className="h-2 w-2/3 rounded bg-app-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastRevealAnimation() {
  const { t } = useLocale();
  return (
    <div className="min-h-[360px] rounded-xl border border-app-border bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <LineChart className="h-8 w-8 text-brand-secondary" />
        <div>
          <div className="font-semibold text-app-text-primary">{t("Actual vs baseline forecast")}</div>
          <div className="text-sm text-app-text-muted">用 MAE / RMSE / MAPE 比較可解釋 baseline</div>
        </div>
      </div>
      <svg className="h-64 w-full" viewBox="0 0 640 260" role="img" aria-label="Forecast line reveal animation">
        <path d="M20 220 H620" stroke="#D7E0EA" />
        <path d="M20 40 V220" stroke="#D7E0EA" />
        <path className="journey-line-reveal" d="M30 190 C100 150 140 170 190 120 C240 70 290 105 340 86 C400 62 450 120 500 92 C560 64 590 88 620 58" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
        <path className="journey-line-reveal" d="M30 205 C110 178 170 158 230 138 C310 112 370 112 430 108 C510 104 570 92 620 82" fill="none" stroke="#D97706" strokeWidth="4" strokeLinecap="round" style={{ animationDelay: "0.35s" }} />
        <text x="36" y="34" fill="#64748B" fontSize="12">trips</text>
        <text x="540" y="246" fill="#64748B" fontSize="12">time</text>
      </svg>
    </div>
  );
}
