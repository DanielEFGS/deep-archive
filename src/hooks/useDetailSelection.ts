import { useCallback, useMemo, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { CatalogItem, CatalogPayload, DetailShard } from "../types/catalog";
import { catalogSectors } from "../utils/atlas";
import { safeDatasetPath } from "../utils/security";
import { fetchJson } from "../services/http";

type Options = {
  catalog: CatalogPayload;
  itemsRef: MutableRefObject<CatalogItem[]>;
  setActiveSector: Dispatch<SetStateAction<number>>;
  onEngage: () => void;
};

export function useDetailSelection({
  catalog,
  itemsRef,
  setActiveSector,
  onEngage,
}: Options) {
  const shardCacheRef = useRef(new Map<string, Promise<DetailShard>>());
  const requestRef = useRef(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadBaseItem = useCallback(
    (base: CatalogItem, updateObjectUrl: boolean) => {
      onEngage();
      setSelectedId(base.id);
      if (updateObjectUrl) {
        const url = new URL(window.location.href);
        if (base.slug) url.searchParams.set("object", base.slug);
        else url.searchParams.delete("object");
        url.searchParams.delete("trail");
        url.searchParams.delete("step");
        window.history.replaceState(null, "", url);
      }
      setError(false);
      setSelectedDetail(base);
      if (!base.detailShard) {
        setLoading(false);
        return;
      }

      const requestId = ++requestRef.current;
      setLoading(true);
      const shardUrl = safeDatasetPath(base.detailShard);
      if (!shardUrl) {
        setLoading(false);
        setError(true);
        return;
      }

      let shardPromise = shardCacheRef.current.get(shardUrl);
      if (!shardPromise) {
        shardPromise = fetchJson<DetailShard>(shardUrl).catch((shardError) => {
          shardCacheRef.current.delete(shardUrl);
          throw shardError;
        });
        shardCacheRef.current.set(shardUrl, shardPromise);
      }

      shardPromise
        .then((shard) => {
          if (requestId !== requestRef.current) return;
          const detail = shard[String(base.id)];
          if (!detail) throw new Error(`Detail ${base.id} missing from ${base.detailShard}`);
          setSelectedDetail({ ...base, ...detail });
          setLoading(false);
        })
        .catch((detailError: unknown) => {
          if (requestId !== requestRef.current) return;
          if (import.meta.env.DEV) console.error(detailError);
          setSelectedDetail(base);
          setLoading(false);
          setError(true);
        });
    },
    [onEngage],
  );

  const selectIndex = useCallback(
    (index: number) => {
      const base = itemsRef.current[index];
      if (!base) return;
      const sectorIndex = catalogSectors(catalog).findIndex(
        (sector) => index >= sector.startIndex && index < sector.startIndex + sector.itemCount,
      );
      if (sectorIndex >= 0) setActiveSector(sectorIndex);
      loadBaseItem(base, true);
    },
    [catalog, itemsRef, loadBaseItem, setActiveSector],
  );

  const reset = useCallback((updateUrl = true) => {
    requestRef.current++;
    setSelectedId(null);
    setSelectedDetail(null);
    setLoading(false);
    setError(false);
    if (!updateUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("object");
    window.history.replaceState(null, "", url);
  }, []);

  const selectedBase = useMemo(() => {
    if (selectedId == null) return null;
    return catalog.items.find((item) => item.id === selectedId) ?? null;
  }, [catalog.items, selectedId]);

  return {
    selectedId,
    selected: selectedDetail ?? selectedBase,
    detailLoading: loading,
    detailError: error,
    loadBaseItem,
    handleSelectIndex: selectIndex,
    closeDetail: reset,
    resetSelection: reset,
  };
}
