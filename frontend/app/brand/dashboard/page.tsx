'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import BrandNav from '@/components/shared/BrandNav';

const STATUS_STYLES: Record<string, string> = {
  applied:     'bg-blue-50 text-blue-700 border border-blue-100',
  shortlisted: 'bg-amber-50 text-amber-700 border border-amber-100',
  accepted:    'bg-green-50 text-green-700 border border-green-100',
  rejected:    'bg-red-50 text-red-600 border border-red-100',
};

const BRAND_STAT_STYLES = [
  { iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm', cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200', valueClass: 'text-blue-900', subClass: 'text-blue-500' },
  { iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm', cardBg: 'bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200', valueClass: 'text-violet-900', subClass: 'text-violet-500' },
  { iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm', cardBg: 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200', valueClass: 'text-amber-900', subClass: 'text-amber-600' },
  { iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm', cardBg: 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200', valueClass: 'text-emerald-900', subClass: 'text-emerald-600' },
];

const BRAND_ACTION_COLORS = [
  'bg-gradient-to-br from-[#3D5087] to-[#2B3B68]',
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-emerald-500 to-green-600',
];

export default function BrandDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'brand') { router.push('/auth/login'); return; }
    setUser(parsed);
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      try { await api.post('/api/brand/profile'); } catch { /* already exists */ }
      const response = await api.get('/api/brand/dashboard/stats');
      setStats(response.data.stats);
      setRecentApplications(response.data.recentApplications);
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

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <BrandNav user={user} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Hero strip */}
        <section className="relative bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] rounded-2xl px-5 sm:px-8 py-6 sm:py-7 mb-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute -bottom-12 -left-8 w-48 h-48 bg-white/5 rounded-full" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-blue-200/90 text-sm font-medium mb-1">
                Welcome, {user?.name?.split(' ')[0]}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                Your campaign command center
              </h1>
              <p className="text-blue-200/70 text-sm mt-1.5">
                {stats?.activeCampaigns || 0} active campaigns · {stats?.totalApplications || 0} total applications
              </p>
            </div>
            <Link
              href="/brand/campaigns"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all self-start sm:self-auto flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New campaign
            </Link>
          </div>
        </section>

        {/* Freemium limit warning */}
        {!isPremium && (stats?.activeCampaigns || 0) >= 2 && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-sm text-amber-800">
                <strong>Freemium limit reached.</strong> You've used both free campaigns. Upgrade to create unlimited campaigns and access all features.
              </p>
            </div>
            <Link
              href="/brand/billing"
              className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all self-start sm:self-auto"
            >
              Upgrade now →
            </Link>
          </section>
        )}

        {/* Stat cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            {
              label: 'Active Campaigns',
              value: stats?.activeCampaigns ?? 0,
              sub: isPremium ? 'Unlimited' : `${stats?.activeCampaigns ?? 0} of 2`,
              iconBg: 'bg-blue-50 text-blue-600',
              icon: (
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              ),
              warn: !isPremium && (stats?.activeCampaigns ?? 0) >= 2,
            },
            {
              label: 'Total Applications',
              value: stats?.totalApplications ?? 0,
              sub: 'Received',
              iconBg: 'bg-violet-50 text-violet-600',
              icon: (
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
            },
            {
              label: 'Deals In Progress',
              value: stats?.activeDeals ?? 0,
              sub: 'Active collaborations',
              iconBg: 'bg-amber-50 text-amber-600',
              icon: (
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              ),
            },
            {
              label: 'Deals Completed',
              value: stats?.completedDeals ?? 0,
              sub: 'All time',
              iconBg: 'bg-green-50 text-green-600',
              icon: (
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              ),
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${
                stat.warn ? 'border-amber-300 bg-amber-50/50' : `${BRAND_STAT_STYLES[i].cardBg} hover:shadow-md`
              }`}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <p className="text-xs font-medium text-gray-600 leading-tight pr-2">{stat.label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.warn ? 'bg-amber-100 text-amber-600' : BRAND_STAT_STYLES[i].iconBg}`}>
                  {stat.icon}
                </div>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold leading-none mb-1.5 tabular-nums ${stat.warn ? 'text-amber-900' : BRAND_STAT_STYLES[i].valueClass}`}>
                {stat.value}
              </p>
              <p className={`text-xs font-medium ${stat.warn ? 'text-amber-600' : BRAND_STAT_STYLES[i].subClass}`}>
                {stat.sub}
              </p>
            </div>
          ))}
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

          {/* Recent applications */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Recent Applications</h3>
              <Link href="/brand/campaigns" className="text-xs text-[#3D5087] font-semibold hover:underline">
                View all →
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No applications yet</p>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  Applications from creators will appear here once you launch a campaign.
                </p>
                <Link
                  href="/brand/campaigns"
                  className="mt-4 text-xs text-[#3D5087] font-semibold hover:underline"
                >
                  Create your first campaign →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentApplications.map((app, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3D5087] to-[#6B7FBB] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                      {app.influencerId?.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {app.influencerId?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{app.campaignId?.title}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize flex-shrink-0 ${STATUS_STYLES[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Quick actions */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-1">
                {[
                  {
                    label: 'Create campaign',
                    desc: 'Post a brief for creators',
                    href: '/brand/campaigns',
                    icon: (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Discover creators',
                    desc: 'Browse influencer profiles',
                    href: '/brand/discover',
                    icon: (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Review applications',
                    desc: 'Shortlist and accept creators',
                    href: '/brand/campaigns',
                    icon: (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <polyline points="16 11 18 13 22 9"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Messages',
                    desc: 'Chat with deal partners',
                    href: '/brand/messages',
                    icon: (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    ),
                  },
                ].map((action, i) => (
                  <Link
                    key={action.href + action.label}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center flex-shrink-0 shadow-sm ${BRAND_ACTION_COLORS[i]}`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{action.label}</p>
                      <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-[#3D5087] transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upgrade card */}
            {!isPremium && (
              <div className="relative bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] rounded-2xl p-5 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Premium
                  </div>
                  <h4 className="font-bold text-white text-sm mb-2">Unlock unlimited growth</h4>
                  <ul className="space-y-1.5 mb-4">
                    {[
                      'Unlimited campaigns',
                      'Priority in creator discovery',
                      'Advanced analytics & exports',
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-blue-200/90">
                        <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/brand/billing"
                    className="block text-center bg-white hover:bg-gray-50 text-[#3D5087] py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    ₹1,499 / month — Upgrade now →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
