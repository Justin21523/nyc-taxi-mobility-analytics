import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, FileText, Gauge, Newspaper, Settings, ShieldCheck, Workflow } from "lucide-react";

export type ModuleKey = "dashboard" | "dataQuality" | "analysis" | "textMining" | "mlModels" | "articles" | "jobs" | "settings";
export type ToneKey = "info" | "success" | "warning" | "error";

export type Tone = {
  solid: string;
  soft: string;
  border: string;
  text: string;
};

export type ModuleTone = Tone & {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
};

export const semanticTones: Record<ToneKey, Tone> = {
  success: { solid: "#16A34A", soft: "#DCFCE7", border: "#86EFAC", text: "#166534" },
  warning: { solid: "#D97706", soft: "#FEF3C7", border: "#FCD34D", text: "#92400E" },
  error: { solid: "#DC2626", soft: "#FEE2E2", border: "#FCA5A5", text: "#991B1B" },
  info: { solid: "#0284C7", soft: "#E0F2FE", border: "#7DD3FC", text: "#075985" },
};

export const moduleTones: Record<ModuleKey, ModuleTone> = {
  dashboard: { key: "dashboard", label: "Dashboard", solid: "#2563EB", soft: "#DBEAFE", border: "#93C5FD", text: "#1D4ED8", icon: Gauge },
  dataQuality: { key: "dataQuality", label: "Data Quality", solid: "#059669", soft: "#D1FAE5", border: "#6EE7B7", text: "#047857", icon: ShieldCheck },
  analysis: { key: "analysis", label: "Analysis", solid: "#0F766E", soft: "#CCFBF1", border: "#5EEAD4", text: "#0F766E", icon: BarChart3 },
  textMining: { key: "textMining", label: "Text Mining", solid: "#7C3AED", soft: "#EDE9FE", border: "#C4B5FD", text: "#6D28D9", icon: FileText },
  mlModels: { key: "mlModels", label: "ML Models", solid: "#4F46E5", soft: "#E0E7FF", border: "#A5B4FC", text: "#4338CA", icon: Activity },
  articles: { key: "articles", label: "Articles", solid: "#C2410C", soft: "#FFEDD5", border: "#FDBA74", text: "#9A3412", icon: Newspaper },
  jobs: { key: "jobs", label: "Jobs", solid: "#0891B2", soft: "#CFFAFE", border: "#67E8F9", text: "#0E7490", icon: Workflow },
  settings: { key: "settings", label: "Settings", solid: "#64748B", soft: "#F1F5F9", border: "#CBD5E1", text: "#475569", icon: Settings },
};

export const chartPalette = ["#0F766E", "#2563EB", "#7C3AED", "#0891B2", "#D97706", "#DB2777", "#16A34A", "#475569"];
export const chartGridColor = "#D7E0EA";
export const chartAxisColor = "#64748B";
export const chartPositive = "#2563EB";
export const chartNegative = "#D97706";
export const heatmapPalette = ["#ECFEFF", "#5EEAD4", "#0F766E", "#115E59"];

export const kpiTones = [
  moduleTones.analysis,
  { ...moduleTones.dashboard, label: "Revenue" },
  { ...moduleTones.articles, label: "Fare" },
  { ...moduleTones.jobs, label: "Distance" },
  { ...moduleTones.dataQuality, label: "Tip" },
  { ...moduleTones.mlModels, label: "Airport" },
];

export function moduleForPath(pathname: string): ModuleKey {
  if (pathname === "/" || pathname.startsWith("/saved-views")) return "dashboard";
  if (pathname.startsWith("/data-quality") || pathname.startsWith("/warehouse")) return "dataQuality";
  if (pathname.startsWith("/forecast")) return "mlModels";
  if (pathname.startsWith("/settings")) return "settings";
  return "analysis";
}

export function moduleForTitle(title: string): ModuleKey {
  const normalized = title.toLowerCase();
  if (normalized.includes("quality") || normalized.includes("warehouse")) return "dataQuality";
  if (normalized.includes("forecast")) return "mlModels";
  if (normalized.includes("saved") || normalized.includes("overview")) return "dashboard";
  return "analysis";
}
