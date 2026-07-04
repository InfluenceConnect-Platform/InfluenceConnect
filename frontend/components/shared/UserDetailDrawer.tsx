'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';
import IdChip from '@/components/shared/IdChip';
import { NICHE_LABELS } from '@/lib/niches';

const TEAL = '#7FA8AD';

const LEVEL_LABELS: Record<string, string> = {
  starter: 'Starter',
  growing: 'Growing',
  professional: 'Professional',
  elite: 'Elite',
};

const DEAL_STATUS_STYLES: Record<string, string> = {
  'in-progress':       'bg-blue-50 text-blue-700 border border-blue-100',
  'content-submitted': 'bg-violet-50 text-violet-700 border border-violet-100',
  'completed':         'bg-green-50 text-green-700 border border-green-100',
  'cancelled':         'bg-gray-50 text-gray-500 border border-gray-200',
};

const GSTIN_STYLES: Record<string, string> = {
  verified:      'bg-green-50 text-green-700 border border-green-100',
  pending:       'bg-amber-50 text-amber-700 border border-amber-100',
  rejected:      'bg-red-50 text-red-700 border border-red-100',
  not_submitted: 'bg-gray-50 text-gray-500 border border-gray-200',
};

const inr = (n: number) =>
  '₹' + (Number.isFinite(n) ? n : 0).toLocaleString('en-IN');

const fmtNum = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString('en-IN');

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

interface Props {
  userId: string | null;
  onClose: () => void;
  onChanged: () => void;   // notify parent to refresh the table
}

export default function UserDetailDrawer({ userId, onClose, onChanged }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing]   = useState(false);

  const showToast = (msg: string) =>
    toast.show(msg, /fail|error|cannot|unable|wrong/.test(msg.toLowerCase()) ? 'error' : 'success');

  const fetchDetails = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/users/${userId}/details`);
      setData(res.data);
    } catch {
      showToast('Failed to load user details.');
      setData(null);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (userId) fetchDetails();
    else setData(null);
  }, [userId, fetchDetails]);

  // Esc to close + lock body scroll while open
  useEffect(() => {
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [userId, onClose]);

  const user  = data?.user;
  const role  = user?.role;
  const inf   = data?.influencer;
  const brand = data?.brand;

  const handleStatus = async (status: 'active' | 'suspended') => {
    if (status === 'suspended') {
      const ok = await confirm({
        title: 'Suspend this account?',
        description: `${user?.name} will be signed out immediately and blocked from accessing the platform until restored.`,
        confirmLabel: 'Suspend',
        variant: 'danger',
      });
      if (!ok) return;
    }
    setActing(true);
    try {
      await api.put(`/api/admin/users/${userId}/status`, { status });
      showToast(`User ${status === 'suspended' ? 'suspended' : 'restored'} successfully.`);
      await fetchDetails();
      onChanged();
    } catch {
      showToast('Failed to update user status.');
    } finally {
      setActing(false);
    }
  };

  const handleGstin = async (status: 'verified' | 'rejected') => {
    if (!brand?.brandProfileId) return;
    if (status === 'rejected') {
      const ok = await confirm({
        title: 'Reject this GSTIN?',
        description: `${brand.companyName || data?.user?.name || 'This brand'}'s GSTIN will be marked invalid and their account suspended immediately. They'll be notified by email.`,
        confirmLabel: 'Reject & suspend',
        variant: 'danger',
      });
      if (!ok) return;
    }
    setActing(true);
    try {
      await api.put(`/api/admin/gstin/${brand.brandProfileId}/status`, { status });
      showToast(`GSTIN ${status === 'verified' ? 'approved' : 'rejected'} successfully.`);
      await fetchDetails();
      onChanged();
    } catch {
      showToast('Failed to update GSTIN status.');
    } finally {
      setActing(false);
    }
  };

  const handleReopenGstin = async () => {
    if (!brand?.brandProfileId) return;
    const ok = await confirm({
      title: 'Restore for resubmission?',
      description: `${brand.companyName || data?.user?.name || 'This brand'}'s account will be reactivated and they'll be emailed to submit a corrected GSTIN. Use this when a brand says they entered the wrong number.`,
      confirmLabel: 'Restore & request GSTIN',
      variant: 'info',
    });
    if (!ok) return;
    setActing(true);
    try {
      await api.put(`/api/admin/gstin/${brand.brandProfileId}/reopen`);
      showToast('Account restored — brand asked to resubmit their GSTIN.');
      await fetchDetails();
      onChanged();
    } catch {
      showToast('Failed to restore the account.');
    } finally {
      setActing(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(data?.user?.customId || userId));
      showToast('User ID copied to clipboard.');
    } catch {
      showToast('Unable to copy User ID.');
    }
  };

  const gstinPending  = role === 'brand' && brand?.gstinStatus === 'pending';
  const gstinRejected = role === 'brand' && brand?.gstinStatus === 'rejected';

  // Stat chips — most important numbers per role
  const chips: { label: string; value: string }[] =
    role === 'influencer'
      ? [
          { label: 'Deals done',   value: fmtNum(inf?.dealsCompleted ?? 0) },
          { label: 'Earnings',     value: inr(inf?.totalEarnings ?? 0) },
          { label: 'Credibility',  value: `${inf?.credibilityScore ?? 0}/100` },
          { label: 'Account age',  value: `${data?.accountAgeDays ?? 0}d` },
        ]
      : role === 'brand'
      ? [
          { label: 'Campaigns',    value: fmtNum(brand?.campaignsTotal ?? 0) },
          { label: 'Active deals', value: fmtNum(brand?.activeDeals?.length ?? 0) },
          { label: 'Committed',    value: inr(brand?.totalCommitted ?? 0) },
          { label: 'Account age',  value: `${data?.accountAgeDays ?? 0}d` },
        ]
      : [{ label: 'Account age', value: `${data?.accountAgeDays ?? 0}d` }];

  return (
    <div
      className={`fixed inset-0 z-[120] ${userId ? '' : 'pointer-events-none'}`}
      aria-hidden={!userId}
    >
      {/* Dimmed backdrop — table stays visible behind */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          userId ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 right-0 h-full w-full sm:w-[520px] bg-[#F7F8FA] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          userId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#3E4751] text-white flex-shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">User details</p>
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

            {/* Suspended banner */}
            {user.status === 'suspended' && (
              <div className="bg-red-600 text-white px-5 py-2.5 text-[13px] font-semibold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                This account is suspended
              </div>
            )}

            {/* Identity header */}
            <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
              <div className="flex items-start gap-3.5">
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0 shadow-sm" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3E4751] to-[#5A6472] text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{user.name || '—'}</h2>
                    {user.plan === 'premium' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm">
                        ★ PREMIUM
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-500 truncate">{user.email}</p>
                  {user.customId && (
                    <div className="mt-2">
                      <IdChip id={user.customId} />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge className={
                      role === 'influencer' ? 'bg-teal-50 text-teal-700 border border-teal-100'
                      : role === 'brand' ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }>{cap(role)}</Badge>
                    <Badge className={
                      user.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100'
                      : user.status === 'suspended' ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }>{cap(user.status)}</Badge>
                    <Badge className={
                      user.plan === 'premium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }>{cap(user.plan)}</Badge>
                  </div>
                </div>
              </div>

              {/* Activity summary chips */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {chips.map((c, i) => (
                  <div key={i} className="bg-[#F7F8FA] border border-gray-100 rounded-xl px-2.5 py-2 text-center">
                    <p className="text-sm font-bold text-gray-900 truncate" title={c.value}>{c.value}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5 truncate">{c.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-5 space-y-5">

              {/* Section 1 — Identity & Account */}
              <Section title="Identity & Account">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Full name"   value={user.name} />
                  <Field label="Mobile"      value={user.mobile} />
                  <Field label="Email" full  value={user.email} />
                  <Field label="Signup method" value={cap(user.signupMethod)} />
                  <Field label="Email verified"  value={<VerifiedDot ok={user.emailVerified} />} />
                  <Field label="Mobile verified" value={<VerifiedDot ok={user.mobileVerified} />} />
                  <Field label="Created"  value={fmtDate(user.createdAt)} />
                  <Field label="Updated"  value={fmtDate(user.updatedAt)} />
                </div>
              </Section>

              {/* Section 2 — Influencer */}
              {role === 'influencer' && (
                inf ? (
                  <>
                    <Section title="Creator Profile">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <Field label="City" value={inf.city} />
                        <Field label="Price range" value={
                          inf.priceRangeMin || inf.priceRangeMax
                            ? `${inr(inf.priceRangeMin)} – ${inr(inf.priceRangeMax)}`
                            : '—'
                        } />
                        <Field label="Credibility" value={`${inf.credibilityScore}/100 · ${LEVEL_LABELS[inf.level] || cap(inf.level)}`} full />
                        <Field label="Bio" full value={inf.bio || '—'} />
                      </div>
                      {inf.niche?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {inf.niche.map((n: string) => (
                            <span key={n} className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                              {NICHE_LABELS[n] ?? n}
                            </span>
                          ))}
                        </div>
                      )}
                    </Section>

                    <Section title="Audience">
                      <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                        <div className="flex items-baseline justify-between mb-3">
                          <span className="text-[12px] font-medium text-gray-500">Total followers</span>
                          <span className="text-lg font-bold text-gray-900">{fmtNum(inf.totalFollowers)}</span>
                        </div>
                        {inf.platforms.length === 0 ? (
                          <p className="text-[12px] text-gray-400">No platforms linked yet</p>
                        ) : (
                          <div className="space-y-2">
                            {inf.platforms.map((p: any) => (
                              <div key={p.name} className="flex items-center justify-between text-[12px]">
                                <span className="font-semibold text-gray-700 capitalize">{p.name}</span>
                                <span className="text-gray-500">
                                  {fmtNum(p.followers)} followers
                                  <span className="text-gray-300 mx-1.5">·</span>
                                  {p.engagementRate}% eng.
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Section>

                    <Section title="Portfolio & Deals">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <Field label="Portfolio items" value={fmtNum(inf.portfolioCount)} />
                        <Field label="Currently visible" value={fmtNum(inf.portfolioVisible)} />
                        <Field label="Deals completed" value={fmtNum(inf.dealsCompleted)} />
                        <Field label="Total earnings" value={inr(inf.totalEarnings)} />
                      </div>
                    </Section>

                    <Section title="Active Deals">
                      <DealList deals={inf.activeDeals} nameKey="brandName" nameLabel="Brand" />
                    </Section>

                    <Section title="Applications">
                      <div className="grid grid-cols-4 gap-2">
                        <MiniStat label="Total"    value={inf.applications.total} />
                        <MiniStat label="Accepted" value={inf.applications.accepted} tone="green" />
                        <MiniStat label="Rejected" value={inf.applications.rejected} tone="red" />
                        <MiniStat label="Pending"  value={inf.applications.pending} tone="amber" />
                      </div>
                    </Section>

                    {inf.slug && (
                      <a
                        href={`/brand/creator/${inf.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        View public profile
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </>
                ) : (
                  <EmptyNotice text="Profile not set up yet" />
                )
              )}

              {/* Section 3 — Brand */}
              {role === 'brand' && (
                brand ? (
                  <>
                    <Section title="Company">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <Field label="Company name" value={brand.companyName} />
                        <Field label="Industry" value={brand.industry ? (NICHE_LABELS[brand.industry] ?? cap(brand.industry)) : '—'} />
                        <Field label="City" value={brand.city} />
                        <Field label="Website" value={
                          brand.website
                            ? <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-[#3E4751] underline truncate block">{brand.website}</a>
                            : '—'
                        } />
                      </div>
                    </Section>

                    <Section title="GSTIN Verification">
                      <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">GSTIN</p>
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{brand.gstin || '—'}</p>
                          </div>
                          <Badge className={GSTIN_STYLES[brand.gstinStatus] || GSTIN_STYLES.not_submitted}>
                            {brand.gstinStatus === 'not_submitted' ? 'Not submitted' : cap(brand.gstinStatus)}
                          </Badge>
                        </div>
                        {gstinPending && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleGstin('verified')}
                              disabled={acting}
                              className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleGstin('rejected')}
                              disabled={acting}
                              className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {gstinRejected && (
                          <>
                            <p className="text-[11px] text-gray-400 mt-3 mb-2 leading-relaxed">
                              Rejected — account suspended. If the brand says they mistyped, restore them so they can resubmit a corrected GSTIN.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleReopenGstin}
                                disabled={acting}
                                className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-[#3E4751] text-white hover:bg-[#2c333b] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Restore to resubmit
                              </button>
                              <button
                                onClick={() => handleGstin('verified')}
                                disabled={acting}
                                className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Approve
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </Section>

                    <Section title="Campaigns">
                      {brand.campaignsTotal === 0 ? (
                        <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">No campaigns created yet</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          <MiniStat label="Active"    value={brand.campaignsByStatus.active} tone="green" />
                          <MiniStat label="Draft"     value={brand.campaignsByStatus.draft} />
                          <MiniStat label="Closed"    value={brand.campaignsByStatus.closed} tone="red" />
                          <MiniStat label="Completed" value={brand.campaignsByStatus.completed} tone="blue" />
                        </div>
                      )}
                    </Section>

                    <Section title="Engagement">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <Field label="Applications received" value={fmtNum(brand.applicationsReceived)} />
                        <Field label="Total committed" value={inr(brand.totalCommitted)} />
                      </div>
                    </Section>

                    <Section title="Active Deals">
                      <DealList deals={brand.activeDeals} nameKey="influencerName" nameLabel="Creator" />
                    </Section>

                    <Section title="Working With">
                      {brand.workingWith.length === 0 ? (
                        <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">No active collaborations</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {brand.workingWith.map((name: string, i: number) => (
                            <span key={i} className="text-[12px] px-2.5 py-1 rounded-full font-medium bg-white border border-gray-200 text-gray-700">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </Section>
                  </>
                ) : (
                  <EmptyNotice text="Profile not set up yet" />
                )
              )}
            </div>
          </div>
        )}

        {/* Section 4 — Admin Actions (sticky footer) */}
        {data && user && role !== 'admin' && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-3.5 space-y-2.5">
            {gstinPending && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleGstin('verified')}
                  disabled={acting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Approve GSTIN
                </button>
                <button
                  onClick={() => handleGstin('rejected')}
                  disabled={acting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reject GSTIN
                </button>
              </div>
            )}
            <div className="flex gap-2">
              {user.status === 'suspended' ? (
                <button
                  onClick={() => handleStatus('active')}
                  disabled={acting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Restore Account
                </button>
              ) : (
                <button
                  onClick={() => handleStatus('suspended')}
                  disabled={acting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Suspend Account
                </button>
              )}
              <button
                onClick={handleCopyId}
                className="px-3.5 py-2.5 rounded-xl text-[13px] font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                title="Copy User ID"
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

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${className}`}>
      {children}
    </span>
  );
}

function VerifiedDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />
      {ok ? 'Verified' : 'Unverified'}
    </span>
  );
}

const MINI_TONES: Record<string, string> = {
  default: 'text-gray-900',
  green:   'text-green-600',
  red:     'text-red-600',
  amber:   'text-amber-600',
  blue:    'text-blue-600',
};

function MiniStat({ label, value, tone = 'default' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-2 py-2.5 text-center">
      <p className={`text-base font-bold ${MINI_TONES[tone]}`}>{fmtNum(value)}</p>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function DealList({ deals, nameKey, nameLabel }: { deals: any[]; nameKey: string; nameLabel: string }) {
  if (!deals || deals.length === 0) {
    return <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">No deals yet</p>;
  }
  return (
    <div className="space-y-2">
      {deals.map((d, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{d.campaignTitle}</p>
              <p className="text-[11px] text-gray-400 truncate">{nameLabel}: {d[nameKey]}</p>
            </div>
            <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${DEAL_STATUS_STYLES[d.status] || DEAL_STATUS_STYLES.cancelled}`}>
              {d.status}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="text-[13px] font-bold text-gray-900">{inr(d.agreedAmount)}</p>
            {d.customId && <IdChip id={d.customId} size="xs" tone="subtle" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center">
      <p className="text-[13px] font-medium text-gray-400">{text}</p>
    </div>
  );
}
