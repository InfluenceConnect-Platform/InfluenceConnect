import type { Metadata } from 'next';
import Link from 'next/link';
import FaqAccordion from '@/components/marketing/FaqAccordion';
import Reveal from '@/components/marketing/Reveal';

export const metadata: Metadata = {
  title: 'For Brands — Find the Right Creators | Influence Connect',
  description:
    'Discover Indian creators by niche, platform, location, and budget. Post campaigns, manage applications, and run influencer marketing that performs — free to start.',
};

const BENEFITS = [
  {
    title: 'Discovery that actually filters',
    body: 'Search creators by niche, platform, location, follower range, and budget. See portfolios and credibility scores before you reach out.',
    icon: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  },
  {
    title: 'Campaigns, not chaos',
    body: 'Post a campaign with your goals, budget, and requirements. Qualified creators apply — you shortlist, accept, or reject from one dashboard.',
    icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  },
  {
    title: 'Credibility scores you can trust',
    body: 'Creator scores are earned from real completed collaborations on the platform — not follower counts or self-reported stats.',
    icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  },
  {
    title: 'Negotiate on the record',
    body: 'Agree on deliverables and terms in built-in chat with contact moderation — a clean record of every deal, start to finish.',
    icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  },
  {
    title: 'Performance in one dashboard',
    body: 'Track your campaigns, applications, and collaboration outcomes from a live dashboard built for marketing teams.',
    icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  },
  {
    title: 'Start free, scale when ready',
    body: 'Run up to 2 active campaigns free. Premium (₹1,499/month) unlocks unlimited campaigns, unlimited discovery, and priority support.',
    icon: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  },
];

const FAQS = [
  {
    q: 'Why do I need a GSTIN to sign up?',
    a: 'GST verification is how we keep the platform trustworthy for creators. It confirms your brand is a real, registered business — which also means creators respond faster and take your campaigns seriously.',
  },
  {
    q: 'What does the free plan include?',
    a: 'Up to 2 active campaigns, creator discovery (10 profiles/day), full application management, campaign performance dashboard, and 10 messages per day. Premium removes all of these limits.',
  },
  {
    q: 'How do payments to creators work?',
    a: 'You agree on payment terms directly with each creator during deal negotiation. Influence Connect keeps the negotiation on record; your Premium subscription is the only thing billed through the platform (via Razorpay).',
  },
  {
    q: 'Can my team manage campaigns together?',
    a: 'Each brand account has a full campaign management dashboard. Reach out via the contact page if you have specific team workflow needs — we build with our early brands.',
  },
];

export default function ForBrandsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="anim-blob absolute -top-32 left-0 w-[30rem] h-[30rem] rounded-full bg-[#7C3AED]/15 blur-3xl" />
        <div className="anim-fade-up relative max-w-4xl mx-auto px-5 sm:px-8 pt-16 pb-16 lg:pt-24 lg:pb-20 text-center">
          <span className="inline-block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#7C3AED] mb-4">
            For Brands
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-gray-900 mb-5">
            Influencer marketing{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
              without the guesswork
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-9">
            Find creators whose audience actually matches your customers. Post campaigns,
            review applications, and manage every collaboration from a single dashboard.
          </p>
          <Link
            href="/auth/signup"
            className="btn-shine inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] shadow-lg shadow-[#7C3AED]/25 active:scale-[0.98] transition-all"
          >
            Start your first campaign — free
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 90} className="card-glow group bg-gradient-to-br from-white to-[#7C3AED]/[0.06] border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                <span className="w-11 h-11 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
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
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center mb-10">
          Brand questions
        </h2>
        <FaqAccordion items={FAQS} />
        <div className="text-center mt-12">
          <Link
            href="/auth/signup"
            className="btn-shine inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] shadow-lg active:scale-[0.98] transition-all"
          >
            Join as a brand
          </Link>
        </div>
      </section>
    </>
  );
}
