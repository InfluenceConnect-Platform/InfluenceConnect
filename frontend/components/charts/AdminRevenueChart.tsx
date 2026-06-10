'use client';

import { useRef, useEffect, useState } from 'react';

interface Point { month: string; value: number; }
interface Props {
  data: Point[];
  title?: string;
  subtitle?: string;
  color?: string;
}

function formatINR(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${Math.round(n / 1_000)}K`;
  return `₹${Math.round(n)}`;
}

function niceYMax(max: number): number {
  if (max <= 0) return 1000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10].map(s => s * magnitude);
  return steps.find(s => s >= max * 1.1) ?? max * 1.2;
}

export default function AdminRevenueChart({
  data,
  title = 'Revenue (GMV)',
  subtitle,
  color = '#10b981',
}: Props) {
  const LINE = color;
  const FILL_TOP = color;
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(400);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setChartWidth(entries[0].contentRect.width));
    ro.observe(el);
    setChartWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);

  const PAD = { top: 18, right: 16, bottom: 30, left: 44 };
  const H = 220;
  const W = Math.max(chartWidth, 200);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(1, ...data.map(d => d.value));
  const yMax = niceYMax(maxVal);
  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);

  const stepX = data.length > 1 ? plotW / (data.length - 1) : plotW;
  const pts = data.map((d, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + plotH - (d.value / yMax) * plotH,
    ...d,
    idx: i,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = pts.length
    ? `${linePath} L${pts[pts.length - 1].x},${PAD.top + plotH} L${pts[0].x},${PAD.top + plotH} Z`
    : '';

  return (
    <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-3">
        <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {subtitle ?? `Completed deal value · last 6 months · ${formatINR(total)} total`}
        </p>
      </div>

      <div ref={containerRef} className="px-2 sm:px-3 pb-4">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" onMouseLeave={() => setHovered(null)}>
          <defs>
            <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FILL_TOP} stopOpacity="0.22" />
              <stop offset="100%" stopColor={FILL_TOP} stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, ti) => {
            const y = PAD.top + plotH - (tick / yMax) * plotH;
            return (
              <g key={ti}>
                <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#f0f1f3" strokeWidth="1" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#b0b6bd" fontFamily="sans-serif">
                  {formatINR(tick)}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#rev-area)" />}
          {linePath && <path d={linePath} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

          {pts.map(p => (
            <g key={p.idx} onMouseEnter={() => setHovered(p.idx)}>
              <rect x={p.x - stepX / 2} y={PAD.top} width={stepX} height={plotH} fill="transparent" />
              <circle cx={p.x} cy={p.y} r={hovered === p.idx ? 5 : 3.5} fill="white" stroke={LINE} strokeWidth="2.5" />
              {hovered === p.idx && (
                <g>
                  <rect x={p.x - 38} y={p.y - 32} width={76} height={22} rx="6" fill="#1f2937" />
                  <text x={p.x} y={p.y - 17} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">
                    {formatINR(p.value)}
                  </text>
                </g>
              )}
              <text
                x={p.x}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill={hovered === p.idx ? '#374151' : '#9aa0a6'}
                fontWeight={hovered === p.idx ? '700' : '500'}
                fontFamily="sans-serif"
              >
                {p.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
