'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import InfluencerNav from '@/components/shared/InfluencerNav';
import { NICHE_STYLES, NICHE_LABELS } from '@/lib/niches';

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
  brandLogoUrl?: string;
  campaignTitle: string;
  category: string;
  completedAt: string;
  status: string;
  amount: number;
}

// Turn a raw ISO timestamp into a clear, readable date, e.g. "15 Jun 2026".
const fmtDealDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Human-friendly category label; campaigns without a niche show "General".
const fmtCategory = (cat?: string) => {
  if (!cat) return 'General';
  return NICHE_LABELS[cat] ?? (cat.charAt(0).toUpperCase() + cat.slice(1));
};

// Map raw deal status enums to clear words shown to the influencer.
const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  'content-submitted': 'Awaiting payment',
  'in-progress': 'In progress',
  cancelled: 'Cancelled',
};
const fmtStatus = (status?: string) => STATUS_LABELS[status ?? ''] || 'Completed';

const CAT_COLORS = NICHE_STYLES;

const BRAND_GRADS = [
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-pink-500 to-rose-500',
];

export default function EarningsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [dealHistory, setDealHistory] = useState<DealHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'6months' | '1year'>('6months');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    if (JSON.parse(stored).role !== 'influencer') { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    api.get('/api/influencer/profile/me').then(r => setProfilePicUrl(r.data?.profile?.profilePicUrl || '')).catch(() => {});
    fetchEarnings();
  }, []);

  useLiveData(() => { fetchEarnings(); });

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

  const exportToCSV = () => {
    if (!dealHistory.length) return;

    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

    const summaryRows = [
      ['Summary'],
      ['Total Earnings (₹)', summary?.totalEarnings ?? 0],
      ['Deals Completed',    summary?.dealsCompleted ?? 0],
      ['Active Deals',       summary?.activeDeals ?? 0],
      ['Pending Payout (₹)', summary?.pendingPayout ?? 0],
      ['Avg Deal Value (₹)', summary?.avgDealValue ?? 0],
      [],
      ['Brand', 'Campaign', 'Category', 'Date', 'Status', 'Amount (₹)'],
    ];

    const dealRows = dealHistory.map(d => [
      escape(d.brandName || ''),
      escape(d.campaignTitle || ''),
      escape(fmtCategory(d.category)),
      escape(fmtDealDate(d.completedAt)),
      escape(fmtStatus(d.status)),
      d.amount,
    ]);

    const csv = [...summaryRows, ...dealRows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `influenceconnect-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2500);
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

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Hero ── */}
        <section className="relative bg-gradient-to-br from-[#0d2d33] via-[#1C4A52] to-[#2d7a88] rounded-2xl px-6 sm:px-10 py-7 sm:py-9 mb-6 overflow-hidden shadow-lg">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="earn-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#earn-dots)"/>
          </svg>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-teal-300/80 text-xs font-semibold uppercase tracking-widest mb-2">
                Revenue &amp; partnerships
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Your Earnings
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3 h-3 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  ₹{(summary?.totalEarnings || 0).toLocaleString()} total
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {summary?.dealsCompleted || 0} deals done
                </span>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-amber-400/20 to-yellow-400/20 border border-amber-400/30 text-amber-300 px-3 py-1.5 rounded-full">
                    ★ Premium
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-auto">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 gap-0.5 border border-white/15">
                {(['6months', '1year'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                      activeTab === tab ? 'bg-white text-[#1C4A52] shadow-sm' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {tab === '6months' ? '6 months' : '1 year'}
                  </button>
                ))}
              </div>
              {isPremium && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 text-xs text-white/90 px-3 py-2 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all cursor-pointer font-semibold"
                >
                  {exported ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="hidden sm:inline text-emerald-300">Exported!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span className="hidden sm:inline">Export CSV</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">

          {/* Total earnings — featured */}
          <div className="col-span-2 md:col-span-1 relative overflow-hidden bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-100/80 leading-tight pr-2">Total Earnings</p>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-2 tabular-nums">
              ₹{(summary?.totalEarnings || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-100/70 font-semibold">All completed deals</p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
          </div>

          {/* Active deals */}
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-red-100 border border-rose-200/70 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 leading-tight pr-2">Active Deals</p>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-rose-900 leading-none mb-2 tabular-nums">
              {summary?.activeDeals || 0}
            </p>
            <p className="text-[11px] text-rose-600/80 font-semibold truncate">
              ₹{(summary?.pendingPayout || 0).toLocaleString()} pending
            </p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-red-600 opacity-10 pointer-events-none" />
          </div>

          {/* Deals done */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200/70 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 leading-tight pr-2">Deals Done</p>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-emerald-900 leading-none mb-2 tabular-nums">
              {summary?.dealsCompleted || 0}
            </p>
            <p className="text-[11px] text-emerald-600/80 font-semibold">All time</p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 opacity-10 pointer-events-none" />
          </div>

          {/* Avg deal value */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200/70 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 leading-tight pr-2">Avg Deal Value</p>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-violet-900 leading-none mb-2 tabular-nums">
              ₹{(summary?.avgDealValue || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-violet-600/80 font-semibold">Per campaign</p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 opacity-10 pointer-events-none" />
          </div>

        </section>

        {/* ── Analytics (Premium) or gate ── */}
        {isPremium ? (
          <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 md:gap-5 mb-6">

            {/* Monthly earnings chart */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-bold text-gray-900">Earnings Overview</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Monthly earnings from completed deals</p>
                </div>
                <span className="self-start text-xs font-bold px-2.5 py-1 bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] text-white rounded-full shadow-sm">
                  ₹{(summary?.totalEarnings || 0).toLocaleString()} total
                </span>
              </div>

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
                                ? 'bg-gradient-to-t from-[#0d2d33] to-[#5BA8B5] shadow-sm'
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
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-0.5">Earnings by Category</h3>
              <p className="text-[11px] text-gray-400 mb-5">Breakdown of your deal categories</p>
              {dealHistory.length > 0 ? (
                <div className="flex flex-col gap-3" />
              ) : (
                <div className="flex flex-col items-center justify-center h-[140px] text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1">No data yet</p>
                  <p className="text-xs text-gray-400 max-w-[180px] leading-relaxed">
                    Category breakdown appears after your first completed deal.
                  </p>
                </div>
              )}
            </div>

          </section>
        ) : (
          /* ── Freemium gate ── */
          <section className="mb-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0d2d33] via-[#1C4A52] to-[#2d7a88] rounded-2xl p-6 shadow-lg">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
              <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
                <defs>
                  <pattern id="gate-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.2" fill="white"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gate-dots)"/>
              </svg>
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-white text-[15px] mb-1">Unlock earnings analytics with Premium</h3>
                    <p className="text-sm text-teal-100/80 leading-relaxed mb-3">
                      See your full monthly trend, earnings by category, and export your data as CSV.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Monthly chart',       color: 'bg-teal-400/20 border-teal-300/30 text-teal-100' },
                        { label: 'Category breakdown',  color: 'bg-violet-400/20 border-violet-300/30 text-violet-100' },
                        { label: 'CSV export',          color: 'bg-emerald-400/20 border-emerald-300/30 text-emerald-100' },
                      ].map(f => (
                        <span key={f.label} className={`inline-flex items-center gap-1 text-xs border px-2.5 py-1 rounded-full font-semibold ${f.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link
                  href="/influencer/billing"
                  className="flex-shrink-0 bg-white hover:bg-teal-50 text-[#1C4A52] px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all shadow-sm hover:shadow-md cursor-pointer text-center whitespace-nowrap self-start sm:self-auto">
                  Upgrade · ₹299/mo →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Deal history ── */}
        <section className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#7FA8AD] to-[#5D8A8F]" />
              <div>
                <h3 className="font-bold text-gray-900">Deal History</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Completed and in-progress deals, newest first</p>
              </div>
            </div>
            <Link href="/influencer/campaigns"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs text-white font-bold bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4A7A7F] px-3.5 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
              Browse campaigns →
            </Link>
          </div>

          {dealHistory.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {['Brand', 'Campaign', 'Category', 'Date', 'Status', 'Amount'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dealHistory.map((deal, index) => {
                      const grad = BRAND_GRADS[(deal.brandName?.charCodeAt(0) || 0) % BRAND_GRADS.length];
                      return (
                        <tr key={index} className="border-b border-gray-50 hover:bg-[#EEF4F5]/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              {deal.brandLogoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={deal.brandLogoUrl} alt={deal.brandName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                              ) : (
                                <div className={`w-8 h-8 rounded-lg text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${grad}`}>
                                  {deal.brandName?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                              <span className="text-sm font-bold text-gray-900">{deal.brandName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500 max-w-[200px] truncate font-medium">{deal.campaignTitle}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${CAT_COLORS[deal.category] || 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                              {fmtCategory(deal.category)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">{fmtDealDate(deal.completedAt)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold ${
                              deal.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${deal.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {fmtStatus(deal.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-black text-emerald-700 text-right tabular-nums">
                            ₹{deal.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {dealHistory.map((deal, index) => {
                  const grad = BRAND_GRADS[(deal.brandName?.charCodeAt(0) || 0) % BRAND_GRADS.length];
                  return (
                    <div key={index} className="px-4 py-4 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {deal.brandLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={deal.brandLogoUrl} alt={deal.brandName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                          ) : (
                            <div className={`w-8 h-8 rounded-lg text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${grad}`}>
                              {deal.brandName?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{deal.brandName}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate font-medium">{deal.campaignTitle}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-emerald-700 tabular-nums flex-shrink-0">
                          ₹{deal.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${CAT_COLORS[deal.category] || 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                          {fmtCategory(deal.category)}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          deal.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${deal.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {fmtStatus(deal.status)}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-auto font-medium">{fmtDealDate(deal.completedAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 text-[15px] mb-1.5">No deals yet</h3>
              <p className="text-sm text-gray-400 max-w-[280px] mb-6 leading-relaxed">
                Your earnings history will appear here once you complete your first deal with a brand.
              </p>
              <Link
                href="/influencer/campaigns"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4A7A7F] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md cursor-pointer">
                Browse campaigns →
              </Link>
            </div>
          )}
        </section>

        {/* <p className="text-xs text-gray-400 text-center mt-6 pb-2">
          Audience analytics — follower demographics, engagement deep-dives, age &amp; gender splits — coming in Phase 2.
        </p> */}

      </main>
    </div>
  );
}
