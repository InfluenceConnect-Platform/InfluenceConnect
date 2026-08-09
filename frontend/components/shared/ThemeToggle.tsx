'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/useTheme';

/**
 * Styled entirely with CSS `dark:` variants (not `isDark` conditionals) so the
 * button flips in the exact same style pass as the rest of the page when the
 * `dark` class on <html> changes — React only supplies the click handler.
 * Light colours use arbitrary hex values (e.g. bg-[#fff]) where the plain
 * token would be repainted by the globals.css dark-cascade overrides.
 */
interface ThemeToggleProps {
  /**
   * When false the control is shown locked with an upsell instead of toggling.
   * Passed by the two role navs, where dark mode is a paid perk; every other
   * surface (marketing, auth, legal, admin) omits it and keeps the toggle.
   */
  enabled?: boolean;
  /** Where to send someone who wants to unlock it. */
  upgradeHref?: string;
}

export default function ThemeToggle({ enabled = true, upgradeHref }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  if (!enabled) {
    const label = 'Dark mode is available on a paid plan';
    const cls = `relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 overflow-hidden shadow-sm flex-shrink-0
        border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af] hover:text-gray-600 hover:border-gray-300
        dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500`;
    const icon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
    return upgradeHref ? (
      <Link href={upgradeHref} aria-label={label} title={label} className={`${cls} cursor-pointer`}>
        {icon}
      </Link>
    ) : (
      <button type="button" disabled aria-label={label} title={label} className={`${cls} cursor-not-allowed`}>
        {icon}
      </button>
    );
  }

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
