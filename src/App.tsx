import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItem, CatalogPayload, DetailShard, RenderDiagnostics, RenderQuality } from './types/catalog';
import { SpaceArchiveCanvas } from './components/SpaceArchiveCanvas';
import { DetailPanel } from './components/DetailPanel';
import { Hud } from './components/Hud';
import { InfoPanel } from './components/InfoPanel';
import { IndexPanel } from './components/IndexPanel';
import { FieldCursor } from './components/FieldCursor';
import { TrailPanel } from './components/TrailPanel';
import type { EducationalContent, EditorialTrail } from './types/editorial';

const EMPTY: CatalogPayload = {
  generatedAt: '',
  source: 'demo',
  atlas: { url: '', columns: 25, rows: 20, tileWidth: 96, tileHeight: 72 },
  items: [],
};

const DATASET = import.meta.env.VITE_DATASET === 'nasa' || (!import.meta.env.VITE_DATASET && import.meta.env.PROD) ? 'nasa' : 'demo';
const CATALOG_URL = `/datasets/${DATASET}/catalog.json`;
const FIRST_TRAIL_URL = '/editorial/trails/en/how-space-gets-its-colors.json';

export default function App() {
  const [catalog, setCatalog] = useState<CatalogPayload>(EMPTY);
  const itemsRef = useRef<CatalogItem[]>([]);
  const shardCacheRef = useRef(new Map<string, Promise<DetailShard>>());
  const detailRequestRef = useRef(0);
  const trailRequestRef = useRef(0);
  const trailRestoreAttemptedRef = useRef(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CatalogItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [onboardingVisible, setOnboardingVisible] = useState(() => localStorage.getItem('deep500:field-guide') !== 'seen');
  const [catalogReady, setCatalogReady] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [atlasProgress, setAtlasProgress] = useState(0);
  const [quality, setQuality] = useState<RenderQuality>({ label: 'HIGH', pixelRatio: 1 });
  const [diagnostics, setDiagnostics] = useState<RenderDiagnostics | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [trailOpen, setTrailOpen] = useState(false);
  const [trailStarted, setTrailStarted] = useState(false);
  const [trail, setTrail] = useState<EditorialTrail | null>(null);
  const [trailStep, setTrailStep] = useState(0);
  const [trailContent, setTrailContent] = useState<EducationalContent | null>(null);
  const [trailLoading, setTrailLoading] = useState(false);
  const [trailError, setTrailError] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const toggle = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'd' && !(event.target instanceof HTMLInputElement)) {
        setDiagnosticsOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', toggle);
    return () => window.removeEventListener('keydown', toggle);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    fetch(CATALOG_URL, { signal: controller.signal, cache: 'default', credentials: 'omit' })
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
        return response.json() as Promise<CatalogPayload>;
      })
      .then((payload) => {
        if (!payload.items?.length || !payload.atlas?.url) throw new Error('Catalog payload is incomplete.');
        itemsRef.current = payload.items;
        setCatalog(payload);
        setCatalogReady(true);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
          setLoadError(true);
        }
      });
    return () => controller.abort();
  }, [catalogAttempt]);

  const handleHoverIndex = useCallback((index: number | null) => {
    const item = index == null ? undefined : itemsRef.current[index];
    setHoveredId(item?.id ?? null);
  }, []);

  const loadBaseItem = useCallback((base: CatalogItem, updateObjectUrl: boolean) => {
    if (!base) return;
    localStorage.setItem('deep500:field-guide', 'seen');
    setOnboardingVisible(false);

    setSelectedId(base.id);
    if (updateObjectUrl) {
      const url = new URL(window.location.href);
      if (base.slug) url.searchParams.set('object', base.slug);
      else url.searchParams.delete('object');
      url.searchParams.delete('trail');
      url.searchParams.delete('step');
      window.history.replaceState(null, '', url);
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
      const shardUrl = base.detailShard;
      shardPromise = fetch(shardUrl, { cache: 'default', credentials: 'omit' })
        .then((response) => {
          if (!response.ok) throw new Error(`Detail shard HTTP ${response.status}`);
          return response.json() as Promise<DetailShard>;
        })
        .catch((error) => {
          shardCacheRef.current.delete(shardUrl);
          throw error;
        });
      shardCacheRef.current.set(shardUrl, shardPromise);
    }

    shardPromise.then((shard) => {
        if (requestId !== detailRequestRef.current) return;
        const detail = shard[String(base.id)];
        if (!detail) throw new Error(`Detail ${base.id} missing from ${base.detailShard}`);
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
  }, []);

  const handleSelectIndex = useCallback((index: number) => {
    const base = itemsRef.current[index];
    if (base) loadBaseItem(base, true);
  }, [loadBaseItem]);

  const closeDetail = useCallback(() => {
    detailRequestRef.current++;
    setSelectedId(null);
    setSelectedDetail(null);
    setDetailLoading(false);
    setDetailError(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('object');
    window.history.replaceState(null, '', url);
  }, []);

  const enterTrailStep = useCallback((trailData: EditorialTrail, requestedStep: number) => {
    const nextStep = Math.min(Math.max(requestedStep, 0), trailData.steps.length - 1);
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
    url.searchParams.delete('object');
    url.searchParams.set('trail', trailData.slug);
    url.searchParams.set('step', String(nextStep + 1));
    window.history.replaceState(null, '', url);

    fetch(`/editorial/objects/${trailData.locale}/${String(catalogId).padStart(3, '0')}.json`, { cache: 'default', credentials: 'omit' })
      .then((response) => {
        if (!response.ok) throw new Error(`Editorial object HTTP ${response.status}`);
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
  }, [loadBaseItem]);

  const openTrail = useCallback((restoreStep?: number) => {
    const requestId = ++trailRequestRef.current;
    setInfoOpen(false);
    setIndexOpen(false);
    setTrailOpen(true);
    setTrailStarted(false);
    setTrail(null);
    setTrailContent(null);
    setTrailError(false);
    setTrailLoading(true);

    fetch(FIRST_TRAIL_URL, { cache: 'default', credentials: 'omit' })
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
          url.searchParams.delete('object');
          url.searchParams.set('trail', trailData.slug);
          url.searchParams.delete('step');
          window.history.replaceState(null, '', url);
        }
      })
      .catch((error) => {
        if (requestId !== trailRequestRef.current) return;
        if (import.meta.env.DEV) console.error(error);
        setTrailError(true);
        setTrailLoading(false);
      });
  }, [enterTrailStep]);

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
    url.searchParams.delete('trail');
    url.searchParams.delete('step');
    url.searchParams.delete('object');
    window.history.replaceState(null, '', url);
  }, []);

  const visibleIndices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (activeCategory === 'ALL' && !query) return null;
    return new Set(catalog.items.map((item, index) => {
      const categoryMatch = activeCategory === 'ALL' || item.category === activeCategory;
      const text = [item.title, item.category, item.year, item.mission, ...(item.keywords ?? [])].filter(Boolean).join(' ').toLowerCase();
      return categoryMatch && (!query || text.includes(query)) ? index : -1;
    }).filter((index) => index >= 0));
  }, [activeCategory, catalog.items, searchQuery]);

  useEffect(() => {
    if (!catalogReady || selectedId != null) return;
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has('trail')) return;
    const slug = currentUrl.searchParams.get('object');
    if (!slug) return;
    const index = catalog.items.findIndex((item) => item.slug === slug);
    if (index >= 0) handleSelectIndex(index);
  }, [catalog.items, catalogReady, handleSelectIndex, selectedId]);

  useEffect(() => {
    if (!catalogReady || trailRestoreAttemptedRef.current) return;
    trailRestoreAttemptedRef.current = true;
    const url = new URL(window.location.href);
    if (url.searchParams.get('trail') !== 'how-space-gets-its-colors') return;
    const rawStep = Number(url.searchParams.get('step'));
    openTrail(Number.isFinite(rawStep) && rawStep > 0 ? rawStep - 1 : undefined);
  }, [catalogReady, openTrail]);

  const navigateDetail = useCallback((direction: -1 | 1) => {
    if (selectedId == null) return;
    const visible = catalog.items.filter((_, index) => visibleIndices == null || visibleIndices.has(index));
    const position = visible.findIndex((item) => item.id === selectedId);
    const next = visible[(position + direction + visible.length) % visible.length];
    if (next) handleSelectIndex(catalog.items.findIndex((item) => item.id === next.id));
  }, [catalog.items, handleSelectIndex, selectedId, visibleIndices]);

  const categories = useMemo(
    () => [...new Set(catalog.items.map((item) => item.category).filter(Boolean))].slice(0, 8),
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
  const visibleCount = visibleIndices?.size ?? catalog.items.length;
  const bootProgress = catalogReady ? Math.max(8, Math.round(atlasProgress * 100)) : 4;
  const ready = catalogReady && rendererReady;

  return (
    <main className={`app-shell ${ready ? 'is-ready' : ''}`}>
      {catalogReady && (
        <SpaceArchiveCanvas
          atlas={catalog.atlas}
          itemCount={catalog.items.length}
          visibleIndices={visibleIndices}
          onHoverIndex={handleHoverIndex}
          onSelectIndex={handleSelectIndex}
          onReady={() => setRendererReady(true)}
          onProgress={setAtlasProgress}
          onQualityChange={setQuality}
          onError={() => { setRendererReady(true); setLoadError(false); }}
          onDiagnostics={setDiagnostics}
          diagnosticsEnabled={import.meta.env.DEV && diagnosticsOpen}
        />
      )}

      <Hud
        hovered={hovered}
        source={catalog.source}
        categories={categories}
        activeCategory={activeCategory}
        visibleCount={visibleCount}
        quality={quality}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCategoryChange={setActiveCategory}
        onOpenInfo={() => setInfoOpen(true)}
        onOpenIndex={() => setIndexOpen(true)}
        onOpenTrail={() => openTrail()}
        onboardingVisible={ready && onboardingVisible}
        onDismissOnboarding={() => { localStorage.setItem('deep500:field-guide', 'seen'); setOnboardingVisible(false); }}
      />
      <FieldCursor active={hovered != null && selected == null && !infoOpen && !indexOpen && !trailOpen} />

      {!ready && !loadError && (
        <div className="boot-screen" aria-live="polite">
          <div className="boot-mark" />
          <p>INITIALIZING VISUAL FIELD / {String(bootProgress).padStart(2, '0')}%</p>
          <div className="boot-progress"><span style={{ transform: `scaleX(${bootProgress / 100})` }} /></div>
        </div>
      )}

      {loadError && (
        <div className="boot-screen boot-screen--error" role="alert">
          <p>CATALOG UNAVAILABLE</p>
          <span>Dataset “{DATASET}” could not be loaded.</span>
          <button type="button" onClick={() => setCatalogAttempt((attempt) => attempt + 1)}>RETRY CONNECTION</button>
        </div>
      )}

      {import.meta.env.DEV && diagnosticsOpen && diagnostics && (
        <aside className="diagnostics" aria-label="Renderer diagnostics">
          <strong>RENDER FIELD</strong>
          <span>{diagnostics.active ? 'ACTIVE' : 'SLEEPING'}</span>
          <span>{diagnostics.fps.toFixed(0)} FPS / {diagnostics.frameTime.toFixed(1)} MS</span>
          <span>{diagnostics.width}×{diagnostics.height} / {diagnostics.pixelRatio.toFixed(2)} DPR</span>
          <span>{quality.label} / {diagnostics.drawCalls} CALL / {diagnostics.triangles.toLocaleString()} TRI / {diagnostics.textures} TEX</span>
          <span>{Math.round((catalog.atlas.bytes ?? 0) / 1024)} KB / {catalog.atlas.columns * catalog.atlas.tileWidth}×{catalog.atlas.rows * catalog.atlas.tileHeight}</span>
        </aside>
      )}

      {selected && !trailOpen && <DetailPanel item={selected} atlas={catalog.atlas} metadataLoading={detailLoading} metadataError={detailError} position={catalog.items.findIndex((item) => item.id === selected.id) + 1} total={catalog.items.length} onRetry={() => handleSelectIndex(catalog.items.findIndex((item) => item.id === selected.id))} onNavigate={navigateDetail} onClose={closeDetail} />}
      {trailOpen && (
        <TrailPanel
          trail={trail}
          item={selected}
          content={trailContent}
          atlas={catalog.atlas}
          step={trailStep}
          started={trailStarted}
          loading={trailLoading || detailLoading}
          error={trailError || detailError}
          onStart={() => trail && enterTrailStep(trail, 0)}
          onRetry={() => trail ? enterTrailStep(trail, trailStep) : openTrail()}
          onNavigate={(direction) => trail && enterTrailStep(trail, trailStep + direction)}
          onSelectStep={(step) => trail && enterTrailStep(trail, step)}
          onClose={closeTrail}
        />
      )}
      {infoOpen && <InfoPanel catalog={catalog} quality={quality} onClose={() => setInfoOpen(false)} />}
      {indexOpen && <IndexPanel items={catalog.items} atlas={catalog.atlas} onSelect={handleSelectIndex} onClose={() => setIndexOpen(false)} />}
    </main>
  );
}
