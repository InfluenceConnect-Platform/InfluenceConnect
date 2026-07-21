'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/useTheme';
import ThemeToggle from '@/components/shared/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#060D1A]' : 'bg-gray-50'
    }`}>

      {/* ── Decorative Background Layer ── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">

        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="ic-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill={isDark ? 'rgba(127,168,173,0.14)' : 'rgba(93,138,143,0.12)'} />
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

        {/* Blob 1 — teal, top-left */}
        <div
          className="absolute -top-40 -left-40 w-[760px] h-[760px] rounded-full"
          style={{
            background: isDark
              ? 'radial-gradient(circle at center, rgba(93,138,143,0.55) 0%, rgba(93,138,143,0.2) 45%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(127,168,173,0.25) 0%, rgba(127,168,173,0.08) 45%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />

        {/* Blob 2 — deep navy-blue, bottom-right */}
        <div
          className="absolute -bottom-52 -right-36 w-[720px] h-[720px] rounded-full"
          style={{
            background: isDark
              ? 'radial-gradient(circle at center, rgba(61,80,135,0.6) 0%, rgba(61,80,135,0.2) 45%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(139,92,246,0.15) 0%, rgba(61,80,135,0.07) 45%, transparent 70%)',
            filter: 'blur(88px)'
          }}
        />

        {/* Blob 3 — teal, top-right */}
        <div
          className="absolute -top-20 right-0 w-[420px] h-[420px] rounded-full"
          style={{
            background: isDark
              ? 'radial-gradient(circle at center, rgba(127,168,173,0.32) 0%, transparent 65%)'
              : 'radial-gradient(circle at center, rgba(127,168,173,0.18) 0%, transparent 65%)',
            filter: 'blur(64px)'
          }}
        />

        {/* Blob 4 — navy, center-left balance */}
        <div
          className="absolute top-1/2 -left-24 w-[360px] h-[360px] rounded-full"
          style={{
            background: isDark
              ? 'radial-gradient(circle at center, rgba(61,80,135,0.2) 0%, transparent 65%)'
              : 'radial-gradient(circle at center, rgba(61,80,135,0.08) 0%, transparent 65%)',
            filter: 'blur(64px)'
          }}
        />

        {/* Decorative ring — top-left */}
        <svg
          className={`absolute -top-16 -left-16 ${isDark ? 'opacity-[0.07]' : 'opacity-[0.12]'}`}
          width="380" height="380" viewBox="0 0 380 380"
          fill="none" xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="190" cy="190" r="180" stroke="#7FA8AD" strokeWidth="1.2" />
          <circle cx="190" cy="190" r="130" stroke="#7FA8AD" strokeWidth="0.8" />
          <circle cx="190" cy="190" r="80" stroke="#7FA8AD" strokeWidth="0.6" />
        </svg>

        {/* Decorative ring — bottom-right */}
        <svg
          className={`absolute -bottom-20 -right-20 ${isDark ? 'opacity-[0.07]' : 'opacity-[0.12]'}`}
          width="420" height="420" viewBox="0 0 420 420"
          fill="none" xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="210" cy="210" r="200" stroke="#5D8A8F" strokeWidth="1.2" />
          <circle cx="210" cy="210" r="148" stroke="#5D8A8F" strokeWidth="0.8" />
          <circle cx="210" cy="210" r="96" stroke="#5D8A8F" strokeWidth="0.6" />
        </svg>

        {/* Plus accent — right */}
        <svg className={`absolute top-1/3 right-12 ${isDark ? 'opacity-20' : 'opacity-15'}`} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="0" x2="9" y2="18" stroke="#7FA8AD" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="9" x2="18" y2="9" stroke="#7FA8AD" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Plus accent — left */}
        <svg className={`absolute bottom-1/3 left-14 ${isDark ? 'opacity-15' : 'opacity-10'}`} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="0" x2="9" y2="18" stroke="#3D5087" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="9" x2="18" y2="9" stroke="#3D5087" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Small diamond top-center */}
        <svg className={`absolute top-16 left-1/2 -translate-x-1/2 ${isDark ? 'opacity-[0.1]' : 'opacity-[0.15]'}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="5" y="0" width="7" height="7" transform="rotate(45 5 5)" stroke="#7FA8AD" strokeWidth="1" />
        </svg>

        {/* Floating dots */}
        <div className={`absolute top-24 right-1/4 w-2 h-2 rounded-full bg-[#7FA8AD] ${isDark ? 'opacity-20' : 'opacity-30'}`} />
        <div className={`absolute top-1/2 left-8 w-1.5 h-1.5 rounded-full bg-[#5D8A8F] ${isDark ? 'opacity-15' : 'opacity-25'}`} />
        <div className={`absolute bottom-32 right-1/3 w-2 h-2 rounded-full bg-[#7FA8AD] ${isDark ? 'opacity-15' : 'opacity-20'}`} />
        <div className={`absolute top-1/4 left-1/3 w-1 h-1 rounded-full bg-[#7FA8AD] ${isDark ? 'opacity-20' : 'opacity-30'}`} />
      </div>

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0d6672] to-[#3346d9] flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
            IC
          </div>
          <span className={`font-semibold tracking-tight transition-colors ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
            Influence Connect
          </span>
        </Link>

        <ThemeToggle />
      </header>

      {/* ── Page content ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

    </div>
  );
}
