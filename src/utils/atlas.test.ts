import { describe, expect, it } from "vitest";
import type { CatalogPayload } from "../types/catalog";
import { atlasForIndex, atlasPosition, catalogSectors } from "./atlas";

const catalog: CatalogPayload = {
  generatedAt: "2026-08-24",
  source: "nasa",
  atlas: { url: "/fallback.webp", columns: 25, rows: 20, tileWidth: 128, tileHeight: 96 },
  atlases: [
    { url: "/one.webp", columns: 25, rows: 20, tileWidth: 128, tileHeight: 96, startIndex: 0, itemCount: 500 },
    { url: "/two.webp", columns: 25, rows: 20, tileWidth: 128, tileHeight: 96, startIndex: 500, itemCount: 500 },
  ],
  items: Array.from({ length: 1000 }, (_, id) => ({ id, title: String(id), category: "DEEP SPACE" })),
};

describe("atlas utilities", () => {
  it("resolves the correct virtualized sector and local index", () => {
    expect(atlasForIndex(catalog, 734)).toMatchObject({
      atlas: { url: "/two.webp" },
      localIndex: 234,
      sectorIndex: 1,
    });
  });

  it("creates a fallback sector for single-atlas catalogs", () => {
    const single = { ...catalog, atlases: undefined };
    expect(catalogSectors(single)[0]).toMatchObject({ startIndex: 0, itemCount: 1000 });
  });

  it("maps atlas cells to percentage positions", () => {
    expect(atlasPosition(3, 2, 2)).toBe("100% 100%");
  });
});
