import { describe, expect, it } from "vitest";
import type { CatalogItem, CatalogPayload } from "../../types/catalog";
import {
  localMatchingIndices,
  matchingIndices,
  relatedCatalogItems,
} from "./selectors";

const items: CatalogItem[] = [
  {
    id: 1,
    title: "Crab Nebula",
    category: "NEBULAE",
    mission: "Hubble",
    telescope: "HST",
    keywords: ["pulsar", "supernova"],
  },
  {
    id: 2,
    title: "Another remnant",
    category: "NEBULAE",
    mission: "Hubble",
    telescope: "HST",
    keywords: ["supernova"],
  },
  {
    id: 3,
    title: "Earth limb",
    category: "EARTH",
    mission: "ISS",
    keywords: ["atmosphere"],
  },
];

const catalog: CatalogPayload = {
  generatedAt: "2026-08-24",
  source: "nasa",
  atlas: { url: "/atlas.webp", columns: 2, rows: 2, tileWidth: 128, tileHeight: 96 },
  items,
};

describe("matchingIndices", () => {
  it("avoids allocating a filter set when every item is visible", () => {
    expect(matchingIndices(items, "ALL", "  ")).toBeNull();
  });

  it("combines category and normalized text filtering", () => {
    expect([...matchingIndices(items, "NEBULAE", "PULSAR")!]).toEqual([0]);
    expect([...matchingIndices(items, "EARTH", "hubble")!]).toEqual([]);
  });
});

describe("localMatchingIndices", () => {
  it("translates global matches into sector-local indices", () => {
    expect([...localMatchingIndices(new Set([1, 4, 6]), 3, 3)!]).toEqual([1]);
  });
});

describe("relatedCatalogItems", () => {
  it("prioritizes shared category, mission, telescope and keywords", () => {
    const related = relatedCatalogItems(catalog, items[0]);
    expect(related.map(({ item }) => item.id)).toEqual([2]);
    expect(related[0].atlasIndex).toBe(1);
  });
});
