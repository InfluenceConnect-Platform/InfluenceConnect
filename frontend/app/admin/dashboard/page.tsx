'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import AdminNav from '@/components/shared/AdminNav';

const ROLE_STYLES: Record<string, string> = {
  influencer: 'bg-[#EEF4F5] text-[#2A3E42]',
  brand:      'bg-[#EAEDF6] text-[#1B2444]',
  admin:      'bg-gray-100 text-gray-700',
};

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  pending:   'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser]                     = useState<any>(null);
  const [stats, setStats]                   = useState<any>(null);
  const [recentSignups, setRecentSignups]   = useState<any[]>([]);
  const [pendingGSTIN, setPendingGSTIN]     = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [toast, setToast]                   = useState('');

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/auth/login'); return; }
    setUser(parsed);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, gstinRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/gstin/pending'),
      ]);
      setStats(statsRes.data.stats);
      setRecentSignups(statsRes.data.recentSignups);
      setPendingGSTIN(gstinRes.data.pending);
    } catch (err) {
      console.error('Admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {toast && (
        <div className="fixed bottom-5 right-4 sm:right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50 max-w-[calc(100vw-32px)] sm:max-w-sm">
          {toast}
        </div>
      )}

      <AdminNav user={user} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        <div className="mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Platform overview</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Today&apos;s snapshot</h1>
        </div>

        {/* Stat cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            {
              label: 'Total Users',
              value: stats?.totalUsers ?? 0,
              sub: `${stats?.totalInfluencers ?? 0} creators · ${stats?.totalBrands ?? 0} brands`,
              accent: 'border-t-[#7FA8AD]',
            },
            {
              label: 'Active Campaigns',
              value: stats?.activeCampaigns ?? 0,
              sub: 'Currently live',
              accent: 'border-t-[#E8B958]',
            },
            {
              label: 'Deals',
              value: stats?.totalDeals ?? 0,
              sub: `${stats?.completedDeals ?? 0} completed`,
              accent: 'border-t-[#3E4751]',
            },
            {
              label: 'MRR',
              value: `₹${(stats?.mrr ?? 0).toLocaleString('en-IN')}`,
              sub: `${stats?.premiumUsers ?? 0} premium users`,
              accent: 'border-t-[#E89087]',
            },
          ].map((s, i) => (
            <div key={i} className={`bg-white border border-gray-200 border-t-[3px] ${s.accent} rounded-xl p-4 shadow-sm`}>
              <p className="text-xs text-gray-500 font-medium mb-2 leading-tight">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none mb-1.5 tabular-nums">{s.value}</p>
              <p className="text-xs text-gray-400 leading-tight">{s.sub}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mb-5">

          {/* Recent signups */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Recent signups</h3>
              <Link href="/admin/users" className="text-xs text-[#3E4751] font-semibold hover:underline">
                View all →
              </Link>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['User', 'Role', 'Plan', 'Status', 'Joined'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentSignups.map((u, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#EEF4F5] text-[#2A3E42] flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${ROLE_STYLES[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${
                          u.plan === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[u.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-50">
              {recentSignups.map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#EEF4F5] text-[#2A3E42] flex items-center justify-center font-bold text-sm flex-shrink-0">
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

          {/* Subscription mix */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Subscription mix</h3>

            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Freemium vs Premium</span>
                <span>{stats?.totalUsers ?? 0} users</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="bg-[#3E4751] transition-all"
                  style={{ width: `${stats?.totalUsers ? ((stats.freemiumUsers / stats.totalUsers) * 100) : 0}%` }}
                />
                <div
                  className="bg-[#E8B958] transition-all"
                  style={{ width: `${stats?.totalUsers ? ((stats.premiumUsers / stats.totalUsers) * 100) : 0}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-2.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3E4751] flex-shrink-0" />
                  <span className="text-gray-600">Freemium · {stats?.freemiumUsers ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#E8B958] flex-shrink-0" />
                  <span className="text-gray-600">Premium · {stats?.premiumUsers ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-4" />

            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">MRR breakdown</h4>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Creator Premium', color: 'bg-[#7FA8AD]', width: 40 },
                { label: 'Brand Premium',   color: 'bg-[#E8B958]', width: 60 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <span className="w-[90px] text-gray-600 flex-shrink-0 truncate">{item.label}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                    <div className={`h-full ${item.color} rounded-sm`} style={{ width: `${item.width}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GSTIN Queue */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">GSTIN verification queue</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manual review before approving brand accounts</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
              {pendingGSTIN.length} pending
            </span>
          </div>

          {pendingGSTIN.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">No pending GSTIN verifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingGSTIN.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-[#EAEDF6] text-[#1B2444] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {item.userId?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.userId?.name}</p>
                    <p className="text-xs text-gray-400">{item.userId?.email}</p>
                    <p className="text-xs font-mono text-gray-700 mt-1 bg-gray-50 px-2 py-0.5 rounded inline-block">
                      {item.gstin}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:flex-col sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleGSTIN(item._id, 'verified')}
                      className="flex-1 sm:flex-none text-xs px-3.5 py-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleGSTIN(item._id, 'rejected')}
                      className="flex-1 sm:flex-none text-xs px-3.5 py-2 font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer"
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
