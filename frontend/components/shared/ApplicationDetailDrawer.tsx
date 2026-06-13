'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/shared/Toast';
import IdChip from '@/components/shared/IdChip';

const TEAL = '#1C4A52';

const STATUS_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  applied:     { cls: 'bg-blue-50 text-blue-700 border border-blue-200',    dot: 'bg-blue-400',  label: 'Applied' },
  shortlisted: { cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400', label: 'Shortlisted' },
  accepted:    { cls: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500',  label: 'Accepted' },
  rejected:    { cls: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-400',    label: 'Rejected' },
  'on-hold':   { cls: 'bg-gray-50 text-gray-500 border border-gray-200',    dot: 'bg-gray-400',   label: 'Under Review' },
};

// Friendly explanation + tint for each status, shown as a banner.
const STATUS_HINT: Record<string, { text: string; box: string; icon: string }> = {
  applied:     { text: 'Your application is in. The brand typically reviews within 48 hours.', box: 'bg-blue-50 border-blue-100 text-blue-800', icon: 'text-blue-500' },
  shortlisted: { text: "You've been shortlisted — the brand is considering you for this campaign.", box: 'bg-amber-50 border-amber-100 text-amber-800', icon: 'text-amber-500' },
  accepted:    { text: "Congratulations, you're booked! Head to Messages to coordinate the deliverables.", box: 'bg-green-50 border-green-100 text-green-800', icon: 'text-green-500' },
  rejected:    { text: "This application wasn't selected this time. Plenty more campaigns to explore.", box: 'bg-red-50 border-red-100 text-red-700', icon: 'text-red-500' },
  'on-hold':   { text: 'The brand has placed this application under review for now.', box: 'bg-gray-50 border-gray-200 text-gray-700', icon: 'text-gray-500' },
};

const NICHE_COLORS: Record<string, string> = {
  beauty:    'bg-pink-50 text-pink-700 border-pink-200',
  fashion:   'bg-[#FDE5DC] text-[#9C4A33] border-[#f5c4b0]',
  food:      'bg-orange-50 text-orange-700 border-orange-200',
  fitness:   'bg-[#FDF3DD] text-[#854F0B] border-amber-200',
  lifestyle: 'bg-purple-50 text-purple-700 border-purple-200',
  travel:    'bg-[#E8F5E0] text-[#3B6D11] border-green-200',
  tech:      'bg-[#E6F1FB] text-[#0C447C] border-blue-200',
  books:     'bg-[#F0ECFA] text-[#3C3489] border-violet-200',
};

const inr = (n?: number) => '₹' + (Number.isFinite(n as number) ? (n as number) : 0).toLocaleString('en-IN');
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

interface Props {
  application: any | null;
  onClose: () => void;
  onWithdraw: (id: string) => void;
  withdrawing: boolean;
}

export default function ApplicationDetailDrawer({ application, onClose, onWithdraw, withdrawing }: Props) {
  const router = useRouter();
  const toast = useToast();
  const open = !!application;

  // Escape to close + lock body scroll while open.
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

  const app = application;
  const campaign = app?.campaignId || {};
  const brandName = app?.brandId?.name || campaign?.brandId?.name || '—';
  const cfg = app ? (STATUS_CONFIG[app.status] || { cls: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400', label: app.status }) : null;
  const hint = app ? STATUS_HINT[app.status] : null;

  const budgetLabel = campaign.budgetMin || campaign.budgetMax
    ? `${inr(campaign.budgetMin)} – ${inr(campaign.budgetMax)}`
    : 'Open';

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(app?.customId || app?._id));
      toast.success('Application ID copied to clipboard.');
    } catch {
      toast.error('Unable to copy Application ID.');
    }
  };

  return (
    <div className={`fixed inset-0 z-[120] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 right-0 h-full w-full sm:w-[480px] bg-[#F4F6F7] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#1C4A52] to-[#2d7a88] text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Application details</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {app && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Campaign header */}
              <div className="px-5 pt-5 pb-5 bg-white border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[19px] font-bold text-gray-900 leading-snug">{campaign.title || 'Campaign'}</h2>
                    <div className="flex items-center gap-2 mt-2 text-[13px] text-gray-500 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7FA8AD]">
                          <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
                        </svg>
                        {brandName}
                      </span>
                    </div>
                    {app.customId && (
                      <div className="mt-2.5"><IdChip id={app.customId} size="xs" tone="subtle" /></div>
                    )}
                  </div>
                  {cfg && (
                    <span className={`inline-flex items-center gap-1.5 flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full font-bold ${cfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  )}
                </div>

                {campaign.niche?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {campaign.niche.map((n: string) => (
                      <span key={n} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border capitalize ${NICHE_COLORS[n] || 'bg-teal-50 text-teal-700 border-teal-100'}`}>
                        {n}
                      </span>
                    ))}
                  </div>
                )}

                {/* Highlighted stat tiles */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <StatTile label="Budget" value={budgetLabel} />
                  <StatTile label="Applied" value={fmtDate(app.createdAt)} />
                  <StatTile label="Deadline" value={fmtDate(campaign.deadline)} />
                </div>
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* Status hint banner */}
                {hint && (
                  <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${hint.box}`}>
                    <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${hint.icon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                    </svg>
                    <p className="text-[12.5px] leading-snug font-medium">{hint.text}</p>
                  </div>
                )}

                {/* Campaign details */}
                <Section title="Campaign">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3.5 shadow-sm">
                    <Field
                      label="Target platforms"
                      value={campaign.targetPlatforms?.length ? campaign.targetPlatforms.map(cap).join(', ') : 'Any'}
                    />
                    <Field
                      label="Target city"
                      value={campaign.targetCity?.length ? campaign.targetCity.join(', ') : 'All'}
                    />
                    <Field label="Deliverables" value={campaign.deliverables || '—'} full />
                    <Field label="Campaign brief" value={campaign.description || '—'} full />
                  </div>
                </Section>
              </div>
            </div>

            {/* Actions (sticky footer) */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-3.5">
              <div className="flex gap-2">
                {app.status === 'applied' && (
                  <button
                    onClick={() => onWithdraw(app._id)}
                    disabled={withdrawing}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {withdrawing ? 'Withdrawing…' : 'Withdraw application'}
                  </button>
                )}
                {app.status === 'accepted' && (
                  <button
                    onClick={() => router.push('/influencer/messages')}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#1C4A52] to-[#2d7a88] hover:opacity-95 transition-opacity cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Go to Messages
                  </button>
                )}
                {app.status !== 'applied' && app.status !== 'accepted' && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={handleCopyId}
                  className="px-3.5 py-2.5 rounded-xl text-[13px] font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Copy Application ID"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#EEF4F5]/70 border border-[#DCE9EB] rounded-xl px-2.5 py-2.5 text-center">
      <p className="text-[10px] text-[#5D8A8F] font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-[12.5px] font-bold text-[#1C4A52] mt-1 leading-tight break-words">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: TEAL }}>
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
