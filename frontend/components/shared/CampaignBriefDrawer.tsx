'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';

// Slide-in drawer that shows the full brief for the campaign behind a deal.
// It opens immediately with the summary already known from the deal, then
// enriches itself with the complete campaign once `/api/campaigns/:id` resolves
// (description, deadline, targeting, follower range, …). If that fetch fails —
// e.g. the campaign has since expired/closed — the summary is still shown.

export interface CampaignSummary {
  _id: string;
  title: string;
  niche?: string[];
  deliverables?: string;
  budgetMin?: number;
  budgetMax?: number;
}

interface FullCampaign extends CampaignSummary {
  customId?: string;
  description?: string;
  deadline?: string;
  targetCity?: string[];
  targetPlatforms?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  status?: string;
  brandId?: { name?: string };
}

interface Props {
  open: boolean;
  campaign: CampaignSummary | null;
  brandName?: string;
  brandLogoUrl?: string;
  agreedAmount?: number;
  negotiationStatus?: 'open' | 'agreed';
  isDark: boolean;
  onClose: () => void;
}

const inr = (n?: number) => '₹' + (Number.isFinite(n) ? (n as number) : 0).toLocaleString('en-IN');
const fmtFollowers = (n?: number) => {
  if (!Number.isFinite(n)) return null;
  const v = n as number;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(v);
};
const fmtDate = (d?: string) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function CampaignBriefDrawer({
  open,
  campaign,
  brandName,
  brandLogoUrl,
  agreedAmount,
  negotiationStatus,
  isDark,
  onClose,
}: Props) {
  const [full, setFull] = useState<FullCampaign | null>(null);
  const [loading, setLoading] = useState(false);

  const campaignId = campaign?._id;

  const fetchDetails = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/campaigns/${campaignId}`);
      setFull(res.data?.campaign ?? null);
    } catch {
      // Campaign may be expired/closed and no longer fetchable — fall back to
      // the summary we already have from the deal.
      setFull(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (open && campaignId) fetchDetails();
    if (!open) setFull(null);
  }, [open, campaignId, fetchDetails]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Merge: prefer freshly fetched fields, fall back to the deal summary.
  const c: FullCampaign = { ...(campaign ?? { _id: '', title: '' }), ...(full ?? {}) };
  const resolvedBrand = full?.brandId?.name || brandName;

  const surface = isDark ? 'bg-[#0B1725]' : 'bg-[#F7F8FA]';
  const card = isDark ? 'bg-[#0F1C2E] border-slate-700/50' : 'bg-white border-gray-100';
  const labelClr = isDark ? 'text-slate-500' : 'text-gray-400';
  const valueClr = isDark ? 'text-slate-200' : 'text-gray-800';
  const headingClr = isDark ? 'text-white' : 'text-gray-900';

  const budgetLabel = (c.budgetMin || c.budgetMax)
    ? `${inr(c.budgetMin)} – ${inr(c.budgetMax)}`
    : 'Open';
  const followerLabel = (() => {
    const min = fmtFollowers(c.minFollowers);
    const max = fmtFollowers(c.maxFollowers);
    if (min && max) return `${min} – ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return null;
  })();
  const deadlineLabel = fmtDate(c.deadline);

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className={`px-5 py-4 rounded-2xl border ${card}`}>
      <p className={`text-[10.5px] font-bold uppercase tracking-widest mb-2 ${labelClr}`}>{label}</p>
      {children}
    </div>
  );

  return (
    <div className={`fixed inset-0 z-[120] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 right-0 h-full w-full sm:w-[460px] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${surface} ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 60%, #14B8A6 100%)' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Campaign brief</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Title + brand */}
          <div className={`px-5 pt-5 pb-4 rounded-2xl border ${card}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold ${isDark ? 'bg-teal-700' : 'bg-teal-600'}`}>
                {brandLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandLogoUrl} alt={resolvedBrand} className="w-full h-full object-cover" />
                ) : (
                  (resolvedBrand || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] font-medium ${labelClr}`}>{resolvedBrand || 'Brand'}</p>
                <h2 className={`text-[16px] font-bold leading-snug ${headingClr}`}>{c.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {c.customId && (
                <span className={`text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-md ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-500'}`}>{c.customId}</span>
              )}
              {negotiationStatus === 'agreed' && Number.isFinite(agreedAmount) && (
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                  {inr(agreedAmount)} agreed
                </span>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-3">
              <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-teal-400 border-t-transparent' : 'border-teal-600 border-t-transparent'}`} />
              <span className={`text-[12px] ${labelClr}`}>Loading full brief…</span>
            </div>
          )}

          {c.description && (
            <Section label="About this campaign">
              <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${valueClr}`}>{c.description}</p>
            </Section>
          )}

          {c.deliverables && (
            <Section label="Deliverables">
              <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${valueClr}`}>{c.deliverables}</p>
            </Section>
          )}

          <Section label="Budget & terms">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-[10.5px] ${labelClr}`}>Budget range</p>
                <p className={`text-[13.5px] font-semibold ${valueClr}`}>{budgetLabel}</p>
              </div>
              {negotiationStatus === 'agreed' && Number.isFinite(agreedAmount) && (
                <div>
                  <p className={`text-[10.5px] ${labelClr}`}>Agreed price</p>
                  <p className="text-[13.5px] font-semibold text-emerald-600">{inr(agreedAmount)}</p>
                </div>
              )}
              {deadlineLabel && (
                <div>
                  <p className={`text-[10.5px] ${labelClr}`}>Deadline</p>
                  <p className={`text-[13.5px] font-semibold ${valueClr}`}>{deadlineLabel}</p>
                </div>
              )}
              {followerLabel && (
                <div>
                  <p className={`text-[10.5px] ${labelClr}`}>Follower range</p>
                  <p className={`text-[13.5px] font-semibold ${valueClr}`}>{followerLabel}</p>
                </div>
              )}
            </div>
          </Section>

          {Array.isArray(c.niche) && c.niche.length > 0 && (
            <Section label="Niche">
              <div className="flex flex-wrap gap-1.5">
                {c.niche.map((n) => (
                  <span key={n} className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${isDark ? 'bg-teal-900/30 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>{n}</span>
                ))}
              </div>
            </Section>
          )}

          {Array.isArray(c.targetPlatforms) && c.targetPlatforms.length > 0 && (
            <Section label="Platforms">
              <div className="flex flex-wrap gap-1.5">
                {c.targetPlatforms.map((p) => (
                  <span key={p} className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>{p}</span>
                ))}
              </div>
            </Section>
          )}

          {Array.isArray(c.targetCity) && c.targetCity.length > 0 && (
            <Section label="Target cities">
              <div className="flex flex-wrap gap-1.5">
                {c.targetCity.map((city) => (
                  <span key={city} className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>{city}</span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </aside>
    </div>
  );
}
