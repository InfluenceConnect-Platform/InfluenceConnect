'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import InfluencerNav from '@/components/shared/InfluencerNav';

interface EarningsSummary {
  totalEarnings: number;
  activeDeals: number;
  pendingPayout: number;
  dealsCompleted: number;
  avgDealValue: number;
}

interface MonthlyTrend {
  month: string;
  year: number;
  earnings: number;
  deals: number;
}

interface DealHistory {
  brandName: string;
  campaignTitle: string;
  category: string;
  completedAt: string;
  status: string;
  amount: number;
}

const RupeeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const BriefcaseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const TrendingUpIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);
const DownloadIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const LockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const SearchIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const SparkIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
  </svg>
);

export default function EarningsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [dealHistory, setDealHistory] = useState<DealHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'6months' | '1year'>('6months');
  const [profilePicUrl, setProfilePicUrl] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    api.get('/api/influencer/profile/me').then(r => setProfilePicUrl(r.data?.profile?.profilePicUrl || '')).catch(() => {});
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/api/influencer/earnings');
      setSummary(response.data.summary);
      setMonthlyTrend(response.data.monthlyTrend);
      setDealHistory(response.data.dealHistory);
    } catch (error) {
      console.error('Fetch earnings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxEarnings = Math.max(...monthlyTrend.map(m => m.earnings), 1);
  const isPremium = user?.plan === 'premium';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading earnings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA]">

      <InfluencerNav user={user} profilePicUrl={profilePicUrl} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">

        {/* Hero banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1C4A52] via-[#27717E] to-[#5BA8B5] rounded-2xl px-5 sm:px-7 py-5 mb-6 shadow-lg">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 relative">
            <div>
              <p className="text-xs text-teal-200 font-semibold uppercase tracking-wider mb-1.5">Revenue & partnerships</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Earnings</h1>
              <p className="text-teal-200/80 text-sm mt-1">Track your revenue and brand deal history.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 gap-0.5 border border-white/10">
                {(['6months', '1year'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                      activeTab === tab
                        ? 'bg-white text-[#1C4A52] shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {tab === '6months' ? '6 months' : '1 year'}
                  </button>
                ))}
              </div>
              {isPremium && (
                <button className="flex items-center gap-1.5 text-xs text-white/90 px-3 py-2 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-150 cursor-pointer font-medium">
                  <DownloadIcon />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Stat cards — 2-col mobile, 4-col desktop */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">

          {/* Total earnings — featured */}
          <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl p-4 md:p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
            <div className="w-9 h-9 rounded-xl bg-white/20 shadow-sm flex items-center justify-center mb-3 text-white">
              <RupeeIcon />
            </div>
            <p className="text-[11px] text-amber-100/80 font-semibold uppercase tracking-wider mb-1">Total earnings</p>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums leading-none">
              ₹{(summary?.totalEarnings || 0).toLocaleString()}
            </p>
            <p className="text-xs text-amber-100/70 mt-1.5 font-medium">All completed deals</p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-red-100 border border-rose-200 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-200/30 rounded-full -translate-y-4 translate-x-4 pointer-events-none" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm flex items-center justify-center mb-3">
              <BriefcaseIcon />
            </div>
            <p className="text-[11px] text-rose-600/70 font-semibold uppercase tracking-wider mb-1">Active deals</p>
            <p className="text-2xl sm:text-3xl font-bold text-rose-900 tracking-tight tabular-nums leading-none">
              {summary?.activeDeals || 0}
            </p>
            <p className="text-xs text-rose-600/60 mt-1.5 font-medium truncate">
              ₹{(summary?.pendingPayout || 0).toLocaleString()} pending
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-200/30 rounded-full -translate-y-4 translate-x-4 pointer-events-none" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm flex items-center justify-center mb-3">
              <CheckCircleIcon />
            </div>
            <p className="text-[11px] text-emerald-600/70 font-semibold uppercase tracking-wider mb-1">Deals done</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-900 tracking-tight tabular-nums leading-none">
              {summary?.dealsCompleted || 0}
            </p>
            <p className="text-xs text-emerald-600/60 mt-1.5 font-medium">All time</p>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-violet-200/30 rounded-full -translate-y-4 translate-x-4 pointer-events-none" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm flex items-center justify-center mb-3">
              <TrendingUpIcon />
            </div>
            <p className="text-[11px] text-violet-600/70 font-semibold uppercase tracking-wider mb-1">Avg deal value</p>
            <p className="text-2xl sm:text-3xl font-bold text-violet-900 tracking-tight tabular-nums leading-none">
              ₹{(summary?.avgDealValue || 0).toLocaleString()}
            </p>
            <p className="text-xs text-violet-600/60 mt-1.5 font-medium">Per campaign</p>
          </div>

        </section>

        {/* Chart section */}
        {isPremium ? (
          <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 md:gap-5 mb-5 md:mb-6">

            {/* Monthly earnings chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Earnings overview</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Monthly earnings from completed deals</p>
                </div>
                <span className="self-start text-xs font-semibold px-2.5 py-1 bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] text-white rounded-full shadow-sm">
                  ₹{(summary?.totalEarnings || 0).toLocaleString()} total
                </span>
              </div>

              {/* Bar chart */}
              {monthlyTrend.length > 0 ? (
                <div className="flex items-end gap-1.5 sm:gap-2.5 h-[140px] sm:h-[160px]">
                  {monthlyTrend.map((month, index) => {
                    const pct = maxEarnings > 0
                      ? Math.max((month.earnings / maxEarnings) * 100, month.earnings > 0 ? 6 : 3)
                      : 3;
                    const isMax = month.earnings === maxEarnings && month.earnings > 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                          <div
                            className={`w-full rounded-t-lg transition-all duration-200 cursor-pointer relative ${
                              isMax
                                ? 'bg-gradient-to-t from-[#1C4A52] to-[#5BA8B5] shadow-sm'
                                : 'bg-gradient-to-t from-teal-200 to-cyan-100 group-hover:from-[#5D8A8F] group-hover:to-[#7FA8AD]'
                            }`}
                            style={{ height: `${pct}%` }}
                          >
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              ₹{month.earnings.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{month.month}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[140px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-sm text-gray-400">No earnings data yet</p>
                </div>
              )}
            </div>

            {/* Category breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">Earnings by category</h3>
              <p className="text-xs text-gray-400 mb-5">Breakdown of your deal categories</p>
              {dealHistory.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {/* Populated when deals are built */}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[140px] text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <TrendingUpIcon />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No data yet</p>
                  <p className="text-xs text-gray-400 max-w-[180px]">
                    Category breakdown appears after your first completed deal.
                  </p>
                </div>
              )}
            </div>

          </section>
        ) : (
          /* Freemium gate */
          <section className="mb-5 md:mb-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1C4A52] via-[#27717E] to-[#5BA8B5] rounded-2xl p-5 sm:p-6 shadow-lg">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center flex-shrink-0 border border-white/20">
                    <LockIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-[15px] mb-1">
                      Unlock earnings analytics with Premium
                    </h3>
                    <p className="text-sm text-teal-100/80 leading-relaxed">
                      See your full monthly trend, earnings by category, top brand insights, and export your data as CSV.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[
                        { label: 'Monthly chart', color: 'bg-teal-400/20 border-teal-300/30 text-teal-100' },
                        { label: 'Category breakdown', color: 'bg-violet-400/20 border-violet-300/30 text-violet-100' },
                        { label: 'Brand insights', color: 'bg-amber-400/20 border-amber-300/30 text-amber-100' },
                        { label: 'CSV export', color: 'bg-emerald-400/20 border-emerald-300/30 text-emerald-100' },
                      ].map(f => (
                        <span key={f.label} className={`inline-flex items-center gap-1 text-xs border px-2.5 py-1 rounded-full font-medium ${f.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link
                  href="/influencer/billing"
                  className="flex-shrink-0 bg-white hover:bg-gray-50 text-[#1C4A52] px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer text-center whitespace-nowrap">
                  Upgrade · ₹299/mo
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Deal history */}
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/60 to-white">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#7FA8AD] to-[#5D8A8F]" />
              <div>
                <h3 className="font-semibold text-gray-900">Deal history</h3>
                <p className="text-xs text-gray-400 mt-0.5">Completed and in-progress deals, newest first</p>
              </div>
            </div>
            <Link href="/influencer/campaigns"
              className="self-start sm:self-auto text-xs text-white font-semibold transition-colors duration-150 bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md">
              Browse campaigns →
            </Link>
          </div>

          {dealHistory.length > 0 ? (
            <>
              {/* Desktop table — hidden on small screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-teal-50/60 to-cyan-50/30 border-b border-gray-100">
                      {['Brand', 'Campaign', 'Category', 'Date', 'Status', 'Amount'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dealHistory.map((deal, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors duration-100">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0 ${
                              ['bg-gradient-to-br from-violet-500 to-purple-600','bg-gradient-to-br from-teal-500 to-cyan-600','bg-gradient-to-br from-amber-500 to-orange-500','bg-gradient-to-br from-indigo-500 to-blue-600','bg-gradient-to-br from-pink-500 to-rose-500'][(deal.brandName?.charCodeAt(0) || 0) % 5]
                            }`}>
                              {deal.brandName?.slice(0, 1).toUpperCase() || '?'}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{deal.brandName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-500 max-w-[200px] truncate">{deal.campaignTitle}</td>
                        <td className="px-4 py-3.5">
                          {(() => {
                            const catColors: Record<string, string> = { beauty: 'bg-pink-100 text-pink-800', fashion: 'bg-rose-100 text-rose-800', food: 'bg-orange-100 text-orange-800', fitness: 'bg-amber-100 text-amber-800', lifestyle: 'bg-purple-100 text-purple-800', travel: 'bg-emerald-100 text-emerald-800', tech: 'bg-blue-100 text-blue-800', books: 'bg-violet-100 text-violet-800' };
                            return (
                              <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-semibold ${catColors[deal.category] || 'bg-teal-100 text-teal-800'}`}>
                                {deal.category}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-400 whitespace-nowrap">{deal.completedAt}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                            deal.status === 'completed'
                              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          }`}>
                            {deal.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-emerald-700 text-right tabular-nums">
                          ₹{deal.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards — shown only on small screens */}
              <div className="md:hidden divide-y divide-gray-100">
                {dealHistory.map((deal, index) => (
                  <div key={index} className="px-4 py-4 hover:bg-gray-50/60 transition-colors duration-100">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{deal.brandName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{deal.campaignTitle}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 tabular-nums flex-shrink-0">
                        ₹{deal.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const catColors: Record<string, string> = { beauty: 'bg-pink-100 text-pink-800', fashion: 'bg-rose-100 text-rose-800', food: 'bg-orange-100 text-orange-800', fitness: 'bg-amber-100 text-amber-800', lifestyle: 'bg-purple-100 text-purple-800', travel: 'bg-emerald-100 text-emerald-800', tech: 'bg-blue-100 text-blue-800', books: 'bg-violet-100 text-violet-800' };
                        return <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-semibold ${catColors[deal.category] || 'bg-teal-100 text-teal-800'}`}>{deal.category}</span>;
                      })()}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                        deal.status === 'completed'
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      }`}>
                        {deal.status}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-auto">{deal.completedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 sm:py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
                <SearchIcon />
              </div>
              <h3 className="font-bold text-gray-800 text-[15px] mb-1.5">No deals yet</h3>
              <p className="text-sm text-gray-400 max-w-[280px] mb-6 leading-relaxed">
                Your earnings history will appear here once you complete your first deal with a brand.
              </p>
              <Link
                href="/influencer/campaigns"
                className="bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4A7A7F] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer">
                Browse campaigns →
              </Link>
            </div>
          )}
        </section>

        <p className="text-xs text-gray-400 text-center mt-6 pb-2">
          Audience analytics — follower demographics, engagement deep-dives, age & gender splits — coming in Phase 2.
        </p>

      </main>
    </div>
  );
}
