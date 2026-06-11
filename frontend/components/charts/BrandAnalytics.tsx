'use client';

import { useRef, useEffect, useState } from 'react';
import { useTheme } from '@/lib/useTheme';

export interface BrandAnalyticsData {
  applicationsOverTime: { month: string; count: number }[];
  funnel: { applied: number; shortlisted: number; accepted: number; rejected: number };
  dealPipeline: { inProgress: number; contentSubmitted: number; completed: number; cancelled: number };
  spendByCampaign: { title: string; amount: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────
function useWidth(initial = 480) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setW(entries[0].contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function formatINR(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

function niceMax(max: number, ticks = 4): number {
  if (max <= 0) return ticks;
  const rough = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  return step * ticks;
}

// ── Reusable card shell ─────────────────────────────────────────────────────
function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 sm:px-6 pt-5 pb-1">
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function EmptyNote({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[180px] text-center px-6">
      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-2 text-gray-300">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 9l-5 5-3-3-4 4"/></svg>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

// ── 1. Applications Over Time (area line) ───────────────────────────────────
function ApplicationsOverTime({ data }: { data: BrandAnalyticsData['applicationsOverTime'] }) {
  const [ref, width] = useWidth();
  const [hovered, setHovered] = useState<number | null>(null);

  const total = data.reduce((s, d) => s + d.count, 0);
  const PAD = { top: 18, right: 18, bottom: 32, left: 40 };
  const H = 200;
  const W = Math.max(width, 200);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const yMax = niceMax(Math.max(...data.map(d => d.count), 1));
  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);

  const pts = data.map((d, i) => ({
    x: PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
    y: PAD.top + plotH - (d.count / yMax) * plotH,
    ...d,
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, '');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${PAD.top + plotH} L ${pts[0].x} ${PAD.top + plotH} Z`;
  const hovPt = hovered !== null ? pts[hovered] : null;

  return (
    <Card title="Applications Over Time" subtitle="Creator applications received per month">
      <div ref={ref} className="px-2 sm:px-3 pb-4 pt-1">
        {total === 0 ? (
          <EmptyNote label="No applications in the last 6 months yet." />
        ) : (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" onMouseLeave={() => setHovered(null)}>
            <defs>
              <linearGradient id="ba-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3D5087" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3D5087" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="ba-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3D5087" />
                <stop offset="100%" stopColor="#4a5fa0" />
              </linearGradient>
            </defs>
            {yTicks.map((t, i) => {
              const y = PAD.top + plotH - (t / yMax) * plotH;
              return (
                <g key={i}>
                  <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#eef1f7" strokeWidth="1" />
                  <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#aab2c5" fontFamily="sans-serif">{Math.round(t)}</text>
                </g>
              );
            })}
            <path d={areaPath} fill="url(#ba-area)" />
            <path d={linePath} fill="none" stroke="url(#ba-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <rect key={i} x={p.x - plotW / (data.length * 2)} y={PAD.top} width={plotW / data.length} height={plotH} fill="transparent" onMouseEnter={() => setHovered(i)} />
            ))}
            {hovPt && (
              <>
                <line x1={hovPt.x} y1={PAD.top} x2={hovPt.x} y2={PAD.top + plotH} stroke="#3D5087" strokeWidth="1.5" strokeDasharray="3 3" />
                <rect x={Math.min(Math.max(hovPt.x - 22, 2), W - 46)} y={hovPt.y - 30} width={44} height={22} rx="6" fill="#1e2f5c" />
                <text x={Math.min(Math.max(hovPt.x - 22, 2), W - 46) + 22} y={hovPt.y - 15} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">{hovPt.count}</text>
              </>
            )}
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={hovered === i ? 5 : 3.5} fill="white" stroke="#3D5087" strokeWidth="2" />
            ))}
            {pts.map((p, i) => (
              <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill={hovered === i ? '#1e2f5c' : '#9aa3ba'} fontWeight={hovered === i ? '700' : '500'} fontFamily="sans-serif">{p.month}</text>
            ))}
          </svg>
        )}
      </div>
    </Card>
  );
}

// ── 2. Application Funnel (horizontal bars) ─────────────────────────────────
function ApplicationFunnel({ funnel }: { funnel: BrandAnalyticsData['funnel'] }) {
  const rows = [
    { label: 'Applied', value: funnel.applied, color: '#3D5087' },
    { label: 'Shortlisted', value: funnel.shortlisted, color: '#6366f1' },
    { label: 'Accepted', value: funnel.accepted, color: '#10b981' },
    { label: 'Rejected', value: funnel.rejected, color: '#f87171' },
  ];
  const max = Math.max(...rows.map(r => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <Card title="Application Funnel" subtitle="Applications by current status">
      <div className="px-5 sm:px-6 py-4">
        {total === 0 ? (
          <EmptyNote label="No applications received yet." />
        ) : (
          <div className="flex flex-col gap-3.5 py-2">
            {rows.map(r => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-semibold text-gray-600">{r.label}</span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: r.color }}>{r.value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── 3. Deal Pipeline (donut) ────────────────────────────────────────────────
function DealPipeline({ pipeline }: { pipeline: BrandAnalyticsData['dealPipeline'] }) {
  const { isDark } = useTheme();
  const segs = [
    // In-progress uses the brand navy, which blends into the dark card — lift it
    // to a brighter indigo in dark mode so the segment and legend stay visible.
    { label: 'In-progress', value: pipeline.inProgress, color: isDark ? '#818cf8' : '#3D5087' },
    { label: 'Content submitted', value: pipeline.contentSubmitted, color: '#f59e0b' },
    { label: 'Completed', value: pipeline.completed, color: '#10b981' },
    { label: 'Cancelled', value: pipeline.cancelled, color: '#94a3b8' },
  ];
  const total = segs.reduce((s, x) => s + x.value, 0);

  const R = 52;
  const STROKE = 18;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <Card title="Deal Pipeline" subtitle="Your collaborations by status">
      <div className="px-5 sm:px-6 py-4">
        {total === 0 ? (
          <EmptyNote label="No deals yet — accept an application to start." />
        ) : (
          <div className="flex items-center gap-5 py-2">
            <svg width="140" height="140" viewBox="0 0 140 140" className="flex-shrink-0">
              {segs.map((s, i) => {
                if (s.value === 0) return null;
                const len = (s.value / total) * C;
                const el = (
                  <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth={STROKE}
                    strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
                    transform="rotate(-90 70 70)" strokeLinecap="butt" />
                );
                offset += len;
                return el;
              })}
              <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill={isDark ? '#f1f5f9' : '#1e2f5c'} fontFamily="sans-serif">{total}</text>
              <text x="70" y="84" textAnchor="middle" fontSize="10" fontWeight="600" fill="#9aa3ba" fontFamily="sans-serif">deals</text>
            </svg>
            <div className="flex-1 flex flex-col gap-2">
              {segs.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[12px] text-gray-600 flex-1 truncate">{s.label}</span>
                  <span className="text-[12px] font-bold text-gray-800 tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── 4. Spend by Campaign (vertical bars) ────────────────────────────────────
function SpendByCampaign({ data }: { data: BrandAnalyticsData['spendByCampaign'] }) {
  const [ref, width] = useWidth();
  const [hovered, setHovered] = useState<number | null>(null);

  const PAD = { top: 18, right: 12, bottom: 38, left: 48 };
  const H = 200;
  const W = Math.max(width, 200);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const yMax = niceMax(Math.max(...data.map(d => d.amount), 1));
  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);
  const total = data.reduce((s, d) => s + d.amount, 0);

  const barGap = data.length ? plotW / data.length : plotW;
  const barW = Math.min(barGap * 0.55, 42);

  return (
    <Card title="Spend by Campaign" subtitle="Total agreed deal value (₹)">
      <div ref={ref} className="px-2 sm:px-3 pb-4 pt-1">
        {total === 0 ? (
          <EmptyNote label="No agreed deals yet." />
        ) : (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" onMouseLeave={() => setHovered(null)}>
            <defs>
              <linearGradient id="ba-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3D5087" />
                <stop offset="100%" stopColor="#7c8fc7" stopOpacity="0.75" />
              </linearGradient>
            </defs>
            {yTicks.map((t, i) => {
              const y = PAD.top + plotH - (t / yMax) * plotH;
              return (
                <g key={i}>
                  <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#eef1f7" strokeWidth="1" />
                  <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#aab2c5" fontFamily="sans-serif">{formatINR(t)}</text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const barH = (d.amount / yMax) * plotH;
              const x = PAD.left + i * barGap + (barGap - barW) / 2;
              const y = PAD.top + plotH - barH;
              const short = d.title.length > 10 ? `${d.title.slice(0, 9)}…` : d.title;
              return (
                <g key={i} onMouseEnter={() => setHovered(i)}>
                  <rect x={x} y={y} width={barW} height={barH} rx={Math.min(5, barW * 0.2)} fill="url(#ba-bar)" opacity={hovered === null || hovered === i ? 1 : 0.5} style={{ transition: 'opacity 0.15s' }} />
                  {hovered === i && (
                    <>
                      <rect x={Math.min(Math.max(x + barW / 2 - 30, 2), W - 62)} y={y - 28} width={60} height={20} rx="6" fill="#1e2f5c" />
                      <text x={Math.min(Math.max(x + barW / 2 - 30, 2), W - 62) + 30} y={y - 14} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="white" fontFamily="sans-serif">{formatINR(d.amount)}</text>
                    </>
                  )}
                  <text x={x + barW / 2} y={H - 20} textAnchor="middle" fontSize="10" fill={hovered === i ? '#1e2f5c' : '#9aa3ba'} fontWeight={hovered === i ? '700' : '500'} fontFamily="sans-serif">{short}</text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </Card>
  );
}

// ── Grid ────────────────────────────────────────────────────────────────────
export default function BrandAnalytics({ analytics }: { analytics: BrandAnalyticsData }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
      <ApplicationsOverTime data={analytics.applicationsOverTime ?? []} />
      <ApplicationFunnel funnel={analytics.funnel ?? { applied: 0, shortlisted: 0, accepted: 0, rejected: 0 }} />
      <DealPipeline pipeline={analytics.dealPipeline ?? { inProgress: 0, contentSubmitted: 0, completed: 0, cancelled: 0 }} />
      <SpendByCampaign data={analytics.spendByCampaign ?? []} />
    </section>
  );
}
