import { useEffect, useRef, useState } from 'react';
import type { CatalogItem, CatalogPayload } from '../types/catalog';
import { useDialogFocus } from '../hooks/useDialogFocus';

type Props = {
  item: CatalogItem;
  atlas: CatalogPayload['atlas'];
  metadataLoading?: boolean;
  metadataError?: boolean;
  position: number;
  total: number;
  onNavigate: (direction: -1 | 1) => void;
  onRetry: () => void;
  onClose: () => void;
};

function atlasPosition(id: number, columns: number, rows: number) {
  const index = id - 1;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns <= 1 ? 0 : (column / (columns - 1)) * 100;
  const y = rows <= 1 ? 0 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
}

export function DetailPanel({ item, atlas, metadataLoading = false, metadataError = false, position, total, onNavigate, onRetry, onClose }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  useDialogFocus(panelRef, onClose, closeRef);

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
    setImageAttempt(0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') onNavigate(-1);
      if (event.key === 'ArrowRight') onNavigate(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [item.id, onNavigate]);

  const previewStyle = {
    backgroundImage: `url(${atlas.url})`,
    backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
    backgroundPosition: atlasPosition(item.id, atlas.columns, atlas.rows),
  };

  return (
    <div ref={panelRef} className="detail-backdrop" role="dialog" aria-modal="true" aria-labelledby="detail-title" aria-describedby="detail-description" tabIndex={-1} onMouseDown={onClose}>
      <article className="detail-panel" onMouseDown={(event) => event.stopPropagation()}>
        <button ref={closeRef} className="detail-panel__close" type="button" onClick={onClose} aria-label="Close details">
          ESC / CLOSE
        </button>

        <div key={`visual-${item.id}`} className={`detail-panel__visual ${item.fullImageUrl && !imageLoaded && !imageFailed ? 'is-resolving' : ''}`} style={previewStyle}>
          {item.fullImageUrl && !imageLoaded && !imageFailed && <span className="detail-panel__pixel-preview" aria-hidden="true" />}
          {item.fullImageUrl && !imageLoaded && !imageFailed && (
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
          {item.fullImageUrl && !imageFailed && (
            <img
              key={imageAttempt}
              className={imageLoaded ? 'is-loaded' : ''}
              src={item.fullImageUrl}
              alt={item.title}
              decoding="async"
              fetchPriority="high"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
            />
          )}
          {item.fullImageUrl && !imageLoaded && !imageFailed && <span className="detail-panel__loading">LOADING DETAIL</span>}
          {item.fullImageUrl && imageFailed && (
            <span className="detail-panel__image-error">FULL IMAGE UNAVAILABLE · <button type="button" onClick={() => { setImageFailed(false); setImageLoaded(false); setImageAttempt((attempt) => attempt + 1); }}>RETRY</button></span>
          )}
          <span className="detail-panel__number">{String(item.id).padStart(3, '0')}</span>
        </div>

        <div key={`content-${item.id}`} className="detail-panel__content">
          <div className="detail-panel__eyebrow">{item.category}</div>
          <h1 id="detail-title">{item.title}</h1>
          {item.subtitle && <p className="detail-panel__subtitle">{item.subtitle}</p>}
          <p id="detail-description" className={`detail-panel__description ${metadataLoading ? 'is-loading' : ''}`}>
            {item.description ?? (metadataLoading ? 'Loading object metadata…' : 'No description supplied.')}
          </p>
          {metadataError && (
            <p className="detail-panel__error" role="status">
              Extended metadata could not be loaded. <button type="button" onClick={onRetry}>Retry</button>
            </p>
          )}

          <dl className="metadata-grid">
            {item.date && <><dt>Date</dt><dd>{item.date}</dd></>}
            {item.mission && <><dt>Mission</dt><dd>{item.mission}</dd></>}
            {item.telescope && <><dt>Telescope</dt><dd>{item.telescope}</dd></>}
            {item.instrument && <><dt>Instrument</dt><dd>{item.instrument}</dd></>}
            {item.center && <><dt>Center</dt><dd>{item.center}</dd></>}
            {item.photographer && <><dt>Creator</dt><dd>{item.photographer}</dd></>}
            {item.nasaId && <><dt>NASA ID</dt><dd>{item.nasaId}</dd></>}
            {item.credit && <><dt>Credit</dt><dd>{item.credit}</dd></>}
          </dl>

          {item.sourceUrl && (
            <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
              OPEN ORIGINAL SOURCE ↗
            </a>
          )}

          <p className="detail-panel__notice">
            This independent educational project preserves the source and credit supplied with each media asset.
            Third-party material remains subject to its respective rights and usage terms.
          </p>
        </div>
      </article>
      <nav className="detail-floating-nav" aria-label="Browse archive details" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => onNavigate(-1)} aria-label="Previous record"><span>←</span> PREVIOUS</button>
        <span>{String(position).padStart(3, '0')} / {String(total).padStart(3, '0')}</span>
        <button type="button" onClick={() => onNavigate(1)} aria-label="Next record">NEXT <span>→</span></button>
      </nav>
    </div>
  );
}
