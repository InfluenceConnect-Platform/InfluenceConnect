'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Overview',      href: '/admin/dashboard' },
  { label: 'Users',         href: '/admin/users' },
  { label: 'Campaigns',     href: '/admin/campaigns' },
  { label: 'Moderation',    href: '/admin/moderation' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
];

interface AdminNavProps {
  user?: { name?: string } | null;
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px] sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Left: logo + desktop nav */}
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#3E4751] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              IC
            </div>
            <span className="hidden sm:block font-bold text-gray-900 text-[15px] tracking-tight">
              Influence Connect{' '}
              <span className="text-gray-400 font-normal text-xs">· Admin</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  pathname === item.href
                    ? 'bg-[#EEF0F3] text-[#1A2028]'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EEF0F3] text-[#1A2028]">
            Admin
          </span>
          <button
            onClick={handleLogout}
            className="hidden sm:flex text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
          >
            Log out
          </button>
          <div className="w-9 h-9 rounded-full bg-[#3E4751] text-white flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm flex-shrink-0 select-none">
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle navigation"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
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
          <div className="lg:hidden fixed inset-0 top-[60px] bg-black/20 z-20" onClick={() => setOpen(false)} />
          <div className="lg:hidden fixed top-[60px] left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === item.href
                      ? 'bg-[#EEF0F3] text-[#1A2028]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
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
