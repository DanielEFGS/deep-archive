import { useRef } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { useI18n } from "../i18n";
import type { EditorialTrailSummary } from "../types/editorial";

type Props = {
  trails: EditorialTrailSummary[];
  loading: boolean;
  error: boolean;
  onSelect: (slug: string) => void;
  onRetry: () => void;
  onClose: () => void;
};

export function TrailMenu({ trails, loading, error, onSelect, onRetry, onClose }: Props) {
  const { locale } = useI18n();
  const es = locale === "es";
  const panelRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useDialogFocus(panelRef, onClose, closeRef);

  return (
    <div className="trail-menu-backdrop" role="dialog" aria-modal="true" aria-labelledby="trail-menu-title" onMouseDown={onClose}>
      <section ref={panelRef} className="trail-menu" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <header className="trail-menu__header">
          <div>
            <h1 id="trail-menu-title">{es ? "Recorridos" : "Trails"}</h1>
            <p>{es ? "Elige una forma de leer el archivo." : "Choose a way into the archive."}</p>
          </div>
          <button ref={closeRef} type="button" className="trail-menu__close" onClick={onClose} aria-label={es ? "Cerrar menú de recorridos" : "Close Trail menu"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>

        {loading && <p className="trail-menu__state" role="status">{es ? "CARGANDO RECORRIDOS" : "LOADING TRAILS"}</p>}
        {error && (
          <div className="trail-menu__state" role="alert">
            <span>{es ? "No se pudo abrir el índice." : "The Trail index could not be opened."}</span>
            <button type="button" onClick={onRetry}>{es ? "REINTENTAR" : "RETRY"}</button>
          </div>
        )}
        {!loading && !error && (
          <ol className="trail-menu__list">
            {trails.map((trail, index) => (
              <li key={trail.slug}>
                <button type="button" onClick={() => onSelect(trail.slug)}>
                  <span className="trail-menu__index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="trail-menu__copy">
                    <strong>{trail.title}</strong>
                    <span>{trail.dek}</span>
                  </span>
                  <span className="trail-menu__meta">{trail.stepCount} {es ? "IMÁGENES" : "IMAGES"}<br />{trail.estimatedMinutes} MIN</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5" /></svg>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
