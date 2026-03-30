'use client';

import { Search, Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">

      {/* Search bar */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search anything..."
            className="
              w-full pl-9 pr-4 py-2 text-sm
              bg-gray-50 border border-gray-200 rounded-xl
              placeholder:text-gray-400 text-gray-700
              focus:outline-none focus:ring-2 focus:ring-brand-400/20
              focus:border-brand-400 transition-all
            "
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">

        {/* Notification bell */}
        <button className="relative p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-50 rounded-xl transition-colors">
          <Bell size={19} />
          {/* Red dot — unread indicator */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* Discover CTA */}
        <button className="px-4 py-2 bg-brand-400 text-white text-sm font-medium rounded-xl hover:bg-brand-500 transition-colors">
          Discover
        </button>

      </div>
    </header>
  );
}