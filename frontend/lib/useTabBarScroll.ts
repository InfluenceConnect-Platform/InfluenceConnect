'use client';

import { useCallback, useRef, type UIEvent } from 'react';

// Horizontal scroll offset of each role's mobile tab bar, kept at module level
// so it survives the nav re-mounting on every client-side navigation. Every page
// renders its own <InfluencerNav>/<BrandNav>, so without this the fresh <div>
// mounts at scrollLeft 0 — which is what snapped the bar back to "Dashboard"
// right after tapping a far-right tab like Pricing.
const savedScroll: Record<string, number> = {};

// sessionStorage mirror so a hard reload (or the service worker serving a fresh
// document) doesn't lose the position either.
const storageKey = (key: string) => `ic-tabbar-${key}`;

function readSaved(key: string): number | undefined {
  if (savedScroll[key] !== undefined) return savedScroll[key];
  try {
    const s = sessionStorage.getItem(storageKey(key));
    if (s !== null) {
      const n = Number(s);
      if (Number.isFinite(n)) {
        savedScroll[key] = n;
        return n;
      }
    }
  } catch {}
  return undefined;
}

/**
 * Keeps a horizontally scrollable tab bar exactly where the user left it.
 *
 * Spread the returned props onto the scrolling container and mark the active
 * tab with `data-tab-active="true"`:
 *
 *   <div className="flex overflow-x-auto" {...useTabBarScroll('influencer')}>
 */
export function useTabBarScroll(key: string) {
  const elRef = useRef<HTMLDivElement | null>(null);

  // A ref callback rather than an effect: it runs during commit, before paint,
  // so the bar is never painted at the left edge and then jumped.
  const ref = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el;
    if (!el) return;

    const saved = readSaved(key);
    if (saved !== undefined) {
      el.scrollLeft = Math.min(saved, el.scrollWidth - el.clientWidth);
      return;
    }

    // Nothing saved yet (first paint of the session, or a deep link). Only
    // scroll if the active tab is actually out of view — a user who never
    // scrolled the bar shouldn't see it shift under them.
    const active = el.querySelector<HTMLElement>('[data-tab-active="true"]');
    if (!active) return;
    const box = el.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    if (tab.left >= box.left && tab.right <= box.right) return;
    const centered = el.scrollLeft + (tab.left - box.left) - (el.clientWidth - tab.width) / 2;
    el.scrollLeft = Math.max(0, Math.min(centered, el.scrollWidth - el.clientWidth));
  }, [key]);

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const left = e.currentTarget.scrollLeft;
    savedScroll[key] = left;
    try { sessionStorage.setItem(storageKey(key), String(left)); } catch {}
  }, [key]);

  return { ref, onScroll };
}
