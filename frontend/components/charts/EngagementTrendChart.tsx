'use client';

import { useMemo, useRef, useEffect, useState } from 'react';

// One real recorded data point (see /api/influencer/stats-history).
interface StatsSnapshot {
  day: string;
  totalFollowers: number;
  totalEngagement: number;
  avgEngagementRate: number;
}

interface Props {
  history: StatsSnapshot[];
  totalFollowers: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Range = '7d' | '30d';

const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

const fmtPct = (n: number) => `${Math.round(n * 10) / 10}%`;

export default function EngagementTrendChart({ history, totalFollowers }: Props) {
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

  // Real recorded engagement-rate points within the selected window.
  const data = useMemo(() => {
    const N = range === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (N - 1));

    const labelStep = Math.ceil(N / 6);

    return (history ?? [])
      .map(s => ({ ...s, date: new Date(s.day) }))
      .filter(s => !isNaN(s.date.getTime()) && s.date >= cutoff)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((s, i, arr) => ({
        label: range === '7d'
          ? DAYS[weekdayIndex(s.date)]
          : `${s.date.getDate()} ${MONTHS[s.date.getMonth()]}`,
        showLabel: range === '7d' || i % labelStep === 0 || i === arr.length - 1,
        value: s.avgEngagementRate || 0,
      }));
  }, [history, range]);

  const latestRate = history?.length ? history[history.length - 1].avgEngagementRate : 0;

  // ── SVG geometry ──────────────────────────────────────
  const PAD = { top: 24, right: 20, bottom: 36, left: 52 };
  const H = 180;
  const W = Math.max(width, 200);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = data.length ? Math.max(...data.map(d => d.value)) : 0;
  const yMax = Math.max(2, Math.ceil((maxVal * 1.2) / 2) * 2);
  const yTicks = Array.from({ length: 5 }, (_, i) => (i * yMax) / 4);

  // One point can't form a line — center it; otherwise spread across the plot.
  const pts = data.map((d, i) => ({
    x: data.length === 1
      ? PAD.left + plotW / 2
      : PAD.left + (i / (data.length - 1)) * plotW,
    y: PAD.top + plotH - (d.value / yMax) * plotH,
    ...d,
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, '');

  const areaPath = pts.length > 1
    ? `${linePath} L ${pts[pts.length - 1].x} ${PAD.top + plotH} L ${pts[0].x} ${PAD.top + plotH} Z`
    : '';

  const hovPt = hovered !== null ? pts[hovered] : null;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 sm:px-6 pt-5 pb-0">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Engagement Trends</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Recorded engagement rate · {range === '7d' ? 'last 7 days' : 'last 30 days'}
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
            <span className="text-[10px] text-teal-500 font-medium">Reach</span>
          </div>
          {latestRate > 0 && (
            <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-bold text-violet-700">{fmtPct(latestRate)}</span>
              <span className="text-[10px] text-violet-500 font-medium">Avg. Engagement</span>
            </div>
          )}
        </div>
      </div>

      <div ref={containerRef} className="px-2 sm:px-3 pb-4 pt-3">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-2 px-6" style={{ height: H }}>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">No engagement data yet</p>
            <p className="text-[11px] text-gray-400 max-w-xs">
              Your engagement rate is recorded once a day. Update your social stats and check back — this trend fills in as the days go by.
            </p>
          </div>
        ) : (
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
                    {fmtPct(tick)}
                  </text>
                </g>
              );
            })}

            {areaPath && <path d={areaPath} fill="url(#eng-fill)" />}
            {pts.length > 1 && (
              <path d={linePath} fill="none" stroke="url(#eng-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {pts.map((p, i) => (
              <rect
                key={i}
                x={p.x - plotW / (Math.max(data.length, 1) * 2)}
                y={PAD.top}
                width={plotW / Math.max(data.length, 1)}
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
                  <rect x={Math.min(Math.max(hovPt.x - 30, 2), W - 64)} y={hovPt.y - 36} width={62} height={24} rx="6" fill="#1C4A52" />
                  <text x={Math.min(Math.max(hovPt.x - 30, 2), W - 64) + 31} y={hovPt.y - 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">
                    {fmtPct(hovPt.value)}
                  </text>
                </g>
              </>
            )}

            {pts.map((p, i) =>
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
        )}
      </div>
    </div>
  );
}
