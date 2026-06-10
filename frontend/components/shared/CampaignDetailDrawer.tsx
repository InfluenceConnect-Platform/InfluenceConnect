'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';
import IdChip from '@/components/shared/IdChip';

const TEAL = '#7FA8AD';

const STATUS_STYLES: Record<string, string> = {
  active:        'bg-green-50 text-green-700 border border-green-100',
  draft:         'bg-gray-100 text-gray-500 border border-gray-200',
  'in-progress': 'bg-amber-50 text-amber-700 border border-amber-100',
  completed:     'bg-blue-50 text-blue-700 border border-blue-100',
  closed:        'bg-red-50 text-red-600 border border-red-100',
  expired:       'bg-orange-50 text-orange-600 border border-orange-100',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', draft: 'Draft', 'in-progress': 'In Progress',
  completed: 'Completed', closed: 'Closed', expired: 'Expired',
};

const APP_STATUS_STYLES: Record<string, string> = {
  applied:     'bg-gray-50 text-gray-600 border border-gray-200',
  shortlisted: 'bg-violet-50 text-violet-700 border border-violet-100',
  accepted:    'bg-green-50 text-green-700 border border-green-100',
  rejected:    'bg-red-50 text-red-600 border border-red-100',
  'on-hold':   'bg-amber-50 text-amber-700 border border-amber-100',
};

const DEAL_STATUS_STYLES: Record<string, string> = {
  'in-progress':       'bg-blue-50 text-blue-700 border border-blue-100',
  'content-submitted': 'bg-violet-50 text-violet-700 border border-violet-100',
  'completed':         'bg-green-50 text-green-700 border border-green-100',
  'cancelled':         'bg-gray-50 text-gray-500 border border-gray-200',
};

const inr = (n: number) => '₹' + (Number.isFinite(n) ? n : 0).toLocaleString('en-IN');
const fmtNum = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString('en-IN');
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

interface Props {
  campaignId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function CampaignDetailDrawer({ campaignId, onClose, onChanged }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing]   = useState(false);

  const showToast = (msg: string) =>
    toast.show(msg, /fail|error|cannot|unable|wrong/.test(msg.toLowerCase()) ? 'error' : 'success');

  const fetchDetails = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/campaigns/${campaignId}/details`);
      setData(res.data);
    } catch {
      showToast('Failed to load campaign details.');
      setData(null);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) fetchDetails();
    else setData(null);
  }, [campaignId, fetchDetails]);

  useEffect(() => {
    if (!campaignId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [campaignId, onClose]);

  const c     = data?.campaign;
  const brand = data?.brand;
  const apps  = data?.applications;
  const deals = data?.deals;

  const hasSubmittedContent = !!deals?.list?.some((d: any) => d.status === 'content-submitted');
  const canRemove = c && c.status !== 'closed' && c.status !== 'completed' && !hasSubmittedContent;
  const activeDealCount = deals?.active ?? 0;

  const handleRemove = async () => {
    const ok = await confirm({
      title: 'Remove this campaign?',
      description: activeDealCount > 0
        ? `"${c?.title}" will be closed and ${activeDealCount} active collaboration${activeDealCount > 1 ? 's' : ''} will be cancelled — the influencer${activeDealCount > 1 ? 's' : ''} will be notified in chat. This cannot be undone.`
        : `"${c?.title}" will be closed and hidden from creators. This cannot be undone.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!ok) return;
    setActing(true);
    try {
      const res = await api.put(`/api/admin/campaigns/${campaignId}/remove`);
      const cancelled = res.data?.dealsCancelled ?? 0;
      showToast(cancelled > 0
        ? `Campaign removed — ${cancelled} active deal${cancelled > 1 ? 's' : ''} cancelled.`
        : 'Campaign removed successfully.');
      await fetchDetails();
      onChanged();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to remove campaign.');
    } finally {
      setActing(false);
    }
  };

  const handleFlag = async () => {
    const next = !c?.flagged;
    if (next) {
      const ok = await confirm({
        title: 'Flag this campaign?',
        description: `"${c?.title}" will be marked for review. It stays live for the brand and creators — flagging only highlights it for the admin team.`,
        confirmLabel: 'Flag',
        variant: 'warning',
      });
      if (!ok) return;
    }
    setActing(true);
    try {
      await api.put(`/api/admin/campaigns/${campaignId}/flag`, { flagged: next });
      showToast(next ? 'Campaign flagged for review.' : 'Campaign flag cleared.');
      await fetchDetails();
      onChanged();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to update campaign flag.');
    } finally {
      setActing(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(c?.customId || campaignId));
      showToast('Campaign ID copied to clipboard.');
    } catch {
      showToast('Unable to copy Campaign ID.');
    }
  };

  const budgetLabel = c && (c.budgetMin || c.budgetMax)
    ? `${inr(c.budgetMin)} – ${inr(c.budgetMax)}`
    : 'Open';

  const chips: { label: string; value: string }[] = c
    ? [
        { label: 'Applicants', value: fmtNum(apps?.total ?? 0) },
        { label: 'Deals',      value: fmtNum(deals?.total ?? 0) },
        { label: 'Budget',     value: c.budgetMin || c.budgetMax ? inr(c.budgetMax || c.budgetMin) : 'Open' },
        { label: 'Days live',  value: `${data?.daysLive ?? 0}d` },
      ]
    : [];

  return (
    <div className={`fixed inset-0 z-[120] ${campaignId ? '' : 'pointer-events-none'}`} aria-hidden={!campaignId}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          campaignId ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 right-0 h-full w-full sm:w-[520px] bg-[#F7F8FA] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          campaignId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#3E4751] text-white flex-shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Campaign details</p>
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

        {loading || !data ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading details…</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {/* Removed/closed banner */}
            {(c.status === 'closed' || c.status === 'expired') && (
              <div className="bg-red-600 text-white px-5 py-2.5 text-[13px] font-semibold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                This campaign is {STATUS_LABELS[c.status]?.toLowerCase() || c.status}
              </div>
            )}

            {/* Campaign header */}
            <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">{c.title}</h2>
                  {c.customId && (
                    <div className="mt-1.5">
                      <IdChip id={c.customId} size="xs" tone="subtle" />
                    </div>
                  )}
                  {c.niche?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.niche.map((n: string) => (
                        <span key={n} className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-teal-50 text-teal-700 border border-teal-100 capitalize">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                  {c.flagged && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-100 inline-flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                      </svg>
                      Flagged
                    </span>
                  )}
                </div>
              </div>

              {/* Activity summary chips */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {chips.map((chip, i) => (
                  <div key={i} className="bg-[#F7F8FA] border border-gray-100 rounded-xl px-2.5 py-2 text-center">
                    <p className="text-sm font-bold text-gray-900 truncate" title={chip.value}>{chip.value}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5 truncate">{chip.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-5 space-y-5">

              {/* Section 1 — Overview */}
              <Section title="Overview">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Budget" value={budgetLabel} />
                  <Field label="Applicants" value={fmtNum(c.applicantCount)} />
                  <Field label="Target platforms" value={c.targetPlatforms?.length ? c.targetPlatforms.map(cap).join(', ') : 'Any'} />
                  <Field label="Followers" value={
                    c.minFollowers || c.maxFollowers
                      ? `${c.minFollowers ? fmtNum(c.minFollowers) : '0'} – ${c.maxFollowers ? fmtNum(c.maxFollowers) : '∞'}`
                      : '—'
                  } />
                  <Field label="Target city" value={
                    c.targetCity?.length ? c.targetCity.join(', ') : 'All'
                  } full />
                  <Field label="Deadline" value={
                    c.deadline
                      ? `${fmtDate(c.deadline)}${data.daysToDeadline !== null ? ` (${data.daysToDeadline >= 0 ? `${data.daysToDeadline}d left` : `${Math.abs(data.daysToDeadline)}d ago`})` : ''}`
                      : '—'
                  } full />
                  <Field label="Deliverables" value={c.deliverables || '—'} full />
                  <Field label="Description" value={c.description || '—'} full />
                  <Field label="Created" value={fmtDate(c.createdAt)} />
                  <Field label="Updated" value={fmtDate(c.updatedAt)} />
                </div>
              </Section>

              {/* Section 2 — Brand */}
              <Section title="Brand">
                {brand ? (
                  <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3E4751] to-[#5A6472] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                          {(brand.companyName || brand.name)?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-gray-900 truncate">{brand.companyName || brand.name}</p>
                        <p className="text-[12px] text-gray-400 truncate">{brand.email}</p>
                      </div>
                      {brand.status === 'suspended' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-600 border border-red-100">Suspended</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3.5">
                      <Field label="Industry" value={cap(brand.industry)} />
                      <Field label="GSTIN" value={brand.gstinStatus === 'not_submitted' ? 'Not submitted' : cap(brand.gstinStatus)} />
                      <Field label="Website" value={
                        brand.website
                          ? <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-[#3E4751] underline truncate block">{brand.website}</a>
                          : '—'
                      } full />
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">Brand not found</p>
                )}
              </Section>

              {/* Section 3 — Applications */}
              <Section title="Applications">
                {apps.total === 0 ? (
                  <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">No applications yet</p>
                ) : (
                  <>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      <MiniStat label="Total"     value={apps.total} />
                      <MiniStat label="Shortlist" value={apps.breakdown.shortlisted} tone="violet" />
                      <MiniStat label="Accepted"  value={apps.breakdown.accepted} tone="green" />
                      <MiniStat label="Rejected"  value={apps.breakdown.rejected} tone="red" />
                      <MiniStat label="On-hold"   value={apps.breakdown['on-hold']} tone="amber" />
                    </div>
                    <div className="space-y-2">
                      {apps.list.map((a: any, i: number) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                          {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt={a.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3E4751] to-[#5A6472] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                              {a.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{a.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {a.proposedRate ? `Proposed ${inr(a.proposedRate)}` : 'No rate proposed'}
                            </p>
                            {a.customId && <div className="mt-1"><IdChip id={a.customId} size="xs" tone="subtle" /></div>}
                          </div>
                          <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${APP_STATUS_STYLES[a.status] || 'bg-gray-100 text-gray-600'}`}>
                            {a.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Section>

              {/* Section 4 — Deals */}
              <Section title="Deals">
                {deals.total === 0 ? (
                  <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">No deals yet</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Committed</p>
                        <p className="text-[15px] font-bold text-gray-900 mt-0.5">{inr(deals.totalCommitted)}</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Paid out</p>
                        <p className="text-[15px] font-bold text-gray-900 mt-0.5">{inr(deals.totalPaid)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {deals.list.map((d: any, i: number) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{d.influencerName}</p>
                            <p className="text-[13px] font-bold text-gray-900 mt-0.5">{inr(d.agreedAmount)}</p>
                            {d.customId && <div className="mt-1"><IdChip id={d.customId} size="xs" tone="subtle" /></div>}
                          </div>
                          <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${DEAL_STATUS_STYLES[d.status] || DEAL_STATUS_STYLES.cancelled}`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Section>
            </div>
          </div>
        )}

        {/* Admin Actions (sticky footer) */}
        {data && c && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-3.5">
            {hasSubmittedContent && c.status !== 'closed' && c.status !== 'completed' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2.5 leading-snug">
                Can't remove — an influencer has already submitted content. Resolve that deal first.
              </p>
            )}
            <div className="flex gap-2">
              {c.status !== 'closed' && c.status !== 'completed' && (
                <button
                  onClick={handleFlag}
                  disabled={acting}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                    c.flagged
                      ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
                      : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  {c.flagged ? 'Unflag' : 'Flag'}
                </button>
              )}
              {canRemove ? (
                <button
                  onClick={handleRemove}
                  disabled={acting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Remove Campaign
                </button>
              ) : (
                <div className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-gray-50 text-gray-400 text-center border border-gray-100">
                  {hasSubmittedContent && c.status !== 'closed' && c.status !== 'completed'
                    ? 'Removal blocked'
                    : STATUS_LABELS[c.status] ?? cap(c.status)}
                </div>
              )}
              <button
                onClick={handleCopyId}
                className="px-3.5 py-2.5 rounded-xl text-[13px] font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                title="Copy Campaign ID"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

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

const MINI_TONES: Record<string, string> = {
  default: 'text-gray-900',
  green:   'text-green-600',
  red:     'text-red-600',
  amber:   'text-amber-600',
  violet:  'text-violet-600',
};

function MiniStat({ label, value, tone = 'default' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-1.5 py-2 text-center">
      <p className={`text-[15px] font-bold ${MINI_TONES[tone]}`}>{fmtNum(value)}</p>
      <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
