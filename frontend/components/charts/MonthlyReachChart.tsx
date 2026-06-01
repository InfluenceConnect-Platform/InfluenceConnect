'use client';

import { useMemo, useRef, useEffect, useState } from 'react';

interface Platform {
  followers: number;
  engagementRate: number;
}

interface Props {
  platforms: Platform[];
  dealsCompleted?: number;
  credibilityScore?: number;
}

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Period = '6m' | '1y';

// Linear Congruential PRNG — deterministic from seed
function makePRNG(seed: number) {
  let s = Math.abs(Math.round(seed)) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

function niceYMax(max: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10].map(s => s * magnitude);
  return steps.find(s => s >= max * 1.15) ?? max * 1.2;
}

export default function MonthlyReachChart({ platforms, dealsCompleted = 0, credibilityScore = 0 }: Props) {
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

  const totalFollowers = platforms.reduce((s, p) => s + (p.followers || 0), 0) || 80_000;

  const allData = useMemo(() => {
    // Organic impression rate: scales with avg engagement rate (better engagement = higher reach)
    const avgEngRate = platforms.length
      ? platforms.reduce((s, p) => s + (p.engagementRate || 0), 0) / platforms.length
      : 2;
    const impressionRate = Math.min(0.05 + avgEngRate * 0.008, 0.18); // 5–18% of followers/day
    const baseMonthlyReach = Math.round(totalFollowers * impressionRate * 30);

    // Growth trajectory shape based on deals + credibility
    // More deals = steeper upward slope; high credibility = smoother
    const growthStrength = Math.min(dealsCompleted / 25, 1); // 0 → 1 at 25 deals
    const startRatio = 0.55 + (1 - growthStrength) * 0.30; // active: 0.55→1.0; starter: 0.85→1.0

    // Seeded noise: unique per profile, driven by followers + credibility
    const seed = totalFollowers * 0.003 + credibilityScore * 131 + dealsCompleted * 57;
    const rng = makePRNG(seed);

    // Noise amplitude: low credibility = bumpier, high credibility = smoother
    const noiseAmp = 0.08 - Math.min(credibilityScore / 100, 1) * 0.05; // 0.03–0.08

    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const monthIdx = (today.getMonth() - 11 + i + 12) % 12;
      // Linear growth from startRatio → 1.0
      const growthFactor = startRatio + ((1 - startRatio) * i) / 11;
      const noise = (rng() * 2 - 1) * noiseAmp;
      return {
        month: ALL_MONTHS[monthIdx],
        value: Math.max(1000, Math.round(baseMonthlyReach * growthFactor * (1 + noise))),
      };
    });
  }, [platforms, totalFollowers, dealsCompleted, credibilityScore]);

  const data = period === '6m' ? allData.slice(6) : allData;

  // ── SVG geometry ──────────────────────────────────────
  const PAD = { top: 20, right: 16, bottom: 36, left: 64 };
  const H = 220;
  const W = Math.max(chartWidth, 200);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.value));
  const yMax = niceYMax(maxVal);
  const yTickCount = 4;
  const yTickStep = yMax / yTickCount;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => i * yTickStep);

  const barGap = plotW / data.length;
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
          <p className="text-[11px] text-gray-400 mt-0.5">Total impressions over time</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          {(['6m', '1y'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
      </div>
    </div>
  );
}
