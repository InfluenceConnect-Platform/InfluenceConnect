'use client';

import { createContext, useContext, useEffect, useState, createElement, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'ic-theme';

// The admin console is light-only: it has no theme toggle and its pages are
// styled for light alone, so a 'dark' left in storage by the same person's
// creator/brand session must never carry over. Forced, not stored — leaving
// /admin restores whatever theme they actually chose.
const isLightOnlyRoute = (path: string | null) => !!path && path.startsWith('/admin');

// Matches --background in globals.css' .dark block — the mobile status bar
// goes the same near-black the app goes to, regardless of which role's
// light-mode colour (green/ruby) the route would otherwise use.
const DARK_STATUS_BAR = '#060D1A';

// The light-mode status-bar colour for whichever route is mounted, published
// by useThemeColor(). Deliberately a module variable rather than React state:
// applyTheme has to read it *synchronously* so the <meta theme-color> is
// rewritten in the same task that flips the `dark` class. When this waited on
// a re-render + effect instead, the status bar and the page changed a beat
// apart — the visible two-step the toggle used to have.
let activeLightColor = '#228B22';

export function setActiveLightColor(color: string) {
  activeLightColor = color;
}

export function writeThemeColorMeta(theme: Theme) {
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', theme === 'dark' ? DARK_STATUS_BAR : activeLightColor);
}

/** The whole theme change, as one synchronous DOM mutation. */
function commitTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  writeThemeColorMeta(theme);
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

/**
 * Flips the theme without animating a single element.
 *
 * Where View Transitions exist (Chrome, Edge, Safari 18+) the browser
 * snapshots the page before and after `commitTheme` and cross-fades the two
 * as GPU textures — the fade costs nothing per frame no matter how many
 * nodes or backdrop-filters the page has. Everywhere else (Firefox today,
 * and whenever reduced motion is requested) it snaps instantly, which is
 * crisp rather than janky. Both beat the old per-element transition; see the
 * long note in globals.css for why that was the bottleneck.
 */
function applyTheme(theme: Theme, animate: boolean) {
  const root = document.documentElement;

  // Suppress element-level transitions across the flip, then release on the
  // frame after the change has been painted.
  root.classList.add('ic-theme-switching');
  const release = () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove('ic-theme-switching'))
    );

  const doc = document as ViewTransitionDocument;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (!animate || reduced || typeof doc.startViewTransition !== 'function') {
    commitTheme(theme);
    release();
    return;
  }

  // `finished` rejects if the transition is skipped (e.g. tab backgrounded),
  // so settle on both paths rather than leaving the guard class stuck on.
  doc.startViewTransition(() => commitTheme(theme)).finished.then(release, release);
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
  const pathname = usePathname();
  const lightOnly = isLightOnlyRoute(pathname);

  // Re-runs on every entry to and exit from a light-only route, so a
  // client-side navigation into /admin drops the dark class and navigating
  // back out puts the stored theme back.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const resolved: Theme = lightOnly ? 'light' : stored === 'dark' ? 'dark' : 'light';
      setTheme(resolved);
      // The inline <head> script already set the class pre-paint; this only
      // reconciles the meta tag, so never animate it.
      applyTheme(resolved, false);
    } catch {}
  }, [lightOnly]);

  // Persists and applies in one step so callers can't leave the stored value
  // and the <html> class disagreeing.
  const setThemeExplicit = (next: Theme) => {
    // A stray toggle on a light-only route would fight the effect above and
    // overwrite the user's real preference; ignore it outright.
    if (lightOnly) return;
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    applyTheme(next, true);
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
