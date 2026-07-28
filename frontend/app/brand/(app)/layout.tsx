'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Shared across every /brand/* dashboard tab (the (app) group excludes the
// public /brand/creator/[slug] profile route) so the App Router treats this
// segment as one stable layout instead of tearing the whole tree down and
// rebuilding it on every nav-tab click — that churn is what was producing
// the intermittent stuck-loading/404 flash when switching tabs quickly.
export default function BrandAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let token: string | null = null;
    let stored: string | null = null;
    let role: string | undefined;
    try {
      token = localStorage.getItem('token');
      stored = localStorage.getItem('user');
      role = stored ? JSON.parse(stored)?.role : undefined;
    } catch {}

    if (!token || !stored || role !== 'brand') {
      router.replace('/auth/login');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3D5087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
