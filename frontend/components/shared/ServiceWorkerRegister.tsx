'use client';

import { useEffect } from 'react';

// Registers public/sw.js so Chrome offers a real "Install app" (a proper
// WebAPK with a themed status bar) instead of falling back to a plain
// home-screen shortcut. Production-only — no reason to layer a service
// worker on top of `next dev`'s own refresh/HMR cycle. Renders nothing.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal — the app works exactly the same without it, just
      // without the "installable" upgrade from a bare shortcut.
    });
  }, []);

  return null;
}
