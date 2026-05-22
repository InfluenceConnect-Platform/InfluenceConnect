'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/brand/dashboard' },
  { label: 'Campaigns', href: '/brand/campaigns' },
  { label: 'Discover', href: '/brand/discover' },
  { label: 'Messages', href: '/brand/messages' },
  { label: 'Profile', href: '/brand/profile' },
  { label: 'Billing', href: '/brand/billing' },
];

interface BrandNavProps {
  user: { name: string; plan?: string } | null;
  // logoUrl can be passed as a prop (for the profile page which already has it loaded)
  // or omitted — BrandNav will fetch it itself
  logoUrl?: string;
}

export default function BrandNav({ user: userProp, logoUrl: logoUrlProp }: BrandNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Self-sufficient user state: reads localStorage directly so the nav
  // never shows '?' even when the parent page hasn't populated its own
  // user state yet (e.g. after a full-page reload / bfcache miss).
  const [localUser, setLocalUser] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  // Keep localUser in sync if localStorage changes (e.g. after plan upgrade)
  useEffect(() => {
    try {
      const s = localStorage.getItem('user');
      if (s) setLocalUser(JSON.parse(s));
    } catch {}
  }, []);

  // Prefer the prop (parent may have fresher data), fall back to local read
  const user = userProp ?? localUser;
  const isPremium = user?.plan === 'premium';

  // Fetch brand profile logo when no prop is provided
  useEffect(() => {
    if (logoUrlProp !== undefined) return;
    api.get('/api/brand/profile/me')
      .then(res => setFetchedLogoUrl(res.data?.profile?.logoUrl || ''))
      .catch(() => {});
  }, [logoUrlProp]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/messages/unread-count');
      setUnreadCount(res.data.count ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (pathname === '/brand/messages') setUnreadCount(0);
  }, [pathname]);

  const logoUrl = logoUrlProp !== undefined ? logoUrlProp : fetchedLogoUrl;

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px] sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/brand/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3D5087] to-[#2B3B68] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              IC
            </div>
            <span className="font-bold text-gray-900 text-[15px] tracking-tight hidden sm:block">
              Influence Connect
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map(item => {
              const isMessages = item.href === '/brand/messages';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    pathname === item.href
                      ? 'bg-[#EAEDF6] text-[#1B2444]'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                  {isMessages && unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C4B5FD] shadow-[0_0_0_1.5px_white]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className={`hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPremium ? 'bg-amber-100 text-amber-700' : 'bg-[#EAEDF6] text-[#1B2444]'
          }`}>
            {isPremium ? '★ Premium' : 'Freemium'}
          </span>
          <button
            onClick={handleLogout}
            className="hidden sm:flex text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
          >
            Log out
          </button>
          {/* Avatar — shows logo if uploaded, falls back to initial; links to profile */}
          <Link href="/brand/profile" title="Brand profile"
            className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0 select-none bg-gradient-to-br from-[#EAEDF6] to-[#D4D9EE] flex items-center justify-center hover:ring-[#3D5087] transition-all duration-150 cursor-pointer">
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
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
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
          <div
            className="lg:hidden fixed inset-0 top-[60px] bg-black/20 z-20"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed top-[60px] left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(item => {
                const isMessages = item.href === '/brand/messages';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      pathname === item.href
                        ? 'bg-[#EAEDF6] text-[#1B2444]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.label}
                      {isMessages && unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#C4B5FD] flex-shrink-0" />
                      )}
                    </span>
                  </Link>
                );
              })}
              <div className="my-1 h-px bg-gray-100" />
              <button
                onClick={handleLogout}
                className="px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 text-left cursor-pointer transition-all"
              >
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
