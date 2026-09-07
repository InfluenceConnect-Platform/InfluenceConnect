'use client';

import { useEffect } from 'react';

// A focused <input type="number"> treats the mouse-wheel / two-finger
// trackpad scroll as a step up/down, so users silently change values
// (avg. likes, budgets, follower counts…) just by scrolling the page.
// Nobody wants that — number fields here are typed, never spun.
//
// One document-level listener blurs any focused number input the moment a
// wheel gesture lands on it. The browser then keeps scrolling the page as
// normal, but the value is left untouched. Capture phase so it runs before
// the input's own default handling. Renders nothing.
export default function NumberInputWheelGuard() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el instanceof HTMLInputElement &&
        el.type === 'number' &&
        document.activeElement === el
      ) {
        el.blur();
      }
    };

    document.addEventListener('wheel', onWheel, { capture: true, passive: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, []);

  return null;
}
