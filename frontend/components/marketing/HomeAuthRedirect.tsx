'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/**
 * Sends a logged-in influencer/brand straight to their dashboard when they
 * land on the marketing homepage instead of showing them the landing page again.
 * Admin sessions (sessionStorage) are intentionally excluded.
 */
export default function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored || !isTokenValid(token)) return;

    try {
      const role = JSON.parse(stored)?.role;
      if (role === 'influencer') router.replace('/influencer/dashboard');
      else if (role === 'brand') router.replace('/brand/dashboard');
    } catch {}
  }, [router]);

  return null;
}
