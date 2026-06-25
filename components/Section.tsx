"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/lib/client/i18n";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useLocale();
  return (
    <section className="ui-panel rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-brand-primary" />
        <h2 className="text-base font-semibold text-app-text-primary">{t(title)}</h2>
      </div>
      {children}
    </section>
  );
}
