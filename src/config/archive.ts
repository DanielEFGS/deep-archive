import type { CatalogPayload } from "../types/catalog";

export const EMPTY_CATALOG: CatalogPayload = {
  generatedAt: "",
  source: "demo",
  atlas: { url: "", columns: 25, rows: 20, tileWidth: 96, tileHeight: 72 },
  items: [],
};

export const DATASET =
  import.meta.env.VITE_DATASET === "nasa" ||
  (!import.meta.env.VITE_DATASET && import.meta.env.PROD)
    ? "nasa"
    : "demo";

export const CATALOG_URL = `/datasets/${DATASET}/catalog.json`;

export function trailUrl(locale: string, slug: string) {
  return `/editorial/trails/${locale}/${encodeURIComponent(slug)}.json`;
}

export function editorialObjectUrl(locale: string, catalogId: number) {
  return `/editorial/objects/${locale}/${String(catalogId).padStart(3, "0")}.json`;
}
