'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandNav from '@/components/shared/BrandNav';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import { useToast } from '@/components/shared/Toast';
import { useConfirm } from '@/components/shared/ConfirmModal';

const FREEMIUM_FEATURES = [
  { text: 'Up to 2 active campaigns',                      included: true  },
  { text: 'Creator discovery — up to 10 profiles/day',     included: true  },
  { text: 'Search & filter creators (niche, platform, location, followers, budget)', included: true },
  { text: 'Application management (shortlist, accept, reject)', included: true },
  { text: 'Campaign performance dashboard',                included: true  },
  { text: 'Up to 10 messages per day',                     included: true  },
  { text: 'Email notifications',                           included: true  },
  { text: 'Unlimited active campaigns',                    included: false },
  { text: 'Unlimited creator profile views',               included: false },
  { text: 'Unlimited daily messages',                      included: false },
  { text: 'Priority support',                              included: false },
];

const PREMIUM_FEATURES = [
  'Unlimited active campaigns',
  'Unlimited creator profile views in Discover',
  'Unlimited daily messages',
  'Priority support',
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
    a: 'No. Deals are agreed directly between you and creators, and we never take a commission on them.',
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
  const toast = useToast();
  const confirm = useConfirm();
  const [user, setUser] = useState<{ name: string; plan?: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [premiumStartedAt, setPremiumStartedAt] = useState<string | null>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
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
    fetchAccount();
  }, [router]);

  const fetchAccount = () => {
    api.get('/api/auth/account').then(res => {
      setPremiumStartedAt(res.data.premiumStartedAt ?? null);
      setPremiumUntil(res.data.premiumUntil ?? null);
    }).catch(() => {});
  };

  useLiveData(() => { fetchAccount(); });

  // Routes legacy showToast(msg) calls to the global toast, inferring the
  // variant from the message so success/error/info are coloured appropriately.
  const showToast = (msg: string) => {
    const m = msg.toLowerCase();
    const type = /fail|error|cannot|must|please|invalid|unable|required|denied|wrong/.test(m)
      ? 'error'
      : /success|created|saved|published|updated|deleted|sent|accepted|welcome|🎉|unlocked/.test(m)
        ? 'success'
        : 'info';
    toast.show(msg, type);
  };

  const syncUserToStorage = (updatedUser: any) => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged = { ...parsed, plan: updatedUser.plan };
      localStorage.setItem('user', JSON.stringify(merged));
      setUser(merged);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/upgrade');
      syncUserToStorage(res.data.user);
      setPremiumStartedAt(res.data.user.premiumStartedAt ?? null);
      setPremiumUntil(res.data.user.premiumUntil ?? null);
      showToast('🎉 Welcome to Premium! All features are now unlocked.');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!(await confirm({
      title: 'Downgrade to Freemium?',
      description: 'You will lose Premium features.',
      confirmLabel: 'Downgrade',
      cancelLabel: 'Keep Premium',
      variant: 'warning',
    }))) return;
    setDowngrading(true);
    try {
      const res = await api.post('/api/auth/downgrade');
      syncUserToStorage(res.data.user);
      setPremiumStartedAt(null);
      setPremiumUntil(null);
      showToast('Plan downgraded to Freemium.');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Downgrade failed. Please try again.');
    } finally {
      setDowngrading(false);
    }
  };

  const isPremium = user?.plan === 'premium';

  return (
    <div className="min-h-screen bg-[#F4F6FB]">


      <BrandNav user={user} />

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Already Premium */}
        {isPremium && (
          <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-[#1e2f5c] via-[#3D5087] to-[#4a5fa0] rounded-2xl p-5 sm:p-7 shadow-lg flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 -left-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
              <defs>
                <pattern id="bb-premium-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="white"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#bb-premium-dots)"/>
            </svg>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-md flex-shrink-0 border border-white/20">
              <StarIcon />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Active plan</p>
              <h2 className="text-lg font-bold text-white">You&apos;re on Premium — enjoy every feature</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {premiumStartedAt && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-100/80">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Started {new Date(premiumStartedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {premiumUntil && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-100/80">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Renews {new Date(premiumUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleDowngrade}
              disabled={downgrading}
              className="relative flex-shrink-0 self-start sm:self-auto flex items-center gap-2 text-sm text-[#2B3B68] font-semibold bg-white px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer shadow-sm disabled:opacity-60"
            >
              <RefreshIcon />
              {downgrading ? 'Downgrading…' : 'Cancel plan'}
            </button>
          </div>
        )}

        {/* Hero header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1e2f5c] via-[#3D5087] to-[#4a5fa0] rounded-2xl px-6 sm:px-10 py-8 sm:py-10 mb-8 text-center shadow-lg">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="bb-hero-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bb-hero-dots)"/>
          </svg>
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 mb-4">
              <SparkIcon />
              Simple, transparent pricing
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-3 leading-tight">
              Scale your brand.<br className="sm:hidden" /> Find better creators.
            </h1>
            <p className="text-blue-100/80 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-6">
              Start free with 2 campaigns. Upgrade when you need unlimited reach and deeper insights.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl p-1 gap-0.5 border border-white/10">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    billing === 'monthly'
                      ? 'bg-white text-[#2B3B68] shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    billing === 'yearly'
                      ? 'bg-white text-[#2B3B68] shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                    −20%
                  </span>
                </button>
              </div>
            </div>
            {billing === 'yearly' && (
              <p className="text-xs text-emerald-300 font-semibold mt-2">
                You save ₹{YEARLY_SAVINGS.toLocaleString('en-IN')} per year — 2 months free
              </p>
            )}
          </div>
        </section>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">

          {/* Freemium */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm flex flex-col border border-slate-200/80 bg-gradient-to-br from-slate-50 via-[#eef1f9] to-[#e8ecf7]">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#3D5087]/6 rounded-full pointer-events-none" />
            <div className="absolute -bottom-8 -left-6 w-28 h-28 bg-[#3D5087]/4 rounded-full pointer-events-none" />

            <div className="relative px-6 pt-6 pb-5 border-b border-slate-200/60">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3D5087] bg-[#3D5087]/10 border border-[#3D5087]/15 px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-2">Freemium</span>
              <div className="flex items-baseline gap-1.5 mb-1 mt-1">
                <span className="text-4xl font-bold text-[#1B2444] tracking-tight">₹0</span>
                <span className="text-slate-400 text-sm font-medium">/ forever</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Everything you need to launch your first campaigns.
              </p>
            </div>

            <div className="relative px-6 py-5 flex-1 flex flex-col">
              {isPremium ? (
                <button
                  onClick={handleDowngrade}
                  disabled={downgrading}
                  className="w-full py-2.5 border border-[#3D5087]/25 rounded-xl text-sm font-semibold text-[#3D5087] hover:bg-[#3D5087]/10 transition-all mb-5 cursor-pointer disabled:opacity-50 bg-white/60"
                >
                  {downgrading ? 'Downgrading…' : 'Downgrade to Freemium'}
                </button>
              ) : (
                <div className="w-full py-2.5 border border-[#3D5087]/20 rounded-xl text-sm font-semibold text-[#3D5087]/60 text-center mb-5 bg-white/50 select-none">
                  Current plan
                </div>
              )}

              <div className="flex flex-col gap-2.5 flex-1">
                {FREEMIUM_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      f.included
                        ? 'bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white shadow-sm'
                        : 'bg-slate-400/40 text-slate-500'
                    }`}>
                      {f.included ? <CheckIcon /> : <XIcon />}
                    </span>
                    <span className={`text-sm leading-snug ${f.included ? 'text-slate-700' : 'text-slate-500'}`}>
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
                    <span className="w-4 h-4 rounded-full bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
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
              { icon: <LockIcon />, text: <><strong className="text-gray-700">Razorpay</strong> secured checkout</>, color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
              { icon: <RefreshIcon />, text: <>Cancel <strong className="text-gray-700">anytime</strong>, no questions asked</>, color: 'bg-gradient-to-br from-emerald-500 to-green-600' },
              { icon: <ShieldIcon />, text: <>We <strong className="text-gray-700">never</strong> store card details</>, color: 'bg-gradient-to-br from-violet-500 to-purple-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <span className={`w-7 h-7 rounded-lg text-white flex items-center justify-center flex-shrink-0 shadow-sm ${item.color}`}>
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
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-white flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#3D5087] to-[#2B3B68]" />
            <h3 className="font-bold text-gray-900">Full feature comparison</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-blue-50/30">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">Feature</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Freemium</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#3D5087] uppercase tracking-wider">Premium ✦</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { feature: 'Active campaigns',          free: '2',          premium: 'Unlimited' },
                { feature: 'Creator profile views',     free: '10/day',     premium: 'Unlimited' },
                { feature: 'Daily messages',            free: '10/day',     premium: 'Unlimited' },
                { feature: 'Search & filter creators',  free: true,         premium: true },
                { feature: 'Application management',     free: true,         premium: true },
                { feature: 'Campaign dashboard',        free: true,         premium: true },
                { feature: 'Priority support',          free: false,        premium: true },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-700">{row.feature}</td>
                  <td className="px-6 py-3.5 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free
                        ? <span className="inline-flex w-5 h-5 rounded-full bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white items-center justify-center mx-auto shadow-sm"><CheckIcon /></span>
                        : <span className="inline-flex w-5 h-5 rounded-full bg-gray-100 text-gray-300 items-center justify-center mx-auto"><XIcon /></span>
                    ) : (
                      <span className="text-gray-600 font-medium text-xs bg-gray-100 px-2 py-0.5 rounded-full">{row.free}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    {typeof row.premium === 'boolean' ? (
                      row.premium
                        ? <span className="inline-flex w-5 h-5 rounded-full bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white items-center justify-center mx-auto shadow-sm"><CheckIcon /></span>
                        : <span className="inline-flex w-5 h-5 rounded-full bg-gray-100 text-gray-300 items-center justify-center mx-auto"><XIcon /></span>
                    ) : (
                      <span className="text-white font-semibold text-xs bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] px-2 py-0.5 rounded-full">{row.premium}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-white flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#3D5087] to-[#2B3B68]" />
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
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${openFaq === i ? 'bg-gradient-to-br from-[#3D5087] to-[#2B3B68] text-white rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
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
