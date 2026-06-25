"use client";

import { useLocale } from "@/lib/client/i18n";

export function LocalizedText({ text, as = "span", className }: { text: string; as?: "span" | "div" | "h1" | "p"; className?: string }) {
  const { t } = useLocale();
  const Tag = as;
  return <Tag className={className}>{t(text)}</Tag>;
}
