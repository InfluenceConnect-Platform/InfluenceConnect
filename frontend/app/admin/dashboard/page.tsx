'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import AdminNav from '@/components/shared/AdminNav';
import { useToast } from '@/components/shared/Toast';
import AdminGrowthChart from '@/components/charts/AdminGrowthChart';

const ROLE_STYLES: Record<string, string> = {
  influencer: 'bg-teal-50 text-teal-700 border border-teal-100',
  brand:      'bg-blue-50 text-blue-700 border border-blue-100',
  admin:      'bg-gray-100 text-gray-600 border border-gray-200',
};

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-50 text-green-700 border border-green-100',
  pending:   'bg-amber-50 text-amber-700 border border-amber-100',
  suspended: 'bg-red-50 text-red-700 border border-red-100',
};

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading admin panel…</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser]                   = useState<any>(null);
  const [stats, setStats]                 = useState<any>(null);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);
  const [signupTrend, setSignupTrend]     = useState<any[]>([]);
  const [pendingGSTIN, setPendingGSTIN]   = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
    setUser(parsed);
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveData(() => { fetchData(); });

  const fetchData = async () => {
    try {
      const [statsRes, gstinRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/gstin/pending'),
      ]);
      setStats(statsRes.data.stats);
      setRecentSignups(statsRes.data.recentSignups);
      setSignupTrend(statsRes.data.signupTrend ?? []);
      setPendingGSTIN(gstinRes.data.pending);
    } catch (err) {
      console.error('Admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    toast.show(msg, /fail|error|cannot|unable|wrong/.test(msg.toLowerCase()) ? 'error' : 'success');
  };

  const handleGSTIN = async (profileId: string, status: string) => {
    try {
      await api.put(`/api/admin/gstin/${profileId}/status`, { status });
      showToast(`GSTIN ${status} successfully.`);
      fetchData();
    } catch {
      showToast('Failed to update GSTIN status.');
    }
  };

  if (loading) return <PageLoader />;

  const STAT_CARDS = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      sub: `${stats?.totalInfluencers ?? 0} creators · ${stats?.totalBrands ?? 0} brands`,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      accent: 'bg-blue-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Active Campaigns',
      value: stats?.activeCampaigns ?? 0,
      sub: 'Currently live on the platform',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      accent: 'bg-amber-400',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      ),
    },
    {
      label: 'Total Deals',
      value: stats?.totalDeals ?? 0,
      sub: `${stats?.completedDeals ?? 0} completed`,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      accent: 'bg-violet-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    {
      label: 'MRR',
      value: `₹${(stats?.mrr ?? 0).toLocaleString('en-IN')}`,
      sub: `${stats?.premiumUsers ?? 0} premium subscribers`,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'bg-emerald-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">


      <AdminNav user={user} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">

        {/* Page header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Platform overview</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          </div>
          <button
            onClick={fetchData}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 px-3 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {STAT_CARDS.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-[3px] ${s.accent} rounded-t-2xl`} />
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-semibold text-gray-500 leading-tight">{s.label}</p>
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center flex-shrink-0`}>
                  {s.icon}
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none mb-1.5 tabular-nums">{s.value}</p>
              <p className="text-xs text-gray-400 leading-tight">{s.sub}</p>
            </div>
          ))}
        </section>

        {/* Growth chart */}
        <section className="mb-5">
          <AdminGrowthChart data={signupTrend} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-5 mb-5">

          {/* Recent signups */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Recent signups</h3>
                <p className="text-xs text-gray-400 mt-0.5">Last 8 registrations</p>
              </div>
              <Link
                href="/admin/users"
                className="text-xs font-semibold text-[#3E4751] hover:text-[#5A6472] flex items-center gap-1 transition-colors"
              >
                View all
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    {['User', 'Role', 'Plan', 'Status', 'Joined'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentSignups.map((u, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3E4751] to-[#5A6472] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 shadow-sm">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_STYLES[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                          u.plan === 'premium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLES[u.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-gray-50">
              {recentSignups.map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3E4751] to-[#5A6472] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_STYLES[u.role]}`}>
                      {u.role}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLES[u.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: subscription mix */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-5 flex flex-col gap-5">

            {/* Freemium vs Premium */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">Subscription mix</h3>
                <span className="text-xs text-gray-400">{stats?.totalUsers ?? 0} users</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-3">
                <div
                  className="bg-[#3E4751] transition-all duration-500"
                  style={{ width: `${stats?.totalUsers ? ((stats.freemiumUsers / stats.totalUsers) * 100) : 0}%` }}
                />
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${stats?.totalUsers ? ((stats.premiumUsers / stats.totalUsers) * 100) : 0}%` }}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3E4751] flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Freemium <span className="text-gray-400 font-normal">· {stats?.freemiumUsers ?? 0}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Premium <span className="text-gray-400 font-normal">· {stats?.premiumUsers ?? 0}</span></span>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* MRR breakdown */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">MRR breakdown</p>
              <div className="flex flex-col gap-3.5">
                {[
                  {
                    label: 'Creator Premium',
                    color: 'bg-teal-400',
                    amount: stats?.influencerMRR ?? 0,
                    width: stats?.mrr ? Math.round(((stats.influencerMRR ?? 0) / stats.mrr) * 100) : 0,
                  },
                  {
                    label: 'Brand Premium',
                    color: 'bg-amber-400',
                    amount: stats?.brandMRR ?? 0,
                    width: stats?.mrr ? Math.round(((stats.brandMRR ?? 0) / stats.mrr) * 100) : 0,
                  },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-medium">{item.label}</span>
                      <span className="text-gray-500 font-semibold tabular-nums">₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Quick links */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Quick access</p>
              {[
                { label: 'Manage users', href: '/admin/users' },
                { label: 'Review campaigns', href: '/admin/campaigns' },
                { label: 'Subscription overview', href: '/admin/subscriptions' },
              ].map((l, i) => (
                <Link
                  key={i}
                  href={l.href}
                  className="flex items-center justify-between text-xs font-medium text-gray-600 hover:text-[#3E4751] py-1.5 border-b border-gray-50 last:border-0 transition-colors group"
                >
                  {l.label}
                  <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#3E4751] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* GSTIN Queue */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">GSTIN verification queue</h3>
              <p className="text-xs text-gray-400 mt-0.5">Review brand tax registrations before approval</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
              pendingGSTIN.length > 0
                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                : 'bg-green-50 text-green-700 border border-green-100'
            }`}>
              {pendingGSTIN.length} pending
            </span>
          </div>

          {pendingGSTIN.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">All clear</p>
              <p className="text-xs text-gray-400 mt-0.5">No pending GSTIN verifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingGSTIN.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-blue-100">
                    {item.userId?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.userId?.name}</p>
                    <p className="text-xs text-gray-400">{item.userId?.email}</p>
                    <p className="text-xs font-mono text-gray-600 mt-1.5 bg-gray-100 px-2.5 py-1 rounded-lg inline-block tracking-wider">
                      {item.gstin}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleGSTIN(item._id, 'verified')}
                      className="text-xs px-4 py-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleGSTIN(item._id, 'rejected')}
                      className="text-xs px-4 py-2 font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer border border-red-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
