'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/useTheme';

// Matches --background in globals.css' .dark block — the status bar should
// go the same near-black the app itself goes to, regardless of which role's
// light-mode color (green/ruby) the page would otherwise use.
const DARK_STATUS_BAR = '#060D1A';

/**
 * Keeps the mobile browser chrome (status bar / address bar) in sync with
 * the app's manual dark-mode toggle, which — unlike the static per-route
 * `viewport.themeColor` export — can't react to `prefers-color-scheme`
 * media queries because dark mode here is a class toggle driven by
 * localStorage, not the OS setting. `lightColor` is whatever role/section
 * color the page uses when not dark (e.g. brand green, creator ruby).
 */
export function useThemeColor(lightColor: string) {
  const { isDark } = useTheme();

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const created = !meta;
    const prev = meta?.getAttribute('content') ?? null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', isDark ? DARK_STATUS_BAR : lightColor);

    return () => {
      if (!meta) return;
      if (created) meta.remove();
      else if (prev !== null) meta.setAttribute('content', prev);
    };
  }, [isDark, lightColor]);
}
