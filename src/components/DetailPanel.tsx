import { useEffect, useRef, useState } from "react";
import type { CatalogItem, CatalogPayload } from "../types/catalog";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { safeExternalUrl } from "../utils/security";
import { categoryLabel, useI18n } from "../i18n";
import { atlasPosition } from "../utils/atlas";

type Props = {
  item: CatalogItem;
  atlas: CatalogPayload["atlas"];
  atlasIndex: number;
  metadataLoading?: boolean;
  metadataError?: boolean;
  position: number;
  total: number;
  relatedItems?: Array<{
    item: CatalogItem;
    atlas: CatalogPayload["atlas"];
    atlasIndex: number;
  }>;
  onSelectRelated?: (id: number) => void;
  onNavigate: (direction: -1 | 1) => void;
  onRetry: () => void;
  onClose: () => void;
};

export function DetailPanel({
  item,
  atlas,
  atlasIndex,
  metadataLoading = false,
  metadataError = false,
  position,
  total,
  relatedItems = [],
  onSelectRelated,
  onNavigate,
  onRetry,
  onClose,
}: Props) {
  const { locale } = useI18n();
  const es = locale === "es";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [imageOnly, setImageOnly] = useState(false);
  const [viewSwitching, setViewSwitching] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const viewSwitchTimeoutRef = useRef<number | null>(null);
  useDialogFocus(panelRef, onClose, closeRef);
  const fullImageUrl = safeExternalUrl(item.fullImageUrl);
  const sourceUrl = safeExternalUrl(item.sourceUrl);
  const imageResolving =
    !imageFailed && (metadataLoading || Boolean(fullImageUrl && !imageLoaded));

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
    setImageAttempt(0);
    setDescriptionExpanded(false);
    setMetadataExpanded(false);
    setImageOnly(false);
    setViewSwitching(false);
    if (viewSwitchTimeoutRef.current !== null) {
      window.clearTimeout(viewSwitchTimeoutRef.current);
      viewSwitchTimeoutRef.current = null;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onNavigate(-1);
      if (event.key === "ArrowRight") onNavigate(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (viewSwitchTimeoutRef.current !== null)
        window.clearTimeout(viewSwitchTimeoutRef.current);
    };
  }, [item.id, onNavigate]);

  const toggleImageOnly = () => {
    if (viewSwitching) return;
    setViewSwitching(true);
    viewSwitchTimeoutRef.current = window.setTimeout(() => {
      setImageOnly((current) => !current);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setViewSwitching(false)),
      );
      viewSwitchTimeoutRef.current = null;
    }, 150);
  };

  const previewStyle = {
    backgroundImage: `url(${atlas.url})`,
    backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
    backgroundPosition: atlasPosition(atlasIndex, atlas.columns, atlas.rows),
  };

  return (
    <div
      ref={panelRef}
      className={`detail-backdrop ${imageOnly ? "is-image-only" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      aria-describedby="detail-description"
      tabIndex={-1}
      onMouseDown={onClose}
    >
      <article
        className={`detail-panel ${imageOnly ? "is-image-only" : ""} ${viewSwitching ? "is-view-switching" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          className="panel-close detail-panel__close"
          type="button"
          onClick={onClose}
          aria-label={es ? "Cerrar detalles" : "Close details"}
        >
          <span className="panel-close__label">ESC / {es ? "CERRAR" : "CLOSE"}</span>
          <svg className="panel-close__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div
          key={`visual-${item.id}`}
          className={`detail-panel__visual ${imageResolving ? "is-resolving" : ""}`}
          style={previewStyle}
          aria-busy={imageResolving}
        >
          {imageResolving && (
            <span className="detail-panel__pixel-preview" aria-hidden="true" />
          )}
          {imageResolving && (
            <span className="detail-panel__pixel-pulses" aria-hidden="true">
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
              key={imageAttempt}
              className={imageLoaded ? "is-loaded" : ""}
              src={fullImageUrl}
              alt={item.title}
              decoding="async"
              fetchPriority="high"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
            />
          )}
          {imageResolving && (
            <span className="detail-panel__loading" role="status">
              {es ? "PREPARANDO IMAGEN" : "PREPARING IMAGE"}
            </span>
          )}
          {fullImageUrl && imageFailed && (
            <span className="detail-panel__image-error">
              {es ? "IMAGEN COMPLETA NO DISPONIBLE" : "FULL IMAGE UNAVAILABLE"}{" "}
              ·{" "}
              <button
                type="button"
                onClick={() => {
                  setImageFailed(false);
                  setImageLoaded(false);
                  setImageAttempt((attempt) => attempt + 1);
                }}
              >
                {es ? "REINTENTAR" : "RETRY"}
              </button>
            </span>
          )}
          <span className="detail-panel__number">
            {String(item.id).padStart(3, "0")}
          </span>
          <div className="detail-view-controls">
            <button
              type="button"
              disabled={viewSwitching}
              aria-pressed={imageOnly}
              aria-label={
                imageOnly
                  ? es
                    ? "Restaurar detalles"
                    : "Restore details"
                  : es
                    ? "Ver imagen en pantalla completa"
                    : "View image full screen"
              }
              data-tooltip={
                imageOnly
                  ? es
                    ? "MOSTRAR DETALLES"
                    : "SHOW DETAILS"
                  : es
                    ? "SOLO IMAGEN"
                    : "IMAGE ONLY"
              }
              onClick={toggleImageOnly}
            >
              {imageOnly ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          key={`content-${item.id}`}
          className="detail-panel__content"
          aria-hidden={imageOnly || undefined}
          inert={imageOnly}
        >
          <header className="detail-panel__content-header">
            <div className="detail-panel__eyebrow">
              {categoryLabel(item.category, locale)}
            </div>
            <h1 id="detail-title">{item.title}</h1>
            {item.subtitle && (
              <p className="detail-panel__subtitle">{item.subtitle}</p>
            )}
          </header>
          <div className="detail-panel__content-body">
          <div className={`detail-description-block ${descriptionExpanded ? "is-expanded" : ""}`}>
            {es && item.description && (
              <span className="detail-description-block__source">DESCRIPCIÓN ORIGINAL · EN</span>
            )}
            <p
              id="detail-description"
              className={`detail-panel__description ${metadataLoading ? "is-loading" : ""}`}
            >
              {item.description ??
                (metadataLoading
                  ? es
                    ? "Cargando metadatos del objeto…"
                    : "Loading object metadata…"
                  : es
                    ? "Sin descripción disponible."
                    : "No description supplied.")}
            </p>
            {(item.description?.length ?? 0) > 180 && (
              <button
                className="detail-description-block__toggle"
                type="button"
                aria-expanded={descriptionExpanded}
                onClick={() => setDescriptionExpanded((expanded) => !expanded)}
              >
                {descriptionExpanded
                  ? es ? "MOSTRAR MENOS ↑" : "SHOW LESS ↑"
                  : es ? "MOSTRAR MÁS ↓" : "SHOW MORE ↓"}
              </button>
            )}
          </div>
          {metadataError && (
            <p className="detail-panel__error" role="status">
              {es
                ? "No se pudieron cargar los metadatos ampliados."
                : "Extended metadata could not be loaded."}{" "}
              <button type="button" onClick={onRetry}>
                {es ? "Reintentar" : "Retry"}
              </button>
            </p>
          )}

          <section className={`detail-technical ${metadataExpanded ? "is-expanded" : ""}`}>
            <button
              className="detail-technical__toggle"
              type="button"
              aria-expanded={metadataExpanded}
              onClick={() => setMetadataExpanded((expanded) => !expanded)}
            >
              <span>{es ? "DATOS TÉCNICOS" : "TECHNICAL DATA"}</span>
              <span aria-hidden="true">{metadataExpanded ? "−" : "+"}</span>
            </button>
          <dl className="metadata-grid">
            {item.date && (
              <>
                <dt>{es ? "Fecha" : "Date"}</dt>
                <dd>{item.date}</dd>
              </>
            )}
            {item.mission && (
              <>
                <dt>{es ? "Misión" : "Mission"}</dt>
                <dd>{item.mission}</dd>
              </>
            )}
            {item.telescope && (
              <>
                <dt>{es ? "Telescopio" : "Telescope"}</dt>
                <dd>{item.telescope}</dd>
              </>
            )}
            {item.instrument && (
              <>
                <dt>{es ? "Instrumento" : "Instrument"}</dt>
                <dd>{item.instrument}</dd>
              </>
            )}
            {item.photographer && (
              <>
                <dt>{es ? "Autoría" : "Creator"}</dt>
                <dd>{item.photographer}</dd>
              </>
            )}
            {item.nasaId && (
              <>
                <dt>NASA ID</dt>
                <dd>{item.nasaId}</dd>
              </>
            )}
          </dl>
          </section>

          {(item.center || item.credit) && (
            <dl className="detail-attribution">
              {item.center && (
                <>
                  <dt>{es ? "INSTITUCIÓN" : "INSTITUTION"}</dt>
                  <dd>{item.center}</dd>
                </>
              )}
              {item.credit && (
                <>
                  <dt>{es ? "CRÉDITO" : "CREDIT"}</dt>
                  <dd>{item.credit}</dd>
                </>
              )}
            </dl>
          )}

          {sourceUrl && (
            <a
              className="source-link"
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {es ? "ABRIR FUENTE ORIGINAL" : "OPEN ORIGINAL SOURCE"} ↗
            </a>
          )}

          <p className="detail-panel__notice">
            {es
              ? "Este proyecto educativo independiente conserva la fuente y los créditos suministrados con cada recurso. El material de terceros está sujeto a sus respectivos derechos y condiciones de uso."
              : "This independent educational project preserves the source and credit supplied with each media asset. Third-party material remains subject to its respective rights and usage terms."}
          </p>

          {relatedItems.length > 0 && onSelectRelated && (
            <section className="related-objects" aria-labelledby="related-objects-title">
              <div className="related-objects__heading">
                <h2 id="related-objects-title">{es ? "Objetos relacionados" : "Related objects"}</h2>
                <span>{es ? "POR TEMA E INSTRUMENTO" : "BY SUBJECT AND INSTRUMENT"}</span>
              </div>
              <div className="related-objects__rail">
                {relatedItems.map((related) => (
                  <button key={related.item.id} type="button" onClick={() => onSelectRelated(related.item.id)}>
                    <span
                      className="related-objects__thumb"
                      aria-hidden="true"
                      style={{
                        backgroundImage: `url(${related.atlas.url})`,
                        backgroundSize: `${related.atlas.columns * 100}% ${related.atlas.rows * 100}%`,
                        backgroundPosition: atlasPosition(related.atlasIndex, related.atlas.columns, related.atlas.rows),
                      }}
                    />
                    <span className="related-objects__copy">
                      <strong>{related.item.title}</strong>
                      <span>{categoryLabel(related.item.category, locale)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          </div>
        </div>
      </article>
      <nav
        className="detail-floating-nav"
        aria-label={
          es ? "Explorar detalles del archivo" : "Browse archive details"
        }
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          aria-label={es ? "Registro anterior" : "Previous record"}
        >
          <span>←</span> {es ? "ANTERIOR" : "PREVIOUS"}
        </button>
        <span>
          {String(position).padStart(3, "0")} / {String(total).padStart(3, "0")}
        </span>
        <button
          type="button"
          onClick={() => onNavigate(1)}
          aria-label={es ? "Registro siguiente" : "Next record"}
        >
          {es ? "SIGUIENTE" : "NEXT"} <span>→</span>
        </button>
      </nav>
    </div>
  );
}
