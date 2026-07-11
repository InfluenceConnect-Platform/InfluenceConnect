'use client';

import { useTheme } from '@/lib/useTheme';

/**
 * Styled entirely with CSS `dark:` variants (not `isDark` conditionals) so the
 * button flips in the exact same style pass as the rest of the page when the
 * `dark` class on <html> changes — React only supplies the click handler.
 * Light colours use arbitrary hex values (e.g. bg-[#fff]) where the plain
 * token would be repainted by the globals.css dark-cascade overrides.
 */
export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden shadow-sm flex-shrink-0
        border-[#e5e7eb] bg-[#fff] text-[#6b7280] hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300
        dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/60 dark:hover:border-slate-600"
    >
      {/* Sun icon — visible in dark mode (click to go light) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute w-[17px] h-[17px] transition-all duration-300 opacity-0 rotate-90 scale-75 dark:opacity-100 dark:rotate-0 dark:scale-100"
      >
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>

      {/* Moon icon — visible in light mode (click to go dark) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute w-[17px] h-[17px] transition-all duration-300 opacity-100 rotate-0 scale-100 dark:opacity-0 dark:-rotate-90 dark:scale-75"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  );
}
