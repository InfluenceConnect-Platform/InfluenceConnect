'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  /** Accent hex for the selected row's text (ruby for creators, green for brands). */
  accent: string;
  /** Full className for the trigger button — caller controls padding/border/disabled look. */
  triggerClassName: string;
}

/**
 * Custom single-select dropdown with its own bounded, scrollable list — used
 * in place of a native <select> wherever the option list is long (state/city
 * pickers, up to 45+ items). Two problems this fixes that a native <select>
 * (or a plain absolutely-positioned custom panel) hits:
 *
 *  1. Native <select> popups are rendered by the OS/browser outside our
 *     control and have been reported to scroll unreliably once the list
 *     overflows the viewport on some browser/OS combos.
 *  2. This picker is used inside scrollable containers (a modal body, the
 *     mobile filter drawer) whose `overflow-y-auto`/`overflow-hidden` would
 *     clip a plain `position: absolute` popup anchored inside them. The
 *     panel is portaled to <body> with `position: fixed` computed from the
 *     trigger's real screen position, so it always renders on top, fully
 *     visible, regardless of what scrollable box the trigger sits inside.
 */
export default function SearchableSelect({ value, onChange, options, placeholder, disabled, accent, triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const PANEL_MAX_HEIGHT = 320;

  const computePosition = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < PANEL_MAX_HEIGHT && r.top > spaceBelow;
    setPos(
      openUp
        ? { bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width }
        : { top: r.bottom + 4, left: r.left, width: r.width }
    );
  };

  useEffect(() => {
    if (!open) return;
    computePosition();

    const onOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    // Any scroll of an ancestor invalidates the computed position — close
    // rather than show a stale/misplaced panel. Scrolling *inside* the
    // panel's own list must not close it, so ignore events whose target is
    // the panel itself.
    const onScroll = (e: Event) => {
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);

    document.addEventListener('mousedown', onOutsideClick);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      // Let the panel mount before focusing so it doesn't steal the click.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const toggleOpen = () => {
    if (!open) setFilter('');
    setOpen(o => !o);
  };

  const filtered = filter.trim()
    ? options.filter(o => o.toLowerCase().includes(filter.trim().toLowerCase()))
    : options;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`${triggerClassName} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[1000] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width }}
        >
          {options.length > 8 && (
            <div className="p-2 border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Search…"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900"
              />
            </div>
          )}
          <div className="overflow-y-auto overscroll-contain py-1" style={{ maxHeight: PANEL_MAX_HEIGHT - 48 }}>
            {filtered.length === 0 && (
              <div className="px-3.5 py-2.5 text-sm text-gray-400">No matches</div>
            )}
            {filtered.map(opt => {
              const selected = opt === value;
              return (
                <div
                  key={opt}
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`px-3.5 py-2.5 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${selected ? 'font-semibold' : 'text-gray-700'}`}
                  style={selected ? { color: accent } : undefined}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
