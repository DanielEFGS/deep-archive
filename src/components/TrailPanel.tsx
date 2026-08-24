import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CatalogItem, CatalogPayload } from "../types/catalog";
import type { EducationalContent, EditorialTrail } from "../types/editorial";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { ObservationGrid } from "./ObservationGrid";
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
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const explanationRef = useRef<HTMLDivElement | null>(null);
  const orientationFullscreenRef = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [guideCollapsed, setGuideCollapsed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  useDialogFocus(panelRef, onClose, closeRef);

  const releaseForcedLandscape = () => {
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
    setRevealed(false);
    setImmersive(false);
    setGuideCollapsed(false);
    setImageLoaded(false);
    setImageFailed(false);
    setLinkCopied(false);
  }, [item?.id]);

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

  const toggleGuide = () => {
    const nextCollapsed = !guideCollapsed;
    setGuideCollapsed(nextCollapsed);

    if (!nextCollapsed) {
      releaseForcedLandscape();
      return;
    }

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
        await orientation?.lock?.("landscape");
      } catch {
        // Orientation locking is a progressive enhancement and is not
        // supported by every mobile browser.
      }
    })();
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
        className={`trail-panel ${started ? "is-started" : "is-intro"} ${revealed ? "is-revealed" : ""} ${immersive ? "is-immersive" : ""} ${guideCollapsed ? "is-guide-collapsed" : ""}`}
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
            <div className="trail-intro__signal" aria-hidden="true">
              {trail.steps.map((trailStep, index) => (
                <i
                  key={trailStep.catalogId}
                  style={{ "--trail-index": index } as CSSProperties}
                />
              ))}
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
              className={`trail-visual ${imageResolving ? "is-resolving" : ""}`}
              style={previewStyle}
              aria-busy={imageResolving}
            >
              {fullImageUrl && !imageFailed && (
                <img
                  className={imageLoaded ? "is-loaded" : ""}
                  src={fullImageUrl}
                  alt={item.title}
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageFailed(true)}
                />
              )}
              {imageResolving && (
                <span className="trail-visual__loading" role="status">
                  {es ? "PREPARANDO IMAGEN" : "PREPARING IMAGE"}
                </span>
              )}
              {localizedContent?.observationMap &&
                (imageLoaded || imageFailed) && (
                  <ObservationGrid
                    key={`${item.id}-${immersive ? "observe" : "browse"}`}
                    map={localizedContent.observationMap}
                    itemId={item.id}
                    locale={locale}
                  />
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
                    onClick={() => setImmersive(true)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="10.5" cy="10.5" r="5.5" />
                      <path d="m14.5 14.5 5 5M8 10.5h5M10.5 8v5" />
                    </svg>
                  </button>
                )}
                {immersive && (
                  <button
                    type="button"
                    aria-label={
                      es
                        ? "Salir del modo observación"
                        : "Exit observation mode"
                    }
                    title={es ? "Salir de observación" : "Exit observation"}
                    onClick={() => {
                      releaseForcedLandscape();
                      setImmersive(false);
                      setGuideCollapsed(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m7 7 10 10M17 7 7 17" />
                    </svg>
                  </button>
                )}
                {immersive && (
                  <button
                    type="button"
                    aria-label={
                      guideCollapsed
                        ? es
                          ? "Expandir guía de observación"
                          : "Expand observation guide"
                        : es
                          ? "Contraer guía de observación"
                          : "Collapse observation guide"
                    }
                    title={
                      guideCollapsed
                        ? es
                          ? "Expandir guía"
                          : "Expand guide"
                        : es
                          ? "Contraer guía"
                          : "Collapse guide"
                    }
                    aria-pressed={guideCollapsed}
                    onClick={toggleGuide}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 5h16v14H4zM14 5v14" />
                      <path
                        d={guideCollapsed ? "m9 9 3 3-3 3" : "m11 9-3 3 3 3"}
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="trail-copy" aria-busy={loading}>
              <div className="trail-copy__position">
                {String(step + 1).padStart(2, "0")} /{" "}
                {String(trail.steps.length).padStart(2, "0")} ·{" "}
                {trail.steps[step]?.chapter}
              </div>
              <h1 id="trail-title">{item.title}</h1>

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
