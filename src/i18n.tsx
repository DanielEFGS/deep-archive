import { createContext, useContext } from "react";

export type Locale = "en" | "es";

export const localeNames: Record<Locale, string> = { en: "EN", es: "ES" };

export function resolveInitialLocale(): Locale {
  const urlLocale = new URL(window.location.href).searchParams.get("lang");
  if (urlLocale === "en" || urlLocale === "es") return urlLocale;
  try {
    const saved = localStorage.getItem("deep:locale");
    if (saved === "en" || saved === "es") return saved;
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export const ui = {
  en: {
    archiveSubtitle: "INTERACTIVE ASTRONOMICAL ARCHIVE",
    all: "ALL",
    search: "SEARCH /",
    searchPlaceholder: "OBJECT, YEAR, MISSION",
    searchLabel: "Search archive",
    clearSearch: "Clear search",
    noMatches: "NO MATCHES",
    records: "VISIBLE",
    demoRecords: "DEMO RECORDS",
    trail: "TRAIL 01",
    index: "INDEX",
    about: "ABOUT",
    move: "MOVE TO EXPLORE",
    moveHelp: "CLICK ANY FRAME FOR DETAILS · ARROWS + ENTER SUPPORTED",
    pointerHelp: "Move to reveal · click a frame to inspect · / to search",
    touchHelp: "Drag to explore · tap a frame to inspect",
    gotIt: "GOT IT",
    archiveControls: "Archive controls",
    filterArchive: "Filter astronomical archive",
    design: "DESIGN / DEVELOPMENT",
    independent: "INDEPENDENT PROJECT · NOT NASA-AFFILIATED",
    creatorLinks: "Creator links",
    language: "Language",
    initializing: "INITIALIZING VISUAL FIELD",
    loadingCatalog: "LOADING CATALOG",
    loadingAtlas: "LOADING IMAGE ATLAS",
    unavailable: "CATALOG UNAVAILABLE",
    datasetError: "could not be loaded.",
    retryConnection: "RETRY CONNECTION",
    visualGuide: "VISUAL GUIDE",
    approximateEditorialAreas: "APPROXIMATE EDITORIAL AREAS",
    visualGuideRegion: (count: number) =>
      `Visual guide with ${count} approximate editorial areas. These are not scientific annotations.`,
    visualGuideControls: "Visual Guide controls",
    previousGuidedArea: "Previous guided area",
    nextGuidedArea: "Next guided area",
    collapseVisualGuide: "Collapse Visual Guide",
    openVisualGuide: "Open Visual Guide",
    archiveSectors: "Archive sectors",
    previousSector: "Load previous 500 records",
    nextSector: "Load next 500 records",
  },
  es: {
    archiveSubtitle: "ARCHIVO ASTRONÓMICO INTERACTIVO",
    all: "TODO",
    search: "BUSCAR /",
    searchPlaceholder: "OBJETO, AÑO, MISIÓN",
    searchLabel: "Buscar en el archivo",
    clearSearch: "Limpiar búsqueda",
    noMatches: "SIN RESULTADOS",
    records: "VISIBLES",
    demoRecords: "REGISTROS DEMO",
    trail: "RECORRIDO 01",
    index: "ÍNDICE",
    about: "ACERCA DE",
    move: "MUÉVETE PARA EXPLORAR",
    moveHelp: "ABRE UNA IMAGEN · FLECHAS + ENTER DISPONIBLES",
    pointerHelp: "Muévete para revelar · abre una imagen · / para buscar",
    touchHelp: "Arrastra para explorar · toca una imagen para abrir",
    gotIt: "ENTENDIDO",
    archiveControls: "Controles del archivo",
    filterArchive: "Filtrar archivo astronómico",
    design: "DISEÑO / DESARROLLO",
    independent: "PROYECTO INDEPENDIENTE · SIN AFILIACIÓN CON NASA",
    creatorLinks: "Enlaces del creador",
    language: "Idioma",
    initializing: "INICIANDO CAMPO VISUAL",
    loadingCatalog: "CARGANDO CATÁLOGO",
    loadingAtlas: "CARGANDO ATLAS DE IMÁGENES",
    unavailable: "ARCHIVO NO DISPONIBLE",
    datasetError: "no se pudo cargar.",
    retryConnection: "REINTENTAR CONEXIÓN",
    visualGuide: "GUÍA VISUAL",
    approximateEditorialAreas: "ÁREAS EDITORIALES APROXIMADAS",
    visualGuideRegion: (count: number) =>
      `Guía visual con ${count} áreas editoriales aproximadas. No son anotaciones científicas.`,
    visualGuideControls: "Controles de la guía visual",
    previousGuidedArea: "Área guiada anterior",
    nextGuidedArea: "Área guiada siguiente",
    collapseVisualGuide: "Contraer guía visual",
    openVisualGuide: "Abrir guía visual",
    archiveSectors: "Sectores del archivo",
    previousSector: "Cargar los 500 registros anteriores",
    nextSector: "Cargar los siguientes 500 registros",
  },
} as const;

type I18nValue = { locale: Locale; text: (typeof ui)[Locale] };
export const I18nContext = createContext<I18nValue>({
  locale: "en",
  text: ui.en,
});
export const useI18n = () => useContext(I18nContext);

export const categoryLabel = (category: string, locale: Locale) => {
  if (locale === "en") return category;
  return (
    (
      {
        ALL: "TODO",
        GALAXIES: "GALAXIAS",
        NEBULAE: "NEBULOSAS",
        "DEEP SPACE": "ESPACIO PROFUNDO",
        "SOLAR SYSTEM": "SISTEMA SOLAR",
        EARTH: "TIERRA",
        MISSIONS: "MISIONES",
      } as Record<string, string>
    )[category] ?? category
  );
};

export const qualityLabel = (quality: string, locale: Locale) => {
  if (locale === "en") return quality;
  return (
    (
      { HIGH: "ALTA", BALANCED: "EQUILIBRADA", ECO: "ECO" } as Record<
        string,
        string
      >
    )[quality] ?? quality
  );
};

export const editorialStatusLabel = (status: string, locale: Locale) => {
  if (locale === "en") return status.replace("-", " ").toUpperCase();
  return (
    (
      {
        draft: "BORRADOR",
        "source-checked": "FUENTES VERIFICADAS",
        reviewed: "REVISADO",
      } as Record<string, string>
    )[status] ?? status.toUpperCase()
  );
};

export const observationKindLabel = (kind: string, locale: Locale) => {
  if (locale === "en") return kind.replace("-", " ");
  return (
    (
      {
        "visible-feature": "RASGO VISIBLE",
        "processed-signal": "SEÑAL PROCESADA",
        "editorial-guide": "GUÍA EDITORIAL",
      } as Record<string, string>
    )[kind] ?? kind.replace("-", " ")
  );
};
