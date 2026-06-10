'use client';

import { useState } from 'react';

interface Segment { label: string; value: number; color: string; }
interface Props {
  title: string;
  subtitle?: string;
  segments: Segment[];
  centerLabel?: string;
}

export default function AdminDonut({ title, subtitle, segments, centerLabel = 'Total' }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const size = 140;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offsetAcc = 0;
  const arcs = segments.map((seg, i) => {
    const frac = total > 0 ? seg.value / total : 0;
    const dash = frac * circumference;
    const arc = { ...seg, i, dash, gap: circumference - dash, offset: offsetAcc };
    offsetAcc += dash;
    return arc;
  });

  const activeValue = hovered !== null ? segments[hovered].value : total;
  const activeLabel = hovered !== null ? segments[hovered].label : centerLabel;

  return (
    <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-1">
        <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 px-5 sm:px-6 py-5">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f2f4" strokeWidth={stroke} />
            {total > 0 && arcs.map(a => (
              <circle
                key={a.i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={hovered === a.i ? stroke + 3 : stroke}
                strokeDasharray={`${a.dash} ${a.gap}`}
                strokeDashoffset={-a.offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-width 0.15s ease', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(a.i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{activeValue}</span>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-1 capitalize">{activeLabel}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full flex flex-col gap-1.5">
          {segments.map((seg, i) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-colors cursor-default ${hovered === i ? 'bg-gray-50' : ''}`}
              >
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
                <span className="text-[12.5px] text-gray-600 font-medium capitalize flex-1 min-w-0 truncate">{seg.label}</span>
                <span className="text-[12.5px] text-gray-900 font-bold tabular-nums flex-shrink-0">{seg.value}</span>
                <span className="text-[11px] text-gray-400 tabular-nums flex-shrink-0 w-8 text-right">{pct}%</span>
              </div>
            );
          })}
          {total === 0 && (
            <p className="text-[12px] text-gray-400">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
