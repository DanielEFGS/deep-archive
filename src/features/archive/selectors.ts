import type { AtlasConfig, CatalogItem, CatalogPayload } from "../../types/catalog";
import { atlasForIndex } from "../../utils/atlas";

export type RelatedItem = {
  item: CatalogItem;
  atlas: AtlasConfig;
  atlasIndex: number;
};

export function matchingIndices(
  items: CatalogItem[],
  category: string,
  searchQuery: string,
): Set<number> | null {
  const query = searchQuery.trim().toLocaleLowerCase();
  if (category === "ALL" && !query) return null;

  const matches = new Set<number>();
  items.forEach((item, index) => {
    if (category !== "ALL" && item.category !== category) return;
    const searchableText = [
      item.title,
      item.category,
      item.year,
      item.mission,
      ...(item.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    if (!query || searchableText.includes(query)) matches.add(index);
  });
  return matches;
}

export function localMatchingIndices(
  matches: Set<number> | null,
  sectorStart: number,
  sectorLength: number,
): Set<number> | null {
  if (matches == null) return null;
  const local = new Set<number>();
  for (const globalIndex of matches) {
    const localIndex = globalIndex - sectorStart;
    if (localIndex >= 0 && localIndex < sectorLength) local.add(localIndex);
  }
  return local;
}

export function relatedCatalogItems(
  catalog: CatalogPayload,
  selected: CatalogItem | null,
  limit = 4,
): RelatedItem[] {
  if (!selected) return [];
  const selectedKeywords = new Set(
    (selected.keywords ?? []).map((value) => value.toLocaleLowerCase()),
  );

  return catalog.items
    .map((item, index) => {
      if (item.id === selected.id) return null;
      const sharedKeywords = (item.keywords ?? []).filter((value) =>
        selectedKeywords.has(value.toLocaleLowerCase()),
      ).length;
      const score =
        (item.category === selected.category ? 5 : 0) +
        (item.mission && item.mission === selected.mission ? 3 : 0) +
        (item.telescope && item.telescope === selected.telescope ? 2 : 0) +
        Math.min(sharedKeywords, 3) * 2;
      return score > 0 ? { item, index, score } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item, index }) => {
      const position = atlasForIndex(catalog, index);
      return { item, atlas: position.atlas, atlasIndex: position.localIndex };
    });
}
