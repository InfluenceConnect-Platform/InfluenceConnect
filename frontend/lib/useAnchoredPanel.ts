'use client';

import { useCallback, useEffect, useEffectEvent, useRef, type RefObject } from 'react';

const GAP = 4;          // px between the anchor and the panel
const EDGE = 8;         // px kept clear of the visible screen edge
const MIN_HEIGHT = 160; // below this the panel is useless — overhang the edge instead

/**
 * Placement + dismissal for a dropdown panel portaled to <body> with
 * `position: fixed` (portaled so scrollable/overflow-hidden ancestors can't
 * clip it — see SearchableSelect). Attach the returned callback ref to the
 * panel element.
 *
 * The panel closes only on a deliberate action: a press outside the
 * anchor/panel, Escape, or a mouse-wheel scroll of the page. It deliberately
 * does NOT close on `scroll`/`resize`: on phones those fire by themselves
 * right after the panel opens — the on-screen keyboard sliding up, the
 * browser toolbar showing/hiding, the page scrolling a focused input into
 * view — which is what made the State dropdown flash open and vanish on
 * mobile. Those events only re-run placement.
 *
 * Placement is measured against the *visual* viewport, so while the keyboard
 * is up the panel is kept in the visible area above it instead of behind it.
 */
export function useAnchoredPanel({
  open,
  onClose,
  anchorRef,
  containerRef = anchorRef,
  maxHeight,
}: {
  open: boolean;
  onClose: () => void;
  /** Element the panel hangs off — a trigger button or text input. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Presses inside this element don't count as outside. Defaults to the anchor. */
  containerRef?: RefObject<HTMLElement | null>;
  maxHeight: number;
}) {
  const panelEl = useRef<HTMLElement | null>(null);
  // Which side of the anchor the panel opened on, picked once per mount — so
  // the keyboard eating the space below doesn't flip the panel (and the search
  // box the user just tapped) to the other side of the trigger mid-typing.
  const side = useRef<'above' | 'below' | null>(null);

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelEl.current;
    if (!anchor || !panel) return;
    const r = anchor.getBoundingClientRect();
    const vv = window.visualViewport;
    const viewTop = (vv ? vv.offsetTop : 0) + EDGE;
    const viewBottom = (vv ? vv.offsetTop + vv.height : window.innerHeight) - EDGE;

    if (!side.current) {
      const spaceBelow = viewBottom - (r.bottom + GAP);
      const spaceAbove = r.top - GAP - viewTop;
      side.current = spaceBelow < maxHeight && spaceAbove > spaceBelow ? 'above' : 'below';
    }

    let top: number;
    let room: number;
    if (side.current === 'below') {
      top = Math.min(Math.max(r.bottom + GAP, viewTop), viewBottom - MIN_HEIGHT);
      room = viewBottom - top;
      panel.style.transform = '';
    } else {
      // `top` is the panel's bottom edge here; translateY(-100%) grows it
      // upward, so a list that shrinks while filtering stays against the anchor.
      top = Math.max(Math.min(r.top - GAP, viewBottom), viewTop + MIN_HEIGHT);
      room = top - viewTop;
      panel.style.transform = 'translateY(-100%)';
    }
    panel.style.top = `${top}px`;
    panel.style.left = `${r.left}px`;
    panel.style.width = `${r.width}px`;
    panel.style.maxHeight = `${Math.min(maxHeight, Math.max(room, MIN_HEIGHT))}px`;
  }, [anchorRef, maxHeight]);

  // Positioned from the ref callback (runs during commit, before paint) so
  // the panel never paints at an unpositioned spot first.
  const panelRef = useCallback((el: HTMLElement | null) => {
    panelEl.current = el;
    side.current = null;
    if (el) place();
  }, [place]);

  const close = useEffectEvent(() => onClose());

  useEffect(() => {
    if (!open) return;

    const inPanel = (t: EventTarget | null) => t instanceof Node && !!panelEl.current?.contains(t);
    const onPointerDown = (e: PointerEvent) => {
      if (inPanel(e.target)) return;
      if (e.target instanceof Node && containerRef.current?.contains(e.target)) return;
      close();
    };
    // Someone wheeling the page on desktop is scrolling away, like a native
    // <select> closes. Touch scrolling and anything the browser does on its
    // own (keyboard, toolbar, scroll-into-view) never fire `wheel`.
    const onWheel = (e: WheelEvent) => {
      if (!inPanel(e.target)) close();
    };
    const onViewportChange = (e: Event) => {
      if (inPanel(e.target)) return; // the panel's own list scrolling moves nothing
      place();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const focusWasInPanel = inPanel(document.activeElement);
      close();
      if (focusWasInPanel) anchorRef.current?.focus();
    };

    const vv = window.visualViewport;
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { capture: true, passive: true });
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    vv?.addEventListener('resize', onViewportChange);
    vv?.addEventListener('scroll', onViewportChange);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
      vv?.removeEventListener('resize', onViewportChange);
      vv?.removeEventListener('scroll', onViewportChange);
    };
  }, [open, place, anchorRef, containerRef]);

  return panelRef;
}
