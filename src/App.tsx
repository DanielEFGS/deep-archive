import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CatalogItem,
  CatalogPayload,
  DetailShard,
  RenderDiagnostics,
  RenderQuality,
} from "./types/catalog";
import { SpaceArchiveCanvas } from "./components/SpaceArchiveCanvas";
import { Hud } from "./components/Hud";
import { FieldCursor } from "./components/FieldCursor";
import { TouchPreview } from "./components/TouchPreview";
import type { EducationalContent, EditorialTrail } from "./types/editorial";
import { safeDatasetPath } from "./utils/security";
import { atlasForIndex, catalogSectors } from "./utils/atlas";
import { I18nContext, resolveInitialLocale, ui, type Locale } from "./i18n";

const DetailPanel = lazy(() =>
  import("./components/DetailPanel").then((module) => ({
    default: module.DetailPanel,
  })),
);
const InfoPanel = lazy(() =>
  import("./components/InfoPanel").then((module) => ({
    default: module.InfoPanel,
  })),
);
const IndexPanel = lazy(() =>
  import("./components/IndexPanel").then((module) => ({
    default: module.IndexPanel,
  })),
);
const TrailPanel = lazy(() =>
  import("./components/TrailPanel").then((module) => ({
    default: module.TrailPanel,
  })),
);

const EMPTY: CatalogPayload = {
  generatedAt: "",
  source: "demo",
  atlas: { url: "", columns: 25, rows: 20, tileWidth: 96, tileHeight: 72 },
  items: [],
};

const DATASET =
  import.meta.env.VITE_DATASET === "nasa" ||
  (!import.meta.env.VITE_DATASET && import.meta.env.PROD)
    ? "nasa"
    : "demo";
const CATALOG_URL = `/datasets/${DATASET}/catalog.json`;
const firstTrailUrl = (locale: Locale) =>
  `/editorial/trails/${locale}/how-space-gets-its-colors.json`;
const FIELD_GUIDE_STORAGE_KEY = "deep-archive:field-guide";
const LEGACY_FIELD_GUIDE_STORAGE_KEY = "deep500:field-guide";

function hasSeenFieldGuide() {
  return (
    localStorage.getItem(FIELD_GUIDE_STORAGE_KEY) === "seen" ||
    localStorage.getItem(LEGACY_FIELD_GUIDE_STORAGE_KEY) === "seen"
  );
}

function rememberFieldGuide() {
  localStorage.setItem(FIELD_GUIDE_STORAGE_KEY, "seen");
  localStorage.removeItem(LEGACY_FIELD_GUIDE_STORAGE_KEY);
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(resolveInitialLocale);
  const [catalog, setCatalog] = useState<CatalogPayload>(EMPTY);
  const itemsRef = useRef<CatalogItem[]>([]);
  const shardCacheRef = useRef(new Map<string, Promise<DetailShard>>());
  const detailRequestRef = useRef(0);
  const trailRequestRef = useRef(0);
  const trailRestoreAttemptedRef = useRef(false);
  const trailLocaleRef = useRef(locale);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CatalogItem | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [touchExploring, setTouchExploring] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [activeSector, setActiveSector] = useState(0);
  const [onboardingVisible, setOnboardingVisible] = useState(
    () => !hasSeenFieldGuide(),
  );
  const [catalogReady, setCatalogReady] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [sectorTransition, setSectorTransition] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [quality, setQuality] = useState<RenderQuality>({
    label: "HIGH",
    pixelRatio: 1,
  });
  const [diagnostics, setDiagnostics] = useState<RenderDiagnostics | null>(
    null,
  );
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [trailOpen, setTrailOpen] = useState(false);
  const [trailStarted, setTrailStarted] = useState(false);
  const [trail, setTrail] = useState<EditorialTrail | null>(null);
  const [trailStep, setTrailStep] = useState(0);
  const [trailContent, setTrailContent] = useState<EducationalContent | null>(
    null,
  );
  const [trailLoading, setTrailLoading] = useState(false);
  const [trailError, setTrailError] = useState(false);


  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const toggle = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "d" &&
        !(event.target instanceof HTMLInputElement)
      ) {
        setDiagnosticsOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", toggle);
    return () => window.removeEventListener("keydown", toggle);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    fetch(CATALOG_URL, {
      signal: controller.signal,
      cache: "default",
      credentials: "omit",
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
        return response.json() as Promise<CatalogPayload>;
      })
      .then((payload) => {
        if (!payload.items?.length || !payload.atlas?.url)
          throw new Error("Catalog payload is incomplete.");
        itemsRef.current = payload.items;
        setCatalog(payload);
        const requestedSector = Number(
          new URL(window.location.href).searchParams.get("sector"),
        );
        const sectorCount = catalogSectors(payload).length;
        setActiveSector(
          Number.isInteger(requestedSector) && requestedSector > 0
            ? Math.min(requestedSector - 1, sectorCount - 1)
            : 0,
        );
        setCatalogReady(true);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setLoadError(true);
        }
      });
    return () => controller.abort();
  }, [catalogAttempt]);

  const loadBaseItem = useCallback(
    (base: CatalogItem, updateObjectUrl: boolean) => {
      if (!base) return;
      rememberFieldGuide();
      setOnboardingVisible(false);

      setSelectedId(base.id);
      if (updateObjectUrl) {
        const url = new URL(window.location.href);
        if (base.slug) url.searchParams.set("object", base.slug);
        else url.searchParams.delete("object");
        url.searchParams.delete("trail");
        url.searchParams.delete("step");
        window.history.replaceState(null, "", url);
      }
      setDetailError(false);
      if (!base.detailShard) {
        setSelectedDetail(base);
        setDetailLoading(false);
        return;
      }

      const requestId = ++detailRequestRef.current;
      setSelectedDetail(base);
      setDetailLoading(true);

      let shardPromise = shardCacheRef.current.get(base.detailShard);
      if (!shardPromise) {
        const shardUrl = safeDatasetPath(base.detailShard);
        if (!shardUrl) {
          setDetailLoading(false);
          setDetailError(true);
          return;
        }
        shardPromise = fetch(shardUrl, {
          cache: "default",
          credentials: "omit",
        })
          .then((response) => {
            if (!response.ok)
              throw new Error(`Detail shard HTTP ${response.status}`);
            return response.json() as Promise<DetailShard>;
          })
          .catch((error) => {
            shardCacheRef.current.delete(shardUrl);
            throw error;
          });
        shardCacheRef.current.set(shardUrl, shardPromise);
      }

      shardPromise
        .then((shard) => {
          if (requestId !== detailRequestRef.current) return;
          const detail = shard[String(base.id)];
          if (!detail)
            throw new Error(
              `Detail ${base.id} missing from ${base.detailShard}`,
            );
          const merged = { ...base, ...detail };
          setSelectedDetail(merged);
          setDetailLoading(false);
        })
        .catch((error) => {
          if (requestId !== detailRequestRef.current) return;
          if (import.meta.env.DEV) console.error(error);
          setSelectedDetail(base);
          setDetailLoading(false);
          setDetailError(true);
        });
    },
    [],
  );

  const handleSelectIndex = useCallback(
    (index: number) => {
      const base = itemsRef.current[index];
      if (base) {
        const sectorIndex = catalogSectors(catalog).findIndex(
          (sector) =>
            index >= sector.startIndex &&
            index < sector.startIndex + sector.itemCount,
        );
        if (sectorIndex >= 0) setActiveSector(sectorIndex);
        loadBaseItem(base, true);
      }
    },
    [catalog, loadBaseItem],
  );

  const closeDetail = useCallback(() => {
    detailRequestRef.current++;
    setSelectedId(null);
    setSelectedDetail(null);
    setDetailLoading(false);
    setDetailError(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("object");
    window.history.replaceState(null, "", url);
  }, []);

  const enterTrailStep = useCallback(
    (trailData: EditorialTrail, requestedStep: number) => {
      const nextStep = Math.min(
        Math.max(requestedStep, 0),
        trailData.steps.length - 1,
      );
      const catalogId = trailData.steps[nextStep]?.catalogId;
      const base = itemsRef.current.find((item) => item.id === catalogId);
      if (!base) {
        setTrailError(true);
        setTrailLoading(false);
        return;
      }

      const requestId = ++trailRequestRef.current;
      setTrailStep(nextStep);
      setTrailStarted(true);
      setTrailContent(null);
      setTrailError(false);
      setTrailLoading(true);
      loadBaseItem(base, false);

      const url = new URL(window.location.href);
      url.searchParams.delete("object");
      url.searchParams.set("trail", trailData.slug);
      url.searchParams.set("step", String(nextStep + 1));
      window.history.replaceState(null, "", url);

      fetch(
        `/editorial/objects/${trailData.locale}/${String(catalogId).padStart(3, "0")}.json`,
        { cache: "default", credentials: "omit" },
      )
        .then((response) => {
          if (!response.ok)
            throw new Error(`Editorial object HTTP ${response.status}`);
          return response.json() as Promise<EducationalContent>;
        })
        .then((content) => {
          if (requestId !== trailRequestRef.current) return;
          setTrailContent(content);
          setTrailLoading(false);
        })
        .catch((error) => {
          if (requestId !== trailRequestRef.current) return;
          if (import.meta.env.DEV) console.error(error);
          setTrailError(true);
          setTrailLoading(false);
        });
    },
    [loadBaseItem],
  );

  const openTrail = useCallback(
    (restoreStep?: number) => {
      const requestId = ++trailRequestRef.current;
      setInfoOpen(false);
      setIndexOpen(false);
      setTrailOpen(true);
      setTrailStarted(false);
      setTrail(null);
      setTrailContent(null);
      setTrailError(false);
      setTrailLoading(true);

      fetch(firstTrailUrl(locale), { cache: "default", credentials: "omit" })
        .then((response) => {
          if (!response.ok) throw new Error(`Trail HTTP ${response.status}`);
          return response.json() as Promise<EditorialTrail>;
        })
        .then((trailData) => {
          if (requestId !== trailRequestRef.current) return;
          setTrail(trailData);
          setTrailLoading(false);
          if (restoreStep != null) enterTrailStep(trailData, restoreStep);
          else {
            setSelectedId(null);
            setSelectedDetail(null);
            const url = new URL(window.location.href);
            url.searchParams.delete("object");
            url.searchParams.set("trail", trailData.slug);
            url.searchParams.delete("step");
            window.history.replaceState(null, "", url);
          }
        })
        .catch((error) => {
          if (requestId !== trailRequestRef.current) return;
          if (import.meta.env.DEV) console.error(error);
          setTrailError(true);
          setTrailLoading(false);
        });
    },
    [enterTrailStep, locale],
  );

  const closeTrail = useCallback(() => {
    trailRequestRef.current++;
    detailRequestRef.current++;
    setTrailOpen(false);
    setTrailStarted(false);
    setTrail(null);
    setTrailContent(null);
    setTrailLoading(false);
    setTrailError(false);
    setSelectedId(null);
    setSelectedDetail(null);
    setDetailLoading(false);
    setDetailError(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("trail");
    url.searchParams.delete("step");
    url.searchParams.delete("object");
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    if (trailLocaleRef.current === locale) return;
    trailLocaleRef.current = locale;
    if (!trailOpen) return;
    openTrail(trailStarted ? trailStep : undefined);
  }, [locale, openTrail, trailOpen, trailStarted, trailStep]);

  const visibleIndices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (activeCategory === "ALL" && !query) return null;
    return new Set(
      catalog.items
        .map((item, index) => {
          const categoryMatch =
            activeCategory === "ALL" || item.category === activeCategory;
          const text = [
            item.title,
            item.category,
            item.year,
            item.mission,
            ...(item.keywords ?? []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return categoryMatch && (!query || text.includes(query)) ? index : -1;
        })
        .filter((index) => index >= 0),
    );
  }, [activeCategory, catalog.items, searchQuery]);

  const sectors = useMemo(() => catalogSectors(catalog), [catalog]);
  const activeAtlas = sectors[activeSector] ?? sectors[0];
  const sectorStart = activeAtlas?.startIndex ?? 0;
  const sectorItems = useMemo(
    () =>
      catalog.items.slice(
        sectorStart,
        sectorStart + (activeAtlas?.itemCount ?? catalog.items.length),
      ),
    [activeAtlas?.itemCount, catalog.items, sectorStart],
  );
  const sectorVisibleIndices = useMemo(() => {
    if (visibleIndices == null) return null;
    const local = new Set<number>();
    for (const globalIndex of visibleIndices) {
      const localIndex = globalIndex - sectorStart;
      if (localIndex >= 0 && localIndex < sectorItems.length)
        local.add(localIndex);
    }
    return local;
  }, [sectorItems.length, sectorStart, visibleIndices]);

  const changeSector = useCallback(
    (direction: -1 | 1) => {
      const next = Math.min(
        sectors.length - 1,
        Math.max(0, activeSector + direction),
      );
      if (next === activeSector) return;
      setSectorTransition(true);
      setActiveSector(next);
      setHoveredId(null);
    },
    [activeSector, sectors.length],
  );

  useEffect(() => {
    if (!catalogReady) return;
    const url = new URL(window.location.href);
    if (activeSector === 0) url.searchParams.delete("sector");
    else url.searchParams.set("sector", String(activeSector + 1));
    window.history.replaceState(null, "", url);
  }, [activeSector, catalogReady]);

  useEffect(() => {
    if (visibleIndices == null || visibleIndices.size === 0) return;
    const sectorHasMatch = [...visibleIndices].some(
      (index) =>
        index >= sectorStart && index < sectorStart + sectorItems.length,
    );
    if (sectorHasMatch) return;
    const firstMatch = Math.min(...visibleIndices);
    const matchSector = sectors.findIndex(
      (sector) =>
        firstMatch >= sector.startIndex &&
        firstMatch < sector.startIndex + sector.itemCount,
    );
    if (matchSector >= 0) setActiveSector(matchSector);
  }, [activeCategory, searchQuery, sectorItems.length, sectorStart, sectors, visibleIndices]);

  const handleSectorHoverIndex = useCallback(
    (localIndex: number | null) => {
      const item =
        localIndex == null
          ? undefined
          : itemsRef.current[sectorStart + localIndex];
      setHoveredId(item?.id ?? null);
    },
    [sectorStart],
  );

  const handleSectorSelectIndex = useCallback(
    (localIndex: number) => handleSelectIndex(sectorStart + localIndex),
    [handleSelectIndex, sectorStart],
  );

  useEffect(() => {
    if (!catalogReady || selectedId != null) return;
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has("trail")) return;
    const slug = currentUrl.searchParams.get("object");
    if (!slug) return;
    const index = catalog.items.findIndex((item) => item.slug === slug);
    if (index >= 0) handleSelectIndex(index);
  }, [catalog.items, catalogReady, handleSelectIndex, selectedId]);

  useEffect(() => {
    if (!catalogReady || trailRestoreAttemptedRef.current) return;
    trailRestoreAttemptedRef.current = true;
    const url = new URL(window.location.href);
    if (url.searchParams.get("trail") !== "how-space-gets-its-colors") return;
    const rawStep = Number(url.searchParams.get("step"));
    openTrail(
      Number.isFinite(rawStep) && rawStep > 0 ? rawStep - 1 : undefined,
    );
  }, [catalogReady, openTrail]);

  const navigateDetail = useCallback(
    (direction: -1 | 1) => {
      if (selectedId == null) return;
      const visible = catalog.items.filter(
        (_, index) => visibleIndices == null || visibleIndices.has(index),
      );
      const position = visible.findIndex((item) => item.id === selectedId);
      const next =
        visible[(position + direction + visible.length) % visible.length];
      if (next)
        handleSelectIndex(
          catalog.items.findIndex((item) => item.id === next.id),
        );
    },
    [catalog.items, handleSelectIndex, selectedId, visibleIndices],
  );

  const categories = useMemo(
    () =>
      [
        ...new Set(catalog.items.map((item) => item.category).filter(Boolean)),
      ].slice(0, 8),
    [catalog.items],
  );

  const hovered = useMemo<CatalogItem | null>(() => {
    if (hoveredId == null) return null;
    return catalog.items.find((item) => item.id === hoveredId) ?? null;
  }, [catalog.items, hoveredId]);

  const selectedBase = useMemo(() => {
    if (selectedId == null) return null;
    return catalog.items.find((item) => item.id === selectedId) ?? null;
  }, [catalog.items, selectedId]);

  const selected = selectedDetail ?? selectedBase;
  const selectedGlobalIndex = selected
    ? catalog.items.findIndex((item) => item.id === selected.id)
    : -1;
  const selectedAtlas = atlasForIndex(
    catalog,
    Math.max(0, selectedGlobalIndex),
  );
  const visibleCount = visibleIndices?.size ?? catalog.items.length;
  const ready = catalogReady && rendererReady;

  const changeLocale = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
    try {
      localStorage.setItem("deep:locale", nextLocale);
    } catch {
      /* optional preference */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, text: ui[locale] }}>
      <main className={`app-shell ${ready ? "is-ready" : ""}`}>
        {catalogReady && (
          <SpaceArchiveCanvas
            key={activeAtlas.url}
            atlas={activeAtlas}
            itemCount={sectorItems.length}
            visibleIndices={sectorVisibleIndices}
            onHoverIndex={handleSectorHoverIndex}
            onSelectIndex={handleSectorSelectIndex}
            onReady={() => {
              setRendererReady(true);
              setSectorTransition(false);
            }}
            onQualityChange={setQuality}
            onError={() => {
              setRendererReady(true);
              setSectorTransition(false);
              setLoadError(false);
            }}
            onDiagnostics={setDiagnostics}
            diagnosticsEnabled={import.meta.env.DEV && diagnosticsOpen}
            onSectorChange={sectors.length > 1 ? changeSector : undefined}
            onTouchExploringChange={setTouchExploring}
          />
        )}

        {sectorTransition && (
          <div
            className="sector-transition"
            role="status"
            aria-live="polite"
            aria-label={ui[locale].loadingAtlas}
          >
            <span>{ui[locale].loadingAtlas}</span>
          </div>
        )}

        {ready &&
          sectors.length > 1 &&
          !selected &&
          !infoOpen &&
          !indexOpen &&
          !trailOpen && (
            <nav
              className={`sector-nav ${touchExploring ? "is-touch-exploring" : ""}`}
              aria-label={ui[locale].archiveSectors}
              aria-hidden={touchExploring || undefined}
            >
              <button
                type="button"
                onClick={() => changeSector(-1)}
                disabled={activeSector === 0}
                aria-label={ui[locale].previousSector}
              >
                <span className="sector-nav__arrow sector-nav__arrow--up" aria-hidden="true" />
              </button>
              <span aria-live="polite">
                <b>{String(sectorStart + 1).padStart(4, "0")}</b>
                <i>—</i>
                <b>
                  {String(sectorStart + sectorItems.length).padStart(4, "0")}
                </b>
                <small>
                  {activeSector + 1} / {sectors.length}
                </small>
              </span>
              <button
                type="button"
                onClick={() => changeSector(1)}
                disabled={activeSector === sectors.length - 1}
                aria-label={ui[locale].nextSector}
              >
                <span className="sector-nav__arrow sector-nav__arrow--down" aria-hidden="true" />
              </button>
            </nav>
          )}

        <Hud
          hovered={hovered}
          source={catalog.source}
          categories={categories}
          activeCategory={activeCategory}
          visibleCount={visibleCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCategoryChange={setActiveCategory}
          onOpenInfo={() => setInfoOpen(true)}
          onOpenIndex={() => setIndexOpen(true)}
          onOpenTrail={() => openTrail()}
          onboardingVisible={ready && onboardingVisible}
          onDismissOnboarding={() => {
            rememberFieldGuide();
            setOnboardingVisible(false);
          }}
          locale={locale}
          onLocaleChange={changeLocale}
        />
        <FieldCursor
          active={
            hovered != null &&
            selected == null &&
            !infoOpen &&
            !indexOpen &&
            !trailOpen
          }
        />
        <TouchPreview
          atlas={activeAtlas}
          item={hovered}
          atlasIndex={
            hovered
              ? catalog.items.findIndex((item) => item.id === hovered.id) -
                sectorStart
              : null
          }
          active={
            hovered != null &&
            selected == null &&
            !infoOpen &&
            !indexOpen &&
            !trailOpen
          }
        />

        {!ready && !loadError && (
          <div className="boot-screen" aria-live="polite">
            <div className="boot-mark" />
            <p>
              {catalogReady
                ? ui[locale].loadingAtlas
                : ui[locale].loadingCatalog}
            </p>
            <div className="boot-progress" aria-hidden="true">
              <span />
            </div>
          </div>
        )}

        {loadError && (
          <div className="boot-screen boot-screen--error" role="alert">
            <p>{ui[locale].unavailable}</p>
            <span>
              Dataset “{DATASET}” {ui[locale].datasetError}
            </span>
            <button
              type="button"
              onClick={() => setCatalogAttempt((attempt) => attempt + 1)}
            >
              {ui[locale].retryConnection}
            </button>
          </div>
        )}

        {import.meta.env.DEV && diagnosticsOpen && diagnostics && (
          <aside
            className="diagnostics"
            aria-label={
              locale === "es"
                ? "Diagnóstico del renderizador"
                : "Renderer diagnostics"
            }
          >
            <strong>
              {locale === "es" ? "CAMPO DE RENDERIZADO" : "RENDER FIELD"}
            </strong>
            <span>
              {diagnostics.active
                ? locale === "es"
                  ? "ACTIVO"
                  : "ACTIVE"
                : locale === "es"
                  ? "EN REPOSO"
                  : "SLEEPING"}
            </span>
            <span>
              {diagnostics.fps.toFixed(0)} FPS /{" "}
              {diagnostics.frameTime.toFixed(1)} MS
            </span>
            <span>
              {diagnostics.width}×{diagnostics.height} /{" "}
              {diagnostics.pixelRatio.toFixed(2)} DPR
            </span>
            <span>
              {quality.label} / {diagnostics.drawCalls} CALL /{" "}
              {diagnostics.triangles.toLocaleString()} TRI /{" "}
              {diagnostics.textures} TEX
            </span>
            <span>
              {Math.round((activeAtlas.bytes ?? 0) / 1024)} KB /{" "}
              {activeAtlas.columns * activeAtlas.tileWidth}×
              {activeAtlas.rows * activeAtlas.tileHeight}
            </span>
          </aside>
        )}

        <Suspense fallback={null}>
          {selected && !trailOpen && (
            <DetailPanel
              item={selected}
              atlas={selectedAtlas.atlas}
              atlasIndex={selectedAtlas.localIndex}
              metadataLoading={detailLoading}
              metadataError={detailError}
              position={
                catalog.items.findIndex((item) => item.id === selected.id) + 1
              }
              total={catalog.items.length}
              onRetry={() =>
                handleSelectIndex(
                  catalog.items.findIndex((item) => item.id === selected.id),
                )
              }
              onNavigate={navigateDetail}
              onClose={closeDetail}
            />
          )}
          {trailOpen && (
            <TrailPanel
              trail={trail}
              item={selected}
              content={trailContent}
              atlas={selectedAtlas.atlas}
              atlasIndex={selectedAtlas.localIndex}
              step={trailStep}
              started={trailStarted}
              loading={trailLoading || detailLoading}
              error={trailError || detailError}
              onStart={() => trail && enterTrailStep(trail, 0)}
              onRetry={() =>
                trail ? enterTrailStep(trail, trailStep) : openTrail()
              }
              onNavigate={(direction) =>
                trail && enterTrailStep(trail, trailStep + direction)
              }
              onSelectStep={(step) => trail && enterTrailStep(trail, step)}
              onClose={closeTrail}
            />
          )}
          {infoOpen && (
            <InfoPanel
              catalog={catalog}
              quality={quality}
              onClose={() => setInfoOpen(false)}
            />
          )}
          {indexOpen && (
            <IndexPanel
              items={catalog.items}
              atlases={sectors}
              onSelect={handleSelectIndex}
              onClose={() => setIndexOpen(false)}
            />
          )}
        </Suspense>
      </main>
    </I18nContext.Provider>
  );
}
