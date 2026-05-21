'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/influencer/dashboard' },
  { label: 'Campaigns', href: '/influencer/campaigns' },
  { label: 'Messages', href: '/influencer/messages' },
  { label: 'Earnings', href: '/influencer/earnings' },
  { label: 'Profile', href: '/influencer/profile' },
  { label: 'Billing', href: '/influencer/billing', active: true },
];

const FREEMIUM_FEATURES = [
  { text: 'Public profile with custom URL', included: true },
  { text: 'Unlimited portfolio uploads', included: true },
  { text: '3 portfolio items visible to brands', included: true },
  { text: '5 campaign applications per month', included: true },
  { text: 'Basic credibility score', included: true },
  { text: '10 messages per day', included: true },
  { text: 'All portfolio items visible', included: false },
  { text: 'Unlimited campaign applications', included: false },
  { text: 'Priority in brand discovery', included: false },
  { text: 'Detailed earnings analytics', included: false },
  { text: 'CSV earnings export', included: false },
];

const PREMIUM_FEATURES = [
  { text: 'Public profile with custom URL' },
  { text: 'Unlimited portfolio uploads' },
  { text: 'All portfolio items visible to brands' },
  { text: 'Unlimited campaign applications' },
  { text: 'Full credibility score breakdown' },
  { text: 'Unlimited daily messages' },
  { text: 'Priority in brand discovery searches' },
  { text: 'Detailed monthly earnings chart' },
  { text: 'Earnings by category breakdown' },
  { text: 'CSV export for earnings' },
  { text: 'Early access to new features' },
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel your subscription anytime from this page. You keep Premium access until the end of your billing period. No questions asked.',
  },
  {
    q: 'What happens to my applications if I downgrade?',
    a: 'Your existing applications are not affected. Only new applications will be subject to the 5/month freemium limit going forward.',
  },
  {
    q: 'Is my portfolio visible on Freemium?',
    a: 'Yes — your 3 most recently uploaded items are always visible to brands. Upgrade to show your full portfolio.',
  },
  {
    q: 'Does Influence Connect take a cut of my earnings?',
    a: 'No. In Phase 1, deals are agreed directly between you and brands. Platform commission is only introduced in Phase 2.',
  },
];

// Icons
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const SparkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; plan: string } | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [toast, setToast] = useState('');

  const MONTHLY_PRICE = 299;
  const YEARLY_PRICE = Math.round(MONTHLY_PRICE * 12 * 0.8);
  const YEARLY_PER_MONTH = Math.round(YEARLY_PRICE / 12);
  const YEARLY_SAVINGS = MONTHLY_PRICE * 12 - YEARLY_PRICE;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
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
      showToast('🎉 Welcome to Premium! All features are now unlocked.');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!confirm('Downgrade to Freemium? You will lose Premium features at the end of your billing period.')) return;
    setDowngrading(true);
    try {
      const res = await api.post('/api/auth/downgrade');
      syncUserToStorage(res.data.user);
      showToast('Plan downgraded to Freemium.');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Downgrade failed. Please try again.');
    } finally {
      setDowngrading(false);
    }
  };

  const isPremium = user?.plan === 'premium';

  return (
    <div className="min-h-screen bg-[#F7F9FA]">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl max-w-sm animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px] sticky top-0 z-20 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] flex items-center justify-center text-white font-bold text-sm shadow-sm">IC</div>
            <span className="font-bold text-gray-900 text-[15px] tracking-tight hidden sm:block">Influence Connect</span>
          </div>
          <div className="hidden lg:flex gap-0.5">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  item.active ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPremium ? 'bg-amber-100 text-amber-700' : 'bg-[#EEF4F5] text-[#2A3E42]'
          }`}>
            {isPremium ? '★ Premium' : 'Freemium'}
          </span>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FDE5DC] to-[#f5c4b0] text-[#9C4A33] flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* Mobile tab bar */}
      <div className="lg:hidden sticky top-[60px] z-10 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden px-3 gap-0.5 py-2">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                item.active ? 'bg-[#EEF4F5] text-[#2A3E42]' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Already on Premium — special state */}
        {isPremium && (
          <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-[#1C4A52] via-[#27717E] to-[#5BA8B5] rounded-2xl p-5 sm:p-7 shadow-lg flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-md flex-shrink-0 border border-white/20">
              <StarIcon />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider mb-1">Active plan</p>
              <h2 className="text-lg font-bold text-white">You&apos;re on Premium — enjoy every feature</h2>
              <p className="text-sm text-teal-100/80 mt-1">Your subscription renews automatically. You can cancel anytime from below.</p>
            </div>
            <button
              onClick={handleDowngrade}
              disabled={downgrading}
              className="relative flex-shrink-0 self-start sm:self-auto flex items-center gap-2 text-sm text-[#1C4A52] font-semibold bg-white px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-60"
            >
              <RefreshIcon />
              {downgrading ? 'Downgrading…' : 'Cancel plan'}
            </button>
          </div>
        )}

        {/* Hero header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1C4A52] via-[#27717E] to-[#5BA8B5] rounded-2xl px-6 sm:px-10 py-8 sm:py-10 mb-8 text-center shadow-lg">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 mb-4">
              <SparkIcon />
              Simple, transparent pricing
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-3 leading-tight">
              Grow faster.<br className="sm:hidden" /> Earn more.
            </h1>
            <p className="text-teal-100/80 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-6">
              Start free forever. Upgrade when you&apos;re ready to take your creator career to the next level.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl p-1 gap-0.5 border border-white/10">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    billing === 'monthly'
                      ? 'bg-white text-[#1C4A52] shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    billing === 'yearly'
                      ? 'bg-white text-[#1C4A52] shadow-sm'
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
                You save ₹{YEARLY_SAVINGS.toLocaleString()} per year — 2 months free
              </p>
            )}
          </div>
        </section>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">

          {/* Freemium */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 pt-6 pb-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-widest mb-2">Freemium</span>
              <div className="flex items-baseline gap-1.5 mb-1 mt-1">
                <span className="text-4xl font-bold text-gray-900 tracking-tight">₹0</span>
                <span className="text-gray-400 text-sm font-medium">/ forever</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Everything you need to start getting discovered.
              </p>
            </div>

            <div className="px-6 py-5 flex-1 flex flex-col">
              {isPremium ? (
                <button
                  onClick={handleDowngrade}
                  disabled={downgrading}
                  className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all mb-5 cursor-pointer disabled:opacity-50"
                >
                  {downgrading ? 'Downgrading…' : 'Downgrade to Freemium'}
                </button>
              ) : (
                <div className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-400 text-center mb-5 bg-gray-50 select-none">
                  Current plan
                </div>
              )}

              <div className="flex flex-col gap-2.5 flex-1">
                {FREEMIUM_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      f.included
                        ? 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-300'
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
          <div className="relative rounded-2xl overflow-hidden shadow-lg flex flex-col border-2 border-[#7FA8AD]">

            {/* Gradient hero top */}
            <div className="bg-gradient-to-br from-[#5D8A8F] via-[#7FA8AD] to-[#9fc5c9] px-6 pt-6 pb-5 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-8 -translate-x-6 pointer-events-none" />

              {/* Badge */}
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/30 mb-3">
                <StarIcon />
                Most popular
              </span>

              <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-2">Premium</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-bold text-white tracking-tight">
                  ₹{billing === 'monthly' ? MONTHLY_PRICE.toLocaleString() : YEARLY_PER_MONTH.toLocaleString()}
                </span>
                <span className="text-white/70 text-sm font-medium">/ month</span>
              </div>
              {billing === 'yearly' ? (
                <p className="text-xs text-white/80 font-medium">
                  ₹{YEARLY_PRICE.toLocaleString()} billed yearly
                </p>
              ) : (
                <p className="text-xs text-white/70">Billed monthly, cancel anytime</p>
              )}
            </div>

            <div className="bg-white px-6 py-5 flex-1 flex flex-col">
              {isPremium ? (
                <div className="w-full py-2.5 bg-[#EEF4F5] border border-[#7FA8AD]/30 rounded-xl text-sm font-bold text-[#2A3E42] text-center mb-5 flex items-center justify-center gap-2">
                  <span className="text-[#7FA8AD]"><CheckIcon /></span>
                  You are on Premium
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#7FA8AD] to-[#5D8A8F] hover:from-[#5D8A8F] hover:to-[#4a7277] text-white rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mb-5 shadow-md hover:shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    <>
                      Upgrade to Premium
                      <ArrowIcon />
                    </>
                  )}
                </button>
              )}

              <div className="flex flex-col gap-2.5 flex-1">
                {PREMIUM_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <CheckIcon />
                    </span>
                    <span className="text-sm text-gray-700 leading-snug">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Trust bar */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6 py-4 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <LockIcon />
              </span>
              <span><strong className="text-gray-700">Razorpay</strong> secured checkout</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <RefreshIcon />
              </span>
              <span>Cancel <strong className="text-gray-700">anytime</strong>, no questions asked</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldIcon />
              </span>
              <span>We <strong className="text-gray-700">never</strong> store card details</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/60 to-white flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#7FA8AD] to-[#5D8A8F]" />
            <h3 className="font-bold text-gray-900">Frequently asked questions</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {FAQS.map((faq, i) => (
              <div key={i} className="px-5 sm:px-6 py-4 sm:py-5 hover:bg-teal-50/20 transition-colors duration-100">
                <p className="text-sm font-bold text-gray-900 mb-1.5">{faq.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Questions? Reach out via the Messages section and we'll get back to you within 24 hours.
        </p>

      </main>
    </div>
  );
}
