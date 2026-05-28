'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRoot() {
  const router = useRouter();

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'admin') {
          router.replace('/admin/dashboard');
          return;
        }
      } catch {}
    }
    router.replace('/admin/login');
  }, [router]);

  return null;
}
