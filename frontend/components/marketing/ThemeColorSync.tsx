'use client';

import { useThemeColor } from '@/lib/useThemeColor';

// The static `viewport.themeColor` export on the marketing layout only
// covers the initial paint — it can't react to the in-app dark-mode toggle,
// which is a localStorage-driven class switch, not `prefers-color-scheme`.
// This keeps the status bar/address bar synced to it after hydration.
export default function ThemeColorSync() {
  useThemeColor('#228B22');
  return null;
}
