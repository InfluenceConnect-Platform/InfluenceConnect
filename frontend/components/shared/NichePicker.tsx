'use client';

import { useState, useMemo } from 'react';
import {
  NICHE_TAXONOMY,
  NICHE_LABELS,
  SUB_NICHE_LABELS,
  NICHE_SUBNICHES,
  SUB_NICHE_TO_NICHE,
  NICHE_CATEGORY,
} from '@/lib/niches';

interface Props {
  /** Selected niche slugs. */
  niches: string[];
  onNichesChange: (next: string[]) => void;
  /** Selected sub-niche slugs. Omit both to hide the sub-niche level entirely. */
  subNiches?: string[];
  onSubNichesChange?: (next: string[]) => void;
  /** Role accent hex — ruby #E0115F for creators, forest green #228B22 for brands. */
  accent: string;
  accentDark: string;
  accentTint: string;
  accentBorder: string;
  /** Cap on how many niches may be picked. */
  maxNiches?: number;
  dark?: boolean;
  idPrefix?: string;
}

/**
 * Three-level taxonomy picker: category → niche → sub-niche.
 *
 * Categories start collapsed so the full 38-niche list isn't dumped on the
 * user at once; a category auto-expands when it already contains a selection
 * so existing choices are never hidden behind a closed panel.
 *
 * Sub-niches are only offered for niches that are actually selected, and
 * deselecting a niche drops its sub-niches — the two lists can never drift
 * into an impossible combination.
 */
export default function NichePicker({
  niches,
  onNichesChange,
  subNiches,
  onSubNichesChange,
  accent,
  accentDark,
  accentTint,
  accentBorder,
  maxNiches,
  dark = false,
  idPrefix = 'niche',
}: Props) {
  const showSubs = Array.isArray(subNiches) && typeof onSubNichesChange === 'function';

  // Categories containing an existing selection start open.
  const initiallyOpen = useMemo(() => {
    const set = new Set<string>();
    niches.forEach(n => { const c = NICHE_CATEGORY[n]; if (c) set.add(c); });
    return set;
    // Only seeded once — afterwards the user drives open/closed state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [open, setOpen] = useState<Set<string>>(initiallyOpen);

  const atLimit = typeof maxNiches === 'number' && niches.length >= maxNiches;

  const toggleCategory = (slug: string) =>
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });

  const toggleNiche = (slug: string) => {
    const selected = niches.includes(slug);
    if (!selected && atLimit) return;
    const next = selected ? niches.filter(n => n !== slug) : [...niches, slug];
    onNichesChange(next);
    // Drop any sub-niches whose parent niche is no longer selected.
    if (showSubs && selected) {
      onSubNichesChange!(subNiches!.filter(s => SUB_NICHE_TO_NICHE[s] !== slug));
    }
  };

  const toggleSubNiche = (slug: string) => {
    if (!showSubs) return;
    onSubNichesChange!(
      subNiches!.includes(slug) ? subNiches!.filter(s => s !== slug) : [...subNiches!, slug]
    );
  };

  const textMuted = dark ? 'text-slate-400' : 'text-gray-500';
  const border = dark ? 'border-slate-700/60' : 'border-gray-200';
  const panelBg = dark ? 'bg-[#0f1e31]' : 'bg-white';

  return (
    <div className="flex flex-col gap-2">
      {NICHE_TAXONOMY.map(cat => {
        const isOpen = open.has(cat.slug);
        const pickedInCat = cat.niches.filter(n => niches.includes(n.slug)).length;
        const panelId = `${idPrefix}-cat-${cat.slug}`;

        return (
          <div key={cat.slug} className={`rounded-xl border overflow-hidden ${border} ${panelBg}`}>
            <button
              type="button"
              onClick={() => toggleCategory(cat.slug)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-3.5 sm:py-2.5 min-h-[48px] sm:min-h-0 text-left transition-colors cursor-pointer ${
                dark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                {/* Category names are long ("Business, Wealth & Personal
                    Finance") and the filter sidebar is narrow, so truncating
                    left every one of them ending in "…" and unreadable. Wrap
                    to as many lines as the name needs instead. */}
                <span className={`text-[13px] font-bold leading-snug break-words ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                  {cat.label}
                </span>
                {pickedInCat > 0 && (
                  <span
                    className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: accentTint, color: accentDark }}
                  >
                    {pickedInCat}
                  </span>
                )}
              </span>
              <svg
                className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${textMuted}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isOpen && (
              <div id={panelId} className={`px-3.5 pb-3.5 pt-1 border-t ${border}`}>
                <div className="flex flex-wrap gap-1.5 pt-2.5">
                  {cat.niches.map(n => {
                    const on = niches.includes(n.slug);
                    const blocked = !on && atLimit;
                    return (
                      <button
                        key={n.slug}
                        type="button"
                        onClick={() => toggleNiche(n.slug)}
                        disabled={blocked}
                        aria-pressed={on}
                        className={`px-3 py-2.5 sm:py-1.5 rounded-full text-[11.5px] font-semibold border transition-all duration-150 ${
                          blocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                        } ${on ? 'text-white border-transparent shadow-sm' : dark
                          ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        style={on ? { background: `linear-gradient(135deg, ${accent}, ${accentDark})` } : undefined}
                      >
                        {NICHE_LABELS[n.slug] ?? n.slug}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-niches, grouped under each selected niche in this category */}
                {showSubs && cat.niches.filter(n => niches.includes(n.slug)).map(n => {
                  const subs = NICHE_SUBNICHES[n.slug] ?? [];
                  if (!subs.length) return null;
                  return (
                    <div key={`${n.slug}-subs`} className="mt-3 pl-3" style={{ borderLeft: `2px solid ${accentBorder}` }}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${textMuted}`}>
                        {NICHE_LABELS[n.slug]} — sub-niches
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {subs.map(s => {
                          const on = subNiches!.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSubNiche(s)}
                              aria-pressed={on}
                              className={`px-2.5 py-2 sm:py-1 rounded-full text-[11px] font-medium border transition-all duration-150 cursor-pointer ${
                                on ? '' : dark
                                  ? 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                              style={on ? { backgroundColor: accentTint, borderColor: accentBorder, color: accentDark } : undefined}
                            >
                              {SUB_NICHE_LABELS[s] ?? s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {atLimit && (
        <p className={`text-[11px] ${textMuted}`}>
          You&apos;ve selected the maximum of {maxNiches} niches. Deselect one to choose another.
        </p>
      )}
    </div>
  );
}
