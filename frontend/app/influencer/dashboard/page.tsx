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
  profilePicUrl?: string;
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const confirmLogout = () => setShowLogoutModal(true);

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
          <button onClick={confirmLogout}
            className="text-xs text-red-500 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer font-medium">
            Log out
          </button>
          <Link href="/influencer/profile" title="View profile"
            className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm cursor-pointer hover:ring-[#7FA8AD] transition-all duration-150 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#FDE5DC] to-[#f5c4b0]">
            {profile?.profilePicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#9C4A33] font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </Link>
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
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1C4A52] via-[#27717E] to-[#5BA8B5] rounded-2xl px-5 sm:px-7 py-5 sm:py-6 mb-5 md:mb-6 shadow-lg">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 relative">
            {/* Left: avatar + info */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-white/30 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                {profile?.profilePicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg sm:text-xl">{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-teal-200 font-medium mb-0.5 uppercase tracking-wider">Welcome back</p>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none truncate">
                  {user?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 text-white px-2.5 py-1 rounded-full text-xs font-semibold capitalize border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                    {profile?.level || 'Starter'}
                  </span>
                  {profile?.city && (
                    <span className="text-xs text-teal-100 bg-white/10 px-2.5 py-1 rounded-full border border-white/20 hidden sm:inline">
                      {profile.city}
                    </span>
                  )}
                  {(profile?.niche?.length ?? 0) > 0 && (
                    <span className="text-xs text-teal-100 bg-white/10 px-2.5 py-1 rounded-full border border-white/20 capitalize hidden sm:inline">
                      {profile!.niche.slice(0, 2).join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile strength ring — hidden on very small, shown from sm */}
            <div className="hidden sm:flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 border border-white/20 shadow-sm flex-shrink-0">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5" />
                  <circle cx="24" cy="24" r="18" fill="none" stroke="white" strokeWidth="3.5"
                    strokeDasharray={`${(completionPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white">{completionPct}%</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Profile strength</p>
                <p className="text-xs text-teal-200 mt-0.5">

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
              iconClass: 'bg-gradient-to-br from-[#7FA8AD] to-[#4A8D95] text-white shadow-sm',
              cardClass: 'bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200',
              valueClass: 'text-[#1C4A52]',
              subClass: 'text-teal-600',
            },
            {
              label: 'Engagement rate',
              value: primaryPlatform ? `${primaryPlatform.engagementRate}%` : '—',
              sub: primaryPlatform ? primaryPlatform.name : 'No platform',
              Icon: TrendingUpIcon,
              iconClass: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm',
              cardClass: 'bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200',
              valueClass: 'text-violet-900',
              subClass: 'text-violet-500',
            },
            {
              label: 'Portfolio items',
              value: profile?.portfolioItems?.length ?? 0,
              sub: `${visiblePortfolio.length} visible`,
              Icon: GridIcon,
              iconClass: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm',
              cardClass: 'bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200',
              valueClass: 'text-amber-900',
              subClass: 'text-amber-600',
            },
            {
              label: 'Deals done',
              value: profile?.dealsCompleted ?? 0,
              sub: 'All time',
              Icon: CheckCircleIcon,
              iconClass: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm',
              cardClass: 'bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200',
              valueClass: 'text-emerald-900',
              subClass: 'text-emerald-600',
            },
          ].map((stat) => (
            <div key={stat.label}
              className={`rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 ${stat.cardClass}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-tight pr-1">{stat.label}</p>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconClass}`}>
                  <stat.Icon />
                </div>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold tracking-tight leading-none mb-1.5 tabular-nums ${stat.valueClass}`}>
                {stat.value}
              </p>
              <p className={`text-xs capitalize font-medium truncate ${stat.subClass}`}>{stat.sub}</p>
            </div>
          ))}
        </section>

        {/* Profile completion prompt */}
        {completionPct < 100 && (
          <section className="bg-gradient-to-br from-teal-50 via-cyan-50 to-white border border-teal-200 rounded-xl p-4 sm:p-5 mb-5 md:mb-6 shadow-sm">
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
                          <p className="text-sm font-semibold capitalize text-gray-900">{platform.name}</p>
                          <span className={`text-sm font-bold tabular-nums ${
                            platform.name.toLowerCase() === 'instagram' ? 'text-pink-600' :
                            platform.name.toLowerCase() === 'youtube' ? 'text-red-600' :
                            platform.name.toLowerCase() === 'tiktok' ? 'text-cyan-600' :
                            platform.name.toLowerCase() === 'twitter' || platform.name.toLowerCase() === 'x' ? 'text-gray-800' :
                            platform.name.toLowerCase() === 'linkedin' ? 'text-sky-700' :
                            'text-blue-600'
                          }`}>{platform.engagementRate}%</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-400">{formatFollowers(platform.followers)} followers</p>
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
                  { label: 'Browse campaigns', href: '/influencer/campaigns', desc: 'Find brand opportunities', Icon: SearchIcon, iconClass: 'bg-gradient-to-br from-indigo-500 to-blue-600' },
                  { label: 'Edit profile', href: '/influencer/profile?edit=true', desc: 'Update bio and stats', Icon: PencilIcon, iconClass: 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F]' },
                  { label: 'View earnings', href: '/influencer/earnings', desc: 'Track your revenue', Icon: CurrencyIcon, iconClass: 'bg-gradient-to-br from-amber-500 to-orange-500' },
                  { label: 'Messages', href: '/influencer/messages', desc: 'Chat with brands', Icon: MessageIcon, iconClass: 'bg-gradient-to-br from-emerald-500 to-green-600' },
                ].map((action) => (
                  <Link key={action.href} href={action.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-150 group cursor-pointer">
                    <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center flex-shrink-0 shadow-sm ${action.iconClass}`}>
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

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />
          {/* Modal card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center animate-[fadeInScale_0.18s_ease-out]">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h2 className="text-[17px] font-bold text-gray-900 mb-1">Log out?</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              You&apos;ll need to sign in again to access your dashboard.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-150 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer">
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
