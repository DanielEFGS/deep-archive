import { useEffect, useMemo, useRef, useState } from "react";
import type { AtlasSector, CatalogItem } from "../types/catalog";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { categoryLabel, useI18n } from "../i18n";
import { atlasPosition } from "../utils/atlas";

type Props = {
  items: CatalogItem[];
  atlases: AtlasSector[];
  onSelect: (index: number) => void;
  onClose: () => void;
};

const PAGE_SIZE = 40;

export function IndexPanel({ items, atlases, onSelect, onClose }: Props) {
  const { locale } = useI18n();
  const es = locale === "es";
  const panelRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  useDialogFocus(panelRef, onClose, searchRef);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const candidates = items.map((item, index) => ({ item, index }));
    if (!needle) return candidates;
    return candidates.filter(({ item }) =>
      [
        item.title,
        item.category,
        item.year,
        item.mission,
        item.nasaId,
        ...(item.keywords ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [items, query]);

  useEffect(() => setPage(0), [query]);
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const visibleMatches = matches.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const thumbnailStyle = (index: number) => {
    const atlas =
      atlases.find(
        (candidate) =>
          index >= candidate.startIndex &&
          index < candidate.startIndex + candidate.itemCount,
      ) ?? atlases[0];
    const localIndex = Math.max(0, index - atlas.startIndex);
    return {
      backgroundImage: `url(${atlas.url})`,
      backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
      backgroundPosition: atlasPosition(localIndex, atlas.columns, atlas.rows),
    };
  };

  return (
    <div
      className="index-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="index-title"
      onMouseDown={onClose}
    >
      <section
        ref={panelRef}
        className="index-panel"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="index-panel__chrome navigation-modal__header">
        <div className="index-panel__header">
          <h2 id="index-title">
            {es ? "Índice del archivo" : "Archive index"}
          </h2>
          <label>
            <span>{es ? "Buscar registros" : "Search records"}</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={es ? "Objeto, año, misión" : "Object, year, mission"}
            />
          </label>
        </div>
        <button className="navigation-modal__close" type="button" onClick={onClose} aria-label={es ? "Cerrar índice" : "Close index"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        </header>
        <div className="index-panel__body">
        <p className="index-panel__status" aria-live="polite">
          {matches.length
            ? `${matches.length} ${es ? "registros · página" : "records · page"} ${page + 1} ${es ? "de" : "of"} ${pageCount}`
            : es
              ? "Ningún registro coincide con la búsqueda"
              : "No records match this search"}
        </p>
        <ol className="index-list">
          {visibleMatches.map(({ item, index }) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(index);
                  onClose();
                }}
              >
                <span
                  className="index-list__thumb"
                  style={thumbnailStyle(index)}
                  aria-hidden="true"
                />
                <span>{String(item.id).padStart(3, "0")}</span>
                <strong>{item.title}</strong>
                <small>
                  {[
                    categoryLabel(item.category, locale),
                    item.year,
                    item.mission,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </button>
            </li>
          ))}
        </ol>
        {matches.length > PAGE_SIZE && (
          <nav
            className="index-pagination"
            aria-label={es ? "Páginas del índice" : "Archive index pages"}
          >
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              ← {es ? "ANTERIOR" : "PREVIOUS"}
            </button>
            <span>
              {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, matches.length)} /{" "}
              {matches.length}
            </span>
            <button
              type="button"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((current) => current + 1)}
            >
              {es ? "SIGUIENTE" : "NEXT"} →
            </button>
          </nav>
        )}
        </div>
      </section>
    </div>
  );
}
