'use client';

import { useEffect, useRef } from 'react';

/**
 * Keeps a page's data fresh without a manual reload. Re-runs `refetch`:
 *  - on a polling interval (default 12s),
 *  - whenever the tab regains focus / becomes visible again (instant catch-up),
 * and only while the tab is actually visible (hidden background tabs don't poll).
 *
 * `refetch` is read through a ref so callers can pass an inline closure that
 * reads current state/filters without re-subscribing the listeners every render.
 */
export function useLiveData(
  refetch: () => void,
  options?: { interval?: number; enabled?: boolean }
) {
  const { interval = 12000, enabled = true } = options || {};
  const saved = useRef(refetch);
  saved.current = refetch;

  useEffect(() => {
    if (!enabled) return;
    const run = () => {
      if (document.visibilityState === 'visible') saved.current();
    };
    const id = setInterval(run, interval);
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', run);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', run);
    };
  }, [interval, enabled]);
}

export default useLiveData;
