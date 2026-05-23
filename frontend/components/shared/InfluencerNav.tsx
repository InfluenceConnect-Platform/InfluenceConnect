'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/influencer/dashboard' },
  { label: 'Campaigns', href: '/influencer/campaigns' },
  { label: 'Messages', href: '/influencer/messages' },
  { label: 'Earnings', href: '/influencer/earnings' },
  { label: 'Profile', href: '/influencer/profile' },
  { label: 'Billing', href: '/influencer/billing' },
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

  // Clear dots when navigating to their respective pages
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
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px] sticky top-0 z-30 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <Link href="/influencer/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              IC
            </div>
            <span className="font-bold text-gray-900 text-[15px] tracking-tight hidden sm:block">Influence Connect</span>
          </Link>

          <div className="hidden lg:flex gap-0.5">
            {NAV_ITEMS.map(item => {
              const isMessages = item.href === '/influencer/messages';
              const isCampaigns = item.href === '/influencer/campaigns';
              const isActive = pathname === item.href;
              const hasDot = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && newCampaignCount > 0);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                    isActive ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                  {hasDot && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#4CAF7D] shadow-[0_0_0_1.5px_white]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPremium ? 'bg-amber-100 text-amber-700' : 'bg-[#EEF4F5] text-[#2A3E42]'
          }`}>
            {isPremium ? '★ Premium' : 'Freemium'}
          </span>
          <button
            onClick={handleLogout}
            className="hidden sm:flex text-xs text-red-500 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer font-medium"
          >
            Log out
          </button>
          <Link href="/influencer/profile" title="View profile"
            className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm cursor-pointer hover:ring-[#7FA8AD] transition-all duration-150 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#FDE5DC] to-[#f5c4b0]">
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
                const isMessages = item.href === '/influencer/messages';
                const isCampaigns = item.href === '/influencer/campaigns';
                const isActive = pathname === item.href;
                const hasDot = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && newCampaignCount > 0);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.label}
                      {hasDot && (
                        <span className="w-2 h-2 rounded-full bg-[#4CAF7D] flex-shrink-0" />
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

      {/* Mobile tab bar — shown below nav on small screens */}
      <div className="lg:hidden sticky top-[60px] z-10 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden px-3 gap-0.5 py-2">
          {NAV_ITEMS.map(item => {
            const isMessages = item.href === '/influencer/messages';
            const isCampaigns = item.href === '/influencer/campaigns';
            const isActive = pathname === item.href;
            const hasDot = (isMessages && (unreadCount > 0 || pendingOfferCount > 0)) || (isCampaigns && newCampaignCount > 0);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  isActive ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {item.label}
                {hasDot && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#4CAF7D] shadow-[0_0_0_1.5px_white]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
