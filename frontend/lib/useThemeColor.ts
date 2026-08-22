'use client';

import { useEffect } from 'react';
import { useTheme, setActiveLightColor, writeThemeColorMeta } from '@/lib/useTheme';

/**
 * Keeps the mobile browser chrome (status bar / address bar) in sync with
 * the app's manual dark-mode toggle, which — unlike the static per-route
 * `viewport.themeColor` export — can't react to `prefers-color-scheme`
 * media queries because dark mode here is a class toggle driven by
 * localStorage, not the OS setting. `lightColor` is whatever role/section
 * colour the page uses when not dark (e.g. brand green, creator ruby).
 *
 * This only handles *route* changes. The theme toggle itself repaints the
 * meta tag synchronously inside applyTheme() — going through a React effect
 * there would land the status-bar change a frame or more after the page
 * flipped, which read as the toggle lagging.
 */
export function useThemeColor(lightColor: string) {
  const { theme } = useTheme();

  useEffect(() => {
    setActiveLightColor(lightColor);
    writeThemeColorMeta(theme);
  }, [theme, lightColor]);
}
