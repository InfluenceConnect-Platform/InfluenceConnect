'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/influencer/dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: 'Campaigns',
    href: '/influencer/campaigns',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    label: 'Messages',
    href: '/influencer/messages',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Earnings',
    href: '/influencer/earnings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/influencer/profile',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: 'Billing',
    href: '/influencer/billing',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
];

interface InfluencerNavProps {
  user: { name: string; plan?: string } | null;
  profilePicUrl?: string;
}

export default function InfluencerNav({ user: userProp, profilePicUrl }: InfluencerNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOfferCount, setPendingOfferCount] = useState(0);
  const [newCampaignCount, setNewCampaignCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [localUser, setLocalUser] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  useEffect(() => {
    try {
      const s = localStorage.getItem('user');
      if (s) setLocalUser(JSON.parse(s));
    } catch {}
  }, []);

  const user = userProp ?? localUser;
  const isPremium = user?.plan === 'premium';

  const fetchCounts = async () => {
    try {
      const [msgRes, offerRes] = await Promise.all([
        api.get('/api/messages/unread-count'),
        api.get('/api/deals/pending-offer-count'),
      ]);
      setUnreadCount(msgRes.data.count ?? 0);
      setPendingOfferCount(offerRes.data.count ?? 0);
    } catch {}
  };

  const fetchNewCampaigns = async () => {
    try {
      const since = localStorage.getItem('lastSeenCampaignsAt') ?? '0';
      const res = await api.get(`/api/campaigns/new-since?since=${since}`);
      setNewCampaignCount(res.data.count ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetchCounts();
    fetchNewCampaigns();
    pollRef.current = setInterval(() => {
      fetchCounts();
      fetchNewCampaigns();
    }, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (pathname === '/influencer/messages') {
      setUnreadCount(0);
      setPendingOfferCount(0);
    }
    if (pathname === '/influencer/campaigns') {
      localStorage.setItem('lastSeenCampaignsAt', Date.now().toString());
      setNewCampaignCount(0);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[64px] sticky top-0 z-30 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">

        {/* Left — logo + nav links */}
        <div className="flex items-center gap-6 lg:gap-8 min-w-0">
          <Link href="/influencer/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#3d7178] flex items-center justify-center text-white font-black text-[13px] shadow-md group-hover:shadow-[#7FA8AD]/40 transition-shadow duration-200">
              IC
            </div>
            <span className="font-extrabold text-gray-900 text-[15px] tracking-tight hidden sm:block">
              Influence<span className="text-[#5D8A8F]">Connect</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map(item => {
              const isMessages  = item.href === '/influencer/messages';
              const isCampaigns = item.href === '/influencer/campaigns';
              const isActive    = pathname === item.href;
              const hasDot      = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && newCampaignCount > 0);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF4F5] text-[#2A3E42]'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`transition-colors duration-150 ${isActive ? 'text-[#5D8A8F]' : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#5D8A8F]" />
                  )}
                  {hasDot && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_1.5px_white]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right — plan badge, logout, avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {isPremium ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-white shadow-sm shadow-amber-200">
              ★ Premium
            </span>
          ) : (
            <span className="hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
              Freemium
            </span>
          )}

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1 text-[12px] text-gray-500 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150 cursor-pointer font-semibold"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>

          <Link
            href="/influencer/profile"
            title={user?.name ?? 'Profile'}
            className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-[#7FA8AD] shadow-sm transition-all duration-150 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#FDE5DC] to-[#f5c4b0] cursor-pointer"
          >
            {profilePicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#9C4A33] font-bold text-sm">{user?.name?.charAt(0).toUpperCase() ?? '?'}</span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle navigation"
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all cursor-pointer"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-[64px] bg-black/20 z-20" onClick={() => setMobileOpen(false)} />
          <div className="lg:hidden fixed top-[64px] left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-xl">
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(item => {
                const isMessages  = item.href === '/influencer/messages';
                const isCampaigns = item.href === '/influencer/campaigns';
                const isActive    = pathname === item.href;
                const hasDot      = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && newCampaignCount > 0);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={isActive ? 'text-[#5D8A8F]' : 'text-gray-400'}>{item.icon}</span>
                      {item.label}
                    </span>
                    {hasDot && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                  </Link>
                );
              })}
              <div className="my-1 h-px bg-gray-100" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 text-left cursor-pointer transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile tab bar */}
      <div className="lg:hidden sticky top-[64px] z-10 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden px-3 gap-0.5 py-2">
          {NAV_ITEMS.map(item => {
            const isMessages  = item.href === '/influencer/messages';
            const isCampaigns = item.href === '/influencer/campaigns';
            const isActive    = pathname === item.href;
            const hasDot      = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && newCampaignCount > 0);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 cursor-pointer ${
                  isActive ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <span className={isActive ? 'text-[#5D8A8F]' : ''}>{item.icon}</span>
                {item.label}
                {hasDot && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_1.5px_white]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
