import { useEffect, useRef, useState } from "react";
import type { CatalogItem } from "../types/catalog";
import { creatorLinks } from "../config/site";
import { categoryLabel, localeNames, useI18n, type Locale } from "../i18n";
import { useDialogFocus } from "../hooks/useDialogFocus";

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

type MobileDrawerProps = Pick<
  Props,
  | "categories"
  | "activeCategory"
  | "onCategoryChange"
  | "onOpenInfo"
  | "onOpenIndex"
  | "onOpenTrail"
  | "locale"
  | "onLocaleChange"
> & { onClose: () => void };

function MobileDrawer({
  categories,
  activeCategory,
  onCategoryChange,
  onOpenInfo,
  onOpenIndex,
  onOpenTrail,
  locale,
  onLocaleChange,
  onClose,
}: MobileDrawerProps) {
  const { text } = useI18n();
  const panelRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useDialogFocus(panelRef, onClose, closeRef);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const runAndClose = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="mobile-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        ref={panelRef}
        className="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-drawer-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <strong id="mobile-drawer-title">{locale === "es" ? "EXPLORAR" : "EXPLORE"}</strong>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={locale === "es" ? "Cerrar menú" : "Close menu"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <nav className="mobile-drawer__categories" aria-label={text.filterArchive}>
          {["ALL", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "is-active" : ""}
              aria-pressed={activeCategory === category}
              onClick={() => runAndClose(() => onCategoryChange(category))}
            >
              {categoryLabel(category, locale)}
            </button>
          ))}
        </nav>
        <nav className="mobile-drawer__destinations" aria-label={locale === "es" ? "Secciones" : "Sections"}>
          <button type="button" onClick={() => runAndClose(onOpenTrail)}>{text.trail}</button>
          <button type="button" onClick={() => runAndClose(onOpenIndex)}>{text.index}</button>
          <button type="button" onClick={() => runAndClose(onOpenInfo)}>{text.about}</button>
        </nav>
        <div className="mobile-drawer__language" role="group" aria-label={text.language}>
          <span>{text.language}</span>
          {(Object.keys(localeNames) as Locale[]).map((value) => (
            <button key={value} type="button" aria-pressed={locale === value} onClick={() => runAndClose(() => onLocaleChange(value))}>
              {localeNames[value]}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

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
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
  useEffect(() => {
    if (mobileSearchOpen) mobileSearchRef.current?.focus();
  }, [mobileSearchOpen]);
  return (
    <div className="hud">
      <header className={`hud__top${mobileSearchOpen ? " is-mobile-search-open" : ""}`}>
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

        <div className="mobile-header__actions">
          <button
            className="mobile-header__search-toggle"
            type="button"
            aria-label={mobileSearchOpen ? text.clearSearch : text.searchLabel}
            aria-expanded={mobileSearchOpen}
            onClick={() => {
              if (mobileSearchOpen) onSearchChange("");
              setMobileSearchOpen((open) => !open);
              setMobileMenuOpen(false);
            }}
          >
            {mobileSearchOpen ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5" /><path d="m14.5 14.5 5 5" /></svg>
            )}
          </button>
          <button
            className="mobile-header__menu-toggle"
            type="button"
            aria-label={locale === "es" ? "Abrir menú" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => {
              setMobileMenuOpen(true);
              setMobileSearchOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>

        {mobileSearchOpen && (
          <label className="mobile-search">
            <span>{text.search}</span>
            <input
              ref={mobileSearchRef}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={text.searchPlaceholder}
              aria-label={text.searchLabel}
            />
          </label>
        )}

        {activeCategory !== "ALL" && (
          <button
            className="mobile-active-filter"
            type="button"
            onClick={() => onCategoryChange("ALL")}
            aria-label={`${categoryLabel(activeCategory, locale)} · ${locale === "es" ? "quitar filtro" : "clear filter"}`}
          >
            {categoryLabel(activeCategory, locale)} <span aria-hidden="true">×</span>
          </button>
        )}
      </header>

      {mobileMenuOpen && (
        <MobileDrawer
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          onOpenInfo={onOpenInfo}
          onOpenIndex={onOpenIndex}
          onOpenTrail={onOpenTrail}
          locale={locale}
          onLocaleChange={onLocaleChange}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

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
