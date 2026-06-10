'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import AdminNav from '@/components/shared/AdminNav';
import AdminRevenueChart from '@/components/charts/AdminRevenueChart';
import AdminDonut from '@/components/charts/AdminDonut';

export default function AdminSubscriptions() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [mrrTrend, setMrrTrend] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
    fetchOverview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveData(() => { fetchOverview(); });

  const fetchOverview = async () => {
    try {
      const response = await api.get('/api/admin/subscriptions/overview');
      setOverview(response.data.overview);
      setMrrTrend(response.data.mrrTrend ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-IN');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F8FA] via-[#F4F6F9] to-[#EDF0F5]">
      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">

        <div className="mb-7">
          <p className="text-[11px] font-semibold text-[#7FA8AD] uppercase tracking-[0.18em] mb-1.5">Revenue &amp; subscriptions</p>
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Subscriptions</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* MRR Hero */}
            <div className="bg-[#3E4751] rounded-2xl px-6 sm:px-8 py-6 sm:py-7 text-white overflow-hidden relative">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-white/[0.03] rounded-full pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">Monthly Recurring Revenue</p>
                    <p className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">₹{fmt(overview?.mrr ?? 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                    <span className="text-xs text-white/50">Creator: <span className="text-white font-semibold">₹{fmt(overview?.influencerMRR ?? 0)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-xs text-white/50">Brand: <span className="text-white font-semibold">₹{fmt(overview?.brandMRR ?? 0)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white/40 flex-shrink-0" />
                    <span className="text-xs text-white/50">Total premium: <span className="text-white font-semibold">{overview?.totalPremium ?? 0} users</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Users',         value: overview?.totalUsers ?? 0,        icon: 'users',    color: 'text-blue-600',    bg: 'bg-blue-50' },
                { label: 'Premium Users',        value: overview?.totalPremium ?? 0,      icon: 'star',     color: 'text-amber-600',   bg: 'bg-amber-50' },
                { label: 'Freemium Users',       value: overview?.freemiumUsers ?? 0,     icon: 'free',     color: 'text-gray-500',    bg: 'bg-gray-100' },
                { label: 'Conversion Rate',
                  value: overview?.totalUsers
                    ? `${Math.round(((overview.totalPremium ?? 0) / overview.totalUsers) * 100)}%`
                    : '0%',                                                                icon: 'chart',    color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            {/* MRR trend + premium mix */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
              <AdminRevenueChart
                data={mrrTrend}
                title="MRR growth"
                subtitle="Cumulative monthly recurring revenue · last 6 months"
                color="#3E4751"
              />
              <AdminDonut
                title="Premium mix"
                subtitle="Premium subscribers by role"
                centerLabel="Premium"
                segments={[
                  { label: 'Creators', value: overview?.premiumInfluencers ?? 0, color: '#7FA8AD' },
                  { label: 'Brands',   value: overview?.premiumBrands ?? 0,      color: '#f59e0b' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Revenue breakdown */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-5">Revenue breakdown</h3>
                <div className="flex flex-col gap-5">
                  {[
                    {
                      label: 'Creator Premium',
                      value: `₹${fmt(overview?.influencerMRR ?? 0)}`,
                      sub:   `${overview?.premiumInfluencers ?? 0} subscribers × ₹299/mo`,
                      bar:   overview?.mrr ? Math.round(((overview.influencerMRR ?? 0) / overview.mrr) * 100) : 0,
                      color: 'bg-teal-400',
                      dotColor: 'bg-teal-400',
                    },
                    {
                      label: 'Brand Premium',
                      value: `₹${fmt(overview?.brandMRR ?? 0)}`,
                      sub:   `${overview?.premiumBrands ?? 0} subscribers × ₹1,499/mo`,
                      bar:   overview?.mrr ? Math.round(((overview.brandMRR ?? 0) / overview.mrr) * 100) : 0,
                      color: 'bg-amber-400',
                      dotColor: 'bg-amber-400',
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor} flex-shrink-0`} />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                          </div>
                        </div>
                        <p className="text-base font-bold text-gray-900 tabular-nums">{item.value}</p>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-4">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${item.bar}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User breakdown */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-5">User breakdown</h3>
                <div className="flex flex-col gap-1">
                  {[
                    { label: 'Total users',        value: overview?.totalUsers ?? 0,        bold: true },
                    { label: 'Premium users',       value: overview?.totalPremium ?? 0,       bold: false },
                    { label: 'Freemium users',      value: overview?.freemiumUsers ?? 0,      bold: false },
                    { label: 'Premium creators',    value: overview?.premiumInfluencers ?? 0, bold: false },
                    { label: 'Premium brands',      value: overview?.premiumBrands ?? 0,      bold: false },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center justify-between py-3 ${i < 4 ? 'border-b border-gray-50' : ''}`}>
                      <p className={`text-sm ${item.bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{item.label}</p>
                      <p className={`text-sm tabular-nums ${item.bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2.5">
                    <span>Plan distribution</span>
                    <span>{overview?.totalUsers ?? 0} total</span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                    <div
                      className="bg-[#3E4751] transition-all duration-700"
                      style={{ width: `${overview?.totalUsers ? (((overview.freemiumUsers ?? 0) / overview.totalUsers) * 100) : 0}%` }}
                    />
                    <div
                      className="bg-amber-400 transition-all duration-700"
                      style={{ width: `${overview?.totalUsers ? (((overview.totalPremium ?? 0) / overview.totalUsers) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#3E4751]" />
                      <span className="text-gray-500">Freemium · {overview?.freemiumUsers ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                      <span className="text-gray-500">Premium · {overview?.totalPremium ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
