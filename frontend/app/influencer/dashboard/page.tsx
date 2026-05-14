'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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
}

const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const TrendingUpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const GridIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const CurrencyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const MessageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const SparkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const formatFollowers = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/influencer/dashboard', active: true },
  { label: 'Campaigns', href: '/influencer/campaigns' },
  { label: 'Messages', href: '/influencer/messages' },
  { label: 'Earnings', href: '/influencer/earnings' },
  { label: 'Profile', href: '/influencer/profile' },
  { label: 'Billing', href: '/influencer/billing' },
];

export default function InfluencerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [primaryPlatform, setPrimaryPlatform] = useState<Platform | null>(null);
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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const isPremium = user?.plan === 'premium';
  const visiblePortfolio = profile?.portfolioItems?.slice(0, isPremium ? undefined : 3) ?? [];

  const completionFlags = [
    !!profile?.bio,
    (profile?.platforms?.length ?? 0) > 0,
    (profile?.portfolioItems?.length ?? 0) > 0,
    !!profile?.city,
    (profile?.niche?.length ?? 0) > 0,
  ];
  const completionPct = Math.round((completionFlags.filter(Boolean).length / completionFlags.length) * 100);
  const CIRCUMFERENCE = 2 * Math.PI * 18;

  return (
    <div className="min-h-screen bg-[#F7F9FA]">

      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px] sticky top-0 z-20 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              IC
            </div>
            <span className="font-bold text-gray-900 text-[15px] tracking-tight hidden sm:block">Influence Connect</span>
          </div>
          {/* Desktop nav links — hidden below lg */}
          <div className="hidden lg:flex gap-0.5">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  item.active ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {/* Right: plan badge + logout + avatar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPremium ? 'bg-amber-100 text-amber-700' : 'bg-[#EEF4F5] text-[#2A3E42]'
          }`}>
            {isPremium ? '★ Premium' : 'Freemium'}
          </span>
          <button onClick={handleLogout}
            className="hidden sm:block text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all duration-150 cursor-pointer">
            Log out
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FDE5DC] to-[#f5c4b0] text-[#9C4A33] flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm cursor-pointer"
            onClick={handleLogout} title="Tap to log out">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* Mobile tab bar — sticky below main nav, hidden on lg+ */}
      <div className="lg:hidden sticky top-[60px] z-10 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden px-3 gap-0.5 py-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                item.active ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#EEF4F5] via-[#f0ecf5] to-[#FDE5DC] border border-[rgba(127,168,173,0.2)] rounded-2xl px-5 sm:px-7 py-5 sm:py-6 mb-5 md:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            {/* Left: avatar + info */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5 uppercase tracking-wider">Welcome back</p>
                <h1 className="text-xl sm:text-2xl font-bold text-[#2A3E42] tracking-tight leading-none truncate">
                  {user?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#F0ECFA] text-[#3C3489] px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B4A8E8]" />
                    {profile?.level || 'Starter'}
                  </span>
                  {profile?.city && (
                    <span className="text-xs text-gray-500 bg-white/60 px-2.5 py-1 rounded-full border border-white/80 hidden sm:inline">
                      {profile.city}
                    </span>
                  )}
                  {(profile?.niche?.length ?? 0) > 0 && (
                    <span className="text-xs text-gray-500 bg-white/60 px-2.5 py-1 rounded-full border border-white/80 capitalize hidden sm:inline">
                      {profile!.niche.slice(0, 2).join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile strength ring — hidden on very small, shown from sm */}
            <div className="hidden sm:flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 border border-white/80 shadow-sm flex-shrink-0">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
                  <circle cx="24" cy="24" r="18" fill="none" stroke="#7FA8AD" strokeWidth="3.5"
                    strokeDasharray={`${(completionPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-[#2A3E42]">{completionPct}%</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Profile strength</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {completionFlags.filter(Boolean).length}/{completionFlags.length} steps done
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stat cards — 2-col on mobile, 4-col on md+ */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
          {[
            {
              label: 'Credibility score',
              value: profile?.credibilityScore ?? 0,
              sub: 'Out of 100',
              Icon: ShieldIcon,
              iconClass: 'bg-[#EEF4F5] text-[#7FA8AD]',
              accentClass: 'border-l-[#7FA8AD]',
            },
            {
              label: 'Engagement rate',
              value: primaryPlatform ? `${primaryPlatform.engagementRate}%` : '—',
              sub: primaryPlatform ? primaryPlatform.name : 'No platform',
              Icon: TrendingUpIcon,
              iconClass: 'bg-[#F0ECFA] text-[#3C3489]',
              accentClass: 'border-l-[#B4A8E8]',
            },
            {
              label: 'Portfolio items',
              value: profile?.portfolioItems?.length ?? 0,
              sub: `${visiblePortfolio.length} visible`,
              Icon: GridIcon,
              iconClass: 'bg-[#FDF3DD] text-amber-600',
              accentClass: 'border-l-amber-400',
            },
            {
              label: 'Deals done',
              value: profile?.dealsCompleted ?? 0,
              sub: 'All time',
              Icon: CheckCircleIcon,
              iconClass: 'bg-green-50 text-green-600',
              accentClass: 'border-l-green-400',
            },
          ].map((stat) => (
            <div key={stat.label}
              className={`bg-white border border-gray-200 border-l-4 ${stat.accentClass} rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-tight pr-1">{stat.label}</p>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconClass}`}>
                  <stat.Icon />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-none mb-1.5 tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs text-gray-400 capitalize font-medium truncate">{stat.sub}</p>
            </div>
          ))}
        </section>

        {/* Profile completion prompt */}
        {completionPct < 100 && (
          <section className="bg-white border border-[#7FA8AD]/30 rounded-xl p-4 sm:p-5 mb-5 md:mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center flex-shrink-0">
                  <SparkIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px] mb-0.5">
                    {completionPct < 40 ? 'Build your profile to get discovered' : completionPct < 80 ? 'Almost there — finish your profile' : 'One last step to complete your profile'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2.5">
                    {completionFlags.filter(Boolean).length} of {completionFlags.length} sections complete.
                  </p>
                  <div className="flex items-center gap-2.5 max-w-xs">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-[#5D8A8F]">{completionPct}%</span>
                  </div>
                </div>
              </div>
              <Link href="/influencer/profile?edit=true"
                className="bg-[#7FA8AD] hover:bg-[#5D8A8F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer text-center sm:whitespace-nowrap flex-shrink-0">
                Complete profile →
              </Link>
            </div>
          </section>
        )}

        {/* Main grid — single col on mobile, 2-col on lg+ */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">

          {/* Platform stats */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Platform stats</h3>
                <p className="text-xs text-gray-400 mt-0.5">{profile?.platforms?.length ?? 0} platform{(profile?.platforms?.length ?? 0) !== 1 ? 's' : ''} connected</p>
              </div>
              <Link href="/influencer/profile?edit=true"
                className="flex items-center gap-1.5 text-xs text-[#5D8A8F] font-semibold hover:text-[#2A3E42] transition-colors cursor-pointer">
                <PencilIcon />
                Edit
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              {(profile?.platforms?.length ?? 0) > 0 ? (
                <div className="flex flex-col gap-3">
                  {profile!.platforms.map((platform) => (
                    <div key={platform.name}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#7FA8AD]/30 hover:bg-[#EEF4F5]/40 transition-all duration-150 group">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[11px] font-bold text-[#2A3E42] uppercase shadow-sm flex-shrink-0">
                        {platform.name.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold capitalize text-gray-900">{platform.name}</p>
                          <span className="text-sm font-bold text-[#5D8A8F] tabular-nums">{platform.engagementRate}%</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-400">{formatFollowers(platform.followers)} followers</p>
                          <p className="text-xs text-gray-400 hidden sm:block">engagement</p>
                        </div>
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] rounded-full"
                            style={{ width: `${Math.min((platform.engagementRate / 10) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 sm:py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF4F5] text-[#7FA8AD] flex items-center justify-center mx-auto mb-3">
                    <TrendingUpIcon />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No platforms connected</p>
                  <p className="text-xs text-gray-400 mb-4 max-w-[240px] mx-auto">Add your social stats so brands can see your reach</p>
                  <Link href="/influencer/profile?edit=true"
                    className="inline-flex items-center gap-1.5 text-sm text-[#5D8A8F] font-semibold hover:text-[#2A3E42] transition-colors cursor-pointer">
                    Add Instagram, YouTube or Facebook →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Quick actions */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Quick actions</h3>
              </div>
              <div className="p-2">
                {[
                  { label: 'Browse campaigns', href: '/influencer/campaigns', desc: 'Find brand opportunities', Icon: SearchIcon },
                  { label: 'Edit profile', href: '/influencer/profile?edit=true', desc: 'Update bio and stats', Icon: PencilIcon },
                  { label: 'View earnings', href: '/influencer/earnings', desc: 'Track your revenue', Icon: CurrencyIcon },
                  { label: 'Messages', href: '/influencer/messages', desc: 'Chat with brands', Icon: MessageIcon },
                ].map((action) => (
                  <Link key={action.href} href={action.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#EEF4F5] transition-all duration-150 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-white group-hover:text-[#7FA8AD] text-gray-400 flex items-center justify-center flex-shrink-0 transition-all duration-150 border border-transparent group-hover:border-gray-200">
                      <action.Icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900">{action.label}</p>
                      <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                    <span className="text-gray-300 group-hover:text-[#7FA8AD] transition-colors duration-150 flex-shrink-0">
                      <ChevronRightIcon />
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upgrade card */}
            {!isPremium && (
              <div className="bg-gradient-to-br from-[#EEF4F5] via-white to-[#FDF3DD] border border-[#7FA8AD]/25 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7FA8AD] text-white flex items-center justify-center flex-shrink-0">
                    <SparkIcon />
                  </div>
                  <h4 className="font-bold text-[#2A3E42] text-sm">Upgrade to Premium</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Get discovered faster and unlock full access to every feature.
                </p>
                <ul className="flex flex-col gap-2 mb-4">
                  {[
                    'All portfolio items visible to brands',
                    'Unlimited campaign applications',
                    'Priority placement in search',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-[#7FA8AD]/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#5D8A8F]">
                        <CheckIcon />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/influencer/billing"
                  className="block text-center bg-[#7FA8AD] hover:bg-[#5D8A8F] text-white py-2.5 rounded-xl text-xs font-bold transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer">
                  ₹299/month — Upgrade now
                </Link>
              </div>
            )}

          </div>
        </section>

      </main>
    </div>
  );
}
