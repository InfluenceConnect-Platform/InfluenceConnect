'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import InfluencerNav from '@/components/shared/InfluencerNav';

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

const STATUS_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  pending:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400', label: 'Pending' },
  accepted: { cls: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500', label: 'Accepted' },
  rejected: { cls: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-400',   label: 'Declined' },
};

const BRAND_GRADS = [
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-green-600',
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const InstagramLogo = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <radialGradient id="ig-inv" cx="30%" cy="110%" r="130%">
        <stop offset="0%" stopColor="#ffd676"/><stop offset="25%" stopColor="#f46f30"/>
        <stop offset="50%" stopColor="#e1306c"/><stop offset="75%" stopColor="#833ab4"/>
        <stop offset="100%" stopColor="#4a23a8"/>
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-inv)"/>
    <rect x="6.5" y="6.5" width="11" height="11" rx="3.5" fill="none" stroke="white" strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1.6"/>
    <circle cx="17.2" cy="6.8" r="1.1" fill="white"/>
  </svg>
);
const YouTubeLogo = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#FF0000"/>
    <path d="M17.8 8.6c-.2-.7-.8-1.3-1.5-1.5C15 6.8 12 6.8 12 6.8s-3 0-4.3.3c-.7.2-1.3.8-1.5 1.5C6 9.9 6 12 6 12s0 2.1.2 3.4c.2.7.8 1.3 1.5 1.5C9 17.2 12 17.2 12 17.2s3 0 4.3-.3c.7-.2 1.3-.8 1.5-1.5.2-1.3.2-3.4.2-3.4s0-2.1-.2-3.4z" fill="white"/>
    <polygon points="10.5,9.5 10.5,14.5 14.5,12" fill="#FF0000"/>
  </svg>
);
const FacebookLogo = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#1877F2"/>
    <path d="M16 4h-2.5C11.6 4 10 5.6 10 7.7V10H7.5v3H10v7h3v-7h2.5l.5-3H13V7.7c0-.4.3-.7.7-.7H16V4z" fill="white"/>
  </svg>
);

const INDUSTRY_COLORS: Record<string, string> = {
  beauty: 'bg-pink-50 text-pink-700 border-pink-200', fashion: 'bg-purple-50 text-purple-700 border-purple-200',
  food: 'bg-orange-50 text-orange-700 border-orange-200', fitness: 'bg-amber-50 text-amber-700 border-amber-200',
  lifestyle: 'bg-violet-50 text-violet-700 border-violet-200', travel: 'bg-teal-50 text-teal-700 border-teal-200',
  tech: 'bg-blue-50 text-blue-700 border-blue-200', books: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const formatFollowers = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : `${n}`;

interface Invitation {
  _id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
  dealId?: string | null;
  brandLogoUrl?: string;
  brandCompanyName?: string;
  brandDescription?: string;
  brandWebsite?: string;
  brandIndustry?: string;
  brandGstinVerified?: boolean;
  brandId?: { _id: string; name: string };
  campaignId?: {
    _id: string;
    title: string;
    description?: string;
    deliverables?: string;
    niche?: string[];
    budgetMin?: number;
    budgetMax?: number;
    deadline?: string;
    targetPlatform?: string;
    targetCity?: string[];
    minFollowers?: number;
  };
}

export default function InfluencerInvitations() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string>('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    api.get('/api/influencer/profile/me').then(r => setProfilePicUrl(r.data?.profile?.profilePicUrl || '')).catch(() => {});
    fetchInvitations();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/api/invitations/influencer');
      setInvitations(res.data.invitations || []);
    } catch (error) {
      console.error('Fetch invitations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const respond = async (inv: Invitation, action: 'accept' | 'reject') => {
    if (action === 'reject' && !window.confirm('Decline this invitation? This cannot be undone.')) return;
    setActing(inv._id);
    try {
      const res = await api.put(`/api/invitations/${inv._id}/respond`, { action });
      setInvitations(prev => prev.map(i =>
        i._id === inv._id ? { ...i, status: res.data.status, dealId: res.data.dealId ?? i.dealId } : i
      ));
      if (action === 'accept') {
        setToast({ msg: 'Invitation accepted! Opening your messages…', type: 'success' });
        setTimeout(() => router.push('/influencer/messages'), 1200);
      } else {
        setToast({ msg: 'Invitation declined.', type: 'success' });
      }
    } catch (err: any) {
      setToast({ msg: err.response?.data?.error || 'Something went wrong.', type: 'error' });
    } finally {
      setActing('');
    }
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B1725]">
      <InfluencerNav user={user} profilePicUrl={profilePicUrl} />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg max-w-[90vw] text-center ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2f6168] via-[#3d7178] to-[#5D8A8F] rounded-2xl px-6 sm:px-8 py-7 mb-5 shadow-lg">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-8 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <p className="text-teal-100/80 text-xs font-semibold uppercase tracking-widest mb-2">Campaign opportunities</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Invitations</h1>
            <p className="text-teal-50/70 text-sm mt-1.5">
              Brands that invited you to collaborate. Accept to open a deal and start chatting — or decline.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3.5 py-1.5">
                <span className="text-xs font-semibold text-white">{invitations.length} total</span>
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-400/90 rounded-full px-3.5 py-1.5">
                  <span className="text-xs font-bold text-gray-900">{pendingCount} awaiting your response</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#0f1e31] border border-gray-200/80 dark:border-slate-700/60 rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="border-2 border-dashed border-teal-100 dark:border-slate-700 rounded-2xl p-16 text-center bg-white/60 dark:bg-[#0f1e31]/60">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3d7178] to-[#5D8A8F] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">No invitations yet</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">When a brand invites you to a campaign, it will show up here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((inv, idx) => {
              const campaign = inv.campaignId;
              const brandName = inv.brandCompanyName || inv.brandId?.name || 'Brand';
              const status = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
              const grad = BRAND_GRADS[(brandName.charCodeAt(0) || 0) % BRAND_GRADS.length];
              const hasBudget = (campaign?.budgetMin ?? 0) > 0 || (campaign?.budgetMax ?? 0) > 0;
              const deadline = campaign?.deadline ? new Date(campaign.deadline) : null;
              const now = new Date();
              const days = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : null;
              const urgency = days !== null && days >= 0 && days <= 3;
              const soonish = days !== null && days >= 0 && days <= 7 && !urgency;
              const cities = (campaign?.targetCity || []).filter((c: string) => c !== 'all');

              return (
                <div
                  key={inv._id}
                  className=”bg-white dark:bg-[#0f1e31] border border-gray-200/80 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow”
                >
                  {/* Accent strip */}
                  <div className={`h-1 w-full ${inv.status === 'accepted' ? 'bg-gradient-to-r from-emerald-400 to-green-500' : inv.status === 'rejected' ? 'bg-gradient-to-r from-gray-300 to-gray-400' : urgency ? 'bg-gradient-to-r from-red-400 to-rose-500' : soonish ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-[#5D8A8F] to-[#7FA8AD]'}`} />

                  <div className=”p-4 sm:p-5”>

                    {/* ── Brand row ── */}
                    <div className=”flex items-start gap-3 mb-3.5 p-3 rounded-xl bg-gray-50/70 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50”>
                      <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${grad} shadow-sm`}>
                        {inv.brandLogoUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={inv.brandLogoUrl} alt={brandName} className=”w-full h-full object-cover” />
                          : <span className=”text-white font-bold text-sm”>{brandName.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div className=”flex-1 min-w-0”>
                        <div className=”flex items-center gap-2 flex-wrap”>
                          <p className=”text-[13px] font-bold text-gray-900 dark:text-slate-100 truncate”>{brandName}</p>
                          {inv.brandGstinVerified && (
                            <span className=”flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex-shrink-0”>
                              <svg width=”9” height=”9” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” strokeWidth=”3” strokeLinecap=”round” strokeLinejoin=”round”><polyline points=”20 6 9 17 4 12”/></svg>
                              GST
                            </span>
                          )}
                          <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                        <div className=”flex items-center gap-2 flex-wrap mt-1”>
                          {inv.brandIndustry && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border ${INDUSTRY_COLORS[inv.brandIndustry] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {inv.brandIndustry}
                            </span>
                          )}
                          {campaign?.targetPlatform && campaign.targetPlatform !== 'any' && (
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide text-white ${campaign.targetPlatform === 'instagram' ? 'bg-gradient-to-r from-[#ee2a7b] to-[#6228d7]' : campaign.targetPlatform === 'youtube' ? 'bg-[#FF0000]' : 'bg-[#1877F2]'}`}>
                              {campaign.targetPlatform === 'instagram' && <InstagramLogo size={10} />}
                              {campaign.targetPlatform === 'youtube'   && <YouTubeLogo size={10} />}
                              {campaign.targetPlatform === 'facebook'  && <FacebookLogo size={10} />}
                              {campaign.targetPlatform}
                            </span>
                          )}
                          {inv.brandWebsite && (
                            <a href={inv.brandWebsite.startsWith('http') ? inv.brandWebsite : `https://${inv.brandWebsite}`} target=”_blank” rel=”noopener noreferrer” onClick={e => e.stopPropagation()}
                              className=”flex items-center gap-1 text-[11px] text-[#3D5087] dark:text-[#7FA8AD] hover:underline font-medium”>
                              <svg width=”10” height=”10” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” strokeWidth=”2.5” strokeLinecap=”round” strokeLinejoin=”round”>
                                <path d=”M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6”/><polyline points=”15 3 21 3 21 9”/><line x1=”10” y1=”14” x2=”21” y2=”3”/>
                              </svg>
                              {inv.brandWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </a>
                          )}
                        </div>
                        {inv.brandDescription && (
                          <p className=”text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 leading-relaxed line-clamp-2”>{inv.brandDescription}</p>
                        )}
                      </div>
                    </div>

                    {/* ── Campaign title + description ── */}
                    <h3 className=”text-[15px] font-bold text-gray-900 dark:text-slate-100 mb-1.5 leading-snug”>{campaign?.title || 'Campaign Invitation'}</h3>
                    {campaign?.description && (
                      <p className=”text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2”>{campaign.description}</p>
                    )}

                    {/* ── Budget + Deadline ── */}
                    <div className=”grid grid-cols-2 gap-2 mb-4”>
                      <div className=”bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3”>
                        <p className=”text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold uppercase tracking-wider mb-0.5”>Budget</p>
                        <p className=”text-[13px] font-bold text-emerald-900 dark:text-emerald-300 leading-tight”>
                          {hasBudget ? `₹${(campaign?.budgetMin || 0).toLocaleString('en-IN')}` : 'Open'}
                        </p>
                        {hasBudget && <p className=”text-[10px] text-emerald-600/60 dark:text-emerald-400/50”>– ₹{(campaign?.budgetMax || 0).toLocaleString('en-IN')}</p>}
                      </div>
                      <div className={`rounded-xl p-3 border ${urgency ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40' : soonish ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40' : 'bg-[#EEF4F5] dark:bg-[#0d2d33]/60 border-[#7FA8AD]/20'}`}>
                        <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${urgency ? 'text-red-600' : soonish ? 'text-amber-600' : 'text-[#5D8A8F]'}`}>
                          <svg width=”11” height=”11” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” strokeWidth=”2” strokeLinecap=”round” strokeLinejoin=”round”>
                            <rect x=”3” y=”4” width=”18” height=”18” rx=”2”/><line x1=”16” y1=”2” x2=”16” y2=”6”/><line x1=”8” y1=”2” x2=”8” y2=”6”/><line x1=”3” y1=”10” x2=”21” y2=”10”/>
                          </svg>
                          Deadline
                        </div>
                        <p className={`text-[13px] font-bold leading-tight ${urgency ? 'text-red-600' : soonish ? 'text-amber-600' : 'text-[#2A3E42]'}`}>
                          {days === null ? '—' : days < 0 ? 'Closed' : days === 0 ? 'Today!' : `${days}d left`}
                        </p>
                        {deadline && <p className=”text-[10px] text-gray-400 dark:text-slate-500”>{formatDate(campaign!.deadline!)}</p>}
                      </div>
                    </div>

                    {/* ── Deliverables + min followers + location ── */}
                    <div className=”flex flex-col gap-1.5 mb-4”>
                      {campaign?.deliverables && (
                        <div className=”flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400”>
                          <span className=”text-gray-300 dark:text-slate-600 mt-0.5 flex-shrink-0”>▸</span>
                          <span><strong className=”text-gray-600 dark:text-slate-300”>Deliverables:</strong> {campaign.deliverables}</span>
                        </div>
                      )}
                      {(campaign?.minFollowers ?? 0) > 0 && (
                        <div className=”flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400”>
                          <svg className=”text-gray-300 dark:text-slate-600 flex-shrink-0” width=”12” height=”12” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” strokeWidth=”2” strokeLinecap=”round” strokeLinejoin=”round”>
                            <path d=”M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2”/><circle cx=”9” cy=”7” r=”4”/><path d=”M23 21v-2a4 4 0 0 0-3-3.87”/><path d=”M16 3.13a4 4 0 0 1 0 7.75”/>
                          </svg>
                          <span>Min. <strong className=”text-gray-600 dark:text-slate-300”>{formatFollowers(campaign!.minFollowers!)}</strong> followers required</span>
                        </div>
                      )}
                      {cities.length > 0 && (
                        <div className=”flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400”>
                          <svg className=”text-gray-300 dark:text-slate-600 flex-shrink-0” width=”12” height=”12” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” strokeWidth=”2” strokeLinecap=”round” strokeLinejoin=”round”>
                            <path d=”M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z”/><circle cx=”12” cy=”10” r=”3”/>
                          </svg>
                          <span>{cities.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* ── Niche pills + received date ── */}
                    <div className=”flex items-center justify-between gap-2 mb-4”>
                      <div className=”flex flex-wrap gap-1.5”>
                        {campaign?.niche?.map((n: string) => (
                          <span key={n} className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-semibold border ${NICHE_COLORS[n] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{n}</span>
                        ))}
                      </div>
                      <span className=”flex-shrink-0 text-[10px] text-gray-400 dark:text-slate-500”>Received {formatDate(inv.createdAt)}</span>
                    </div>

                    {/* ── Brand note ── */}
                    {inv.message && (
                      <div className=”mb-4 px-3.5 py-2.5 bg-blue-50/60 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 rounded-xl”>
                        <p className=”text-[11px] font-bold text-blue-500 dark:text-slate-400 uppercase tracking-wide mb-0.5”>Note from brand</p>
                        <p className=”text-sm text-gray-700 dark:text-slate-300 italic”>”{inv.message}”</p>
                      </div>
                    )}

                    {/* ── Actions ── */}
                    {inv.status === 'pending' ? (
                      <div className=”flex items-center gap-2.5 pt-4 border-t border-gray-100 dark:border-slate-700/60”>
                        <button
                          onClick={() => respond(inv, 'accept')}
                          disabled={acting === inv._id}
                          className=”flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all shadow-sm disabled:opacity-60 cursor-pointer”
                        >
                          {acting === inv._id
                            ? <span className=”w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin” />
                            : <svg width=”15” height=”15” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” strokeWidth=”2.5” strokeLinecap=”round” strokeLinejoin=”round”><polyline points=”20 6 9 17 4 12”/></svg>
                          }
                          Accept &amp; start deal
                        </button>
                        <button
                          onClick={() => respond(inv, 'reject')}
                          disabled={acting === inv._id}
                          className=”flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-all disabled:opacity-60 cursor-pointer”
                        >
                          Decline
                        </button>
                      </div>
                    ) : inv.status === 'accepted' ? (
                      <div className=”pt-4 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between gap-2”>
                        <p className=”text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5”>
                          <svg width=”13” height=”13” className=”text-emerald-500” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” strokeWidth=”2.5” strokeLinecap=”round” strokeLinejoin=”round”><polyline points=”20 6 9 17 4 12”/></svg>
                          Deal created — collaborate in Messages.
                        </p>
                        <button onClick={() => router.push('/influencer/messages')}
                          className=”flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#3d7178] to-[#5D8A8F] hover:from-[#2f6168] hover:to-[#4d767b] px-3.5 py-2 rounded-lg transition-all shadow-sm cursor-pointer”>
                          <svg width=”12” height=”12” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” strokeWidth=”2” strokeLinecap=”round” strokeLinejoin=”round”><path d=”M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z”/></svg>
                          Go to Messages
                        </button>
                      </div>
                    ) : (
                      <div className=”pt-4 border-t border-gray-100 dark:border-slate-700/60”>
                        <p className=”text-xs text-gray-400 dark:text-slate-500”>You declined this invitation.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
