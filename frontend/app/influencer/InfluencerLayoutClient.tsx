'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeColor } from '@/lib/useThemeColor';

// Shared across every /influencer/* tab so the App Router treats this
// segment as one stable layout instead of tearing the whole tree down and
// rebuilding it on every nav-tab click — that churn is what was producing
// the intermittent stuck-loading/404 flash when switching tabs quickly.
export default function InfluencerLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  useThemeColor('#E0115F');

  useEffect(() => {
    let token: string | null = null;
    let stored: string | null = null;
    let role: string | undefined;
    try {
      token = localStorage.getItem('token');
      stored = localStorage.getItem('user');
      role = stored ? JSON.parse(stored)?.role : undefined;
    } catch {}

    if (!token || !stored || role !== 'influencer') {
      router.replace('/auth/login?role=influencer');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F0417B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
