import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { CatalogItem, CatalogPayload } from "../types/catalog";
import type { EducationalContent, EditorialTrail } from "../types/editorial";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { ObservationGrid } from "./ObservationGrid";
import { TrailIntroSignal } from "./TrailIntroSignal";
import { safeExternalUrl } from "../utils/security";
import { editorialStatusLabel, useI18n } from "../i18n";
import { atlasPosition } from "../utils/atlas";

type Props = {
  trail: EditorialTrail | null;
  item: CatalogItem | null;
  content: EducationalContent | null;
  atlas: CatalogPayload["atlas"];
  atlasIndex: number;
  step: number;
  started: boolean;
  loading: boolean;
  error: boolean;
  onStart: () => void;
  onRetry: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onSelectStep: (step: number) => void;
  onClose: () => void;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function TrailPanel({
  trail,
  item,
  content,
  atlas,
  atlasIndex,
  step,
  started,
  loading,
  error,
  onStart,
  onRetry,
  onNavigate,
  onSelectStep,
  onClose,
}: Props) {
  const { locale } = useI18n();
  const es = locale === "es";
  const localizedContent = content?.locale === locale ? content : null;
  const panelRef = useRef<HTMLElement | null>(null);
  const visualRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const explanationRef = useRef<HTMLDivElement | null>(null);
  const orientationFullscreenRef = useRef(false);
  const rotateHintTimeoutRef = useRef<number | null>(null);
  const viewSwitchTimeoutRef = useRef<number | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [guideCollapsed, setGuideCollapsed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [rotateHintVisible, setRotateHintVisible] = useState(false);
  const [observationBounds, setObservationBounds] = useState<CSSProperties>();
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 0, y: 0 });
  const [zoomHintVisible, setZoomHintVisible] = useState(false);
  const [visualGuidesVisible, setVisualGuidesVisible] = useState(true);
  const [viewSwitching, setViewSwitching] = useState(false);
  useDialogFocus(panelRef, onClose, closeRef);

  const releaseForcedLandscape = () => {
    if (rotateHintTimeoutRef.current !== null) {
      window.clearTimeout(rotateHintTimeoutRef.current);
      rotateHintTimeoutRef.current = null;
    }
    setRotateHintVisible(false);
    const orientation = screen.orientation as LockableOrientation | undefined;
    orientation?.unlock?.();
    if (
      orientationFullscreenRef.current &&
      document.fullscreenElement === panelRef.current
    )
      void document.exitFullscreen().catch(() => undefined);
    orientationFullscreenRef.current = false;
  };

  useEffect(
    () => () => {
      if (rotateHintTimeoutRef.current !== null)
        window.clearTimeout(rotateHintTimeoutRef.current);
      if (viewSwitchTimeoutRef.current !== null)
        window.clearTimeout(viewSwitchTimeoutRef.current);
      const orientation = screen.orientation as LockableOrientation | undefined;
      orientation?.unlock?.();
      if (
        orientationFullscreenRef.current &&
        document.fullscreenElement === panelRef.current
      )
        void document.exitFullscreen().catch(() => undefined);
    },
    [],
  );

  useEffect(() => {
    if (rotateHintTimeoutRef.current !== null) {
      window.clearTimeout(rotateHintTimeoutRef.current);
      rotateHintTimeoutRef.current = null;
    }
    setRevealed(false);
    setImmersive(false);
    setGuideCollapsed(false);
    setImageLoaded(false);
    setImageFailed(false);
    setLinkCopied(false);
    setRotateHintVisible(false);
    setObservationBounds(undefined);
    setZoomScale(1);
    setZoomHintVisible(false);
    setVisualGuidesVisible(true);
    setViewSwitching(false);
    if (viewSwitchTimeoutRef.current !== null) {
      window.clearTimeout(viewSwitchTimeoutRef.current);
      viewSwitchTimeoutRef.current = null;
    }
    activePointersRef.current.clear();
    pinchStartRef.current = null;
  }, [item?.id]);

  const updateObservationBounds = useCallback(() => {
    const visual = visualRef.current;
    const image = imageRef.current;
    if (!visual || !image?.naturalWidth || !image.naturalHeight) return;
    const containerWidth = visual.clientWidth;
    const containerHeight = visual.clientHeight;
    const scale = guideCollapsed && visualGuidesVisible
      ? Math.min(
          containerWidth / image.naturalWidth,
          containerHeight / image.naturalHeight,
        )
      : Math.max(
          containerWidth / image.naturalWidth,
          containerHeight / image.naturalHeight,
        );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    setObservationBounds({
      left: (containerWidth - width) / 2,
      top: (containerHeight - height) / 2,
      width,
      height,
      right: "auto",
      bottom: "auto",
    });
  }, [guideCollapsed, visualGuidesVisible]);

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;
    const observer = new ResizeObserver(updateObservationBounds);
    observer.observe(visual);
    updateObservationBounds();
    return () => observer.disconnect();
  }, [item?.id, updateObservationBounds]);

  useEffect(() => {
    if (!started || !trail) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && step > 0) onNavigate(-1);
      if (event.key === "ArrowRight" && step < trail.steps.length - 1)
        onNavigate(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNavigate, started, step, trail]);

  useEffect(() => {
    if (!zoomHintVisible) return;
    const timeout = window.setTimeout(() => setZoomHintVisible(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [zoomHintVisible]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
    } catch {
      setLinkCopied(false);
    }
  };

  const revealContext = () => {
    setImmersive(false);
    setGuideCollapsed(false);
    setRevealed(true);
    requestAnimationFrame(() => explanationRef.current?.focus());
  };

  const returnToObservation = () => {
    setRevealed(false);
    requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>(".trail-enter-observe")
        ?.focus();
    });
  };

  const requestObservationLandscape = () => {
    const portraitTouch =
      window.matchMedia("(orientation: portrait)").matches &&
      window.matchMedia("(pointer: coarse)").matches;
    if (!portraitTouch) return;

    void (async () => {
      try {
        if (!document.fullscreenElement && panelRef.current) {
          await panelRef.current.requestFullscreen();
          orientationFullscreenRef.current = true;
        }
        const orientation = screen.orientation as
          | LockableOrientation
          | undefined;
        if (!orientation?.lock) throw new Error("Orientation lock unavailable");
        await orientation.lock("landscape");
      } catch {
        // Orientation locking is a progressive enhancement and is not
        // supported by every mobile browser.
        setRotateHintVisible(true);
        if (rotateHintTimeoutRef.current !== null)
          window.clearTimeout(rotateHintTimeoutRef.current);
        rotateHintTimeoutRef.current = window.setTimeout(() => {
          setRotateHintVisible(false);
          rotateHintTimeoutRef.current = null;
        }, 3200);
      }
    })();
  };

  const enterObservationMode = () => {
    setImmersive(true);
    setGuideCollapsed(true);
    setZoomScale(1);
    setVisualGuidesVisible(true);
    setZoomHintVisible(window.matchMedia("(pointer: coarse)").matches);
    requestObservationLandscape();
  };

  const showGuide = () => {
    releaseForcedLandscape();
    setImmersive(false);
    setGuideCollapsed(false);
    setZoomScale(1);
    setZoomHintVisible(false);
    requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>(".trail-enter-observe")
        ?.focus();
    });
  };

  const toggleVisualGuides = () => {
    if (viewSwitching) return;
    setViewSwitching(true);
    setZoomScale(1);
    setZoomHintVisible(false);
    viewSwitchTimeoutRef.current = window.setTimeout(() => {
      setVisualGuidesVisible((visible) => !visible);
      requestAnimationFrame(() => {
        updateObservationBounds();
        requestAnimationFrame(() => setViewSwitching(false));
      });
      viewSwitchTimeoutRef.current = null;
    }, 150);
  };

  const pointerPosition = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onVisualPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!immersive || event.pointerType !== "touch") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointersRef.current.set(event.pointerId, pointerPosition(event));
    if (activePointersRef.current.size === 2) {
      const [first, second] = [...activePointersRef.current.values()];
      pinchStartRef.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        scale: zoomScale,
      };
      setZoomOrigin({
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      });
      setZoomHintVisible(false);
    }
  };

  const onVisualPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!immersive || !activePointersRef.current.has(event.pointerId)) return;
    activePointersRef.current.set(event.pointerId, pointerPosition(event));
    if (activePointersRef.current.size !== 2 || !pinchStartRef.current) return;
    const [first, second] = [...activePointersRef.current.values()];
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    const nextScale = Math.min(
      3,
      Math.max(1, pinchStartRef.current.scale * (distance / pinchStartRef.current.distance)),
    );
    setZoomScale(nextScale);
  };

  const onVisualPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) pinchStartRef.current = null;
  };

  const previewStyle = item
    ? {
        backgroundImage: `url(${atlas.url})`,
        backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
        backgroundPosition: atlasPosition(atlasIndex, atlas.columns, atlas.rows),
      }
    : undefined;
  const fullImageUrl = safeExternalUrl(item?.fullImageUrl);
  const imageResolving = Boolean(
    started &&
      item &&
      !imageFailed &&
      (loading || (fullImageUrl && !imageLoaded)),
  );

  return (
    <div
      className="trail-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trail-title"
      onMouseDown={onClose}
    >
      <section
        ref={panelRef}
        className={`trail-panel ${started ? "is-started" : "is-intro"} ${revealed ? "is-revealed" : ""} ${immersive ? "is-immersive" : ""} ${guideCollapsed ? "is-guide-collapsed" : ""} ${immersive && !visualGuidesVisible ? "is-guides-hidden" : ""}`}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          className="panel-close"
          type="button"
          onClick={onClose}
          aria-label={es ? "Cerrar recorrido" : "Close Trail"}
        >
          <span className="panel-close__label">
            ESC / {es ? "CERRAR" : "CLOSE"}
          </span>
          <svg
            className="panel-close__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        {!trail && loading && (
          <div className="trail-state" aria-live="polite">
            <span className="boot-mark" />
            <p>{es ? "CARGANDO RECORRIDO" : "LOADING TRAIL"}</p>
          </div>
        )}

        {!trail && error && (
          <div className="trail-state" role="alert">
            <h1 id="trail-title">
              {es ? "Recorrido no disponible" : "Trail unavailable"}
            </h1>
            <p>
              {es
                ? "No se pudo cargar el recorrido editorial. Tu posición en el archivo no cambió."
                : "The editorial path could not be loaded. Your position in the archive has not changed."}
            </p>
            <button type="button" onClick={onRetry}>
              {es ? "REINTENTAR RECORRIDO" : "RETRY TRAIL"}
            </button>
          </div>
        )}

        {trail && !started && (
          <div className="trail-intro">
            <div className="trail-intro__signal">
              <TrailIntroSignal slug={trail.slug} locale={locale} />
            </div>
            <div className="trail-intro__copy">
              <h1 id="trail-title">{trail.title}</h1>
              <p className="trail-intro__dek">{trail.dek}</p>
              <dl>
                <div>
                  <dt>{es ? "Imágenes" : "Images"}</dt>
                  <dd>{trail.steps.length}</dd>
                </div>
                <div>
                  <dt>{es ? "Tiempo" : "Time"}</dt>
                  <dd>{trail.estimatedMinutes} min</dd>
                </div>
              </dl>
              <button
                className="trail-primary-action"
                type="button"
                onClick={onStart}
              >
                {es ? "COMENZAR CON LA IMAGEN" : "BEGIN WITH THE IMAGE"}{" "}
                <span>→</span>
              </button>
            </div>
            <button
              className="trail-primary-action trail-primary-action--mobile"
              type="button"
              onClick={onStart}
            >
              {es ? "COMENZAR CON LA IMAGEN" : "BEGIN WITH THE IMAGE"}{" "}
              <span>→</span>
            </button>
          </div>
        )}

        {trail && started && item && (
          <>
            <div
              ref={visualRef}
              className={`trail-visual ${imageResolving ? "is-resolving" : ""} ${viewSwitching ? "is-view-switching" : ""}`}
              style={previewStyle}
              aria-busy={imageResolving}
              onPointerDown={onVisualPointerDown}
              onPointerMove={onVisualPointerMove}
              onPointerUp={onVisualPointerEnd}
              onPointerCancel={onVisualPointerEnd}
            >
              {imageResolving && (
                <span className="trail-visual__pixel-preview" aria-hidden="true" />
              )}
              {imageResolving && (
                <span className="trail-visual__pixel-pulses" aria-hidden="true">
                  {Array.from({ length: 18 }, (_, pulse) => (
                    <i
                      key={pulse}
                      style={{
                        gridColumn: ((item.id * 3 + pulse * 7) % 12) + 1,
                        gridRow: ((item.id * 5 + pulse * 11) % 9) + 1,
                        animationDelay: `${-((item.id + pulse * 0.73) % 4.2)}s`,
                        animationDuration: `${2.2 + ((item.id + pulse * 13) % 19) / 10}s`,
                      }}
                    />
                  ))}
                </span>
              )}
              {fullImageUrl && !imageFailed && (
                <img
                  ref={imageRef}
                  className={imageLoaded ? "is-loaded" : ""}
                  src={fullImageUrl}
                  alt={item.title}
                  decoding="async"
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: `${zoomOrigin.x}px ${zoomOrigin.y}px`,
                  }}
                  onLoad={() => {
                    setImageLoaded(true);
                    requestAnimationFrame(updateObservationBounds);
                  }}
                  onError={() => setImageFailed(true)}
                />
              )}
              {imageResolving && (
                <span className="trail-visual__loading" role="status">
                  {es ? "PREPARANDO IMAGEN" : "PREPARING IMAGE"}
                </span>
              )}
              {visualGuidesVisible && localizedContent?.observationMap &&
                (imageLoaded || imageFailed) && (
                  <ObservationGrid
                    key={`${item.id}-${immersive ? "observe" : "browse"}`}
                    map={localizedContent.observationMap}
                    itemId={item.id}
                    locale={locale}
                    bounds={observationBounds}
                    zoomScale={zoomScale}
                    zoomOrigin={zoomOrigin}
                  />
                )}
              {immersive && zoomHintVisible && (
                <span className="trail-visual__zoom-hint" role="status">
                  {es ? "PELLIZCA PARA AMPLIAR" : "PINCH TO ZOOM"}
                </span>
              )}
              <span className="trail-visual__number">
                {String(item.id).padStart(3, "0")}
              </span>
              <span className="trail-visual__credit">
                {item.credit ?? item.subtitle}
              </span>
              <div className="trail-observation-controls">
                {!immersive && (
                  <button
                    className="trail-enter-observe"
                    type="button"
                    aria-label={
                      es
                        ? "Entrar al modo observación"
                        : "Enter observation mode"
                    }
                    title={es ? "Observar imagen" : "Observe image"}
                    onClick={enterObservationMode}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="10.5" cy="10.5" r="5.5" />
                      <path d="m14.5 14.5 5 5M8 10.5h5M10.5 8v5" />
                    </svg>
                  </button>
                )}
                {immersive && (
                  <button
                    className="trail-toggle-guides"
                    type="button"
                    disabled={viewSwitching}
                    aria-pressed={!visualGuidesVisible}
                    aria-label={
                      visualGuidesVisible
                        ? es
                          ? "Ocultar guías y ampliar imagen"
                          : "Hide guides and fill image"
                        : es
                          ? "Restaurar guías visuales"
                          : "Restore visual guides"
                    }
                    data-tooltip={
                      visualGuidesVisible
                        ? es
                          ? "SOLO IMAGEN"
                          : "IMAGE ONLY"
                        : es
                          ? "MOSTRAR GUÍAS"
                          : "SHOW GUIDES"
                    }
                    onClick={toggleVisualGuides}
                  >
                    {visualGuidesVisible ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" />
                        <path d="m5 5 14 14" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" />
                        <path d="M9 9h6v6H9z" />
                      </svg>
                    )}
                  </button>
                )}
                {immersive && (
                  <button
                    className="trail-show-guide"
                    type="button"
                    aria-label={es ? "Mostrar guía" : "Show guide"}
                    data-tooltip={es ? "MOSTRAR GUÍA" : "SHOW GUIDE"}
                    onClick={showGuide}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 5h16v14H4zM14 5v14" />
                      <path d="m10 9-3 3 3 3" />
                    </svg>
                    <span className="trail-show-guide__label">
                      {es ? "GUÍA" : "GUIDE"}
                    </span>
                  </button>
                )}
              </div>
              {rotateHintVisible && (
                <div className="trail-rotate-hint" role="status">
                  <span aria-hidden="true">↻</span>
                  {es ? "GIRA TU DISPOSITIVO" : "ROTATE YOUR DEVICE"}
                </div>
              )}
            </div>

            <div className="trail-copy" aria-busy={loading}>
              <header className="trail-copy__header">
                <div className="trail-copy__position">
                  {String(step + 1).padStart(2, "0")} /{" "}
                  {String(trail.steps.length).padStart(2, "0")} ·{" "}
                  {trail.steps[step]?.chapter}
                </div>
                <h1 id="trail-title">{item.title}</h1>
              </header>

              <div className="trail-copy__body">
              <div className="trail-observe">
                <p>{trail.steps[step]?.prompt}</p>
                {localizedContent?.observe && (
                  <ul>
                    {localizedContent.observe.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>
                )}
              </div>

              {!revealed && (!error || localizedContent) && (
                <button
                  className="trail-reveal"
                  type="button"
                  disabled={!localizedContent}
                  onClick={revealContext}
                >
                  {localizedContent
                    ? es
                      ? "REVELAR CONTEXTO"
                      : "REVEAL CONTEXT"
                    : es
                      ? "CARGANDO CONTEXTO"
                      : "LOADING CONTEXT"}
                </button>
              )}

              {error && !localizedContent && (
                <div className="trail-inline-error" role="alert">
                  <p>
                    {es
                      ? "Este paso no se pudo cargar por completo."
                      : "This step could not be fully loaded."}
                  </p>
                  <button type="button" onClick={onRetry}>
                    {es ? "REINTENTAR PASO" : "RETRY STEP"}
                  </button>
                </div>
              )}

              {localizedContent && revealed && (
                <div
                  ref={explanationRef}
                  className="trail-explanation"
                  tabIndex={-1}
                  aria-label={`${es ? "Contexto de" : "Context for"} ${item.title}`}
                >
                  <button
                    className="trail-back-to-observation"
                    type="button"
                    onClick={returnToObservation}
                  >
                    ← {es ? "VOLVER A OBSERVACIÓN" : "BACK TO OBSERVATION"}
                  </button>
                  <p className="trail-explanation__intro">
                    {localizedContent.introduction}
                  </p>
                  <section>
                    <h2>
                      {es ? "Qué muestra esta vista" : "What this view shows"}
                    </h2>
                    <p>{localizedContent.explanation}</p>
                  </section>
                  <section>
                    <h2>
                      {es
                        ? "Cómo interpretar el color"
                        : "How to read the color"}
                    </h2>
                    <p>{localizedContent.colorMethod}</p>
                  </section>
                  <section>
                    <h2>{es ? "Por qué es relevante" : "Why it matters"}</h2>
                    <p>{localizedContent.whyItMatters}</p>
                  </section>
                  <div className="trail-explanation__source">
                    <span>
                      {editorialStatusLabel(localizedContent.status, locale)}
                    </span>
                    {localizedContent.sources.map((source) => {
                      const sourceUrl = safeExternalUrl(source.url);
                      return sourceUrl ? (
                        <a
                          key={sourceUrl}
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.label} ↗
                        </a>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              </div>
            </div>

            <nav
              className="trail-progress"
              aria-label={es ? "Progreso del recorrido" : "Trail progress"}
            >
              {trail.steps.map((trailStep, index) => (
                <button
                  key={trailStep.catalogId}
                  type="button"
                  className={
                    index === step
                      ? "is-current"
                      : index < step
                        ? "is-visited"
                        : ""
                  }
                  onClick={() => onSelectStep(index)}
                  aria-label={`${es ? "Ir al paso" : "Go to step"} ${index + 1}: ${trailStep.chapter}`}
                  aria-current={index === step ? "step" : undefined}
                >
                  <span />
                </button>
              ))}
            </nav>
          </>
        )}
      </section>

      {trail && started && (
        <nav
          className="trail-floating-nav"
          aria-label={es ? "Navegar el recorrido" : "Navigate Trail"}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            disabled={step === 0}
          >
            <span>←</span> {es ? "ANTERIOR" : "PREVIOUS"}
          </button>
          <button type="button" onClick={copyLink}>
            {linkCopied
              ? es
                ? "ENLACE COPIADO"
                : "LINK COPIED"
              : es
                ? "COPIAR ENLACE DEL PASO"
                : "COPY STEP LINK"}
          </button>
          {step < trail.steps.length - 1 ? (
            <button type="button" onClick={() => onNavigate(1)}>
              {es ? "SIGUIENTE" : "NEXT"} <span>→</span>
            </button>
          ) : (
            <button type="button" onClick={onClose}>
              {es ? "FINALIZAR" : "FINISH"} <span>→</span>
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
