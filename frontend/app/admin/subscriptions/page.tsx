'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminNav from '@/components/shared/AdminNav';

export default function AdminSubscriptions() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
    fetchOverview();
  }, [router]);

  const fetchOverview = async () => {
    try {
      const response = await api.get('/api/admin/subscriptions/overview');
      setOverview(response.data.overview);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-IN');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        <div className="mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Revenue &amp; subscriptions</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Subscriptions overview</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-2 py-20">
            <div className="w-7 h-7 border-2 border-[#3E4751] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* MRR highlight */}
            <div className="bg-[#3E4751] rounded-2xl px-5 sm:px-7 py-5 sm:py-6 text-white overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
              <p className="text-sm text-white/60 font-medium mb-1">Monthly Recurring Revenue</p>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">₹{fmt(overview?.mrr ?? 0)}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                <span className="text-xs text-white/60">
                  Creator: <span className="text-white font-semibold">₹{fmt(overview?.influencerMRR ?? 0)}</span>
                </span>
                <span className="text-xs text-white/60">
                  Brand: <span className="text-white font-semibold">₹{fmt(overview?.brandMRR ?? 0)}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Revenue breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Revenue breakdown</h3>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      label: 'Creator Premium',
                      value: `₹${fmt(overview?.influencerMRR ?? 0)}`,
                      sub:   `${overview?.premiumInfluencers ?? 0} × ₹299/mo`,
                      bar:   overview?.mrr ? Math.round(((overview.influencerMRR ?? 0) / overview.mrr) * 100) : 0,
                      color: 'bg-[#7FA8AD]',
                    },
                    {
                      label: 'Brand Premium',
                      value: `₹${fmt(overview?.brandMRR ?? 0)}`,
                      sub:   `${overview?.premiumBrands ?? 0} × ₹1,499/mo`,
                      bar:   overview?.mrr ? Math.round(((overview.brandMRR ?? 0) / overview.mrr) * 100) : 0,
                      color: 'bg-[#E8B958]',
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.sub}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{item.value}</p>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.bar}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">User breakdown</h3>
                <div className="flex flex-col divide-y divide-gray-50">
                  {[
                    { label: 'Total users',         value: overview?.totalUsers ?? 0 },
                    { label: 'Premium users',        value: overview?.totalPremium ?? 0 },
                    { label: 'Freemium users',       value: overview?.freemiumUsers ?? 0 },
                    { label: 'Premium influencers',  value: overview?.premiumInfluencers ?? 0 },
                    { label: 'Premium brands',       value: overview?.premiumBrands ?? 0 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <p className="text-sm text-gray-600">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900 tabular-nums">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversion rate */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Plan distribution</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Freemium vs Premium</span>
                    <span>{overview?.totalUsers ?? 0} total</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                    <div
                      className="bg-[#3E4751] transition-all"
                      style={{ width: `${overview?.totalUsers ? (((overview.freemiumUsers ?? 0) / overview.totalUsers) * 100) : 0}%` }}
                    />
                    <div
                      className="bg-[#E8B958] transition-all"
                      style={{ width: `${overview?.totalUsers ? (((overview.totalPremium ?? 0) / overview.totalUsers) * 100) : 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex sm:flex-col gap-3 sm:gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-[#3E4751] flex-shrink-0" />
                    <span className="text-gray-600">Freemium · {overview?.freemiumUsers ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm bg-[#E8B958] flex-shrink-0" />
                    <span className="text-gray-600">Premium · {overview?.totalPremium ?? 0}</span>
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
