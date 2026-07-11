'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/shared/ThemeToggle';
import ScrollProgress from '@/components/marketing/ScrollProgress';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/for-creators', label: 'For Creators' },
  { href: '/for-brands', label: 'For Brands' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Styled entirely with CSS `dark:` variants (not `isDark` conditionals) so the
 * nav flips in the exact same style pass as the page content when the theme
 * toggles — an isDark-driven nav re-renders one React pass behind the <html>
 * class change and visibly lags. Light colours use arbitrary hex values
 * (e.g. bg-[#f3f4f6]) where the plain token would be repainted by the
 * globals.css dark-cascade overrides instead of the intended dark: value.
 */
export default function MarketingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? 'bg-white/90 dark:bg-[#060D1A]/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-slate-800/80 shadow-[0_1px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.35)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <ScrollProgress />
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between" aria-label="Main">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
            IC
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight block leading-none transition-colors text-gray-900 dark:text-slate-100">
              Influence Connect
            </span>
            <span className="text-[0.6rem] font-medium tracking-wide uppercase transition-colors text-gray-500 dark:text-slate-500">
              Creator · Brand Platform
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-gray-900 bg-[#f3f4f6] dark:text-white dark:bg-slate-800/80'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="px-4.5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#5D8A8F] to-[#7C3AED] hover:from-[#4A7A7F] hover:to-[#5B21B6] shadow-md hover:shadow-lg active:scale-[0.97] transition-all duration-200"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex lg:hidden items-center gap-2.5">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors cursor-pointer border-[#e5e7eb] bg-[#fff] text-[#4b5563] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="lg:hidden border-t px-5 pt-3 pb-6 flex flex-col gap-1 border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-[#060D1A]/95 backdrop-blur-xl">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className={`px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-gray-900 bg-[#f3f4f6] dark:text-white dark:bg-slate-800/80'
                  : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="h-px my-3 bg-gray-100 dark:bg-slate-800" />
          <div className="flex flex-col gap-2.5">
            <Link
              href="/auth/login"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-center border transition-colors border-[#e5e7eb] text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-[#5D8A8F] to-[#7C3AED] shadow-md active:scale-[0.98] transition-all"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
