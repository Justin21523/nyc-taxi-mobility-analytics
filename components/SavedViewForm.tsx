"use client";

import { useState } from "react";

export function SavedViewForm({ currentPath }: { currentPath: string }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  async function save() {
    const response = await fetch("/saved-views/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, path: currentPath }),
    });
    setStatus(response.ok ? "Saved" : "Save failed");
    if (response.ok) setName("");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input className="min-w-64 rounded-md border border-slate-300 px-3 py-2 text-sm" value={name} onChange={(event) => setName(event.target.value)} placeholder="Saved view name" />
      <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={save}>Save current view</button>
      {status ? <span className="self-center text-sm text-slate-600">{status}</span> : null}
    </div>
  );
}

