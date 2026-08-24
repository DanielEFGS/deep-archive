import { useEffect, useMemo, useRef, useState } from 'react';
import type { AtlasConfig, CatalogItem } from '../types/catalog';
import { useDialogFocus } from '../hooks/useDialogFocus';

type Props = {
  items: CatalogItem[];
  atlas: AtlasConfig;
  onSelect: (index: number) => void;
  onClose: () => void;
};

const PAGE_SIZE = 40;

export function IndexPanel({ items, atlas, onSelect, onClose }: Props) {
  const panelRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  useDialogFocus(panelRef, onClose, searchRef);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const candidates = items.map((item, index) => ({ item, index }));
    if (!needle) return candidates;
    return candidates.filter(({ item }) =>
      [item.title, item.category, item.year, item.mission, item.nasaId, ...(item.keywords ?? [])]
        .filter(Boolean).join(' ').toLowerCase().includes(needle),
    );
  }, [items, query]);

  useEffect(() => setPage(0), [query]);
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const visibleMatches = matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const thumbnailStyle = (index: number) => {
    const column = index % atlas.columns;
    const row = Math.floor(index / atlas.columns);
    return {
      backgroundImage: `url(${atlas.url})`,
      backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
      backgroundPosition: `${atlas.columns <= 1 ? 0 : (column / (atlas.columns - 1)) * 100}% ${atlas.rows <= 1 ? 0 : (row / (atlas.rows - 1)) * 100}%`,
    };
  };

  return (
    <div className="index-backdrop" role="dialog" aria-modal="true" aria-labelledby="index-title" onMouseDown={onClose}>
      <section ref={panelRef} className="index-panel" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <button className="panel-close" type="button" onClick={onClose}>ESC / CLOSE</button>
        <header className="index-panel__header">
          <h2 id="index-title">Archive index</h2>
          <p>Browse all 500 records through the shared image atlas. Search, then open an object.</p>
          <label>
            <span>Search records</span>
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Object, year, mission" />
          </label>
        </header>
        <p className="index-panel__status" aria-live="polite">
          {matches.length ? `${matches.length} records · page ${page + 1} of ${pageCount}` : 'No records match this search'}
        </p>
        <ol className="index-list">
          {visibleMatches.map(({ item, index }) => (
            <li key={item.id}>
              <button type="button" onClick={() => { onSelect(index); onClose(); }}>
                <span className="index-list__thumb" style={thumbnailStyle(index)} aria-hidden="true" />
                <span>{String(item.id).padStart(3, '0')}</span>
                <strong>{item.title}</strong>
                <small>{[item.category, item.year, item.mission].filter(Boolean).join(' · ')}</small>
              </button>
            </li>
          ))}
        </ol>
        {matches.length > PAGE_SIZE && (
          <nav className="index-pagination" aria-label="Archive index pages">
            <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>← PREVIOUS</button>
            <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, matches.length)} / {matches.length}</span>
            <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((current) => current + 1)}>NEXT →</button>
          </nav>
        )}
      </section>
    </div>
  );
}
