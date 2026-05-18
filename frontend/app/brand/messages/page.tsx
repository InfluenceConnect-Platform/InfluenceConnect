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

        {/* Hero banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] rounded-2xl px-5 sm:px-8 py-5 sm:py-6 mb-6 shadow-lg">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <p className="text-xs text-blue-200/90 font-semibold uppercase tracking-wider mb-1">Conversations across active deals</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Messages</h1>
            <p className="text-blue-200/70 text-sm mt-1">Chat securely with creators once a deal is active</p>
          </div>
        </section>

        {/* Empty state card */}
        <div
          className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden"
          style={{ minHeight: 'calc(100vh - 280px)' }}
        >
          <div className="flex flex-col items-center justify-center h-full px-6 py-16 max-w-lg mx-auto text-center">

            {/* Stacked illustration */}
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3D5087] to-[#4a5fa0] rounded-2xl rotate-6 opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#3D5087] to-[#4a5fa0] rounded-2xl -rotate-3 opacity-40" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-[#3D5087] to-[#4a5fa0] rounded-2xl shadow-lg flex items-center justify-center">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {/* Notification dot */}
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white" />
              </div>
            </div>

            <h3 className="font-bold text-gray-800 text-xl mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-sm">
              Messages appear here once you accept a creator&apos;s application and a deal is created.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link
                href="/brand/campaigns"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] hover:from-[#2B3B68] hover:to-[#3D5087] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
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
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Discover creators
              </Link>
            </div>

            {/* How it works steps */}
            <div className="w-full">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">How it works</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    step: '1',
                    title: 'Create campaign',
                    desc: 'Post a brief to attract the right creators',
                    color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
                    href: '/brand/campaigns',
                  },
                  {
                    step: '2',
                    title: 'Accept application',
                    desc: 'Review creators and accept their applications',
                    color: 'bg-gradient-to-br from-violet-500 to-purple-600',
                    href: '/brand/campaigns',
                  },
                  {
                    step: '3',
                    title: 'Start chatting',
                    desc: 'A deal is auto-created and you can chat here',
                    color: 'bg-gradient-to-br from-emerald-500 to-green-600',
                    href: '#',
                  },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3.5 bg-gray-50 hover:bg-blue-50/40 border border-gray-100 hover:border-blue-100 rounded-2xl transition-all duration-150">
                    <div className={`w-8 h-8 rounded-full ${s.color} text-white text-xs font-bold flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                      {s.step}
                    </div>
                    <p className="text-xs font-bold text-gray-700 mb-1">{s.title}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Security badge */}
            <div className="mt-8 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span className="font-medium">All conversations are moderated — contact info sharing is blocked</span>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
