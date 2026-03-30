'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LogOut, TrendingUp } from 'lucide-react';
import { influencerNav } from '@/lib/navConfig';

const MOCK_USER = {
  name: 'Jane Doe',
  username: '@janedoe',
  initials: 'JD',
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white flex flex-col h-full border-r border-gray-100 flex-shrink-0">

      {/* ── Logo ── */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-400 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              InfluenceConnect
            </p>
            <p className="text-xs text-brand-400 font-medium">Pro Dashboard</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {influencerNav.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-sm font-medium transition-all duration-150 group
                    ${isActive
                      ? 'bg-brand-400 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-brand-50 hover:text-brand-400'
                    }
                  `}
                >
                  <Icon
                    size={18}
                    className={
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-brand-400'
                    }
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User + Logout ── */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-1">
        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center text-white text-xs font-bold">
              {MOCK_USER.initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {MOCK_USER.name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {MOCK_USER.username}
            </p>
          </div>
          <button
            className="p-1 text-gray-400 hover:text-brand-400 transition-colors"
            title="Settings"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Logout */}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-red-50 transition-colors">
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}