import { useRef } from 'react';
import type { CatalogPayload, RenderQuality } from '../types/catalog';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { creatorLinks } from '../config/site';

type Props = {
  catalog: CatalogPayload;
  quality: RenderQuality;
  onClose: () => void;
};

export function InfoPanel({ catalog, quality, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  useDialogFocus(panelRef, onClose, closeRef);

  return (
    <div className="info-backdrop" role="dialog" aria-modal="true" aria-labelledby="info-title" onMouseDown={onClose}>
      <section ref={panelRef} className="info-panel" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <button ref={closeRef} className="panel-close" type="button" onClick={onClose}>
          ESC / CLOSE
        </button>

        <div className="info-panel__heading">
          <h2 id="info-title">DEEP / 500</h2>
          <p>
            Five hundred records, held in one continuous field. Move through the archive as an image first;
            open a frame when you want its name, history and source.
          </p>
        </div>

        <div className="info-panel__grid">
          <article>
            <h3 className="info-label">HOW IT WORKS</h3>
            <dl className="info-stats">
              <div><dt>Visual records</dt><dd>{catalog.items.length || 500}</dd></div>
              <div><dt>Gallery surface</dt><dd>1 WebGL canvas</dd></div>
              <div><dt>Thumbnail requests</dt><dd>1 texture atlas</dd></div>
              <div><dt>Quality profile</dt><dd>{quality.label} / {quality.pixelRatio.toFixed(2)}× DPR</dd></div>
              <div><dt>Dataset</dt><dd>{catalog.source.toUpperCase()}</dd></div>
            </dl>
          </article>

          <article>
            <h3 className="info-label">MEDIA &amp; CREDITS</h3>
            <p>
              Imagery and metadata in the production catalog are sourced from publicly accessible NASA resources for
              educational and informational presentation. Credit is preserved per asset whenever supplied by the
              source record.
            </p>
            <p>
              This project is not affiliated with, sponsored by, or endorsed by NASA. Third-party material remains
              subject to its respective rights and usage terms. No commercial use is intended.
            </p>
            <a href="https://www.nasa.gov/nasa-brand-center/images-and-media/" target="_blank" rel="noreferrer">
              NASA MEDIA USAGE GUIDELINES ↗
            </a>
          </article>
        </div>

        {creatorLinks.length > 0 && (
          <nav className="info-panel__creator-links" aria-label="Creator links">
            <strong>DG</strong>
            {creatorLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="me noreferrer">{link.label} ↗</a>)}
          </nav>
        )}

        <div className="info-panel__footer">
          <span>REACT · THREE.JS · GLSL · STATIC DELIVERY</span>
          <span>BUILD ONCE · CACHE HARD · LOAD DETAIL ON DEMAND</span>
        </div>
      </section>
    </div>
  );
}
