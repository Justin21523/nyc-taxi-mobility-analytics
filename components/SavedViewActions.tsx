"use client";

import { Copy, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { withBasePath } from "@/lib/client/basePath";
import { useLocale } from "@/lib/client/i18n";

export function SavedViewActions({ id, path }: { id: string; path: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const { t } = useLocale();

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}${withBasePath(path)}`);
    setStatus("Copied");
  }

  async function remove() {
    const response = await fetch(withBasePath(`/saved-views/api?id=${encodeURIComponent(id)}`), { method: "DELETE" });
    setStatus(response.ok ? "Deleted" : "Delete failed");
    if (response.ok) router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link className="ui-button-secondary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium" href={path}>
        <ExternalLink className="h-3.5 w-3.5" />
        {t("Open")}
      </Link>
      <button type="button" className="ui-button-secondary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium" onClick={copy}>
        <Copy className="h-3.5 w-3.5" />
        {t("Copy")}
      </button>
      {id ? (
        <button type="button" className="tone-error inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium" onClick={remove}>
          <Trash2 className="h-3.5 w-3.5" />
          {t("Delete")}
        </button>
      ) : null}
      {status ? <span className="text-xs text-app-text-muted">{t(status)}</span> : null}
    </div>
  );
}
