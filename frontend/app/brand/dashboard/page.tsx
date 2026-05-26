'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import BrandNav from '@/components/shared/BrandNav';

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  applied:     { cls: 'bg-blue-50 text-blue-700 border border-blue-100',   label: 'Applied' },
  shortlisted: { cls: 'bg-amber-50 text-amber-700 border border-amber-100', label: 'Shortlisted' },
  accepted:    { cls: 'bg-green-50 text-green-700 border border-green-100', label: 'Accepted' },
  rejected:    { cls: 'bg-red-50 text-red-500 border border-red-100',       label: 'Rejected' },
};

const AVATAR_GRADS = [
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-green-600',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function BrandDashboard() {
  const router = useRouter();
  const [user] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [stats, setStats] = useState<any>(null);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    if (JSON.parse(stored).role !== 'brand') { router.push('/auth/login'); return; }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      try { await api.post('/api/brand/profile'); } catch { /* already exists */ }
      const [statsRes, profileRes] = await Promise.all([
        api.get('/api/brand/dashboard/stats'),
        api.get('/api/brand/profile/me').catch(() => null),
      ]);
      setStats(statsRes.data.stats);
      setRecentApplications(statsRes.data.recentApplications);
      if (profileRes?.data?.profile?.logoUrl) setLogoUrl(profileRes.data.profile.logoUrl);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = user?.plan === 'premium';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#3D5087] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const STATS = [
    {
      label: 'Active Campaigns',
      value: stats?.activeCampaigns ?? 0,
      sub: isPremium ? 'Unlimited plan' : `${stats?.activeCampaigns ?? 0} of 2 free`,
      warn: !isPremium && (stats?.activeCampaigns ?? 0) >= 2,
      from: 'from-blue-500', to: 'to-indigo-600',
      bgFrom: 'from-blue-50', bgTo: 'to-indigo-50',
      border: 'border-blue-200/70',
      valCls: 'text-blue-900', subCls: 'text-blue-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
    {
      label: 'Total Applications',
      value: stats?.totalApplications ?? 0,
      sub: 'From creators',
      from: 'from-violet-500', to: 'to-purple-600',
      bgFrom: 'from-violet-50', bgTo: 'to-purple-50',
      border: 'border-violet-200/70',
      valCls: 'text-violet-900', subCls: 'text-violet-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Active Deals',
      value: stats?.activeDeals ?? 0,
      sub: 'In progress',
      from: 'from-amber-500', to: 'to-orange-500',
      bgFrom: 'from-amber-50', bgTo: 'to-orange-50',
      border: 'border-amber-200/70',
      valCls: 'text-amber-900', subCls: 'text-amber-600',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Deals Completed',
      value: stats?.completedDeals ?? 0,
      sub: 'All time',
      from: 'from-emerald-500', to: 'to-green-600',
      bgFrom: 'from-emerald-50', bgTo: 'to-green-50',
      border: 'border-emerald-200/70',
      valCls: 'text-emerald-900', subCls: 'text-emerald-600',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <BrandNav user={user} logoUrl={logoUrl} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Hero ── */}
        <section className="relative bg-gradient-to-br from-[#1e2f5c] via-[#3D5087] to-[#4a5fa0] rounded-2xl px-6 sm:px-10 py-7 sm:py-9 mb-6 overflow-hidden shadow-lg">
          {/* decorative blobs */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          {/* dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="bd-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bd-dots)"/>
          </svg>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-widest mb-2">
                {getGreeting()}, {user?.name?.split(' ')[0]} 👋
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Campaign Command Center
              </h1>
              {/* inline stat chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  {stats?.activeCampaigns ?? 0} active campaign{(stats?.activeCampaigns ?? 0) !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3 h-3 text-violet-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {stats?.totalApplications ?? 0} application{(stats?.totalApplications ?? 0) !== 1 ? 's' : ''}
                </span>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-amber-400/20 to-yellow-400/20 border border-amber-400/30 text-amber-300 px-3 py-1.5 rounded-full">
                    ★ Premium
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
              <Link
                href="/brand/campaigns"
                className="inline-flex items-center gap-2 bg-white dark:bg-white/20 text-[#3D5087] dark:text-white hover:bg-blue-50 dark:hover:bg-white/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm self-start sm:self-auto"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New campaign
              </Link>
              <Link
                href="/brand/discover"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all self-start sm:self-auto"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Discover creators
              </Link>
            </div>
          </div>
        </section>

        {/* ── Freemium warning ── */}
        {!isPremium && (stats?.activeCampaigns || 0) >= 2 && (
          <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p className="text-sm text-amber-800">
                <strong>Freemium limit reached.</strong> Upgrade to create unlimited campaigns.
              </p>
            </div>
            <Link href="/brand/billing" className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all self-start sm:self-auto">
              Upgrade now →
            </Link>
          </section>
        )}

        {/* ── Stat cards ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`relative overflow-hidden border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all ${
                stat.warn
                  ? 'bg-amber-50 border-amber-300'
                  : `bg-gradient-to-br ${stat.bgFrom} ${stat.bgTo} ${stat.border}`
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 leading-tight pr-2">{stat.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.warn ? 'from-amber-400 to-orange-400' : `${stat.from} ${stat.to}`} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {stat.icon}
                </div>
              </div>
              <p className={`text-3xl sm:text-4xl font-black leading-none mb-2 tabular-nums ${stat.warn ? 'text-amber-900' : stat.valCls}`}>
                {stat.value}
              </p>
              <p className={`text-[11px] font-semibold ${stat.warn ? 'text-amber-600' : stat.subCls}`}>
                {stat.sub}
              </p>
              {/* decorative circle */}
              <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${stat.warn ? 'from-amber-200/30 to-orange-200/30' : `${stat.from} ${stat.to}`} opacity-10 pointer-events-none`} />
            </div>
          ))}
        </section>

        {/* ── Main grid ── */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

          {/* Recent Applications */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Recent Applications</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Latest creator applications across all campaigns</p>
              </div>
              <Link href="/brand/campaigns" className="flex items-center gap-1 text-xs text-[#3D5087] font-bold hover:underline">
                View all
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No applications yet</p>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-4">
                  Creator applications will appear here once you launch a campaign.
                </p>
                <Link href="/brand/campaigns" className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#3D5087] hover:bg-[#2B3B68] px-4 py-2 rounded-xl transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Create first campaign
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentApplications.map((app, i) => {
                  const grad = AVATAR_GRADS[(app.influencerId?.name?.charCodeAt(0) || 0) % AVATAR_GRADS.length];
                  const cfg  = STATUS_CONFIG[app.status];
                  return (
                    <Link key={i} href={`/brand/campaigns?campaign=${app.campaignId?._id}`} className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50/60 transition-colors group cursor-pointer">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm`}>
                        {app.influencerId?.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{app.influencerId?.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          <span className="text-gray-500 font-medium">{app.campaignId?.title}</span>
                        </p>
                      </div>
                      {cfg && (
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      )}
                      <svg className="w-4 h-4 text-gray-200 group-hover:text-[#3D5087] transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Quick actions — 2×2 grid */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    label: 'New Campaign',
                    href: '/brand/campaigns',
                    grad: 'from-[#3D5087] to-[#2B3B68]',
                    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
                  },
                  {
                    label: 'Discover',
                    href: '/brand/discover',
                    grad: 'from-violet-500 to-purple-600',
                    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
                  },
                  {
                    label: 'Applications',
                    href: '/brand/campaigns',
                    grad: 'from-amber-500 to-orange-500',
                    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
                  },
                  {
                    label: 'Messages',
                    href: '/brand/messages',
                    grad: 'from-emerald-500 to-teal-600',
                    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                  },
                ].map(action => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all group cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.grad} text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                      {action.icon}
                    </div>
                    <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition-colors text-center">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upgrade card */}
            {!isPremium ? (
              <div className="relative bg-gradient-to-br from-[#1e2f5c] via-[#3D5087] to-[#4a5fa0] rounded-2xl p-5 overflow-hidden shadow-md">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Upgrade to Premium
                  </div>
                  <h4 className="font-extrabold text-white text-[15px] mb-1">Unlock unlimited growth</h4>
                  <p className="text-blue-200/70 text-xs mb-4 leading-relaxed">Everything you need to run campaigns at scale.</p>
                  <ul className="space-y-2 mb-5">
                    {['Unlimited campaigns', 'Priority in creator discovery', 'Advanced analytics & exports'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-blue-100/90">
                        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/brand/billing"
                    className="block text-center bg-white hover:bg-blue-50 text-[#3D5087] py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                  >
                    ₹1,499 / month — Upgrade now →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-amber-900">Premium Active</p>
                    <p className="text-[11px] text-amber-600">All features unlocked</p>
                  </div>
                </div>
                <Link href="/brand/billing" className="block text-center text-xs font-bold text-amber-700 border border-amber-200 rounded-xl py-2 hover:bg-amber-100 transition-all">
                  Manage subscription →
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
