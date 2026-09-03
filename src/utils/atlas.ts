import type { AtlasConfig, AtlasSector, CatalogPayload } from "../types/catalog";

export type ArchivePage = AtlasSector & {
  atlasOffset: number;
  sectorIndex: number;
};

export function catalogSectors(catalog: CatalogPayload): AtlasSector[] {
  if (catalog.atlases?.length) return catalog.atlases;
  return [
    {
      ...catalog.atlas,
      startIndex: 0,
      itemCount: catalog.items.length,
    },
  ];
}

export function catalogPages(
  catalog: CatalogPayload,
  pageSize?: number,
): ArchivePage[] {
  return catalogSectors(catalog).flatMap((sector, sectorIndex) => {
    const size = pageSize && pageSize > 0 ? pageSize : sector.itemCount;
    const pageCount = Math.ceil(sector.itemCount / size);
    return Array.from({ length: pageCount }, (_, pageIndex) => {
      const atlasOffset = pageIndex * size;
      return {
        ...sector,
        startIndex: sector.startIndex + atlasOffset,
        itemCount: Math.min(size, sector.itemCount - atlasOffset),
        atlasOffset,
        sectorIndex,
      };
    });
  });
}

export function atlasForIndex(
  catalog: CatalogPayload,
  globalIndex: number,
): { atlas: AtlasConfig; localIndex: number; sectorIndex: number } {
  const sectors = catalogSectors(catalog);
  const sectorIndex = Math.max(
    0,
    sectors.findIndex(
      (sector) =>
        globalIndex >= sector.startIndex &&
        globalIndex < sector.startIndex + sector.itemCount,
    ),
  );
  const atlas = sectors[sectorIndex] ?? sectors[0];
  return {
    atlas,
    localIndex: Math.max(0, globalIndex - atlas.startIndex),
    sectorIndex,
  };
}

export function atlasPosition(
  index: number,
  columns: number,
  rows: number,
) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns <= 1 ? 0 : (column / (columns - 1)) * 100;
  const y = rows <= 1 ? 0 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
}
