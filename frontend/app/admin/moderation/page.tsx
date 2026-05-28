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
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Content moderation</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Moderation queue</h1>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF0F3] flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-[#3E4751]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Moderation queue</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-3">
              Auto-blocked messages (phone numbers, emails, social handles) and reported campaigns will appear here. The regex moderation engine runs server-side and logs all violations automatically.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#3E4751] bg-[#EEF0F3] px-3 py-1.5 rounded-full">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Full dashboard coming in Phase 2
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
