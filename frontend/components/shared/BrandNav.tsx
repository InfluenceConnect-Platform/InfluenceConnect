'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/lib/useTheme';
import { useConfirm } from '@/components/shared/ConfirmModal';

// Cached across client-side navigations so the brand logo shows instantly on
// re-mount instead of flashing the letter avatar while it re-fetches. It's null
// on the server and the first client render (so it stays hydration-safe); a hard
// reload resets it and the effect below re-seeds it from localStorage.
let cachedBrandLogoUrl: string | null = null;

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/brand/dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: 'Campaigns',
    href: '/brand/campaigns',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    label: 'Discover',
    href: '/brand/discover',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    label: 'Invitations',
    href: '/brand/invitations',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
  },
  {
    label: 'Messages',
    href: '/brand/messages',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/brand/profile',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: 'Billing',
    href: '/brand/billing',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
];

interface BrandNavProps {
  // Optional: pages like settings don't pass it; the nav then reads the user
  // from localStorage itself via the localUser effect.
  user?: { name: string; plan?: string } | null;
  logoUrl?: string;
}

export default function BrandNav({ user: userProp, logoUrl: logoUrlProp }: BrandNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useTheme();
  const confirm = useConfirm();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState(cachedBrandLogoUrl ?? '');
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOfferCount, setPendingOfferCount] = useState(0);
  const [inviteResponseCount, setInviteResponseCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start null so the first client render matches the SSR HTML (the server has
  // no localStorage). The effect below reads localStorage after mount. Reading
  // it in the initializer is what makes the avatar initial / plan badge / title
  // differ between SSR and hydration → the hydration mismatch.
  const [localUser, setLocalUser] = useState<any>(null);

  // Tracks whether we've hydrated. Until then we ignore even a synchronously
  // provided `userProp`, so the first client render matches the server HTML
  // (which has no localStorage) and we avoid a hydration mismatch on the
  // avatar initial / plan badge / title — regardless of how the parent page
  // initialises the user it passes down.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem('user');
      if (s) setLocalUser(JSON.parse(s));
    } catch {}
  }, []);

  const user = mounted ? (userProp ?? localUser) : null;
  const isPremium = user?.plan === 'premium';

  useEffect(() => {
    if (logoUrlProp !== undefined) return;
    // Seed instantly from the last known value (survives hard reloads)…
    try {
      const ls = localStorage.getItem('brandLogoUrl');
      if (ls) { cachedBrandLogoUrl = ls; setFetchedLogoUrl(ls); }
    } catch {}
    // …then refresh from the API and update both caches.
    api.get('/api/brand/profile/me')
      .then(res => {
        const url = res.data?.profile?.logoUrl || '';
        cachedBrandLogoUrl = url;
        setFetchedLogoUrl(url);
        try { localStorage.setItem('brandLogoUrl', url); } catch {}
      })
      .catch(() => {});
  }, [logoUrlProp]);

  const fetchCounts = async () => {
    try {
      const [msgRes, offerRes, inviteRes] = await Promise.all([
        api.get('/api/messages/unread-count'),
        api.get('/api/deals/pending-offer-count'),
        api.get('/api/invitations/brand/response-count'),
      ]);
      setUnreadCount(msgRes.data.count ?? 0);
      setPendingOfferCount(offerRes.data.count ?? 0);
      setInviteResponseCount(inviteRes.data.count ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetchCounts();
    pollRef.current = setInterval(fetchCounts, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (pathname === '/brand/messages') {
      setUnreadCount(0);
      setPendingOfferCount(0);
    }
    if (pathname === '/brand/invitations') {
      setInviteResponseCount(0);
    }
  }, [pathname]);

  const logoUrl = logoUrlProp !== undefined ? logoUrlProp : fetchedLogoUrl;

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      description: 'You will need to sign in again to access your account.',
      confirmLabel: 'Log out',
      variant: 'warning',
    });
    if (!ok) return;
    localStorage.clear();
    router.push('/auth/login');
  };

  // Reusable dark/light class sets
  const dotShadow = isDark ? 'shadow-[0_0_0_1.5px_#0B1725]' : 'shadow-[0_0_0_1.5px_white]';

  const activeItemCls = isDark
    ? 'bg-[#1a2a45] text-slate-200'
    : 'bg-[#EAEDF6] text-[#1B2444]';

  const inactiveItemCls = isDark
    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50';

  const activeIconCls = isDark ? 'text-[#6B94C6]' : 'text-[#3D5087]';

  return (
    <>
      <nav className={`backdrop-blur-md border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[64px] sticky top-0 z-30 transition-colors duration-200
        ${isDark
          ? 'bg-[#0B1725]/95 border-slate-700/60 shadow-[0_1px_8px_rgba(0,0,0,0.4)]'
          : 'bg-white/95 border-gray-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.06)]'
        }`}>

        {/* Left — logo + nav links */}
        <div className="flex items-center gap-6 lg:gap-8 min-w-0">
          <Link href="/brand/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3D5087] to-[#1e2f5c] flex items-center justify-center text-white font-black text-[13px] shadow-md group-hover:shadow-[#3D5087]/40 transition-shadow duration-200">
              IC
            </div>
            <span className={`font-extrabold text-[15px] tracking-tight hidden sm:block ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
              Influence<span className={isDark ? 'text-[#7B9DD4]' : 'text-[#3D5087]'}>Connect</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map(item => {
              const isMessages = item.href === '/brand/messages';
              const isInvites  = item.href === '/brand/invitations';
              const isActive   = pathname === item.href;
              const hasDot     = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isInvites && inviteResponseCount > 0);
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
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#3D5087]" />
                  )}
                  {hasDot && (
                    <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 ${dotShadow}`} />
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
            href="/brand/settings"
            title="Account Settings"
            className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
              pathname === '/brand/settings'
                ? isDark ? 'bg-[#3D5087]/25 text-[#7B9DD4]' : 'bg-[#3D5087]/10 text-[#3D5087]'
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
            href="/brand/profile"
            title={user?.name ?? 'Brand profile'}
            className={`w-9 h-9 rounded-full overflow-hidden ring-2 shadow-sm transition-all duration-150 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#EAEDF6] to-[#D4D9EE] cursor-pointer
              ${isDark ? 'ring-slate-700 hover:ring-[#3D5087]' : 'ring-gray-200 hover:ring-[#3D5087]'}`}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Brand logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#3D5087] font-bold text-sm">{user?.name?.charAt(0).toUpperCase() ?? '?'}</span>
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
                const isMessages = item.href === '/brand/messages';
                const isInvites  = item.href === '/brand/invitations';
                const isActive   = pathname === item.href;
                const hasDot     = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isInvites && inviteResponseCount > 0);
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
                    {hasDot && <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />}
                  </Link>
                );
              })}
              <div className={`my-1 h-px ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
              <Link
                href="/brand/settings"
                onClick={() => setMobileOpen(v => !v)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/brand/settings'
                    ? activeItemCls
                    : isDark ? 'text-slate-400 hover:bg-slate-800/50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={pathname === '/brand/settings' ? activeIconCls : isDark ? 'text-slate-600' : 'text-gray-400'}>
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
            const isMessages = item.href === '/brand/messages';
            const isInvites  = item.href === '/brand/invitations';
            const isActive   = pathname === item.href;
            const hasDot     = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isInvites && inviteResponseCount > 0);
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
                  <span className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-violet-400 ${dotShadow}`} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
