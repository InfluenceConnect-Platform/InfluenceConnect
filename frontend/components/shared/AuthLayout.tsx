'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/useTheme';
import { useThemeColor } from '@/lib/useThemeColor';
import ThemeToggle from '@/components/shared/ThemeToggle';

type AuthRole = 'influencer' | 'brand';

interface AuthLayoutProps {
  children: React.ReactNode;
  /**
   * Whose sign-up/sign-in this is. The whole page chrome — background wash,
   * decorative accents, logo mark and the Visit Website pill — follows it, so
   * a brand never sees creator ruby around a green card. Left undefined on
   * screens where no role is known yet (the role chooser): the chrome goes
   * neutral (slate) and the decorative blobs split ruby/green by side, so
   * the page doesn't lean toward either role before the user's picked one.
   */
  role?: AuthRole;
}

// rgb triples so the blob gradients can vary alpha per stop.
const PALETTES: Record<AuthRole, {
  mid: string; main: string; dark: string; darker: string;
  tint: string; border: string; bright: string; hoverTint: string;
  rgbMid: string; rgbDark: string; rgbDarker: string; rgbMain: string;
}> = {
  influencer: {
    mid: '#F0417B', main: '#E0115F', dark: '#B00D4D', darker: '#7A0F3D',
    tint: '#FCE4EC', border: '#F3B8CB', bright: '#FFA8C6', hoverTint: '#F9D0DD',
    rgbMid: '240,65,123', rgbDark: '176,13,77', rgbDarker: '122,15,61', rgbMain: '224,17,95',
  },
  brand: {
    mid: '#3FA34D', main: '#228B22', dark: '#1B6E1B', darker: '#14531D',
    tint: '#EAF7EA', border: '#C8E6C9', bright: '#86D992', hoverTint: '#D6EFD7',
    rgbMid: '63,163,77', rgbDark: '27,110,27', rgbDarker: '20,83,29', rgbMain: '34,139,34',
  },
};

// Neutral chrome for screens where no role is known yet — the role chooser.
// Used for the logo mark, Visit Website pill and dot grid, which only have
// room for one color and shouldn't lean creator or brand before the user
// has picked one. The decorative blobs/rings still split ruby/green by side
// (see below) so both roles stay visually present.
const NEUTRAL = {
  mid: '#64748B', main: '#475569', dark: '#334155', darker: '#1E293B',
  tint: '#F1F5F9', border: '#CBD5E1', bright: '#CBD5E1', hoverTint: '#E2E8F0',
  rgbMid: '100,116,139', rgbDark: '51,65,85', rgbDarker: '30,41,59', rgbMain: '71,85,105',
};

export default function AuthLayout({ children, role }: AuthLayoutProps) {
  const { isDark } = useTheme();
  const neutral = !role;
  const c = role ? PALETTES[role] : NEUTRAL;
  // Left-side decorative accents lean creator ruby, right-side lean brand
  // green, only when no role is chosen yet — once a role is picked every
  // accent follows it via `c` like before.
  const left = neutral ? PALETTES.influencer : c;
  const right = neutral ? PALETTES.brand : c;

  // These pages aren't behind /brand or /influencer yet (auth happens before
  // that layout mounts), so the mobile status bar/address bar has no role-
  // aware theme-color from the server. Set it here, keyed off the same role
  // that drives the rest of the page chrome; the hook also swaps to the dark
  // status-bar color when dark mode is on.
  useThemeColor(c.main);

  return (
    <div
      style={{
        ['--ic-a-mid' as string]: c.mid,
        ['--ic-a-main' as string]: c.main,
        ['--ic-a-dark' as string]: c.dark,
        ['--ic-a-darker' as string]: c.darker,
        ['--ic-a-tint' as string]: c.tint,
        ['--ic-a-border' as string]: c.border,
        ['--ic-a-bright' as string]: c.bright,
        ['--ic-a-hover' as string]: c.hoverTint,
      }}
      className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#060D1A]' : 'bg-gray-50'
      }`}
    >
      {/* Solid ruby/green split strip — only when no role is chosen yet, so
          both identities are unambiguously present in full, flat color
          rather than the low-opacity decorative wash below. */}
      {neutral && (
        <div className="relative z-10 h-[5px] w-full flex shrink-0" aria-hidden="true">
          <div className="h-full w-1/2" style={{ backgroundColor: PALETTES.influencer.main }} />
          <div className="h-full w-1/2" style={{ backgroundColor: PALETTES.brand.main }} />
        </div>
      )}

      {/* ── Decorative Background Layer ── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">

        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="ic-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill={isDark ? `rgba(${c.rgbMid},0.16)` : `rgba(${c.rgbMain},0.13)`} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ic-dots)" />
        </svg>

        {/* Radial overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(6,13,26,0.82) 0%, rgba(6,13,26,0.28) 70%, transparent 100%)'
              : 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(248,250,252,0.85) 0%, rgba(248,250,252,0.3) 70%, transparent 100%)'
          }}
        />

        {/* Blob 1 — top-left (ruby when neutral) */}
        <div
          className="absolute -top-40 -left-40 w-[760px] h-[760px] rounded-full"
          style={{
            background: isDark
              ? `radial-gradient(circle at center, rgba(${left.rgbDark},0.55) 0%, rgba(${left.rgbDark},0.20) 45%, transparent 70%)`
              : `radial-gradient(circle at center, rgba(${left.rgbMid},0.22) 0%, rgba(${left.rgbMid},0.07) 45%, transparent 70%)`,
            filter: 'blur(80px)'
          }}
        />

        {/* Blob 2 — bottom-right (green when neutral) */}
        <div
          className="absolute -bottom-52 -right-36 w-[720px] h-[720px] rounded-full"
          style={{
            background: isDark
              ? `radial-gradient(circle at center, rgba(${right.rgbDarker},0.60) 0%, rgba(${right.rgbDarker},0.20) 45%, transparent 70%)`
              : `radial-gradient(circle at center, rgba(${right.rgbMain},0.13) 0%, rgba(${right.rgbDarker},0.07) 45%, transparent 70%)`,
            filter: 'blur(88px)'
          }}
        />

        {/* Blob 3 — top-right (green when neutral) */}
        <div
          className="absolute -top-20 right-0 w-[420px] h-[420px] rounded-full"
          style={{
            background: isDark
              ? `radial-gradient(circle at center, rgba(${right.rgbMid},0.30) 0%, transparent 65%)`
              : `radial-gradient(circle at center, rgba(${right.rgbMid},0.16) 0%, transparent 65%)`,
            filter: 'blur(64px)'
          }}
        />

        {/* Blob 4 — center-left balance (ruby when neutral) */}
        <div
          className="absolute top-1/2 -left-24 w-[360px] h-[360px] rounded-full"
          style={{
            background: isDark
              ? `radial-gradient(circle at center, rgba(${left.rgbDarker},0.22) 0%, transparent 65%)`
              : `radial-gradient(circle at center, rgba(${left.rgbDarker},0.08) 0%, transparent 65%)`,
            filter: 'blur(64px)'
          }}
        />

        {/* Decorative ring — top-left (ruby when neutral) */}
        <svg
          className={`absolute -top-16 -left-16 ${isDark ? 'opacity-[0.07]' : 'opacity-[0.12]'}`}
          width="380" height="380" viewBox="0 0 380 380"
          fill="none" xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="190" cy="190" r="180" stroke={left.mid} strokeWidth="1.2" />
          <circle cx="190" cy="190" r="130" stroke={left.mid} strokeWidth="0.8" />
          <circle cx="190" cy="190" r="80" stroke={left.mid} strokeWidth="0.6" />
        </svg>

        {/* Decorative ring — bottom-right (green when neutral) */}
        <svg
          className={`absolute -bottom-20 -right-20 ${isDark ? 'opacity-[0.07]' : 'opacity-[0.12]'}`}
          width="420" height="420" viewBox="0 0 420 420"
          fill="none" xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="210" cy="210" r="200" stroke={right.main} strokeWidth="1.2" />
          <circle cx="210" cy="210" r="148" stroke={right.main} strokeWidth="0.8" />
          <circle cx="210" cy="210" r="96" stroke={right.main} strokeWidth="0.6" />
        </svg>

        {/* Plus accent — right (green when neutral) */}
        <svg className={`absolute top-1/3 right-12 ${isDark ? 'opacity-20' : 'opacity-15'}`} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="0" x2="9" y2="18" stroke={right.mid} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="9" x2="18" y2="9" stroke={right.mid} strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Plus accent — left (ruby when neutral) */}
        <svg className={`absolute bottom-1/3 left-14 ${isDark ? 'opacity-15' : 'opacity-10'}`} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="0" x2="9" y2="18" stroke={left.dark} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="9" x2="18" y2="9" stroke={left.dark} strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Small diamond top-center */}
        <svg className={`absolute top-16 left-1/2 -translate-x-1/2 ${isDark ? 'opacity-[0.1]' : 'opacity-[0.15]'}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="5" y="0" width="7" height="7" transform="rotate(45 5 5)" stroke={c.mid} strokeWidth="1" />
        </svg>

        {/* Floating dots — split ruby/green when neutral, matching side */}
        <div className={`absolute top-24 right-1/4 w-2 h-2 rounded-full ${isDark ? 'opacity-20' : 'opacity-30'}`} style={{ backgroundColor: right.mid }} />
        <div className={`absolute top-1/2 left-8 w-1.5 h-1.5 rounded-full ${isDark ? 'opacity-15' : 'opacity-25'}`} style={{ backgroundColor: left.main }} />
        <div className={`absolute bottom-32 right-1/3 w-2 h-2 rounded-full ${isDark ? 'opacity-15' : 'opacity-20'}`} style={{ backgroundColor: right.mid }} />
        <div className={`absolute top-1/4 left-1/3 w-1 h-1 rounded-full ${isDark ? 'opacity-20' : 'opacity-30'}`} style={{ backgroundColor: left.mid }} />
      </div>

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow"
            style={neutral
              ? { background: `linear-gradient(135deg, ${PALETTES.influencer.main} 0%, ${PALETTES.influencer.main} 49%, ${PALETTES.brand.main} 51%, ${PALETTES.brand.main} 100%)` }
              : { background: `linear-gradient(135deg, var(--ic-a-mid), var(--ic-a-darker))` }
            }
          >
            IC
          </div>
          <span className={`font-semibold tracking-tight whitespace-nowrap truncate transition-colors ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
            Influence Connect
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2 rounded-xl border-2 shadow-sm transition-colors ${
              isDark
                ? 'border-[var(--ic-a-mid)]/50 bg-[var(--ic-a-mid)]/15 text-[var(--ic-a-bright)] hover:bg-[var(--ic-a-mid)]/25'
                : 'border-[var(--ic-a-border)] bg-[var(--ic-a-tint)] text-[var(--ic-a-dark)] hover:bg-[var(--ic-a-hover)]'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span className="hidden sm:inline">Visit Website</span>
            <span className="sm:hidden">Website</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

    </div>
  );
}
