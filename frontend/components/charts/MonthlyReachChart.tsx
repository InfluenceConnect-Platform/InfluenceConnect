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
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Period = '6m' | '1y';

function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

function niceYMax(max: number): number {
  if (max <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10].map(s => s * magnitude);
  return steps.find(s => s >= max * 1.15) ?? max * 1.2;
}

export default function MonthlyReachChart({ history }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(560);
  const [period, setPeriod] = useState<Period>('6m');
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setChartWidth(entries[0].contentRect.width));
    ro.observe(el);
    setChartWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Real recorded reach, one value per month (latest recorded day in that
  // month = end-of-month reach), within the selected window.
  const data = useMemo(() => {
    const N = period === '6m' ? 6 : 12;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(1);
    cutoff.setMonth(cutoff.getMonth() - (N - 1));

    // monthKey → { date, value, capturedDay } keeping the latest day per month.
    const byMonth = new Map<string, { date: Date; value: number; day: number }>();
    for (const s of history ?? []) {
      const d = new Date(s.day);
      if (isNaN(d.getTime()) || d < cutoff) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const existing = byMonth.get(key);
      if (!existing || d.getTime() > existing.day) {
        byMonth.set(key, {
          date: new Date(d.getFullYear(), d.getMonth(), 1),
          value: s.totalFollowers || 0,
          day: d.getTime(),
        });
      }
    }

    return Array.from(byMonth.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(m => ({ month: MONTHS[m.date.getMonth()], value: m.value }));
  }, [history, period]);

  // ── SVG geometry ──────────────────────────────────────
  const PAD = { top: 20, right: 16, bottom: 36, left: 64 };
  const H = 220;
  const W = Math.max(chartWidth, 200);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = data.length ? Math.max(...data.map(d => d.value)) : 0;
  const yMax = niceYMax(maxVal);
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => (i * yMax) / yTickCount);

  // Keep bars a sensible width even with only one or two months of data.
  const slots = Math.max(data.length, 3);
  const barGap = plotW / slots;
  const barW = barGap * 0.6;

  const bars = data.map((d, i) => {
    const barH = (d.value / yMax) * plotH;
    return {
      x: PAD.left + i * barGap + (barGap - barW) / 2,
      y: PAD.top + plotH - barH,
      width: barW,
      height: barH,
      ...d,
      idx: i,
    };
  });

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 sm:px-6 pt-5 pb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Monthly Reach</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Recorded total followers by month</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          {(['6m', '1y'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setHovered(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === p
                  ? 'bg-gradient-to-r from-[#1C4A52] to-[#2d7a88] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === '6m' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="px-2 sm:px-3 pb-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-2 px-6" style={{ height: H }}>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">No reach data yet</p>
            <p className="text-[11px] text-gray-400 max-w-xs">
              Your total reach is recorded each month from your follower counts. Add your social stats — bars appear here as months are recorded.
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
              <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2d7a88" stopOpacity="1" />
                <stop offset="100%" stopColor="#7FA8AD" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="bar-grad-hover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1C4A52" stopOpacity="1" />
                <stop offset="100%" stopColor="#4A8D95" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {yTicks.map((tick, ti) => {
              const y = PAD.top + plotH - (tick / yMax) * plotH;
              return (
                <g key={ti}>
                  <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#f0f4f5" strokeWidth="1" />
                  <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#b0bec5" fontFamily="sans-serif">
                    {formatReach(tick)}
                  </text>
                </g>
              );
            })}

            {bars.map(bar => (
              <g key={bar.idx} onMouseEnter={() => setHovered(bar.idx)}>
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  rx={Math.min(6, bar.width * 0.25)}
                  fill={hovered === bar.idx ? 'url(#bar-grad-hover)' : 'url(#bar-grad)'}
                  style={{ transition: 'fill 0.15s ease' }}
                />
                {hovered === bar.idx && (
                  <g>
                    <rect x={bar.x + bar.width / 2 - 28} y={bar.y - 30} width={56} height={22} rx="6" fill="#1C4A52" />
                    <text x={bar.x + bar.width / 2} y={bar.y - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">
                      {formatReach(bar.value)}
                    </text>
                  </g>
                )}
                <text
                  x={bar.x + bar.width / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill={hovered === bar.idx ? '#1C4A52' : '#9EB8BC'}
                  fontWeight={hovered === bar.idx ? '700' : '500'}
                  fontFamily="sans-serif"
                >
                  {bar.month}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
