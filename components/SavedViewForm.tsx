"use client";

import { useState } from "react";
import { useLocale } from "@/lib/client/i18n";

export function SavedViewForm({ currentPath }: { currentPath: string }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const { t } = useLocale();

  async function save() {
    const path = typeof window === "undefined" ? currentPath : `${window.location.pathname}${window.location.search}`;
    const response = await fetch("/saved-views/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, path }),
    });
    setStatus(response.ok ? "Saved" : "Save failed");
    if (response.ok) setName("");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input className="ui-input min-w-64 rounded-md px-3 py-2 text-sm" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Saved view name")} />
      <button className="ui-button-primary rounded-md px-4 py-2 text-sm font-semibold" type="button" onClick={save}>{t("Save current view")}</button>
      {status ? <span className="self-center text-sm text-app-text-secondary">{t(status)}</span> : null}
    </div>
  );
}
