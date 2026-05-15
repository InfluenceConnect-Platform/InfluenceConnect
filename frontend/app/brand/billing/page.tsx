'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandNav from '@/components/shared/BrandNav';

const FREEMIUM_FEATURES = [
  { text: 'Up to 2 active campaigns',           included: true  },
  { text: 'Basic creator discovery',            included: true  },
  { text: 'Application management',             included: true  },
  { text: '10 messages per day',                included: true  },
  { text: 'Standard campaign visibility',       included: true  },
  { text: 'Unlimited active campaigns',         included: false },
  { text: 'Priority placement in creator feed', included: false },
  { text: 'Advanced creator filters',           included: false },
  { text: 'Campaign performance analytics',     included: false },
  { text: 'Export campaign reports (CSV)',       included: false },
  { text: 'Dedicated support',                  included: false },
];

const PREMIUM_FEATURES = [
  'Unlimited active campaigns',
  'Priority placement in creator discovery',
  'Advanced creator filters (engagement, tier)',
  'Campaign performance analytics',
  'Export campaign reports (CSV)',
  'Unlimited daily messages',
  'Early access to new features',
  'Dedicated brand support',
  'All Freemium features included',
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel your subscription anytime from this page. You keep Premium access until the end of your current billing period. No hidden fees.',
  },
  {
    q: 'What happens to my campaigns if I downgrade?',
    a: 'Your existing campaigns and data are preserved. After downgrading, only 2 campaigns can be active at a time. Closed or completed campaigns are unaffected.',
  },
  {
    q: 'Do you take a commission on deals?',
    a: 'No. In Phase 1, deals are agreed directly between you and creators. Platform commission is only introduced in a future paid tier.',
  },
  {
    q: 'Is my billing information secure?',
    a: 'All payments are processed through Razorpay. We never store your card details on our servers.',
  },
];

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const StarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
  </svg>
);

export default function BrandBillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; plan?: string } | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const MONTHLY_PRICE = 1499;
  const YEARLY_PRICE = Math.round(MONTHLY_PRICE * 12 * 0.8);
  const YEARLY_PER_MONTH = Math.round(YEARLY_PRICE / 12);
  const YEARLY_SAVINGS = MONTHLY_PRICE * 12 - YEARLY_PRICE;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'brand') { router.push('/auth/login'); return; }
    setUser(parsed);
  }, [router]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      alert('Razorpay checkout will open here in production. Payment gateway is configured and ready.');
    } finally {
      setLoading(false);
    }
  };

  const isPremium = user?.plan === 'premium';

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <BrandNav user={user} />

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Already Premium */}
        {isPremium && (
          <div className="mb-8 bg-gradient-to-br from-[#EAEDF6] via-white to-[#f0f6f7] border border-[#3D5087]/20 rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3D5087] to-[#2B3B68] flex items-center justify-center text-white shadow-md flex-shrink-0">
              <StarIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#3D5087] uppercase tracking-wider mb-1">Active plan</p>
              <h2 className="text-lg font-bold text-[#1B2444]">You&apos;re on Premium — enjoy every feature</h2>
              <p className="text-sm text-gray-500 mt-1">Your subscription renews automatically. You can cancel anytime.</p>
            </div>
            <button className="flex-shrink-0 self-start sm:self-auto flex items-center gap-2 text-sm text-gray-500 border border-gray-200 bg-white px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer font-medium shadow-sm">
              <RefreshIcon />
              Manage plan
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-1.5 bg-[#EAEDF6] text-[#3D5087] text-xs font-bold px-3 py-1.5 rounded-full border border-[#3D5087]/20 mb-4">
            <SparkIcon />
            Simple, transparent pricing
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3 leading-tight">
            Scale your brand.<br className="sm:hidden" /> Find better creators.
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Start free with 2 campaigns. Upgrade when you need unlimited reach and deeper insights.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-0.5">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  billing === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  billing === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yearly
                <span className="text-[11px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                  −20%
                </span>
              </button>
            </div>
          </div>
          {billing === 'yearly' && (
            <p className="text-xs text-green-600 font-semibold mt-2">
              You save ₹{YEARLY_SAVINGS.toLocaleString('en-IN')} per year — 2 months free
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">

          {/* Freemium */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 pt-6 pb-5 border-b border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Freemium</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-bold text-gray-900 tracking-tight">₹0</span>
                <span className="text-gray-400 text-sm font-medium">/ forever</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Everything you need to launch your first campaigns.
              </p>
            </div>

            <div className="px-6 py-5 flex-1 flex flex-col">
              <div className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-400 text-center mb-5 bg-gray-50 select-none">
                {isPremium ? 'Downgrade' : 'Current plan'}
              </div>

              <div className="flex flex-col gap-2.5 flex-1">
                {FREEMIUM_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      f.included ? 'bg-[#EAEDF6] text-[#3D5087]' : 'bg-gray-100 text-gray-300'
                    }`}>
                      {f.included ? <CheckIcon /> : <XIcon />}
                    </span>
                    <span className={`text-sm leading-snug ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Premium */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg flex flex-col border-2 border-[#3D5087]">
            <div className="bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] px-6 pt-6 pb-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-8 -translate-x-6 pointer-events-none" />

              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/30 mb-3">
                <StarIcon />
                Most popular
              </span>

              <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-2">Premium</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-bold text-white tracking-tight tabular-nums">
                  ₹{billing === 'monthly'
                    ? MONTHLY_PRICE.toLocaleString('en-IN')
                    : YEARLY_PER_MONTH.toLocaleString('en-IN')}
                </span>
                <span className="text-white/70 text-sm font-medium">/ month</span>
              </div>
              {billing === 'yearly' ? (
                <p className="text-xs text-white/80 font-medium">
                  ₹{YEARLY_PRICE.toLocaleString('en-IN')} billed yearly
                </p>
              ) : (
                <p className="text-xs text-white/70">Billed monthly, cancel anytime</p>
              )}
            </div>

            <div className="bg-white px-6 py-5 flex-1 flex flex-col">
              {isPremium ? (
                <div className="w-full py-2.5 bg-[#EAEDF6] border border-[#3D5087]/30 rounded-xl text-sm font-bold text-[#1B2444] text-center mb-5 flex items-center justify-center gap-2">
                  <span className="text-[#3D5087]"><CheckIcon /></span>
                  You are on Premium
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#3D5087] to-[#2B3B68] hover:from-[#2B3B68] hover:to-[#1B2444] text-white rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mb-5 shadow-md hover:shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      Upgrade to Premium
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              )}

              <div className="flex flex-col gap-2.5 flex-1">
                {PREMIUM_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#EAEDF6] text-[#3D5087] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon />
                    </span>
                    <span className="text-sm text-gray-700 leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6 py-4 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {[
              { icon: <LockIcon />, text: <><strong className="text-gray-700">Razorpay</strong> secured checkout</> },
              { icon: <RefreshIcon />, text: <>Cancel <strong className="text-gray-700">anytime</strong>, no questions asked</> },
              { icon: <ShieldIcon />, text: <>We <strong className="text-gray-700">never</strong> store card details</> },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-7 h-7 rounded-lg bg-[#EAEDF6] text-[#3D5087] flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </span>
                <span>{item.text}</span>
                {i < 2 && <div className="hidden sm:block w-px h-5 bg-gray-200 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Compare table — desktop */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Full feature comparison</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">Feature</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Freemium</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#3D5087] uppercase tracking-wider">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { feature: 'Active campaigns',         free: '2',          premium: 'Unlimited' },
                { feature: 'Creator discovery',        free: 'Basic',      premium: 'Advanced filters' },
                { feature: 'Daily messages',           free: '10/day',     premium: 'Unlimited' },
                { feature: 'Campaign analytics',       free: false,        premium: true },
                { feature: 'Priority in creator feed', free: false,        premium: true },
                { feature: 'CSV report export',        free: false,        premium: true },
                { feature: 'Dedicated support',        free: false,        premium: true },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-700">{row.feature}</td>
                  <td className="px-6 py-3.5 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free
                        ? <span className="inline-flex w-5 h-5 rounded-full bg-[#EAEDF6] text-[#3D5087] items-center justify-center mx-auto"><CheckIcon /></span>
                        : <span className="inline-flex w-5 h-5 rounded-full bg-gray-100 text-gray-300 items-center justify-center mx-auto"><XIcon /></span>
                    ) : (
                      <span className="text-gray-600 font-medium text-xs">{row.free}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    {typeof row.premium === 'boolean' ? (
                      row.premium
                        ? <span className="inline-flex w-5 h-5 rounded-full bg-[#EAEDF6] text-[#3D5087] items-center justify-center mx-auto"><CheckIcon /></span>
                        : <span className="inline-flex w-5 h-5 rounded-full bg-gray-100 text-gray-300 items-center justify-center mx-auto"><XIcon /></span>
                    ) : (
                      <span className="text-[#3D5087] font-semibold text-xs">{row.premium}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Frequently asked questions</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {FAQS.map((faq, i) => (
              <div key={i} className="px-5 sm:px-6">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 sm:py-5 text-left cursor-pointer group"
                >
                  <p className="text-sm font-semibold text-gray-900 pr-4 group-hover:text-[#3D5087] transition-colors">
                    {faq.q}
                  </p>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openFaq === i && (
                  <p className="text-sm text-gray-500 leading-relaxed pb-5">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Questions?{' '}
          <Link href="/brand/messages" className="text-[#3D5087] hover:underline font-medium">
            Message us
          </Link>{' '}
          and we&apos;ll get back within 24 hours.
        </p>
      </main>
    </div>
  );
}
