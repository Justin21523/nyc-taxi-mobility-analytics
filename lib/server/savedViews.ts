import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { DATA_DIR } from "./paths";

const SAVED_VIEWS_PATH = path.join(DATA_DIR, "reports", "saved_views.json");

export type SavedView = {
  id: string;
  name: string;
  path: string;
  createdAt: string;
};

async function readViews(): Promise<SavedView[]> {
  if (!existsSync(SAVED_VIEWS_PATH)) return [];
  return JSON.parse(await readFile(SAVED_VIEWS_PATH, "utf8")) as SavedView[];
}

async function writeViews(views: SavedView[]) {
  await mkdir(path.dirname(SAVED_VIEWS_PATH), { recursive: true });
  await writeFile(SAVED_VIEWS_PATH, JSON.stringify(views, null, 2));
}

export async function listSavedViews() {
  return readViews();
}

export async function saveView(input: { name: string; path: string }) {
  const views = await readViews();
  const view = {
    id: crypto.randomUUID(),
    name: input.name.trim() || "Untitled view",
    path: input.path || "/",
    createdAt: new Date().toISOString(),
  };
  await writeViews([view, ...views]);
  return view;
}

export async function deleteView(id: string) {
  const views = await readViews();
  const next = views.filter((view) => view.id !== id);
  await writeViews(next);
  return { deleted: views.length !== next.length };
}

