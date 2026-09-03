import { useRef } from "react";
import type { CatalogPayload, RenderQuality } from "../types/catalog";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { creatorLinks, creatorPortfolioUrl } from "../config/site";
import { qualityLabel, useI18n } from "../i18n";

type Props = {
  catalog: CatalogPayload;
  quality: RenderQuality;
  onClose: () => void;
};

export function InfoPanel({ catalog, quality, onClose }: Props) {
  const { locale } = useI18n();
  const es = locale === "es";
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  useDialogFocus(panelRef, onClose, closeRef);

  return (
    <div
      className="info-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-title"
      onMouseDown={onClose}
    >
      <section
        ref={panelRef}
        className="info-panel"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="info-panel__chrome">
        <button
          ref={closeRef}
          className="panel-close"
          type="button"
          onClick={onClose}
          aria-label={es ? "Cerrar información" : "Close information"}
        >
          <span className="panel-close__label">ESC / {es ? "CERRAR" : "CLOSE"}</span>
          <svg className="panel-close__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="info-panel__heading">
          <h2 id="info-title">DEEP</h2>
          <p>
            {es
              ? `${catalog.items.length || 1000} registros reunidos en un campo continuo. Recorre primero el archivo como imagen; abre un cuadro cuando quieras conocer su nombre, historia y fuente.`
              : `${catalog.items.length || 1000} records, held in one continuous field. Move through the archive as an image first; open a frame when you want its name, history and source.`}
          </p>
        </div>
        </div>

        <div className="info-panel__body">
        <div className="info-panel__grid">
          <article>
            <h3 className="info-label">
              {es ? "CÓMO FUNCIONA" : "HOW IT WORKS"}
            </h3>
            <dl className="info-stats">
              <div>
                <dt>{es ? "Registros visuales" : "Visual records"}</dt>
                <dd>{catalog.items.length || 1000}</dd>
              </div>
              <div>
                <dt>{es ? "Superficie de galería" : "Gallery surface"}</dt>
                <dd>1 canvas WebGL</dd>
              </div>
              <div>
                <dt>
                  {es ? "Solicitudes de miniaturas" : "Thumbnail requests"}
                </dt>
                <dd>
                  {catalog.atlases?.length ?? 1}{" "}
                  {es ? "atlas sectoriales" : "sector atlases"}
                </dd>
              </div>
              <div>
                <dt>{es ? "Perfil de calidad" : "Quality profile"}</dt>
                <dd>
                  {qualityLabel(quality.label, locale)} /{" "}
                  {quality.pixelRatio.toFixed(2)}× DPR
                </dd>
              </div>
              <div>
                <dt>{es ? "Conjunto de datos" : "Dataset"}</dt>
                <dd>{catalog.source.toUpperCase()}</dd>
              </div>
            </dl>
          </article>

          <article>
            <h3 className="info-label">
              {es ? "MEDIOS Y CRÉDITOS" : "MEDIA & CREDITS"}
            </h3>
            <p>
              {es
                ? "Las imágenes y los metadatos del catálogo provienen de recursos de NASA públicamente accesibles y se presentan con fines educativos e informativos. Cada recurso conserva el crédito entregado por su fuente."
                : "Imagery and metadata in the production catalog are sourced from publicly accessible NASA resources for educational and informational presentation. Credit is preserved per asset whenever supplied by the source record."}
            </p>
            <p>
              {es
                ? "Este proyecto no está afiliado, patrocinado ni respaldado por NASA. El material de terceros está sujeto a sus respectivos derechos y condiciones de uso. No se contempla uso comercial."
                : "This project is not affiliated with, sponsored by, or endorsed by NASA. Third-party material remains subject to its respective rights and usage terms. No commercial use is intended."}
            </p>
            <a
              href="https://www.nasa.gov/nasa-brand-center/images-and-media/"
              target="_blank"
              rel="noreferrer"
            >
              {es
                ? "NORMAS DE USO DE MEDIOS DE NASA"
                : "NASA MEDIA USAGE GUIDELINES"}{" "}
              ↗
            </a>
          </article>
        </div>

        <p className="info-panel__collaboration">
          {es
            ? "DEEP invita a aportar observaciones científicas o educativas concisas que ayuden a mejorar sus guías y la interpretación de las fuentes."
            : "DEEP welcomes concise scientific or educational feedback that can improve its guides and source interpretation."}
        </p>

        <nav
          className="info-panel__creator-links"
          aria-label={es ? "Guías editoriales" : "Editorial guides"}
        >
          <a href={es ? "/es/objetos/" : "/objects/"}>
            {es ? "OBJETOS EDITORIALES" : "EDITORIAL OBJECTS"} →
          </a>
          <a href={es ? "/es/recorridos/" : "/trails/"}>
            {es ? "RECORRIDOS GUIADOS" : "GUIDED TRAILS"} →
          </a>
        </nav>

        {creatorLinks.length > 0 && (
          <nav
            className="info-panel__creator-links"
            aria-label={es ? "Enlaces del creador" : "Creator links"}
          >
            <a
              className="info-panel__creator-mark"
              href={creatorPortfolioUrl}
              target="_blank"
              rel="me noreferrer"
              aria-label={es ? "Portafolio de DG" : "DG portfolio"}
            >
              <strong>DG</strong>
            </a>
            {creatorLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="me noreferrer"
              >
                {link.label} ↗
              </a>
            ))}
          </nav>
        )}

        <div className="info-panel__footer">
          <span>
            REACT · THREE.JS · GLSL ·{" "}
            {es ? "ENTREGA ESTÁTICA" : "STATIC DELIVERY"}
          </span>
          <span>
            {es
              ? "COMPILAR UNA VEZ · CACHEAR · CARGAR DETALLES A DEMANDA"
              : "BUILD ONCE · CACHE HARD · LOAD DETAIL ON DEMAND"}
          </span>
        </div>
        </div>
      </section>
    </div>
  );
}
