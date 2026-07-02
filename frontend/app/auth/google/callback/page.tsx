'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token      = searchParams.get('token');
    const userRaw    = searchParams.get('user');
    const setupToken = searchParams.get('setupToken');
    const step       = searchParams.get('step');
    const error      = searchParams.get('error');

    if (error) {
      router.replace('/auth/login?error=google_failed');
      return;
    }

    // New Google user — needs to add mobile. Forward the signed setupToken
    // (never a raw userId) so the completion page can call send-mobile-otp securely.
    if (step === 'mobile' && setupToken) {
      router.replace(`/auth/complete-profile?setupToken=${setupToken}&step=mobile`);
      return;
    }

    // Fully verified returning user — save token and go to dashboard
    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        document.cookie = `ic_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;

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

// useSearchParams() must be wrapped in Suspense for production builds
export default function GoogleCallbackPageWrapper() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackPage />
    </Suspense>
  );
}
