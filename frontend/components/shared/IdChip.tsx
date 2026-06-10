'use client';

import { useState } from 'react';
import { useToast } from '@/components/shared/Toast';

type Tone = 'light' | 'dark' | 'subtle';
type Size = 'xs' | 'sm';

interface IdChipProps {
  /** The human-readable customId, e.g. "IC-INF-000001". Renders nothing if empty. */
  id?: string | null;
  size?: Size;
  tone?: Tone;
  className?: string;
}

const TONES: Record<Tone, string> = {
  light:  'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200/70',
  subtle: 'bg-gray-50 text-gray-500 border-gray-200/70 hover:bg-gray-100',
  dark:   'bg-white/12 text-white/90 border-white/15 hover:bg-white/20',
};

const SIZES: Record<Size, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-[11px] px-2 py-0.5 gap-1.5',
};

/**
 * Monospace ID pill with a one-click copy button and a "Copied" toast.
 * Use everywhere a customId is shown — never render raw ObjectIds.
 */
export default function IdChip({ id, size = 'sm', tone = 'light', className = '' }: IdChipProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!id) return null;

  const copy = async (e: React.MouseEvent) => {
    // Allow use inside clickable rows/cards without triggering their handlers.
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.show('Copied', 'success');
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.show('Unable to copy', 'error');
    }
  };

  const dim = size === 'xs' ? 11 : 12;

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${id}`}
      className={`group inline-flex items-center font-mono font-medium tracking-tight rounded-md border transition-colors cursor-pointer ${TONES[tone]} ${SIZES[size]} ${className}`}
    >
      <span>{id}</span>
      {copied ? (
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-90 transition-opacity">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}
