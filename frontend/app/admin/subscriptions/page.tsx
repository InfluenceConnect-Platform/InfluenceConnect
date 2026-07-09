'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import { AdminShell, AdminHeader, CountUp, SpotlightCard } from '@/components/shared/AdminUI';
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
    <AdminShell>

        <AdminHeader
          eyebrow="Revenue & subscriptions"
          title="Subscriptions"
          subtitle="Track MRR, premium conversions and plan distribution in real time."
        />

        {loading ? (
          <div className="flex flex-col gap-5 animate-pulse" aria-hidden="true">
            <div className="h-44 rounded-3xl bg-gray-200/60" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-200/50" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
              <div className="h-72 rounded-2xl bg-gray-200/50" />
              <div className="h-72 rounded-2xl bg-gray-200/50" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* MRR Hero */}
            <div className="bg-gradient-to-br from-[#2E3944] via-[#3E4751] to-[#20262D] rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-6 sm:py-7 text-white overflow-hidden relative shadow-[0_16px_44px_rgba(38,44,51,0.30)] anim-fade-up">
              <div className="absolute -top-20 -right-16 w-64 h-64 bg-[#7FA8AD]/20 rounded-full blur-3xl pointer-events-none anim-blob" />
              <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">Monthly Recurring Revenue</p>
                    <CountUp
                      value={overview?.mrr ?? 0}
                      format={n => `₹${fmt(Math.round(n))}`}
                      className="block text-[28px] sm:text-5xl font-bold tracking-tight tabular-nums"
                    />
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
              {([
                {
                  label: 'Total Users', value: overview?.totalUsers ?? 0, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', wash: 'to-blue-50/60',
                  icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
                },
                {
                  label: 'Premium Users', value: overview?.totalPremium ?? 0, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', wash: 'to-amber-50/60',
                  icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
                },
                {
                  label: 'Freemium Users', value: overview?.freemiumUsers ?? 0, color: 'text-gray-500', bg: 'bg-gray-100 border-gray-200', wash: 'to-gray-50/80',
                  icon: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
                },
                {
                  label: 'Conversion Rate',
                  value: overview?.totalUsers
                    ? Math.round(((overview.totalPremium ?? 0) / overview.totalUsers) * 100)
                    : 0,
                  format: (n: number) => `${Math.round(n)}%`,
                  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', wash: 'to-emerald-50/60',
                  icon: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
                },
              ] as { label: string; value: number; format?: (n: number) => string; color: string; bg: string; wash: string; icon: React.ReactNode }[]).map((s, i) => (
                <SpotlightCard key={i} className={`bg-gradient-to-br from-white via-white ${s.wash} border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow-[0_12px_28px_rgba(16,24,40,0.08)] hover:-translate-y-0.5 transition-all duration-200 anim-fade-up anim-delay-${i + 1}`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-1">{s.label}</p>
                    <span className={`w-8 h-8 rounded-lg border ${s.bg} ${s.color} flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {s.icon}
                      </svg>
                    </span>
                  </div>
                  <CountUp value={s.value} format={s.format} className="text-2xl font-bold text-gray-900 tabular-nums" />
                </SpotlightCard>
              ))}
            </div>

            {/* MRR trend + premium mix */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 anim-fade-up anim-delay-2">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 anim-fade-up anim-delay-3">

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
                    { label: 'Total users',        value: overview?.totalUsers ?? 0,        bold: true,  href: '/admin/users' },
                    { label: 'Premium users',       value: overview?.totalPremium ?? 0,       bold: false, href: '/admin/users?plan=premium' },
                    { label: 'Freemium users',      value: overview?.freemiumUsers ?? 0,      bold: false, href: '/admin/users?plan=freemium' },
                    { label: 'Premium creators',    value: overview?.premiumInfluencers ?? 0, bold: false, href: '/admin/users?plan=premium&role=influencer' },
                    { label: 'Premium brands',      value: overview?.premiumBrands ?? 0,      bold: false, href: '/admin/users?plan=premium&role=brand' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => router.push(item.href)}
                      className={`group flex items-center justify-between py-3 -mx-2 px-2 rounded-lg text-left hover:bg-gray-50 transition-colors cursor-pointer ${i < 4 ? 'border-b border-gray-50' : ''}`}
                    >
                      <span className={`text-sm inline-flex items-center gap-1.5 ${item.bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {item.label}
                        <svg className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-gray-400 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </span>
                      <span className={`text-sm tabular-nums ${item.bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{item.value}</span>
                    </button>
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
    </AdminShell>
  );
}
