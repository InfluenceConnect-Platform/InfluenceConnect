'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLiveData } from '@/lib/useLiveData';
import InfluencerNav from '@/components/shared/InfluencerNav';
import { useToast } from '@/components/shared/Toast';
import { openRazorpayCheckout } from '@/lib/razorpay';
import SubscriptionPanel from '@/components/shared/SubscriptionPanel';
import { INFLUENCER_TIERS, yearlyPrice } from '@/lib/tiers';

const FAQS = [
  {
    q: 'Can I cancel?',
    a: 'Yes, any time from this page — no fee, no need to contact us, no reason required. Cancelling stops future charges and you keep full access until the end of the period you have already paid for. You can also choose to end it immediately, but the remaining paid days are then forfeited.',
  },
  {
    q: 'Will I be charged automatically?',
    a: 'Yes — plans renew until you cancel. Buying a plan authorises a mandate through Razorpay, which notifies you in advance of every renewal charge. Your next charge date is always shown at the top of this page.',
  },
  {
    q: 'What happens if I switch plans?',
    a: 'Your new plan starts when your current period ends, and the old one stops renewing at the same moment. You are never charged twice and you do not lose days you have already paid for.',
  },
  {
    q: 'What if a renewal payment fails?',
    a: 'Razorpay retries it. If it keeps failing, automatic renewal stops and we email you — you keep access until the end of the period you have already paid for, and can start a new plan any time.',
  },
  {
    q: 'What happens when my plan expires?',
    a: 'Your account automatically reverts to Free at the end of the period you paid for. Your existing applications are not affected — only new activity is subject to your new tier\'s limits.',
  },
  {
    q: 'Can I upgrade or downgrade later?',
    a: 'Yes, any time from this page. The new plan starts when your current paid period ends and the old one stops renewing at the same moment, so you are never charged twice and never lose days you have already paid for.',
  },
  {
    q: 'Does Influence Connect take a cut of my earnings?',
    a: 'No. Deals are agreed directly between you and brands, and we never take a cut of your earnings.',
  },
];

// Icons
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
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
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const TIER_GRADIENT: Record<string, string> = {
  free: 'from-slate-50 via-rose-50/60 to-[#FDF2F6] dark:from-[#0E1B2E] dark:via-[#0d1a2c] dark:to-[#0E1B2E]',
  silver: 'from-[#3D0A20] via-[#B00D4D] to-[#F0417B]',
  golden: 'from-[#E0115F] via-[#F0417B] to-[#F3B8CB]',
  platinum: 'from-[#7A0F3D] via-[#E0115F] to-[#F0417B]',
};

export default function BillingPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<{ name: string; plan: string; tier?: string } | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [premiumStartedAt, setPremiumStartedAt] = useState<string | null>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [subRefresh, setSubRefresh] = useState(0);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login?role=influencer'); return; }
    if (JSON.parse(stored).role !== 'influencer') { router.push('/auth/login?role=influencer'); return; }
    setUser(JSON.parse(stored));
    api.get('/api/influencer/profile/me').then(r => setProfilePicUrl(r.data?.profile?.profilePicUrl || '')).catch(() => {});
    fetchAccount();
  }, []);

  const fetchAccount = () => {
    api.get('/api/auth/account').then(res => {
      setPremiumStartedAt(res.data.premiumStartedAt ?? null);
      setPremiumUntil(res.data.premiumUntil ?? null);
      setAccountEmail(res.data.email ?? '');
    }).catch(() => {});
  };

  useLiveData(() => { fetchAccount(); });

  const showToast = (msg: string) => {
    const m = msg.toLowerCase();
    const type = /fail|error|cannot|must|please|invalid|unable|required|denied|wrong/.test(m)
      ? 'error'
      : /success|created|saved|published|updated|deleted|sent|accepted|welcome|🎉|unlocked|premium/.test(m)
        ? 'success'
        : 'info';
    toast.show(msg, type);
  };

  const syncUserToStorage = (updatedUser: any) => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged = { ...parsed, plan: updatedUser.plan, tier: updatedUser.tier };
      localStorage.setItem('user', JSON.stringify(merged));
      setUser(merged);
    }
  };

  const handleUpgrade = async (tierKey: string) => {
    setLoadingTier(tierKey);
    // Plans are subscriptions: buying one authorises a mandate at checkout and
    // it renews until cancelled. A one-time Order is only a fallback for when
    // recurring isn't enabled on the Razorpay account yet, so nobody is ever
    // blocked from paying.
    let asSubscription = true;
    try {
      const tierDef = INFLUENCER_TIERS.find(t => t.key === tierKey)!;
      const cycleWord = billing === 'monthly' ? 'month' : 'year';

      let startRes;
      try {
        startRes = await api.post('/api/payments/subscription', { billingCycle: billing, tier: tierKey });
      } catch (err: any) {
        // See the brand billing page — fall back to the one-time order on any
        // server-side failure, not just the one error code, so a Razorpay
        // config problem can't block the purchase outright.
        const status = err.response?.status;
        const recoverable = err.response?.data?.code === 'RECURRING_UNAVAILABLE'
          || status === undefined || status >= 500;
        if (!recoverable) throw err;
        asSubscription = false;
        startRes = await api.post('/api/payments/create-order', { billingCycle: billing, tier: tierKey });
      }

      const { orderId, subscriptionId, amount, currency, keyId, startsAt, replacingPlan } = startRes.data;

      await openRazorpayCheckout({
        key: keyId,
        // Razorpay derives the amount from the Plan for subscriptions —
        // sending both would show the wrong price at checkout.
        ...(asSubscription
          ? { subscription_id: subscriptionId }
          : { amount, currency, order_id: orderId }),
        name: 'Influence Connect',
        description: asSubscription
          ? `${tierDef.label} — ₹${tierDef.priceMonthly}/${cycleWord === 'month' ? 'mo' : 'yr'}, renews every ${cycleWord}`
          : `${tierDef.label} (${billing === 'monthly' ? '30 days' : '365 days'})`,
        prefill: { name: user?.name, email: accountEmail },
        theme: { color: '#B00D4D' },
        handler: async (response) => {
          try {
            const verifyRes = await api.post(
              asSubscription ? '/api/payments/subscription/verify' : '/api/payments/verify',
              response,
            );
            syncUserToStorage(verifyRes.data.user);
            setPremiumStartedAt(verifyRes.data.user.premiumStartedAt ?? null);
            setPremiumUntil(verifyRes.data.user.premiumUntil ?? null);
            showToast(
              !asSubscription
                ? `🎉 Welcome to ${tierDef.label}! This is a one-time purchase and won't renew.`
                : startsAt
                ? `✅ You'll move to ${tierDef.label} on ${new Date(startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, when your ${replacingPlan ?? 'current'} plan ends.`
                : `🎉 ${tierDef.label} is active. It renews every ${cycleWord} until you cancel.`
            );
            setSubRefresh(n => n + 1);
          } catch (error: any) {
            showToast(error.response?.data?.error || 'Payment verification failed. Contact support if you were charged.');
          } finally {
            setLoadingTier(null);
          }
        },
        modal: { ondismiss: () => setLoadingTier(null) },
      });
    } catch (error: any) {
      const code = error.response?.data?.code;
      if (code === 'ALREADY_ON_PLAN') showToast('You are already on this plan.');
      else showToast(error.response?.data?.error || 'Checkout failed. Please try again.');
      setLoadingTier(null);
    }
  };

  const currentTier = user?.tier || (user?.plan === 'premium' ? 'silver' : 'free');
  const currentTierDef = INFLUENCER_TIERS.find(t => t.key === currentTier);

  return (
    <div className="min-h-screen bg-[#F7F9FA]">

      <InfluencerNav user={user} profilePicUrl={profilePicUrl} />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Current plan banner */}
        {currentTier !== 'free' && currentTierDef && (
          <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-[#3D0A20] via-[#B00D4D] to-[#F0417B] rounded-2xl p-5 sm:p-7 shadow-lg flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-md flex-shrink-0 border border-white/20">
              <SparkIcon />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className="text-xs font-semibold text-rose-200 uppercase tracking-wider mb-1">Active plan</p>
              <h2 className="text-lg font-bold text-white">You&apos;re on {currentTierDef.label} — enjoy your features</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {premiumStartedAt && (
                  <span className="flex items-center gap-1.5 text-xs text-rose-100/80">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Started {new Date(premiumStartedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                  </span>
                )}
                {premiumUntil && (
                  <span className="flex items-center gap-1.5 text-xs text-rose-100/80">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Expires {new Date(premiumUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleUpgrade(currentTier)}
              disabled={loadingTier === currentTier}
              className="relative flex-shrink-0 self-start sm:self-auto flex items-center gap-2 text-sm text-[#7A0F3D] font-semibold bg-white px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-60"
            >
              <RefreshIcon />
              {loadingTier === currentTier ? 'Processing…' : 'Renew now'}
            </button>
          </div>
        )}

        <SubscriptionPanel
          key={subRefresh}
          accent="#E0115F"
          accentDark="#7A0F3D"
          tierLabel={(t) => INFLUENCER_TIERS.find(x => x.key === t)?.label ?? t}
          notify={showToast}
          onChanged={() => { setSubRefresh(n => n + 1); fetchAccount(); }}
        />

        {/* Hero header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#3D0A20] via-[#B00D4D] to-[#F0417B] rounded-2xl px-6 sm:px-10 py-8 sm:py-10 mb-8 text-center shadow-lg">
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
            <p className="text-rose-100/80 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-6">
              Start free. Upgrade through Silver, Golden and Platinum as your creator career grows.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl p-1 gap-0.5 border border-white/10">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    billing === 'monthly'
                      ? 'bg-white dark:!bg-rose-100 text-[#7A0F3D] dark:!text-[#7A0F3D] shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    billing === 'yearly'
                      ? 'bg-white dark:!bg-rose-100 text-[#7A0F3D] dark:!text-[#7A0F3D] shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="text-[11px] font-bold text-white bg-[#7A0F3D] px-1.5 py-0.5 rounded-full">
                    −20%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Billing disclosure — auto-renewal is how plans work now, so it is
            stated plainly rather than offered as a toggle. RBI e-mandate rules
            still require the user to authorise the mandate at checkout. */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-start gap-2.5 px-4 py-3 rounded-2xl border bg-white dark:bg-[#0f1e31] border-gray-200 dark:border-slate-700/60 shadow-sm max-w-xl">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#E0115F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            <p className="text-[12px] text-gray-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-gray-900 dark:text-slate-100">Plans renew automatically.</strong>{' '}
              You&apos;ll be charged each {billing === 'monthly' ? 'month' : 'year'}  until you cancel.
              Cancel any time from this page — you keep access until the end of the period you&apos;ve paid for.
            </p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
          {INFLUENCER_TIERS.map((t) => {
            const isFree = t.key === 'free';
            const isCurrent = currentTier === t.key;
            const displayPrice = billing === 'monthly' ? t.priceMonthly : Math.round(yearlyPrice(t.priceMonthly) / 12);

            return (
              <div key={t.key} className={`relative rounded-2xl overflow-hidden shadow-sm flex flex-col ${t.key === 'golden' ? 'border-2 border-[#F0417B] shadow-lg' : 'border border-gray-200 dark:border-white/10'}`}>
                {t.key === 'golden' && (
                  <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/30">
                    <SparkIcon /> Popular
                  </span>
                )}
                <div className={`px-5 pt-6 pb-5 relative overflow-hidden ${isFree ? `bg-gradient-to-br ${TIER_GRADIENT.free}` : `bg-gradient-to-br ${TIER_GRADIENT[t.key]}`}`}>
                  <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isFree ? 'text-gray-500' : 'text-white/70'}`}>{t.label}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-3xl font-bold tracking-tight ${isFree ? 'text-gray-900' : 'text-white'}`}>₹{displayPrice}</span>
                    <span className={`text-xs font-medium ${isFree ? 'text-slate-400' : 'text-white/70'}`}>{isFree ? '/ forever' : '/ mo'}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isFree ? 'text-slate-500' : 'text-white/80'}`}>{t.tagline}</p>
                </div>

                <div className="bg-white dark:bg-[#0E1B2E] px-5 py-5 flex-1 flex flex-col">
                  {isCurrent ? (
                    <div className="w-full py-2.5 bg-[#FCE4EC] border border-[#F0417B]/30 rounded-xl text-xs font-bold text-[#7A0F3D] text-center mb-5 flex items-center justify-center gap-2">
                      <span className="text-[#F0417B]"><CheckIcon /></span>
                      Current plan
                    </div>
                  ) : isFree ? (
                    <div className="w-full py-2.5 border border-gray-300 dark:border-white/15 rounded-xl text-xs font-semibold text-gray-600 text-center mb-5 bg-gray-50 dark:bg-white/5 select-none">
                      Default plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(t.key)}
                      disabled={loadingTier === t.key}
                      className="w-full py-2.5 bg-gradient-to-r from-[#F0417B] to-[#E0115F] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-1.5 mb-5 shadow-md cursor-pointer"
                    >
                      {loadingTier === t.key ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Upgrade <ArrowIcon /></>
                      )}
                    </button>
                  )}

                  <div className="flex flex-col gap-2 flex-1">
                    {t.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#F0417B] to-[#E0115F] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <CheckIcon />
                        </span>
                        <span className="text-[12.5px] text-gray-700 dark:text-slate-300 leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust bar */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6 py-4 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <LockIcon />
              </span>
              <span><strong className="text-gray-700">Razorpay</strong> secured checkout</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#B00D4D] to-[#7A0F3D] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <RefreshIcon />
              </span>
              <span>One-time by default, <strong className="text-gray-700">Autopay optional</strong></span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldIcon />
              </span>
              <span>We <strong className="text-gray-700">never</strong> store card details</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50/60 to-white dark:from-[#3D0A20] dark:to-[#0f1e31] flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#F0417B] to-[#E0115F]" />
            <h3 className="font-bold text-gray-900">Frequently asked questions</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {FAQS.map((faq, i) => (
              <div key={i} className="px-5 sm:px-6 py-4 sm:py-5 hover:bg-rose-50/20 transition-colors duration-100">
                <p className="text-sm font-bold text-gray-900 mb-1.5">{faq.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Questions?{' '}
          <Link href="/influencer/settings#support" className="text-[#E0115F] hover:underline font-medium">
            Message us
          </Link>{' '}
          and we&apos;ll get back within 24 hours.
        </p>

      </main>
    </div>
  );
}
