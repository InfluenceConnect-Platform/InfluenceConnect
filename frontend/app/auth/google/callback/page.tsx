'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token    = searchParams.get('token');
    const userRaw  = searchParams.get('user');
    const userId   = searchParams.get('userId');
    const step     = searchParams.get('step');
    const error    = searchParams.get('error');

    if (error) {
      router.replace('/auth/login?error=google_failed');
      return;
    }

    // New Google user — needs to add mobile
    if (step === 'mobile' && userId) {
      router.replace(`/auth/complete-profile?userId=${userId}&step=mobile`);
      return;
    }

    // Fully verified returning user — save token and go to dashboard
    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'brand') router.replace('/brand/dashboard');
        else router.replace('/influencer/dashboard');
      } catch {
        router.replace('/auth/login?error=google_failed');
      }
      return;
    }

    router.replace('/auth/login?error=google_failed');
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF4F5] via-white to-[#EAEDF6]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Signing you in with Google…</p>
      </div>
    </div>
  );
}
