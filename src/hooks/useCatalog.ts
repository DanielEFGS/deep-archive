import { useEffect, useRef, useState } from "react";
import { CATALOG_URL, EMPTY_CATALOG } from "../config/archive";
import type { CatalogItem, CatalogPayload } from "../types/catalog";
import { catalogSectors } from "../utils/atlas";
import { fetchJson } from "../services/http";

function requestedSector(catalog: CatalogPayload) {
  const requested = Number(new URL(window.location.href).searchParams.get("sector"));
  const sectorCount = catalogSectors(catalog).length;
  return Number.isInteger(requested) && requested > 0
    ? Math.min(requested - 1, sectorCount - 1)
    : 0;
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogPayload>(EMPTY_CATALOG);
  const itemsRef = useRef<CatalogItem[]>([]);
  const [activeSector, setActiveSector] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    setReady(false);

    fetchJson<CatalogPayload>(CATALOG_URL, { signal: controller.signal })
      .then((payload) => {
        if (!payload.items?.length || !payload.atlas?.url) {
          throw new Error("Catalog payload is incomplete.");
        }
        itemsRef.current = payload.items;
        setCatalog(payload);
        setActiveSector(requestedSector(payload));
        setReady(true);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        if (import.meta.env.DEV) console.error(loadError);
        setError(true);
      });

    return () => controller.abort();
  }, [attempt]);

  return {
    catalog,
    itemsRef,
    activeSector,
    setActiveSector,
    catalogReady: ready,
    loadError: error,
    clearLoadError: () => setError(false),
    retryCatalog: () => setAttempt((current) => current + 1),
  };
}
