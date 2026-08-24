import { useEffect, useRef } from "react";
import type { CatalogItem } from "../types/catalog";
import { creatorLinks } from "../config/site";
import { categoryLabel, localeNames, useI18n, type Locale } from "../i18n";

type Props = {
  hovered: CatalogItem | null;
  source: "demo" | "nasa";
  categories: string[];
  activeCategory: string;
  visibleCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onOpenInfo: () => void;
  onOpenIndex: () => void;
  onOpenTrail: () => void;
  onboardingVisible: boolean;
  onDismissOnboarding: () => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
};

export function Hud({
  hovered,
  source,
  categories,
  activeCategory,
  visibleCount,
  searchQuery,
  onSearchChange,
  onCategoryChange,
  onOpenInfo,
  onOpenIndex,
  onOpenTrail,
  onboardingVisible,
  onDismissOnboarding,
  locale,
  onLocaleChange,
}: Props) {
  const { text } = useI18n();
  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  return (
    <div className="hud">
      <header className="hud__top">
        <div className="brand-lockup">
          <span className="brand-lockup__orb" aria-hidden="true" />
          <div>
            <strong>DEEP</strong>
            <span>{text.archiveSubtitle}</span>
          </div>
        </div>

        <nav className="category-nav" aria-label={text.filterArchive}>
          {["ALL", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "is-active" : ""}
              aria-pressed={activeCategory === category}
              onClick={() => onCategoryChange(category)}
            >
              {categoryLabel(category, locale)}
            </button>
          ))}
        </nav>

        <div className="hud__actions">
          <label className="archive-search">
            <span>{text.search}</span>
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={text.searchPlaceholder}
              aria-label={text.searchLabel}
            />
            {searchQuery && (
              <button
                className="archive-search__clear"
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={text.clearSearch}
              >
                ×
              </button>
            )}
          </label>
          <span aria-live="polite">
            {visibleCount === 0
              ? text.noMatches
              : source === "demo"
                ? `${visibleCount} ${text.demoRecords}`
                : `${visibleCount} ${text.records}`}
          </span>
          <div className="hud__links">
            <button
              className="hud__trail-link"
              type="button"
              onClick={onOpenTrail}
            >
              {text.trail}
            </button>
            <button type="button" onClick={onOpenIndex}>
              {text.index}
            </button>
            <button type="button" onClick={onOpenInfo}>
              {text.about}
            </button>
            <div
              className="locale-switcher"
              role="group"
              aria-label={text.language}
            >
              {(Object.keys(localeNames) as Locale[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={locale === value}
                  onClick={() => onLocaleChange(value)}
                >
                  {localeNames[value]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section
        className={`hover-card ${hovered ? "hover-card--visible" : ""}`}
        aria-live="polite"
      >
        <span className="hover-card__index">
          {hovered ? String(hovered.id).padStart(3, "0") : "---"}
        </span>
        <div>
          <strong>{hovered?.title ?? text.move}</strong>
          <span>{hovered?.subtitle ?? text.moveHelp}</span>
        </div>
      </section>

      {onboardingVisible && (
        <aside className="field-guide" aria-label={text.archiveControls}>
          <span className="field-guide__pointer">{text.pointerHelp}</span>
          <span className="field-guide__touch">{text.touchHelp}</span>
          <button type="button" onClick={onDismissOnboarding}>
            {text.gotIt}
          </button>
        </aside>
      )}

      <footer className="site-footer">
        <div className="creator-signature">
          <strong>DG</strong>
          <span>{text.design}</span>
        </div>
        <nav className="creator-links" aria-label={text.creatorLinks}>
          {creatorLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="me noreferrer"
            >
              <span>{link.label}</span>
              <span className="creator-links__external" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
          {!creatorLinks.length && (
            <span>
              {locale === "es"
                ? "ESTUDIO VISUAL INDEPENDIENTE"
                : "INDEPENDENT VISUAL STUDY"}
            </span>
          )}
        </nav>
      </footer>
    </div>
  );
}
