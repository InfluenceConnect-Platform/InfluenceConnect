'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/shared/AdminNav';

export default function AdminModeration() {
  const router = useRouter();

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') { router.push('/admin/login'); return; }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">

        <div className="mb-7">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Content moderation</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Moderation</h1>
        </div>

        {/* Server-side note */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#3E4751]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#3E4751]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Server-side moderation is active</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Phone numbers, email addresses, and social media handles are automatically stripped from all messages using server-side regex before delivery. No manual action is required for contact-info blocking.
              </p>
            </div>
          </div>
        </div>

        {/* Phase 2 placeholder */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center px-6">

            <div className="w-16 h-16 rounded-2xl bg-[#3E4751]/8 border border-[#3E4751]/10 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-[#3E4751]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-2">Full moderation dashboard</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
              Flagged message logs, reported campaigns, and user-submitted violations will appear here once the Phase 2 moderation engine is deployed.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-3.5 py-2 rounded-xl">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Coming in Phase 2
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold bg-green-50 text-green-700 border border-green-100 px-3.5 py-2 rounded-xl">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Regex filter active now
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
