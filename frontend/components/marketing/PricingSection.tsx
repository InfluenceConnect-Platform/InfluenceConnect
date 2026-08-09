'use client';

import { useState } from 'react';
import Link from 'next/link';
import Reveal from '@/components/marketing/Reveal';
import { BRAND_TIERS, INFLUENCER_TIERS, yearlyPrice } from '@/lib/tiers';

/* Full tier breakdown for both audiences — pulls from the same source of
   truth as the in-app billing pages (frontend/lib/tiers.ts), so marketing
   copy can never drift from what's actually enforced. */

const AUDIENCES = [
  { key: 'creators' as const, label: 'For Creators', role: 'influencer', tiers: INFLUENCER_TIERS, accent: '#E0115F', accentDark: '#7A0F3D' },
  { key: 'brands' as const, label: 'For Brands', role: 'brand', tiers: BRAND_TIERS, accent: '#228B22', accentDark: '#14531D' },
];

function Check({ color }: { color: string }) {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function PricingSection() {
  const [audience, setAudience] = useState<'creators' | 'brands'>('creators');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const current = AUDIENCES.find(a => a.key === audience)!;
  const popularKey = 'golden'; // both audiences' "most popular" tier

  return (
    <div>
      {/* Audience toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200">
          {AUDIENCES.map(a => (
            <button
              key={a.key}
              onClick={() => setAudience(a.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                audience === a.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={audience === a.key ? { color: a.accent } : undefined}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200">
          {(['monthly', 'yearly'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setBilling(mode)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                billing === mode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>
      <p className={`text-center text-xs font-semibold mb-10 transition-opacity ${
        billing === 'yearly' ? 'text-emerald-600 opacity-100' : 'opacity-0'
      }`}>
        Save 20% with yearly billing — 2 months free
      </p>

      {/* Tier cards — full breakdown for the selected audience */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${current.tiers.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5`}>
        {current.tiers.map((t, i) => {
          const isFree = t.key === 'free';
          const isPopular = t.key === popularKey;
          const displayPrice = billing === 'monthly' ? t.priceMonthly : Math.round(yearlyPrice(t.priceMonthly) / 12);

          return (
            <Reveal key={`${audience}-${t.key}`} delay={i * 90}>
            <div
              className={`relative bg-white dark:bg-[#0E1B2E] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full ${
                isPopular ? 'border-2' : 'border border-gray-200'
              }`}
              style={isPopular ? { borderColor: current.accent } : undefined}
            >
              {isPopular && (
                <span
                  className="absolute top-3 right-3 z-10 text-[10px] font-bold text-white px-2 py-1 rounded-full"
                  style={{ backgroundColor: current.accent }}
                >
                  Popular
                </span>
              )}
              <div
                className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5"
                style={isFree ? undefined : { background: `linear-gradient(135deg, ${current.accent}, ${current.accentDark})` }}
              >
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isFree ? '' : 'text-white/70'}`} style={isFree ? { color: current.accent } : undefined}>
                  {t.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span key={billing} className={`anim-pop text-3xl font-bold tracking-tight tabular-nums ${isFree ? 'text-gray-900 dark:text-slate-100' : 'text-white'}`}>
                    ₹{displayPrice.toLocaleString('en-IN')}
                  </span>
                  <span className={`text-xs font-medium ${isFree ? 'text-gray-400' : 'text-white/70'}`}>{isFree ? '/ forever' : '/ mo'}</span>
                </div>
                <p className={`text-xs mt-1.5 leading-relaxed ${isFree ? 'text-gray-500' : 'text-white/80'}`}>{t.tagline}</p>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                  {t.features.map(f => (
                    <li key={f} className="flex gap-2 text-[12.5px] text-gray-600 dark:text-slate-400 leading-snug">
                      <Check color={current.accent} /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/auth/signup?role=${current.role}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                  style={{ background: `linear-gradient(135deg, ${current.accent}, ${current.accentDark})` }}
                >
                  {isFree ? `Start free as a ${audience === 'creators' ? 'creator' : 'brand'}` : `Choose ${t.label}`}
                </Link>
              </div>
            </div>
            </Reveal>
          );
        })}
      </div>

      <p className="text-center text-[0.7rem] text-gray-400 mt-6">
        No card required for the free plan · Paid tiers billed via Razorpay, one-time by default (Autopay optional)
      </p>
    </div>
  );
}
