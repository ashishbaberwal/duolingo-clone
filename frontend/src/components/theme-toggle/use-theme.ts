"use client";

import { useCallback, useEffect } from "react";

export type ColorTheme = "dark" | "light";

const STORAGE_KEY = "lingotrail-theme";
const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

function systemTheme(): ColorTheme {
  return window.matchMedia(DARK_THEME_QUERY).matches ? "dark" : "light";
}

function storedTheme(): ColorTheme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function activeTheme(): ColorTheme {
  const documentTheme = document.documentElement.dataset.theme;
  if (documentTheme === "dark" || documentTheme === "light") {
    return documentTheme;
  }
  return storedTheme() ?? systemTheme();
}

function applyTheme(theme: ColorTheme, persist: boolean) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The document theme still works when storage is unavailable.
    }
  }
}

export function useTheme() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_THEME_QUERY);

    function followSystemTheme(event: MediaQueryListEvent) {
      if (storedTheme() !== null) {
        return;
      }
      const nextTheme = event.matches ? "dark" : "light";
      applyTheme(nextTheme, false);
    }

    mediaQuery.addEventListener("change", followSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", followSystemTheme);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = activeTheme() === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  }, []);

  return { toggleTheme };
}
