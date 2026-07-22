'use client';

import { useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import { NICHE_STYLES, NICHE_LABELS } from '@/lib/niches';
import { cdnImg } from '@/lib/img';

const TEAL = '#5D8A8F';

export interface DealHistoryRow {
  _id: string;
  customId?: string;
  campaignCustomId?: string;
  campaignTitle: string;
  campaignDescription?: string;
  deliverables?: string;
  niche?: string[];
  brandName: string;
  brandEmail?: string;
  brandLogoUrl?: string;
  category?: string;
  status: string;
  amount: number;
  startedAt?: string;
  completedAt?: string;
}

interface PayoutInfo {
  paid: boolean;
  paidAt?: string | null;
  transactionRef?: string;
  receiptUrl?: string;
}

interface Props {
  deal: DealHistoryRow | null;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'content-submitted': 'bg-amber-50 text-amber-700 border border-amber-200',
  'in-progress': 'bg-blue-50 text-blue-700 border border-blue-100',
  cancelled: 'bg-gray-50 text-gray-500 border border-gray-200',
};
const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  'content-submitted': 'Awaiting payment',
  'in-progress': 'In progress',
  cancelled: 'Cancelled',
};

const inr = (n?: number) => '₹' + (Number.isFinite(n) ? (n as number) : 0).toLocaleString('en-IN');
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function DealHistoryDrawer({ deal, onClose }: Props) {
  const [payout, setPayout] = useState<PayoutInfo | null>(null);
  const [loadingPayout, setLoadingPayout] = useState(false);

  useEffect(() => {
    setPayout(null);
    if (!deal) return;
    setLoadingPayout(true);
    api.get(`/api/deals/${deal._id}/payout`)
      .then(res => setPayout(res.data?.payout ?? null))
      .catch(() => setPayout(null))
      .finally(() => setLoadingPayout(false));
  }, [deal?._id]);

  useEffect(() => {
    if (!deal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [deal, onClose]);

  return (
    <div className={`fixed inset-0 z-[120] ${deal ? '' : 'pointer-events-none'}`} aria-hidden={!deal}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          deal ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 right-0 h-full w-full sm:w-[460px] bg-[#F7F8FA] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          deal ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg, #04141a 0%, #0b5e6c 60%, #1fb8a8 100%)' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Deal details</p>
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

        {deal && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Header card */}
            <div className="bg-white border border-gray-100 rounded-2xl px-5 pt-5 pb-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F]">
                  {deal.brandLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" decoding="async" src={cdnImg(deal.brandLogoUrl)} alt={deal.brandName} className="w-full h-full object-cover" />
                  ) : (
                    (deal.brandName || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-gray-400">{deal.brandName}</p>
                  <h2 className="text-[16px] font-bold leading-snug text-gray-900">{deal.campaignTitle}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {deal.customId && (
                  <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">{deal.customId}</span>
                )}
                {deal.campaignCustomId && (
                  <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">{deal.campaignCustomId}</span>
                )}
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${STATUS_STYLES[deal.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[deal.status] ?? deal.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-[#F7F8FA] border border-gray-100 rounded-xl px-2.5 py-2 text-center">
                  <p className="text-sm font-black text-emerald-700">{inr(deal.amount)}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">Amount</p>
                </div>
                <div className="bg-[#F7F8FA] border border-gray-100 rounded-xl px-2.5 py-2 text-center">
                  <p className="text-sm font-bold text-gray-900">{fmtDate(deal.completedAt)}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">Completed</p>
                </div>
              </div>
            </div>

            <Section title="Timeline">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Started" value={fmtDate(deal.startedAt)} />
                <Field label="Completed" value={fmtDate(deal.completedAt)} />
                <Field label="Brand" value={deal.brandName} />
                <Field label="Brand email" value={deal.brandEmail || '—'} />
              </div>
            </Section>

            {deal.campaignDescription && (
              <Section title="About this campaign">
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-gray-800">{deal.campaignDescription}</p>
              </Section>
            )}

            {deal.deliverables && (
              <Section title="Deliverables">
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-gray-800">{deal.deliverables}</p>
              </Section>
            )}

            {Array.isArray(deal.niche) && deal.niche.length > 0 && (
              <Section title="Niche">
                <div className="flex flex-wrap gap-1.5">
                  {deal.niche.map(n => (
                    <span key={n} className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border ${NICHE_STYLES[n] || 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                      {NICHE_LABELS[n] ?? n}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Payment proof">
              {loadingPayout ? (
                <div className="flex items-center gap-2 py-1">
                  <div className="w-3.5 h-3.5 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[12px] text-gray-400">Loading…</span>
                </div>
              ) : payout?.paid ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Paid on" value={fmtDate(payout.paidAt)} />
                  <Field label="Transaction ref" value={payout.transactionRef || '—'} />
                  <Field
                    label="Receipt"
                    value={payout.receiptUrl
                      ? <a href={payout.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[#3E4751] underline">View receipt</a>
                      : '—'}
                    full
                  />
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                  No payment proof recorded for this deal yet.
                </p>
              )}
            </Section>
          </div>
        )}
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
      <h3 className="text-[10.5px] font-bold uppercase tracking-widest mb-2.5" style={{ color: TEAL }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  const display = value === undefined || value === null || value === '' ? '—' : value;
  return (
    <div className={full ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <div className="text-[13px] font-semibold text-gray-900 mt-0.5 break-words">{display}</div>
    </div>
  );
}
