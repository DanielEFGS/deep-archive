import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "deep:theme";

function savedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch {
    return null;
  }
}

export function resolveInitialTheme(): Theme {
  return (
    savedTheme() ??
    (window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark")
  );
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#eeede8" : "#06080d");
}

export function useTheme(initialTheme: Theme) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (savedTheme()) return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const followSystemTheme = (event: MediaQueryListEvent) => {
      if (savedTheme()) return;
      setTheme(event.matches ? "light" : "dark");
    };
    query.addEventListener("change", followSystemTheme);
    return () => query.removeEventListener("change", followSystemTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* optional preference */
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
