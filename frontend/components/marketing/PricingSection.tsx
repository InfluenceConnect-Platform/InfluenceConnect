'use client';

import { useState } from 'react';
import Link from 'next/link';

/* Prices mirror the in-app billing pages (influencer/billing, brand/billing). */
const CREATOR_MONTHLY = 299;
const BRAND_MONTHLY = 1499;
const yearly = (m: number) => Math.round(m * 12 * 0.8);
const yearlyPerMonth = (m: number) => Math.round(yearly(m) / 12);

interface Plan {
  audience: string;
  accent: string;        // tailwind text class
  gradient: string;      // CTA gradient classes
  border: string;
  wash: string;          // card background gradient tint
  monthly: number;
  free: string[];
  premium: string[];
}

const PLANS: Plan[] = [
  {
    audience: 'Creators',
    accent: 'text-[#5D8A8F]',
    gradient: 'from-[#5D8A8F] to-[#4A7A7F] hover:from-[#4A7A7F] hover:to-[#3D6B70]',
    border: 'border-[#5D8A8F]/25',
    wash: 'to-[#5D8A8F]/[0.06]',
    monthly: CREATOR_MONTHLY,
    free: [
      'Public profile with custom URL',
      'Unlimited portfolio uploads (3 visible to brands)',
      '5 campaign applications per month',
      'Basic credibility score',
      '10 messages per day',
    ],
    premium: [
      'Unlimited campaign applications',
      'All portfolio items visible to brands',
      'Unlimited daily messages',
      'Detailed monthly earnings chart',
      'Earnings by category + CSV export',
      'Early access to new features',
    ],
  },
  {
    audience: 'Brands',
    accent: 'text-[#7C3AED]',
    gradient: 'from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95]',
    border: 'border-[#7C3AED]/25',
    wash: 'to-[#7C3AED]/[0.06]',
    monthly: BRAND_MONTHLY,
    free: [
      'Up to 2 active campaigns',
      'Creator discovery — 10 profiles/day',
      'Search & filter creators (niche, platform, location, budget)',
      'Application management (shortlist, accept, reject)',
      'Campaign performance dashboard',
      '10 messages per day',
    ],
    premium: [
      'Unlimited active campaigns',
      'Unlimited creator profile views',
      'Unlimited daily messages',
      'Priority support',
      'All Freemium features included',
    ],
  },
];

function Check({ muted = false }: { muted?: boolean }) {
  return (
    <svg
      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${muted ? 'text-gray-400' : 'text-emerald-500'}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div>
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

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {PLANS.map(plan => (
          <div key={plan.audience} className={`bg-gradient-to-br from-white ${plan.wash} dark:from-[#0E1B2E] border-2 ${plan.border} rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300`}>
            <div className="p-8 pb-6 border-b border-gray-100">
              <p className={`text-xs font-bold uppercase tracking-widest ${plan.accent} mb-3`}>
                {plan.audience}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold text-gray-900 tracking-tight tabular-nums">
                  ₹{(billing === 'monthly' ? plan.monthly : yearlyPerMonth(plan.monthly)).toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-gray-500 font-medium">/ month</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 h-4">
                {billing === 'yearly'
                  ? `₹${yearly(plan.monthly).toLocaleString('en-IN')} billed yearly · cancel anytime`
                  : 'Billed monthly · cancel anytime'}
              </p>
            </div>

            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                  Free plan
                </p>
                <ul className="flex flex-col gap-3">
                  {plan.free.map(item => (
                    <li key={item} className="flex gap-2.5 text-sm text-gray-600 leading-snug">
                      <Check muted /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${plan.accent} mb-4`}>
                  Premium adds
                </p>
                <ul className="flex flex-col gap-3">
                  {plan.premium.map(item => (
                    <li key={item} className="flex gap-2.5 text-sm text-gray-700 font-medium leading-snug">
                      <Check /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-8 pb-8">
              <Link
                href={`/auth/signup?role=${plan.audience === 'Creators' ? 'influencer' : 'brand'}`}
                className={`w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${plan.gradient} shadow-md hover:shadow-lg active:scale-[0.98] transition-all`}
              >
                Start free as a {plan.audience === 'Creators' ? 'creator' : 'brand'}
              </Link>
              <p className="text-center text-[0.7rem] text-gray-400 mt-3">
                No card required for the free plan · Premium billed via Razorpay
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
