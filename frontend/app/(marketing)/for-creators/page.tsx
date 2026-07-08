import type { Metadata } from 'next';
import Link from 'next/link';
import FaqAccordion from '@/components/marketing/FaqAccordion';
import Reveal from '@/components/marketing/Reveal';
import SectionWave from '@/components/marketing/SectionWave';

export const metadata: Metadata = {
  title: 'For Creators — Find Paid Brand Campaigns | Influence Connect',
  description:
    'Join Influence Connect free as a creator. Apply to campaigns from GST-verified Indian brands, negotiate safely in moderated chat, and track your earnings in one dashboard.',
};

const BENEFITS = [
  {
    title: 'Campaigns come to you',
    body: 'Browse live campaigns filtered to your niche and follower range. Apply with your profile and rates — no cold pitching.',
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    tint: 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white shadow-md shadow-[#5D8A8F]/25',
    bar: 'from-[#7FA8AD] to-[#5D8A8F]',
  },
  {
    title: 'Only verified brands',
    body: 'Every brand submits a valid GSTIN before posting. You will never waste time on fake offers or ghost accounts.',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
    tint: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/25',
    bar: 'from-emerald-400 to-emerald-600',
  },
  {
    title: 'A profile that sells you',
    body: 'A public profile with a custom URL, portfolio uploads, and a credibility score that grows with every completed collab.',
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    tint: 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25',
    bar: 'from-[#8B5CF6] to-[#7C3AED]',
  },
  {
    title: 'Deal privately, safely',
    body: 'Negotiate inside moderated chat. Your phone number and email stay hidden until a deal is agreed by both sides.',
    icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    tint: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/25',
    bar: 'from-sky-400 to-blue-600',
  },
  {
    title: 'Know what you earn',
    body: 'Track earnings month by month and by category. Premium adds detailed analytics and CSV export for your accountant.',
    icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    tint: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/25',
    bar: 'from-amber-400 to-orange-500',
  },
  {
    title: 'Free to start, fair to upgrade',
    body: '5 applications per month free, forever. Premium removes the caps for ₹299/month — less than one sponsored story.',
    icon: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    tint: 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white shadow-md shadow-[#5D8A8F]/25',
    bar: 'from-[#7FA8AD] to-[#5D8A8F]',
  },
];

const FAQS = [
  {
    q: 'How much does it cost to join as a creator?',
    a: 'Nothing. The free plan includes a public profile, portfolio uploads, 5 campaign applications per month, and in-platform messaging. Premium (₹299/month, 20% off yearly) unlocks unlimited applications, full portfolio visibility, and earnings analytics.',
  },
  {
    q: 'How do I get paid for collaborations?',
    a: 'You agree on payment terms directly with the brand during deal negotiation in chat. Influence Connect tracks your recorded earnings so you always have a clean history of what you have earned.',
  },
  {
    q: 'What is the credibility score?',
    a: 'A score built from your real completed collaborations on the platform. It signals reliability to brands — the more deals you complete well, the stronger your profile ranks.',
  },
  {
    q: 'Do I need a minimum follower count?',
    a: 'No. Brands set their own follower ranges per campaign, and many campaigns actively look for nano and micro creators with engaged audiences.',
  },
];

export default function ForCreatorsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5D8A8F] via-[#4A8A82] to-emerald-600">
        <div aria-hidden className="bg-dot-grid-white absolute inset-0" />
        <div aria-hidden className="anim-blob absolute -top-32 right-0 w-[30rem] h-[30rem] rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="anim-blob absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: '3s' }} />
        <div className="anim-fade-up relative max-w-4xl mx-auto px-5 sm:px-8 pt-16 pb-16 lg:pt-24 lg:pb-20 text-center">
          <span className="inline-block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/80 mb-4">
            For Creators
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-white mb-5">
            Turn your content into{' '}
            <span className="anim-gradient-text bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
              consistent income
            </span>
          </h1>
          <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto mb-9">
            Stop chasing brands in DMs. On Influence Connect, GST-verified brands post real,
            budgeted campaigns — and you choose the ones worth your audience.
          </p>
          <Link
            href="/auth/signup?role=influencer"
            className="btn-shine inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-[#2A3E42] bg-[#fff] hover:bg-[#f3f4f6] shadow-lg active:scale-[0.98] transition-all"
          >
            Create your creator profile — free
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
        <SectionWave className="fill-[#EEF4F5] dark:fill-[#0d2d33]" />
      </section>

      {/* Benefits grid */}
      <section className="bg-gradient-to-br from-[#EEF4F5] via-amber-50/40 to-emerald-50 border-y border-gray-200 dark:from-[#0d2d33] dark:via-[rgba(120,80,10,0.12)] dark:to-[rgba(6,78,59,0.30)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 90} className="card-glow group relative bg-gradient-to-br from-white to-[#5D8A8F]/[0.07] dark:from-[#0E1B2E] border border-gray-200 rounded-2xl p-6 pt-7 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                <span aria-hidden className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${b.bar}`} />
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${b.tint}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {b.icon}
                  </svg>
                </span>
                <h2 className="text-base font-bold text-gray-900 mb-2">{b.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{b.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#EEF4F5]/60 to-emerald-50/60 dark:from-[#0E1B2E] dark:via-[#0d2d33]/40 dark:to-[rgba(6,78,59,0.20)]">
      <div aria-hidden className="anim-blob absolute bottom-0 -right-24 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center mb-10">
            Creator{' '}
            <span className="anim-gradient-text bg-gradient-to-r from-[#5D8A8F] to-emerald-600 bg-clip-text text-transparent">questions</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <FaqAccordion items={FAQS} />
        </Reveal>
        <div className="text-center mt-12">
          <Link
            href="/auth/signup?role=influencer"
            className="btn-shine inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#5D8A8F] to-[#7C3AED] shadow-lg active:scale-[0.98] transition-all"
          >
            Join as a creator
          </Link>
        </div>
      </div>
      </section>
    </>
  );
}
