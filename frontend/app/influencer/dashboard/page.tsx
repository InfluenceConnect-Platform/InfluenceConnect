'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import InfluencerNav from '@/components/shared/InfluencerNav';
import IdChip from '@/components/shared/IdChip';
import EngagementTrendChart from '@/components/charts/EngagementTrendChart';
import MonthlyReachChart from '@/components/charts/MonthlyReachChart';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
}

interface Platform {
  name: string;
  followers: number;
  engagementRate: number;
}

// One real recorded data point from /api/influencer/stats-history.
interface StatsSnapshot {
  day: string;
  totalFollowers: number;
  totalEngagement: number;
  avgEngagementRate: number;
}

interface Profile {
  slug: string;
  bio: string;
  niche: string[];
  city: string;
  priceRangeMin: number;
  priceRangeMax: number;
  credibilityScore: number;
  level: string;
  dealsCompleted: number;
  portfolioItems: any[];
  platforms: Platform[];
  profilePicUrl?: string;
  userId?: { customId?: string; name?: string };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);
const YoutubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const TiktokIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l-.01-8.42a8.18 8.18 0 0 0 4.78 1.52V5.0a4.85 4.85 0 0 1-1-.31z"/>
  </svg>
);
const TwitterXIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const LinkedinIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const getPlatformIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n === 'instagram') return <InstagramIcon />;
  if (n === 'youtube') return <YoutubeIcon />;
  if (n === 'facebook') return <FacebookIcon />;
  if (n === 'tiktok') return <TiktokIcon />;
  if (n === 'twitter' || n === 'x') return <TwitterXIcon />;
  if (n === 'linkedin') return <LinkedinIcon />;
  return <span className="text-[11px] font-bold uppercase">{name.slice(0, 2)}</span>;
};

const formatFollowers = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export default function InfluencerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [primaryPlatform, setPrimaryPlatform] = useState<Platform | null>(null);
  const [statsHistory, setStatsHistory] = useState<StatsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !stored) { router.push('/auth/login'); return; }
    const parsedUser = JSON.parse(stored);
    if (parsedUser.role !== 'influencer') { router.push('/auth/login'); return; }
    setUser(parsedUser);
    fetchProfile();
  }, []);

  useLiveData(() => { fetchProfile(); });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/influencer/profile/me');
      setProfile(response.data.profile);
      setPrimaryPlatform(response.data.primaryPlatform);
    } catch (error: any) {
      if (error.response?.status === 404) {
        await api.post('/api/influencer/profile');
        const response = await api.get('/api/influencer/profile/me');
        setProfile(response.data.profile);
      }
    } finally {
      setLoading(false);
    }
    // Real recorded stat history for the trend charts. Non-blocking and
    // best-effort — the dashboard still renders if this fails.
    try {
      const res = await api.get('/api/influencer/stats-history');
      setStatsHistory(res.data.snapshots ?? []);
    } catch {
      setStatsHistory([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const isPremium = user?.plan === 'premium';

  const completionFlags = [
    !!profile?.bio,
    (profile?.platforms?.length ?? 0) > 0,
    (profile?.portfolioItems?.length ?? 0) > 0,
    !!profile?.city,
    (profile?.niche?.length ?? 0) > 0,
  ];
  const completionPct = Math.round((completionFlags.filter(Boolean).length / completionFlags.length) * 100);
  const CIRCUMFERENCE = 2 * Math.PI * 18;

  const totalFollowers = (profile?.platforms ?? []).reduce((sum, p) => sum + p.followers, 0);

  const STATS = [
    {
      label: 'Credibility Score',
      value: profile?.credibilityScore ?? 0,
      sub: 'Out of 100',
      from: 'from-[#7FA8AD]', to: 'to-[#4A8D95]',
      bgFrom: 'from-teal-50', bgTo: 'to-cyan-100',
      border: 'border-teal-200/70',
      valCls: 'text-[#1C4A52]', subCls: 'text-teal-600',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
    },
    {
      label: 'Engagement Rate',
      value: primaryPlatform ? `${primaryPlatform.engagementRate}%` : '—',
      sub: primaryPlatform ? primaryPlatform.name : 'No platform',
      from: 'from-violet-500', to: 'to-purple-600',
      bgFrom: 'from-violet-50', bgTo: 'to-purple-100',
      border: 'border-violet-200/70',
      valCls: 'text-violet-900', subCls: 'text-violet-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
    },
    {
      label: 'Portfolio Items',
      value: profile?.portfolioItems?.length ?? 0,
      sub: isPremium ? 'All visible' : `${Math.min(profile?.portfolioItems?.length ?? 0, 3)} visible`,
      from: 'from-amber-500', to: 'to-orange-500',
      bgFrom: 'from-amber-50', bgTo: 'to-orange-100',
      border: 'border-amber-200/70',
      valCls: 'text-amber-900', subCls: 'text-amber-600',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      label: 'Deals Done',
      value: profile?.dealsCompleted ?? 0,
      sub: 'All time',
      from: 'from-emerald-500', to: 'to-green-600',
      bgFrom: 'from-emerald-50', bgTo: 'to-green-100',
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
    <div className="min-h-screen bg-[#F7F9FA]">
      <InfluencerNav user={user} profilePicUrl={profile?.profilePicUrl} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Hero ── */}
        <section className="relative bg-gradient-to-br from-[#0d2d33] via-[#1C4A52] to-[#2d7a88] rounded-2xl px-6 sm:px-10 py-7 sm:py-9 mb-6 overflow-hidden shadow-lg">
          {/* decorative blobs */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          {/* dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="inf-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#inf-dots)"/>
          </svg>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-teal-300/80 text-xs font-semibold uppercase tracking-widest mb-2">
                {getGreeting()}, {user?.name?.split(' ')[0]} 👋
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2.5">
                Your Creator Hub
              </h1>
              {profile?.userId?.customId && (
                <div className="mb-3">
                  <IdChip id={profile.userId.customId} tone="dark" />
                </div>
              )}
              {/* inline stat chips */}
              <div className="flex flex-wrap items-center gap-2">
                {totalFollowers > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <svg className="w-3 h-3 text-teal-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    {formatFollowers(totalFollowers)} followers
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {profile?.dealsCompleted ?? 0} deal{(profile?.dealsCompleted ?? 0) !== 1 ? 's' : ''} done
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm capitalize">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                  {profile?.level || 'Starter'}
                </span>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-amber-400/20 to-yellow-400/20 border border-amber-400/30 text-amber-300 px-3 py-1.5 rounded-full">
                    ★ Premium
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
              {/* Profile strength ring */}
              <div className="hidden sm:flex items-center gap-3 bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 mb-1">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5"/>
                    <circle cx="24" cy="24" r="18" fill="none" stroke="white" strokeWidth="3.5"
                      strokeDasharray={`${(completionPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-white">{completionPct}%</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Profile strength</p>
                  <p className="text-xs text-teal-300 mt-0.5">{completionFlags.filter(Boolean).length}/{completionFlags.length} steps done</p>
                </div>
              </div>
              <Link
                href="/influencer/campaigns"
                className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-[#0d2d33] px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm self-start sm:self-auto"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                Browse campaigns
              </Link>
              <Link
                href="/influencer/profile"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all self-start sm:self-auto"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                View profile
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`relative overflow-hidden border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all bg-gradient-to-br ${stat.bgFrom} ${stat.bgTo} ${stat.border}`}
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 leading-tight pr-2">{stat.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.from} ${stat.to} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {stat.icon}
                </div>
              </div>
              <p className={`text-3xl sm:text-4xl font-black leading-none mb-2 tabular-nums ${stat.valCls}`}>
                {stat.value}
              </p>
              <p className={`text-[11px] font-semibold capitalize ${stat.subCls}`}>
                {stat.sub}
              </p>
              {/* decorative circle */}
              <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${stat.from} ${stat.to} opacity-10 pointer-events-none`} />
            </div>
          ))}
        </section>

        {/* ── Analytics charts ── */}
        <section className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 sm:gap-5 mb-6">
          <EngagementTrendChart
            history={statsHistory}
            totalFollowers={totalFollowers}
          />
          <MonthlyReachChart
            history={statsHistory}
          />
        </section>

        {/* ── Profile completion prompt ── */}
        {completionPct < 100 && (
          <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-br from-teal-50 via-cyan-50 to-white dark:from-[#0d2d33] dark:via-[#0a2428] dark:to-[#0f1e31] border border-teal-200/80 dark:border-[#7FA8AD]/30 rounded-2xl px-5 py-4 mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#EEF4F5] dark:bg-[#7FA8AD]/20 text-[#7FA8AD] dark:text-[#9DC4C9] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm mb-0.5">
                  {completionPct < 40 ? 'Build your profile to get discovered' : completionPct < 80 ? 'Almost there — finish your profile' : 'One last step to complete your profile'}
                </h3>
                <div className="flex items-center gap-2.5 max-w-[240px]">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[#5D8A8F] dark:text-[#9DC4C9] flex-shrink-0">{completionPct}%</span>
                </div>
              </div>
            </div>
            <Link
              href="/influencer/profile?edit=true"
              className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#7FA8AD] hover:bg-[#5D8A8F] dark:bg-[#5D8A8F] dark:hover:bg-[#7FA8AD] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
            >
              Complete profile →
            </Link>
          </section>
        )}

        {/* ── Main grid ── */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

          {/* Platform stats */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Platform Stats</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {profile?.platforms?.length ?? 0} platform{(profile?.platforms?.length ?? 0) !== 1 ? 's' : ''} connected
                </p>
              </div>
              <Link
                href="/influencer/profile?edit=true"
                className="flex items-center gap-1.5 text-xs text-[#5D8A8F] font-bold hover:text-[#2A3E42] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              {(profile?.platforms?.length ?? 0) > 0 ? (
                <div className="flex flex-col gap-3">
                  {profile!.platforms.map((platform) => (
                    <div key={platform.name}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-all duration-150">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
                        platform.name.toLowerCase() === 'instagram' ? 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' :
                        platform.name.toLowerCase() === 'youtube' ? 'bg-gradient-to-br from-[#FF0000] to-[#CC0000]' :
                        platform.name.toLowerCase() === 'facebook' ? 'bg-gradient-to-br from-[#1877F2] to-[#0a5ed1]' :
                        platform.name.toLowerCase() === 'tiktok' ? 'bg-gradient-to-br from-[#010101] to-[#69C9D0]' :
                        platform.name.toLowerCase() === 'twitter' || platform.name.toLowerCase() === 'x' ? 'bg-black' :
                        platform.name.toLowerCase() === 'linkedin' ? 'bg-gradient-to-br from-[#0077B5] to-[#005885]' :
                        'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F]'
                      }`}>
                        {getPlatformIcon(platform.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold capitalize text-gray-900">{platform.name}</p>
                          <span className={`text-sm font-black tabular-nums ${
                            platform.name.toLowerCase() === 'instagram' ? 'text-pink-600' :
                            platform.name.toLowerCase() === 'youtube' ? 'text-red-600' :
                            platform.name.toLowerCase() === 'tiktok' ? 'text-cyan-600' :
                            platform.name.toLowerCase() === 'twitter' || platform.name.toLowerCase() === 'x' ? 'text-gray-800' :
                            platform.name.toLowerCase() === 'linkedin' ? 'text-sky-700' :
                            'text-blue-600'
                          }`}>{platform.engagementRate}%</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-400 font-medium">{formatFollowers(platform.followers)} followers</p>
                          <p className="text-xs text-gray-400 hidden sm:block">engagement</p>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${
                            platform.name.toLowerCase() === 'instagram' ? 'from-[#ee2a7b] to-[#6228d7]' :
                            platform.name.toLowerCase() === 'youtube' ? 'from-[#FF0000] to-[#FF6B6B]' :
                            platform.name.toLowerCase() === 'tiktok' ? 'from-[#010101] to-[#69C9D0]' :
                            platform.name.toLowerCase() === 'twitter' || platform.name.toLowerCase() === 'x' ? 'from-gray-700 to-gray-400' :
                            platform.name.toLowerCase() === 'linkedin' ? 'from-[#0077B5] to-[#42A5F5]' :
                            'from-[#1877F2] to-[#42A5F5]'
                          }`} style={{ width: `${Math.min((platform.engagementRate / 10) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-14 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1">No platforms connected</p>
                  <p className="text-xs text-gray-400 mb-5 max-w-[240px] mx-auto leading-relaxed">
                    Add your social stats so brands can see your reach
                  </p>
                  <Link
                    href="/influencer/profile?edit=true"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#7FA8AD] hover:bg-[#5D8A8F] px-4 py-2 rounded-xl transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Instagram, YouTube or more
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-4">

            {/* Quick actions — 2×2 grid */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    label: 'Campaigns',
                    href: '/influencer/campaigns',
                    grad: 'from-[#1C4A52] to-[#0d2d33]',
                    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
                  },
                  {
                    label: 'Edit Profile',
                    href: '/influencer/profile?edit=true',
                    grad: 'from-[#7FA8AD] to-[#5D8A8F]',
                    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
                  },
                  {
                    label: 'Earnings',
                    href: '/influencer/earnings',
                    grad: 'from-amber-500 to-orange-500',
                    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                  },
                  {
                    label: 'Messages',
                    href: '/influencer/messages',
                    grad: 'from-emerald-500 to-green-600',
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

            {/* Upgrade / Premium card */}
            {!isPremium ? (
              <div className="relative bg-gradient-to-br from-[#0d2d33] via-[#1C4A52] to-[#2d7a88] rounded-2xl p-5 overflow-hidden shadow-md">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Upgrade to Premium
                  </div>
                  <h4 className="font-extrabold text-white text-[15px] mb-1">Unlock every feature</h4>
                  <p className="text-teal-200/70 text-xs mb-4 leading-relaxed">Show all your work and remove every limit.</p>
                  <ul className="space-y-2 mb-5">
                    {['All portfolio items visible to brands', 'Unlimited campaign applications', 'Unlimited daily messages'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-teal-100/90">
                        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/influencer/billing"
                    className="block text-center bg-white/95 hover:bg-white text-[#0d2d33] py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                  >
                    ₹299 / month — Upgrade now →
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
                <Link href="/influencer/billing" className="block text-center text-xs font-bold text-amber-700 border border-amber-200 rounded-xl py-2 hover:bg-amber-100 transition-all">
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
