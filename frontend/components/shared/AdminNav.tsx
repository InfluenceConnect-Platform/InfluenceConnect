'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { useConfirm } from '@/components/shared/ConfirmModal';
import api from '@/lib/api';

type NavItem = { label: string; href: string; icon: ReactNode; badgeKey?: string };

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Overview',
    href: '/admin/dashboard',
    icon: (
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: (
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Campaigns',
    href: '/admin/campaigns',
    icon: (
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    ),
  },
  {
    label: 'GST',
    href: '/admin/gst',
    badgeKey: 'gstin',
    icon: (
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/>
      </svg>
    ),
  },
  {
    label: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: (
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Logs',
    href: '/admin/logs',
    icon: (
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="9" y1="9" x2="10" y2="9"/>
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: (
      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

interface AdminNavProps {
  user?: { name?: string } | null;
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const confirm   = useConfirm();
  const [open, setOpen] = useState(false);
  const [pendingGstin, setPendingGstin] = useState(0);

  useEffect(() => {
    let active = true;
    api.get('/api/admin/gstin/count')
      .then(res => { if (active) setPendingGstin(res.data?.pending || 0); })
      .catch(() => {});
    return () => { active = false; };
  }, [pathname]);

  const badgeFor = (key?: string) => (key === 'gstin' && pendingGstin > 0 ? pendingGstin : 0);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      description: 'You will need to sign in again to access the admin panel.',
      confirmLabel: 'Log out',
      variant: 'warning',
    });
    if (!ok) return;
    localStorage.clear();
    router.push('/admin/login');
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[64px] sticky top-0 z-30 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]">

        {/* Left: logo + desktop nav */}
        <div className="flex items-center gap-6 min-w-0 h-full">

          <Link href="/admin/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3E4751] to-[#262C33] flex items-center justify-center text-white font-bold text-[13px] shadow-[0_2px_8px_rgba(62,71,81,0.35)] ring-1 ring-white/10 group-hover:shadow-[0_4px_14px_rgba(62,71,81,0.45)] transition-shadow duration-200">
              IC
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-gray-900 text-[14px] tracking-tight leading-none">Influence Connect</p>
              <p className="text-[10px] font-semibold text-[#7FA8AD] uppercase tracking-[0.18em] mt-1">Admin</p>
            </div>
          </Link>

          {/* Desktop nav — segmented pills */}
          <div className="hidden lg:flex items-center gap-1 bg-gray-50/80 border border-gray-200/70 rounded-2xl p-1">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#3E4751] text-white shadow-[0_2px_8px_rgba(62,71,81,0.28)]'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {badgeFor(item.badgeKey) > 0 && (
                    <span className={`ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                      isActive ? 'bg-white text-[#3E4751]' : 'bg-amber-500 text-white'
                    }`}>
                      {badgeFor(item.badgeKey)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            Admin
          </span>

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-xl bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-150 cursor-pointer font-semibold shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3E4751] to-[#262C33] text-white flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-[0_2px_8px_rgba(62,71,81,0.3)] flex-shrink-0 select-none">
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>

          <button
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle navigation"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/60 text-gray-600 transition-all cursor-pointer"
          >
            {open ? (
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
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 top-[64px] bg-black/20 z-20" onClick={() => setOpen(false)} />
          <div className="lg:hidden fixed top-[64px] left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#3E4751] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                    {badgeFor(item.badgeKey) > 0 && (
                      <span className={`ml-auto min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                        isActive ? 'bg-white text-[#3E4751]' : 'bg-amber-500 text-white'
                      }`}>
                        {badgeFor(item.badgeKey)}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="my-1 h-px bg-gray-100" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 text-left cursor-pointer transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
