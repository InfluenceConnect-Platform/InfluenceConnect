'use client';

import { useRef, useEffect, useState } from 'react';

interface TrendPoint {
  month: string;
  influencers: number;
  brands: number;
}

interface Props {
  data: TrendPoint[];
}

const CREATOR_COLOR = '#3E4751';
const BRAND_COLOR   = '#7FA8AD';

function niceYMax(max: number): number {
  if (max <= 4) return Math.max(max, 4);
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10].map(s => s * magnitude);
  return steps.find(s => s >= max * 1.1) ?? max * 1.2;
}

export default function AdminGrowthChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(640);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setChartWidth(entries[0].contentRect.width));
    ro.observe(el);
    setChartWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const totalNew = data.reduce((s, d) => s + d.influencers + d.brands, 0);

  // ── SVG geometry ──────────────────────────────────────
  const PAD = { top: 18, right: 14, bottom: 32, left: 36 };
  const H = 240;
  const W = Math.max(chartWidth, 200);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(1, ...data.map(d => Math.max(d.influencers, d.brands)));
  const yMax = niceYMax(maxVal);
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => (yMax / yTickCount) * i);

  const groupGap = plotW / Math.max(data.length, 1);
  const barW = Math.min(groupGap * 0.28, 26);
  const innerGap = barW * 0.25;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 sm:px-6 pt-5 pb-3 gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">User growth</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">New signups over the last 6 months · {totalNew} total</p>
        </div>
        <div className="flex items-center gap-3.5 flex-shrink-0 pt-1">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CREATOR_COLOR }} />
            Creators
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BRAND_COLOR }} />
            Brands
          </span>
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
          {/* Y grid + labels */}
          {yTicks.map((tick, ti) => {
            const y = PAD.top + plotH - (tick / yMax) * plotH;
            return (
              <g key={ti}>
                <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#f0f1f3" strokeWidth="1" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#b0b6bd" fontFamily="sans-serif">
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}

          {/* Grouped bars */}
          {data.map((d, i) => {
            const groupX = PAD.left + i * groupGap + groupGap / 2;
            const infH = (d.influencers / yMax) * plotH;
            const brandH = (d.brands / yMax) * plotH;
            const x1 = groupX - barW - innerGap / 2;
            const x2 = groupX + innerGap / 2;
            const isHover = hovered === i;
            return (
              <g key={i} onMouseEnter={() => setHovered(i)}>
                {/* hover backdrop */}
                <rect
                  x={groupX - groupGap / 2}
                  y={PAD.top}
                  width={groupGap}
                  height={plotH}
                  fill={isHover ? '#3E47510a' : 'transparent'}
                />
                <rect
                  x={x1}
                  y={PAD.top + plotH - infH}
                  width={barW}
                  height={infH}
                  rx={Math.min(5, barW * 0.3)}
                  fill={CREATOR_COLOR}
                  opacity={isHover ? 1 : 0.92}
                  style={{ transition: 'opacity 0.15s ease' }}
                />
                <rect
                  x={x2}
                  y={PAD.top + plotH - brandH}
                  width={barW}
                  height={brandH}
                  rx={Math.min(5, barW * 0.3)}
                  fill={BRAND_COLOR}
                  opacity={isHover ? 1 : 0.92}
                  style={{ transition: 'opacity 0.15s ease' }}
                />

                {/* tooltip */}
                {isHover && (d.influencers > 0 || d.brands > 0) && (
                  <g>
                    <rect x={groupX - 46} y={PAD.top - 6} width={92} height={38} rx="7" fill="#1f2937" />
                    <text x={groupX} y={PAD.top + 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#9ca3af" fontFamily="sans-serif">
                      {d.month}
                    </text>
                    <text x={groupX} y={PAD.top + 24} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">
                      {d.influencers} creators · {d.brands} brands
                    </text>
                  </g>
                )}

                <text
                  x={groupX}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isHover ? '#3E4751' : '#9aa0a6'}
                  fontWeight={isHover ? '700' : '500'}
                  fontFamily="sans-serif"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
