'use client';

import { useState, useEffect, useRef, useId, type ReactNode, type MouseEvent } from 'react';
import AdminNav from '@/components/shared/AdminNav';

/**
 * Shared chrome for every admin page: ambient backdrop, nav, and the
 * main content container. Keeps the panel visually consistent so pages
 * only describe their own content.
 */
export function AdminShell({
  user,
  narrow,
  children,
}: {
  user?: { name?: string } | null;
  narrow?: boolean;
  children: ReactNode;
}) {
  // The admin panel is light-only — it was never built with dark-mode styling
  // (unlike the rest of the app, which the user can toggle to dark). If dark
  // mode is on from browsing elsewhere on the site, the global dark-mode CSS
  // overrides some text colours here but not the light-only backgrounds,
  // producing washed-out, barely-visible text. Force light while mounted here.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F8FB] relative overflow-x-clip">
      {/* Ambient colour wash behind the top of the page */}
      <div className="absolute inset-x-0 top-0 h-[460px] overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#ECF2F3] via-[#F3F5F9] to-transparent" />
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#7FA8AD]/[0.17] blur-3xl anim-blob" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/3 w-[420px] h-[420px] rounded-full bg-indigo-300/[0.10] blur-3xl" />
        <div className="absolute -top-24 -right-28 w-[400px] h-[400px] rounded-full bg-amber-300/[0.13] blur-3xl anim-blob" style={{ animationDelay: '4s' }} />
      </div>

      <AdminNav user={user} />

      <main className={`relative ${narrow ? 'max-w-5xl' : 'max-w-[1280px]'} mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9`}>
        {children}
      </main>
    </div>
  );
}

/** Standard page header: eyebrow with gradient tick, bold title, optional count pill, subtitle and right-aligned actions. */
export function AdminHeader({
  eyebrow,
  title,
  subtitle,
  count,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  count?: number;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7 anim-fade-up">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold text-[#5D8A8F] uppercase tracking-[0.18em] mb-2">
          <span className="w-6 h-[3px] rounded-full bg-gradient-to-r from-[#5D8A8F] via-[#7FA8AD] to-amber-400" />
          {eyebrow}
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] sm:text-[29px] font-extrabold tracking-tight text-gray-900">{title}</h1>
          {typeof count === 'number' && count > 0 && (
            <span className="text-sm font-semibold text-[#3E4751] bg-white border border-gray-200/80 px-2.5 py-0.5 rounded-full tabular-nums shadow-sm">
              {count.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

/** Animates a number from its previous value to `value` with an ease-out curve. Respects prefers-reduced-motion. */
export function CountUp({
  value,
  format,
  className,
  duration = 900,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString('en-IN'));
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = reduced ? value : fromRef.current;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = from === value ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (value - from) * eased;
      fromRef.current = current;
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{fmt(display)}</span>;
}

/** Tiny inline area sparkline with a soft gradient fill and end-point dot. */
export function Sparkline({
  points,
  color = '#7FA8AD',
  className,
}: {
  points: number[];
  color?: string;
  className?: string;
}) {
  const gradId = useId();
  if (points.length < 2) return null;
  const W = 120, H = 36, P = 3;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const step = (W - P * 2) / (points.length - 1);
  const coords = points.map((v, i) => [
    P + i * step,
    H - P - ((v - min) / range) * (H - P * 2),
  ] as const);
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${last[0]},${H} L${coords[0][0]},${H} Z`} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}

/** Month-over-month delta pill: ↑ green, ↓ red, → gray. Hidden when there's no history to compare. */
export function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous <= 0 && current <= 0) return null;
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 100;
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
        flat
          ? 'bg-gray-100 text-gray-500 border border-gray-200'
          : up
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : 'bg-red-50 text-red-600 border border-red-100'
      }`}
      title="vs previous month"
    >
      {flat ? '→' : up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

/** Card wrapper whose hover glow follows the cursor (spotlight effect). Pass the full card styling via className. */
export function SpotlightCard({
  className = '',
  spotColor = 'rgba(127, 168, 173, 0.18)',
  children,
}: {
  className?: string;
  spotColor?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMouseMove} className={`relative overflow-hidden group/spot ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover/spot:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotColor}, transparent 70%)` }}
      />
      {children}
    </div>
  );
}

/** Shimmer placeholder for tables and lists while data loads. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="px-5 py-5 flex flex-col gap-5 animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="h-3 bg-gray-100 rounded-full" style={{ width: `${42 - (i % 3) * 8}%` }} />
            <div className="h-2.5 bg-gray-100/80 rounded-full" style={{ width: `${26 + (i % 2) * 6}%` }} />
          </div>
          <div className="hidden sm:block h-5 w-16 bg-gray-100 rounded-full flex-shrink-0" />
          <div className="hidden md:block h-5 w-14 bg-gray-100 rounded-full flex-shrink-0" />
          <div className="hidden lg:block h-5 w-20 bg-gray-100 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
