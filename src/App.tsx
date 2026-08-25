import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CatalogItem,
  RenderDiagnostics,
  RenderQuality,
} from "./types/catalog";
import { SpaceArchiveCanvas } from "./components/SpaceArchiveCanvas";
import { Hud } from "./components/Hud";
import { FieldCursor } from "./components/FieldCursor";
import { TouchPreview } from "./components/TouchPreview";
import type {
  EducationalContent,
  EditorialTrail,
  EditorialTrailSummary,
} from "./types/editorial";
import { atlasForIndex, catalogSectors } from "./utils/atlas";
import { I18nContext, resolveInitialLocale, ui, type Locale } from "./i18n";
import { DATASET, editorialObjectUrl, trailUrl } from "./config/archive";
import { fetchJson } from "./services/http";
import { useCatalog } from "./hooks/useCatalog";
import { useDetailSelection } from "./hooks/useDetailSelection";
import {
  localMatchingIndices,
  matchingIndices,
  relatedCatalogItems,
} from "./features/archive/selectors";
import {
  hasSeenFieldGuide,
  rememberFieldGuide,
} from "./features/onboarding/storage";
import {
  DetailPanel,
  IndexPanel,
  InfoPanel,
  TrailMenu,
  TrailPanel,
} from "./app/lazyPanels";

function ModuleLoadingOverlay({ locale }: { locale: Locale }) {
  return (
    <div className="module-loading" role="status" aria-live="polite">
      <div className="module-loading__field" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} style={{ animationDelay: `${-index * 0.19}s` }} />
        ))}
      </div>
      <span>{locale === "es" ? "CARGANDO MÓDULO" : "LOADING MODULE"}</span>
    </div>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(resolveInitialLocale);
  const {
    catalog,
    itemsRef,
    activeSector,
    setActiveSector,
    catalogReady,
    loadError,
    clearLoadError,
    retryCatalog,
  } = useCatalog();
  const trailRequestRef = useRef(0);
  const trailMenuRequestRef = useRef(0);
  const trailRestoreAttemptedRef = useRef(false);
  const trailLocaleRef = useRef(locale);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [touchExploring, setTouchExploring] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(
    () => !hasSeenFieldGuide(),
  );
  const [rendererReady, setRendererReady] = useState(false);
  const [sectorTransition, setSectorTransition] = useState(false);
  const [quality, setQuality] = useState<RenderQuality>({
    label: "HIGH",
    pixelRatio: 1,
  });
  const [diagnostics, setDiagnostics] = useState<RenderDiagnostics | null>(
    null,
  );
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [trailOpen, setTrailOpen] = useState(false);
  const [trailMenuOpen, setTrailMenuOpen] = useState(false);
  const [trailSummaries, setTrailSummaries] = useState<EditorialTrailSummary[]>([]);
  const [trailMenuLoading, setTrailMenuLoading] = useState(false);
  const [trailMenuError, setTrailMenuError] = useState(false);
  const [trailStarted, setTrailStarted] = useState(false);
  const [trail, setTrail] = useState<EditorialTrail | null>(null);
  const [trailStep, setTrailStep] = useState(0);
  const [trailContent, setTrailContent] = useState<EducationalContent | null>(
    null,
  );
  const [trailLoading, setTrailLoading] = useState(false);
  const [trailError, setTrailError] = useState(false);

  const engageArchive = useCallback(() => {
    rememberFieldGuide();
    setOnboardingVisible(false);
  }, []);
  const {
    selectedId,
    selected,
    detailLoading,
    detailError,
    loadBaseItem,
    handleSelectIndex,
    closeDetail,
    resetSelection,
  } = useDetailSelection({ catalog, itemsRef, setActiveSector, onEngage: engageArchive });


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

      fetchJson<EducationalContent>(editorialObjectUrl(trailData.locale, catalogId))
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
    (slug = "how-space-gets-its-colors", restoreStep?: number) => {
      const requestId = ++trailRequestRef.current;
      setInfoOpen(false);
      setIndexOpen(false);
      setTrailMenuOpen(false);
      setTrailOpen(true);
      setTrailStarted(false);
      setTrail(null);
      setTrailContent(null);
      setTrailError(false);
      setTrailLoading(true);

      fetchJson<EditorialTrail>(trailUrl(locale, slug))
        .then((trailData) => {
          if (requestId !== trailRequestRef.current) return;
          setTrail(trailData);
          setTrailLoading(false);
          if (restoreStep != null) enterTrailStep(trailData, restoreStep);
          else {
            resetSelection(false);
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
    [enterTrailStep, locale, resetSelection],
  );

  const openTrailMenu = useCallback(() => {
    setInfoOpen(false);
    setIndexOpen(false);
    setTrailMenuOpen(true);
    setTrailMenuError(false);
    if (trailSummaries.some((entry) => entry.locale === locale)) return;
    const requestId = ++trailMenuRequestRef.current;
    setTrailMenuLoading(true);
    fetchJson<{ trails: EditorialTrailSummary[] }>("/editorial/manifest.json")
      .then((manifest) => {
        if (requestId !== trailMenuRequestRef.current) return;
        setTrailSummaries(manifest.trails.filter((entry) => entry.locale === locale));
        setTrailMenuLoading(false);
      })
      .catch((error) => {
        if (requestId !== trailMenuRequestRef.current) return;
        if (import.meta.env.DEV) console.error(error);
        setTrailMenuLoading(false);
        setTrailMenuError(true);
      });
  }, [locale, trailSummaries.length]);

  const closeTrail = useCallback(() => {
    trailRequestRef.current++;
    setTrailOpen(false);
    setTrailStarted(false);
    setTrail(null);
    setTrailContent(null);
    setTrailLoading(false);
    setTrailError(false);
    resetSelection(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("trail");
    url.searchParams.delete("step");
    url.searchParams.delete("object");
    window.history.replaceState(null, "", url);
  }, [resetSelection]);

  useEffect(() => {
    if (trailLocaleRef.current === locale) return;
    trailLocaleRef.current = locale;
    if (!trailOpen) return;
    openTrail(trail?.slug, trailStarted ? trailStep : undefined);
  }, [locale, openTrail, trail, trailOpen, trailStarted, trailStep]);

  useEffect(() => {
    trailMenuRequestRef.current++;
    setTrailSummaries([]);
    setTrailMenuOpen(false);
  }, [locale]);

  const visibleIndices = useMemo(
    () => matchingIndices(catalog.items, activeCategory, searchQuery),
    [activeCategory, catalog.items, searchQuery],
  );

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
  const sectorVisibleIndices = useMemo(
    () => localMatchingIndices(visibleIndices, sectorStart, sectorItems.length),
    [sectorItems.length, sectorStart, visibleIndices],
  );

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
    const trailSlug = url.searchParams.get("trail");
    if (!trailSlug) return;
    const rawStep = Number(url.searchParams.get("step"));
    openTrail(
      trailSlug,
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

  const selectedGlobalIndex = selected
    ? catalog.items.findIndex((item) => item.id === selected.id)
    : -1;
  const selectedAtlas = atlasForIndex(
    catalog,
    Math.max(0, selectedGlobalIndex),
  );
  const relatedItems = useMemo(
    () => relatedCatalogItems(catalog, selected),
    [catalog, selected],
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
              clearLoadError();
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
          !trailOpen &&
          !trailMenuOpen && (
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
          onOpenTrail={openTrailMenu}
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
            !trailOpen &&
            !trailMenuOpen
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
            !trailOpen &&
            !trailMenuOpen
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
              onClick={retryCatalog}
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

        <Suspense fallback={<ModuleLoadingOverlay locale={locale} />}>
          {selected && !trailOpen && !trailMenuOpen && (
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
              relatedItems={relatedItems}
              onSelectRelated={(id) => {
                const index = catalog.items.findIndex((item) => item.id === id);
                if (index >= 0) handleSelectIndex(index);
              }}
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
          {trailMenuOpen && (
            <TrailMenu
              trails={trailSummaries}
              loading={trailMenuLoading}
              error={trailMenuError}
              onSelect={(slug) => openTrail(slug)}
              onRetry={() => {
                setTrailSummaries([]);
                setTrailMenuOpen(false);
                requestAnimationFrame(openTrailMenu);
              }}
              onClose={() => setTrailMenuOpen(false)}
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
