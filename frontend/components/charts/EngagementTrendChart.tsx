'use client';

import { useMemo, useRef, useEffect, useState } from 'react';

interface Platform {
  name: string;
  followers: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  engagementRate: number;
}

interface Props {
  platforms: Platform[];
  totalFollowers: number;
  dealsCompleted?: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Range = '7d' | '30d';

// Map a JS Date (Sun=0..Sat=6) onto the Mon-indexed weekly shape arrays.
const weekdayShapeIndex = (date: Date) => (date.getDay() + 6) % 7;

// Each platform has a different audience behaviour — peak days differ
const PLATFORM_SHAPES: Record<string, number[]> = {
  instagram:  [0.76, 0.83, 1.05, 1.15, 1.22, 1.28, 1.12],
  youtube:    [0.78, 0.82, 0.88, 1.08, 1.18, 1.30, 1.25],
  tiktok:     [0.70, 0.78, 0.85, 0.95, 1.12, 1.35, 1.28],
  twitter:    [0.98, 1.18, 1.14, 1.06, 0.92, 0.82, 0.78],
  x:          [0.98, 1.18, 1.14, 1.06, 0.92, 0.82, 0.78],
  linkedin:   [0.55, 1.22, 1.28, 1.18, 0.96, 0.60, 0.48],
  facebook:   [0.80, 0.86, 1.04, 1.10, 1.18, 1.24, 1.16],
};
const DEFAULT_SHAPE = [0.82, 0.88, 1.02, 1.18, 1.08, 1.28, 1.14];

// Linear Congruential PRNG — deterministic from seed
function makePRNG(seed: number) {
  let s = Math.abs(Math.round(seed)) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function formatK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

export default function EngagementTrendChart({ platforms, totalFollowers, dealsCompleted = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [hovered, setHovered] = useState<number | null>(null);
  const [range, setRange] = useState<Range>('7d');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const baseEngagement = platforms.reduce(
      (sum, p) => sum + (p.avgLikes || 0) + (p.avgComments || 0) + (p.avgShares || 0),
      0
    ) || 3200;

    // Primary platform = highest followers
    const primary = platforms.reduce<Platform | null>(
      (best, p) => (!best || p.followers > best.followers ? p : best), null
    );
    const platformKey = primary?.name?.toLowerCase() ?? '';
    const shape = PLATFORM_SHAPES[platformKey] ?? DEFAULT_SHAPE;

    // Volatility: how jagged the line is, driven by engagement rate
    // 0% rate → flat (0.05 noise), 5%+ rate → spiky (0.18 noise)
    const avgEngRate = platforms.length
      ? platforms.reduce((s, p) => s + (p.engagementRate || 0), 0) / platforms.length
      : 2;
    const volatility = Math.min(avgEngRate / 5, 1) * 0.18 + 0.04;

    // Trend slope: active creators trend up over the week
    // dealsCompleted drives how much the later days are boosted
    const trendBoost = Math.min(dealsCompleted / 30, 0.25); // 0 → 0.25 max

    // Seed = combination of stats so each profile gets unique noise
    const seed = totalFollowers * 0.01 + avgEngRate * 1000 + dealsCompleted * 77;
    const rng = makePRNG(seed);

    const N = range === '7d' ? 7 : 30;
    // For 30d, label only a handful of evenly spaced points to avoid clutter.
    const labelStep = Math.ceil(N / 6);
    const today = new Date();

    return Array.from({ length: N }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (N - 1 - i));
      const shapeVal = shape[weekdayShapeIndex(date)];
      const noise = (rng() * 2 - 1) * volatility; // ±volatility
      const trend = (i / (N - 1)) * trendBoost; // linear upward tilt over the range
      return {
        label: range === '7d'
          ? DAYS[weekdayShapeIndex(date)]
          : `${date.getDate()} ${MONTHS[date.getMonth()]}`,
        showLabel: range === '7d' || i % labelStep === 0 || i === N - 1,
        value: Math.max(10, Math.round(baseEngagement * shapeVal * (1 + noise) * (1 + trend))),
      };
    });
  }, [platforms, totalFollowers, dealsCompleted, range]);

  const avgComments = platforms.length
    ? Math.round(platforms.reduce((s, p) => s + (p.avgComments || 0), 0) / platforms.length)
    : 0;

  // ── SVG geometry ──────────────────────────────────────
  const PAD = { top: 24, right: 20, bottom: 36, left: 52 };
  const H = 180;
  const W = Math.max(width, 200);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.value));
  const yStep = Math.ceil(maxVal / 4 / 500) * 500 || 500;
  const yMax = yStep * 4;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * plotW,
    y: PAD.top + plotH - (d.value / yMax) * plotH,
    ...d,
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${PAD.top + plotH} L ${pts[0].x} ${PAD.top + plotH} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => i * yStep);
  const hovPt = hovered !== null ? pts[hovered] : null;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 sm:px-6 pt-5 pb-0">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Engagement Trends</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {range === '7d' ? 'Last 7 days performance' : 'Last 30 days performance'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {(['7d', '30d'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => { setRange(r); setHovered(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  range === r
                    ? 'bg-gradient-to-r from-[#1C4A52] to-[#2d7a88] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === '7d' ? '7 Days' : 'Last month'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-teal-700">
              {totalFollowers >= 1_000_000
                ? `${(totalFollowers / 1_000_000).toFixed(1)}M`
                : totalFollowers >= 1_000
                ? `${(totalFollowers / 1_000).toFixed(0)}K`
                : totalFollowers || '—'}
            </span>
            <span className="text-[10px] text-teal-500 font-medium">Total Reach</span>
          </div>
          {avgComments > 0 && (
            <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-bold text-violet-700">{avgComments}</span>
              <span className="text-[10px] text-violet-500 font-medium">Avg. Comments</span>
            </div>
          )}
        </div>
      </div>

      <div ref={containerRef} className="px-2 sm:px-3 pb-4 pt-3">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full overflow-visible"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="eng-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7FA8AD" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7FA8AD" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="eng-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5D8A8F" />
              <stop offset="100%" stopColor="#2d7a88" />
            </linearGradient>
            <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {yTicks.map(tick => {
            const y = PAD.top + plotH - (tick / yMax) * plotH;
            return (
              <g key={tick}>
                <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#f0f4f5" strokeWidth="1" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#b0bec5" fontFamily="sans-serif">
                  {formatK(tick)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#eng-fill)" />
          <path d={linePath} fill="none" stroke="url(#eng-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {pts.map((p, i) => (
            <rect
              key={i}
              x={p.x - plotW / (data.length * 2)}
              y={PAD.top}
              width={plotW / data.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
            />
          ))}

          {hovPt && (
            <>
              <line x1={hovPt.x} y1={PAD.top} x2={hovPt.x} y2={PAD.top + plotH} stroke="#7FA8AD" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx={hovPt.x} cy={hovPt.y} r="6" fill="white" stroke="#2d7a88" strokeWidth="2" filter="url(#dot-glow)" />
              <g>
                <rect x={Math.min(hovPt.x - 28, W - 72)} y={hovPt.y - 36} width={60} height={24} rx="6" fill="#1C4A52" />
                <text x={Math.min(hovPt.x - 28, W - 72) + 30} y={hovPt.y - 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">
                  {formatK(hovPt.value)}
                </text>
              </g>
            </>
          )}

          {range === '7d' && pts.map((p, i) =>
            hovered === i ? null : (
              <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#7FA8AD" strokeWidth="2" />
            )
          )}

          {pts.map((p, i) =>
            p.showLabel ? (
              <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="11"
                fill={hovered === i ? '#1C4A52' : '#9EB8BC'}
                fontWeight={hovered === i ? '700' : '500'}
                fontFamily="sans-serif"
              >
                {p.label}
              </text>
            ) : null
          )}
        </svg>
      </div>
    </div>
  );
}
