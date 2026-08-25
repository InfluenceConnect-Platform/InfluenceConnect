'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Slows down and smooths out both wheel scrolling (desktop) and touch
 * scrolling (mobile/tablet).
 *
 * There is no CSS or browser setting a page can use to scroll less per wheel
 * notch or per finger-pixel — the OS/browser decides that. The only way to
 * change it is to swallow the input event and drive the scroll position
 * ourselves: each wheel notch, or each touch-drag pixel, adds a scaled-down
 * distance to a target offset. Wheel input eases toward that target every
 * frame; touch input tracks the finger 1:1 in damped units while the finger
 * is down, then hands off to a matching damped-momentum glide on release —
 * otherwise lifting the finger would restore full native (undamped) speed
 * the instant it left the screen.
 *
 * Deliberately narrow beyond that: keyboard, scrollbar drags, anchor jumps,
 * Next's scroll-to-top on navigation and every nested scroller (modals, chat
 * threads, dropdowns, horizontal carousels) are left on native behaviour, and
 * the whole thing switches off under `prefers-reduced-motion`.
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
  /**
   * Distance travelled per pixel of finger movement while touching, as a
   * fraction of a native 1:1 drag. Lower = slower. Defaults to `step` so
   * touch and wheel feel equally damped out of the box; expose separately
   * only if mobile ever needs its own tuning.
   */
  touchStep?: number;
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

const FRAME = 1000 / 60; // `catchUp` and friction below are per-frame at 60fps, normalised

// A finger has to move this many raw pixels before a touch gesture commits to
// being a vertical scroll — below it we can't yet tell a scroll from a
// horizontal swipe (a carousel, a swipeable card), so nothing is intercepted.
const DIRECTION_LOCK_PX = 6;

// Momentum after the finger lifts decays by this fraction every frame (60fps),
// and stops once it drops below MIN_VELOCITY px/ms. Tuned to taper off in
// roughly half a second — enough to feel like a glide, not a dead stop, but
// short enough that it doesn't fight the next gesture.
const FRICTION = 0.92;
const MIN_VELOCITY = 0.02; // px/ms

export default function SmoothScroll({ step = 0.6, catchUp = 0.15, touchStep }: SmoothScrollProps) {
  const effectiveTouchStep = touchStep ?? step;

  // Re-arming on navigation tears down any in-flight glide, so it can't fight
  // the scroll-to-top Next performs during a client-side transition.
  const pathname = usePathname();

  useEffect(() => {
    // The eased glide is motion the user didn't ask for — under "reduce motion"
    // we stay out of the way entirely and leave scrolling native.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    let target = window.scrollY;   // where the page is heading (wheel mode)
    let current = window.scrollY;  // sub-pixel position, ours to keep
    let running = false;
    let frame = 0;
    let last = 0;
    let activeTick: (now: number) => void = () => {};

    const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
      // Hand `scroll-behavior` back to the stylesheet (see `start`).
      root.style.scrollBehavior = '';
    };

    const start = (tickFn: (now: number) => void) => {
      activeTick = tickFn;
      if (running) return;
      running = true;
      // A `scroll-behavior: smooth` in CSS would make every frame of the loop
      // below its own animation. Nothing sets it today; this keeps the loop
      // correct if anything ever does.
      root.style.scrollBehavior = 'auto';
      last = performance.now();
      frame = requestAnimationFrame(activeTick);
    };

    // ── Wheel: ease the current position toward a fixed target ──
    const wheelTick = (now: number) => {
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
      frame = requestAnimationFrame(activeTick);
    };

    /** Wheel deltas arrive in pixels, lines or pages depending on the browser. */
    const toPixels = (e: WheelEvent) =>
      e.deltaMode === 1 ? e.deltaY * LINE_HEIGHT
      : e.deltaMode === 2 ? e.deltaY * window.innerHeight
      : e.deltaY;

    /**
     * True when `el` can absorb this wheel/touch itself. Direction matters: a
     * list already scrolled to its end should still pass the input on to the
     * page, the way native scroll chaining does.
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
      if (!running || activeTick !== wheelTick) { current = target = window.scrollY; }
      target = Math.min(Math.max(target + raw * factor, 0), max);
      start(wheelTick);
    };

    // ── Touch: track the finger 1:1 in damped units while down, then glide
    // on release using the same damped velocity (so lifting the finger never
    // suddenly restores full native speed) ──
    let touchX = 0;
    let touchY = 0;
    let touching = false;
    let directionLocked = false;
    let verticalGesture = false;
    let velocity = 0; // damped px/ms, smoothed across recent touchmove events

    const momentumTick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;

      const decay = Math.pow(FRICTION, dt / FRAME);
      velocity *= decay;

      const max = maxScroll();
      const next = Math.min(Math.max(current + velocity * dt, 0), max);
      const hitEdge = next === 0 || next === max;
      current = next;
      target = current;
      window.scrollTo(0, current);

      if (hitEdge || Math.abs(velocity) < MIN_VELOCITY) {
        stop();
        return;
      }
      frame = requestAnimationFrame(activeTick);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { touching = false; return; }
      // A fresh touch always wins over any glide already in flight, and picks
      // up from wherever the page actually is.
      stop();
      current = target = window.scrollY;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
      touching = true;
      directionLocked = false;
      verticalGesture = false;
      velocity = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touching || e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = touchX - x;
      const dy = touchY - y;

      // Don't commit to vertical scrolling until the gesture clearly is one —
      // otherwise a horizontal swipe (carousel, swipeable card) loses its
      // first few pixels of movement to us.
      if (!directionLocked) {
        if (Math.hypot(dx, dy) < DIRECTION_LOCK_PX) return;
        directionLocked = true;
        verticalGesture = Math.abs(dy) > Math.abs(dx);
        if (!verticalGesture) { touching = false; return; }
      }
      if (!verticalGesture) return;

      touchX = x;
      touchY = y;

      // A scrollable element under the finger (modal, chat thread, dropdown)
      // keeps native touch scrolling — we only take over the page itself.
      if (nestedScroller(e.target, dy)) return;

      const max = maxScroll();
      if (max <= 0) return;

      // At either edge, moving further in the direction that would leave the
      // page (pull-to-refresh, bounce) is left native rather than swallowed.
      if ((current <= 0 && dy < 0) || (current >= max && dy > 0)) return;

      const now = performance.now();
      const dt = Math.max(1, now - last);
      const damped = dy * effectiveTouchStep;
      // Smoothed rather than instantaneous, so a single jittery touchmove
      // sample doesn't produce a wild momentum value on release.
      const instant = damped / dt;
      velocity = velocity === 0 ? instant : velocity + (instant - velocity) * 0.5;
      last = now;

      e.preventDefault();
      current = target = Math.min(Math.max(current + damped, 0), max);
      window.scrollTo(0, current);
    };

    const endTouch = () => {
      if (!touching) return;
      touching = false;
      if (!verticalGesture || Math.abs(velocity) < MIN_VELOCITY) return;
      start(momentumTick);
    };

    // Any other way of scrolling wins immediately: drop our glide and let the
    // browser take it from where the page currently sits.
    const yield_ = () => {
      if (!running) return;
      stop();
      current = target = window.scrollY;
    };

    // `passive: false` is what makes preventDefault work on wheel/touchmove.
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });
    window.addEventListener('keydown', yield_, { passive: true });
    window.addEventListener('mousedown', yield_, { passive: true });

    return () => {
      stop();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', endTouch);
      window.removeEventListener('touchcancel', endTouch);
      window.removeEventListener('keydown', yield_);
      window.removeEventListener('mousedown', yield_);
    };
  }, [pathname, step, catchUp, effectiveTouchStep]);

  return null;
}
