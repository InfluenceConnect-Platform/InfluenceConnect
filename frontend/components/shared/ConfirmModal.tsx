'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

const VARIANTS: Record<ConfirmVariant, { chip: string; button: string; icon: ReactNode }> = {
  danger: {
    chip: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    button: 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500/40',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  warning: {
    chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    button: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500/40',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    chip: 'bg-[#EAEDF6] text-[#3D5087] dark:bg-[#3D5087]/25 dark:text-[#7B9DD4]',
    button: 'bg-[#3D5087] hover:bg-[#33446f] focus-visible:ring-[#3D5087]/40',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const close = useCallback((result: boolean) => {
    setOpts(null);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  // Esc to cancel + lock body scroll while open
  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [opts, close]);

  const variant = VARIANTS[opts?.variant ?? 'warning'];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => close(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-4">
              <span className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${variant.chip}`}>
                {variant.icon}
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-slate-100">{opts.title}</h3>
                {opts.description && (
                  <p className="mt-1.5 text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed">{opts.description}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {opts.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold text-white shadow-sm transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 ${variant.button}`}
              >
                {opts.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
