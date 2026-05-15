'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandNav from '@/components/shared/BrandNav';

export default function BrandMessages() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <BrandNav user={user} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Conversations across active deals
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Messages</h1>
        </div>

        <div
          className="bg-white border border-gray-200/80 rounded-2xl shadow-sm flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 220px)' }}
        >
          <div className="text-center px-6 py-12 max-w-sm mx-auto">
            {/* Illustration */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-[#EAEDF6] rounded-2xl rotate-6" />
              <div className="absolute inset-0 bg-[#EAEDF6]/60 rounded-2xl -rotate-3" />
              <div className="relative w-20 h-20 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center">
                <svg className="w-9 h-9 text-[#3D5087]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Messages appear here once you accept a creator&apos;s application and a deal is created. Start by reviewing your campaign applications.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/brand/campaigns"
                className="inline-flex items-center justify-center gap-2 bg-[#3D5087] hover:bg-[#2B3B68] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <polyline points="16 11 18 13 22 9"/>
                </svg>
                Review applications
              </Link>
              <Link
                href="/brand/discover"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Discover creators
              </Link>
            </div>

            <div className="mt-8 p-4 bg-[#F4F6FB] rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-700">How it works:</strong> Accept an application on the Campaigns page → a deal is auto-created → you can chat securely with that creator here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
