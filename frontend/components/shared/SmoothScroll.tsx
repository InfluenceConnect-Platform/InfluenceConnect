'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Slows down and smooths out wheel scrolling.
 *
 * There is no CSS or browser setting a page can use to scroll less per wheel
 * notch — the OS/browser decides that. The only way to change it is to swallow
 * the wheel event and drive the scroll position ourselves, which is what this
 * does: each notch adds a scaled-down distance to a target offset, and a
 * requestAnimationFrame loop eases the window toward it.
 *
 * Deliberately narrow: it only ever touches wheel events aimed at the document
 * scroller. Touch, keyboard, scrollbar drags, anchor jumps, Next's scroll-to-top
 * on navigation and every nested scroller are left on native behaviour, and the
 * whole thing switches off under `prefers-reduced-motion`.
 */

interface SmoothScrollProps {
  /**
   * Distance travelled per wheel notch, as a fraction of the browser's own
   * step. Lower = slower. 1 = exactly the browser's normal speed.
   */
  step?: number;
  /**
   * Fraction of the remaining distance covered each frame at 60fps. Lower =
   * longer, floatier glide; higher = snappier. 1 would remove the easing.
   */
  catchUp?: number;
}

// Trackpads emit a rapid stream of small, already-smoothed deltas, so they need
// a gentler hand than a mouse wheel's chunky notches — damping both by the same
// amount is what makes a trackpad feel like it's dragging through syrup. Deltas
// below this (in pixel mode) are treated as trackpad input.
const TRACKPAD_DELTA = 50;
const TRACKPAD_RELIEF = 0.35; // pulled back toward 1 (native) by this much

// Firefox reports wheel deltas in lines (deltaMode 1) rather than pixels; ~40px
// per line is close to the distance it would natively have scrolled.
const LINE_HEIGHT = 40;

const FRAME = 1000 / 60; // `catchUp` is per frame at 60fps, normalised below

export default function SmoothScroll({ step = 0.6, catchUp = 0.15 }: SmoothScrollProps) {
  // Re-arming on navigation tears down any in-flight glide, so it can't fight
  // the scroll-to-top Next performs during a client-side transition.
  const pathname = usePathname();

  useEffect(() => {
    // The eased glide is motion the user didn't ask for — under "reduce motion"
    // we stay out of the way entirely and leave scrolling native.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    let target = window.scrollY;   // where the page is heading
    let current = window.scrollY;  // sub-pixel position, ours to keep
    let running = false;
    let frame = 0;
    let last = 0;

    const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
      // Hand `scroll-behavior` back to the stylesheet (see `start`).
      root.style.scrollBehavior = '';
    };

    const start = () => {
      if (running) return;
      running = true;
      // A `scroll-behavior: smooth` in CSS would make every frame of the loop
      // below its own animation. Nothing sets it today; this keeps the loop
      // correct if anything ever does.
      root.style.scrollBehavior = 'auto';
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      // Cap the delta so a backgrounded tab doesn't resume with one huge jump.
      const dt = Math.min(now - last, 50);
      last = now;

      const distance = target - current;
      // Frame-rate independent easing: the same feel on 60Hz and 120Hz.
      const eased = distance * (1 - Math.pow(1 - catchUp, dt / FRAME));
      current += eased;

      if (Math.abs(target - current) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        stop();
        return;
      }
      window.scrollTo(0, current);
      frame = requestAnimationFrame(tick);
    };

    /** Wheel deltas arrive in pixels, lines or pages depending on the browser. */
    const toPixels = (e: WheelEvent) =>
      e.deltaMode === 1 ? e.deltaY * LINE_HEIGHT
      : e.deltaMode === 2 ? e.deltaY * window.innerHeight
      : e.deltaY;

    /**
     * True when `el` can absorb this wheel itself. Direction matters: a list
     * already scrolled to its end should still pass the wheel on to the page,
     * the way native scroll chaining does.
     */
    const absorbs = (el: Element, delta: number) => {
      const style = getComputedStyle(el);
      const overflow = style.overflowY;
      if (overflow !== 'auto' && overflow !== 'scroll' && overflow !== 'overlay') return false;
      const room = el.scrollHeight - el.clientHeight;
      if (room <= 1) return false;
      // `contain`/`none` means the page must not scroll on, at either end.
      const chains = style.overscrollBehaviorY === 'auto';
      if (!chains) return true;
      return delta > 0 ? el.scrollTop < room - 1 : el.scrollTop > 1;
    };

    const nestedScroller = (node: EventTarget | null, delta: number) => {
      let el = node instanceof Element ? node : null;
      while (el && el !== document.body && el !== root) {
        if (absorbs(el, delta)) return true;
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      // Pinch-zoom (ctrl/⌘ + wheel), sideways wheels and anything already
      // handled elsewhere stay native.
      if (e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      if (!e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (nestedScroller(e.target, e.deltaY)) return;

      const max = maxScroll();
      if (max <= 0) return;

      const raw = toPixels(e);
      // Trackpad deltas get damped less — see TRACKPAD_RELIEF.
      const factor = Math.abs(raw) < TRACKPAD_DELTA
        ? step + (1 - step) * TRACKPAD_RELIEF
        : step;

      e.preventDefault();
      // Pick up wherever the page actually is before starting a fresh glide,
      // so a scrollbar drag or anchor jump in between isn't undone.
      if (!running) current = target = window.scrollY;
      target = Math.min(Math.max(target + raw * factor, 0), max);
      start();
    };

    // Any other way of scrolling wins immediately: drop our glide and let the
    // browser take it from where the page currently sits.
    const yield_ = () => {
      if (!running) return;
      stop();
      current = target = window.scrollY;
    };

    // `passive: false` is what makes preventDefault work on wheel.
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', yield_, { passive: true });
    window.addEventListener('touchstart', yield_, { passive: true });
    window.addEventListener('mousedown', yield_, { passive: true });

    return () => {
      stop();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', yield_);
      window.removeEventListener('touchstart', yield_);
      window.removeEventListener('mousedown', yield_);
    };
  }, [pathname, step, catchUp]);

  return null;
}
