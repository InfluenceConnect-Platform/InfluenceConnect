'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/lib/useTheme';
import { useConfirm } from '@/components/shared/ConfirmModal';

// Cached across client-side navigations so the profile picture shows instantly
// on re-mount instead of flashing the letter avatar while it re-fetches. It's
// null on the server and the first client render (so it stays hydration-safe); a
// hard reload resets it and the effect below re-seeds it from localStorage.
let cachedInfluencerPicUrl: string | null = null;

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
    label: 'Invitations',
    href: '/influencer/invitations',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
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
  // Optional: pages like settings don't pass it; the nav then reads the user
  // from localStorage itself via the localUser effect.
  user?: { name: string; plan?: string } | null;
  profilePicUrl?: string;
}

export default function InfluencerNav({ user: userProp, profilePicUrl }: InfluencerNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useTheme();
  const confirm = useConfirm();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOfferCount, setPendingOfferCount] = useState(0);
  const [newCampaignCount, setNewCampaignCount] = useState(0);
  const [appUpdateCount, setAppUpdateCount] = useState(0);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const [fetchedPic, setFetchedPic] = useState(cachedInfluencerPicUrl ?? '');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start null so the first client render matches the SSR HTML (the server has
  // no localStorage). The effect below reads localStorage after mount. Reading
  // it in the initializer is what makes the avatar initial / plan badge / title
  // differ between SSR and hydration → the hydration mismatch.
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('user');
      if (s) setLocalUser(JSON.parse(s));
    } catch {}
  }, []);

  // Persist the profile picture across navigations so it doesn't flash the
  // letter avatar. Every influencer page already fetches and passes it as a
  // prop, so rather than re-fetch we just cache whatever prop we receive
  // (module-level for instant re-mounts + localStorage to survive hard reloads).
  useEffect(() => {
    if (profilePicUrl) {
      cachedInfluencerPicUrl = profilePicUrl;
      setFetchedPic(profilePicUrl);
      try { localStorage.setItem('influencerPicUrl', profilePicUrl); } catch {}
    } else if (!cachedInfluencerPicUrl) {
      // No prop yet (page still fetching) — seed once from the last known value.
      try {
        const ls = localStorage.getItem('influencerPicUrl');
        if (ls) { cachedInfluencerPicUrl = ls; setFetchedPic(ls); }
      } catch {}
    }
  }, [profilePicUrl]);

  const user = userProp ?? localUser;
  const isPremium = user?.plan === 'premium';
  // Prefer the freshly-passed prop (e.g. just uploaded on the profile page),
  // otherwise fall back to the cached value from a previous page.
  const avatarUrl = profilePicUrl || fetchedPic;

  const fetchCounts = async () => {
    try {
      const [msgRes, offerRes, inviteRes] = await Promise.all([
        api.get('/api/messages/unread-count'),
        api.get('/api/deals/pending-offer-count'),
        api.get('/api/invitations/influencer/pending-count'),
      ]);
      setUnreadCount(msgRes.data.count ?? 0);
      setPendingOfferCount(offerRes.data.count ?? 0);
      setPendingInviteCount(inviteRes.data.count ?? 0);
    } catch {}
  };

  const fetchNewCampaigns = async () => {
    try {
      const since = localStorage.getItem('lastSeenCampaignsAt') ?? '0';
      const [campRes, appRes] = await Promise.all([
        api.get(`/api/campaigns/new-since?since=${since}`),
        api.get(`/api/campaigns/application-updates-since?since=${since}`),
      ]);
      setNewCampaignCount(campRes.data.count ?? 0);
      setAppUpdateCount(appRes.data.count ?? 0);
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
      setAppUpdateCount(0);
    }
    if (pathname === '/influencer/invitations') {
      setPendingInviteCount(0);
    }
  }, [pathname]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      description: 'You will need to sign in again to access your account.',
      confirmLabel: 'Log out',
      variant: 'warning',
    });
    if (!ok) return;
    localStorage.clear();
    document.cookie = 'ic_role=; path=/; max-age=0; SameSite=Lax';
    router.push('/auth/login');
  };

  // Reusable dark/light class sets
  const dotShadow = isDark ? 'shadow-[0_0_0_1.5px_#0B1725]' : 'shadow-[0_0_0_1.5px_white]';

  const activeItemCls = isDark
    ? 'bg-[#1a2e32] text-slate-200'
    : 'bg-[#EEF4F5] text-[#2A3E42]';

  const inactiveItemCls = isDark
    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50';

  const activeIconCls = isDark ? 'text-[#7FA8AD]' : 'text-[#5D8A8F]';

  return (
    <>
      <nav className={`backdrop-blur-md border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[64px] sticky top-0 z-30 transition-colors duration-200
        ${isDark
          ? 'bg-[#0B1725]/95 border-slate-700/60 shadow-[0_1px_8px_rgba(0,0,0,0.4)]'
          : 'bg-white/95 border-gray-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.06)]'
        }`}>

        {/* Left — logo + nav links */}
        <div className="flex items-center gap-6 lg:gap-8 min-w-0">
          <Link href="/influencer/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#3d7178] flex items-center justify-center text-white font-black text-[13px] shadow-md group-hover:shadow-[#7FA8AD]/40 transition-shadow duration-200">
              IC
            </div>
            <span className={`font-extrabold text-[15px] tracking-tight hidden sm:block ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
              Influence<span className={isDark ? 'text-[#9DC4C9]' : 'text-[#5D8A8F]'}>Connect</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map(item => {
              const isMessages  = item.href === '/influencer/messages';
              const isCampaigns = item.href === '/influencer/campaigns';
              const isInvites   = item.href === '/influencer/invitations';
              const isActive    = pathname === item.href;
              const hasDot      = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && (newCampaignCount > 0 || appUpdateCount > 0)) || (isInvites && pendingInviteCount > 0);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
                    isActive ? activeItemCls : inactiveItemCls
                  }`}
                >
                  <span className={`transition-colors duration-150 ${isActive ? activeIconCls : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#5D8A8F]" />
                  )}
                  {hasDot && (
                    <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ${dotShadow}`} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right — theme toggle, settings, plan badge, logout, avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          <ThemeToggle />

          <Link
            href="/influencer/settings"
            title="Account Settings"
            className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
              pathname === '/influencer/settings'
                ? isDark ? 'bg-[#5D8A8F]/20 text-[#9DC4C9]' : 'bg-[#5D8A8F]/10 text-[#5D8A8F]'
                : isDark ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>

          {/* Gated on `user` so the badge only renders once the plan is known —
              avoids both a hydration mismatch and a Freemium→Premium flash. */}
          {user && (isPremium ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-white shadow-sm shadow-amber-200">
              ★ Premium
            </span>
          ) : (
            <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border
              ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              Freemium
            </span>
          ))}

          <button
            onClick={handleLogout}
            className={`hidden sm:flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer font-semibold
              ${isDark
                ? 'border-slate-700 text-slate-400 hover:border-red-900/60 hover:text-red-400 hover:bg-red-900/20'
                : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
              }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>

          <Link
            href="/influencer/profile"
            title={user?.name ?? 'Profile'}
            className={`relative w-9 h-9 rounded-full overflow-hidden ring-2 shadow-sm transition-all duration-150 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#FDE5DC] to-[#f5c4b0] cursor-pointer
              ${isDark ? 'ring-slate-700 hover:ring-[#7FA8AD]' : 'ring-gray-200 hover:ring-[#7FA8AD]'}`}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#9C4A33] font-bold text-sm">{user?.name?.charAt(0).toUpperCase() ?? '?'}</span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle navigation"
            className={`lg:hidden p-2 rounded-xl transition-all cursor-pointer
              ${isDark ? 'hover:bg-slate-800/60 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
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
          <div className={`lg:hidden fixed top-[64px] left-0 right-0 z-20 border-b shadow-xl
            ${isDark ? 'bg-[#0B1725] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(item => {
                const isMessages  = item.href === '/influencer/messages';
                const isCampaigns = item.href === '/influencer/campaigns';
              const isInvites   = item.href === '/influencer/invitations';
                const isActive    = pathname === item.href;
                const hasDot      = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && (newCampaignCount > 0 || appUpdateCount > 0)) || (isInvites && pendingInviteCount > 0);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? activeItemCls
                        : isDark ? 'text-slate-400 hover:bg-slate-800/50' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={isActive ? activeIconCls : isDark ? 'text-slate-600' : 'text-gray-400'}>{item.icon}</span>
                      {item.label}
                    </span>
                    {hasDot && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                  </Link>
                );
              })}
              <div className={`my-1 h-px ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
              <Link
                href="/influencer/settings"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/influencer/settings'
                    ? activeItemCls
                    : isDark ? 'text-slate-400 hover:bg-slate-800/50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={pathname === '/influencer/settings' ? activeIconCls : isDark ? 'text-slate-600' : 'text-gray-400'}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </span>
                Account Settings
              </Link>
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
      <div className={`lg:hidden sticky top-[64px] z-10 border-b
        ${isDark
          ? 'bg-[#0B1725] border-slate-700/50 shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
          : 'bg-white border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
        }`}>
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden px-3 gap-0.5 py-2">
          {NAV_ITEMS.map(item => {
            const isMessages  = item.href === '/influencer/messages';
            const isCampaigns = item.href === '/influencer/campaigns';
            const isActive    = pathname === item.href;
            const hasDot      = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && (newCampaignCount > 0 || appUpdateCount > 0));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 cursor-pointer ${
                  isActive ? activeItemCls : isDark ? 'text-slate-500 hover:bg-slate-800/40' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <span className={isActive ? activeIconCls : ''}>{item.icon}</span>
                {item.label}
                {hasDot && (
                  <span className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ${dotShadow}`} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
