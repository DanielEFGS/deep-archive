import { useEffect, useRef } from 'react';
import type { CatalogItem, RenderQuality } from '../types/catalog';
import { creatorLinks } from '../config/site';

type Props = {
  hovered: CatalogItem | null;
  source: 'demo' | 'nasa';
  categories: string[];
  activeCategory: string;
  visibleCount: number;
  quality: RenderQuality;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onOpenInfo: () => void;
  onOpenIndex: () => void;
  onOpenTrail: () => void;
  onboardingVisible: boolean;
  onDismissOnboarding: () => void;
};

export function Hud({
  hovered,
  source,
  categories,
  activeCategory,
  visibleCount,
  quality,
  searchQuery,
  onSearchChange,
  onCategoryChange,
  onOpenInfo,
  onOpenIndex,
  onOpenTrail,
  onboardingVisible,
  onDismissOnboarding,
}: Props) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === '/' && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);
  return (
    <div className="hud">
      <header className="hud__top">
        <div className="brand-lockup">
          <span className="brand-lockup__orb" aria-hidden="true" />
          <div>
            <strong>DEEP / 500</strong>
            <span>INTERACTIVE ASTRONOMICAL ARCHIVE</span>
          </div>
        </div>

        <nav className="category-nav" aria-label="Filter astronomical archive">
          {['ALL', ...categories].map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'is-active' : ''}
              aria-pressed={activeCategory === category}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </nav>

        <div className="hud__actions">
          <label className="archive-search">
            <span>SEARCH /</span>
            <input ref={searchRef} value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="OBJECT, YEAR, MISSION" aria-label="Search archive" />
            {searchQuery && <button className="archive-search__clear" type="button" onClick={() => onSearchChange('')} aria-label="Clear search">×</button>}
          </label>
          <span aria-live="polite">{visibleCount === 0 ? 'NO MATCHES' : source === 'demo' ? `${visibleCount} DEMO RECORDS` : `${visibleCount} VISIBLE`}</span>
          <span className="hud__quality">{quality.label} · {quality.pixelRatio.toFixed(2)}×</span>
          <div className="hud__links"><button className="hud__trail-link" type="button" onClick={onOpenTrail}>TRAIL 01</button><button type="button" onClick={onOpenIndex}>INDEX</button><button type="button" onClick={onOpenInfo}>ABOUT</button></div>
        </div>
      </header>

      <section className={`hover-card ${hovered ? 'hover-card--visible' : ''}`} aria-live="polite">
        <span className="hover-card__index">
          {hovered ? String(hovered.id).padStart(3, '0') : '---'}
        </span>
        <div>
          <strong>{hovered?.title ?? 'MOVE TO EXPLORE'}</strong>
          <span>{hovered?.subtitle ?? 'CLICK ANY FRAME FOR DETAILS · ARROWS + ENTER SUPPORTED'}</span>
        </div>
      </section>

      {onboardingVisible && (
        <aside className="field-guide" aria-label="Archive controls">
          <span className="field-guide__pointer">Move to reveal · click a frame to inspect · / to search</span>
          <span className="field-guide__touch">Drag to explore · tap a frame to inspect</span>
          <button type="button" onClick={onDismissOnboarding} aria-label="Dismiss instructions">GOT IT</button>
        </aside>
      )}

      <footer className="site-footer">
        <div className="creator-signature"><strong>DG</strong><span>DESIGN / DEVELOPMENT</span></div>
        <nav className="creator-links" aria-label="Creator links">
          {creatorLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="me noreferrer">{link.label} ↗</a>)}
          {!creatorLinks.length && <span>INDEPENDENT VISUAL STUDY</span>}
        </nav>
        <span>INDEPENDENT PROJECT · NOT NASA-AFFILIATED</span>
      </footer>
    </div>
  );
}
