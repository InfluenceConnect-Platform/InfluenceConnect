'use client';

import { createContext, useContext, useEffect, useState, createElement, ReactNode } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'ic-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  /** Set explicitly — used to force light when a tier loses the dark-mode perk. */
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  isDark: false,
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const resolved: Theme = stored === 'dark' ? 'dark' : 'light';
      setTheme(resolved);
      applyTheme(resolved);
    } catch {}
  }, []);

  // Persists and applies in one step so callers can't leave the stored value
  // and the <html> class disagreeing.
  const setThemeExplicit = (next: Theme) => {
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    applyTheme(next);
  };

  const toggle = () => setThemeExplicit(theme === 'dark' ? 'light' : 'dark');

  return createElement(
    ThemeContext.Provider,
    { value: { theme, isDark: theme === 'dark', toggle, setTheme: setThemeExplicit } },
    children
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
