import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Influence Connect',
  description:
    'Influence Connect exists to make influencer marketing in India fair, safe, and simple — for creators of every size and brands of every budget.',
};

const VALUES = [
  {
    title: 'Trust is engineered, not promised',
    body: 'GST verification, OTP-secured accounts, moderated chat, and earned credibility scores — safety here is built into the product, not written in a policy nobody reads.',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
    tint: 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white shadow-md shadow-[#5D8A8F]/25',
    wash: 'to-[#5D8A8F]/[0.07]',
  },
  {
    title: 'Small creators matter',
    body: 'India\'s creator economy is not just celebrities. Nano and micro creators with engaged audiences deserve the same access to real, paying brand campaigns.',
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    tint: 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25',
    wash: 'to-[#7C3AED]/[0.06]',
  },
  {
    title: 'Fair economics',
    body: 'We charge a transparent subscription — not a cut of your deals. What you negotiate with each other is yours.',
    icon: <><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></>,
    tint: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/25',
    wash: 'to-amber-500/[0.06]',
  },
  {
    title: 'Built in India, for India',
    body: 'Rupee pricing, GST verification, Razorpay payments, and campaigns designed around how Indian brands and creators actually work together.',
    icon: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    tint: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/25',
    wash: 'to-emerald-500/[0.06]',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF4F5] via-white to-[#F5F3FF] dark:from-[#0d2d33]/60 dark:via-[#0E1B2E] dark:to-[#2c1f4d]/50">
        <div aria-hidden className="anim-blob absolute -top-24 -right-24 w-[26rem] h-[26rem] rounded-full bg-[#7C3AED]/15 blur-3xl" />
        <div aria-hidden className="anim-blob absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl" style={{ animationDelay: '4s' }} />
        <div className="anim-fade-up relative max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-16 lg:pt-24 text-center">
          <span className="inline-block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#5D8A8F] mb-4">
            About us
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-gray-900 mb-6">
            Making influencer marketing{' '}
            <span className="bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#A78BFA] bg-clip-text text-transparent">
              work for everyone
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Influence Connect was born from a simple observation: India&apos;s creator economy is booming,
            but the way creators and brands find each other is still broken — cold DMs, fake accounts,
            ghosted negotiations, and deals that fall apart on trust.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-amber-50/50 dark:from-[#0E1B2E] dark:to-[rgba(120,80,10,0.12)]">
      <div aria-hidden className="anim-blob absolute top-10 -right-24 w-64 h-64 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-12 pb-16 sm:pt-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#7FA8AD]/[0.05] dark:from-[#0E1B2E] dark:via-[#0E1B2E] border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#5D8A8F] via-[#7C3AED] to-[#EA580C]" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">Why we built this</h2>
          <div className="flex flex-col gap-4 text-sm sm:text-[0.95rem] text-gray-600 leading-relaxed">
            <p>
              Creators spend hours pitching brands that never reply. Brands waste budgets on collaborations
              with the wrong audiences. And in between, both sides risk dealing with accounts that aren&apos;t
              who they claim to be.
            </p>
            <p>
              We believe the fix is structural: verify everyone, put campaigns and applications in one
              transparent flow, keep negotiations on the record, and let reputation be earned through
              real completed work. That&apos;s exactly what Influence Connect does.
            </p>
            <p>
              We&apos;re just getting started — and we build in close conversation with our earliest creators
              and brands. If you have ideas or feedback, we genuinely want to hear them.
            </p>
          </div>
        </div>
      </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1C4A52] via-[#2A3E42] to-[#4C1D95]">
        <div aria-hidden className="bg-dot-grid-white absolute inset-0 opacity-60" />
        <div aria-hidden className="anim-blob absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-white text-center mb-2">
            What we stand for
          </h2>
          <p className="text-base text-white/70 text-center max-w-xl mx-auto mb-14">
            We&apos;re more than just a platform — we&apos;re building the trust layer for India&apos;s creator economy
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map(v => (
              <div key={v.title} className="text-center">
                <span className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto ${v.tint}`}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {v.icon}
                  </svg>
                </span>
                <h3 className="text-base font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
        <div className="anim-gradient-bg relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5D8A8F] via-[#7C3AED] to-[#5D8A8F] px-8 py-14 sm:px-14 text-center shadow-2xl">
          <div aria-hidden className="bg-dot-grid-white absolute inset-0" />
          <div aria-hidden className="anim-blob absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden className="anim-blob absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#FB923C]/20 blur-3xl" style={{ animationDelay: '5s' }} />
          <h2 className="relative text-3xl font-bold tracking-tight text-white mb-4">
            Be part of it from the start
          </h2>
          <p className="relative text-base text-white/85 mb-9 max-w-xl mx-auto">
            Join the platform shaping how India&apos;s creators and brands collaborate — free, today.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/auth/signup"
              className="btn-shine inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-[#2A3E42] bg-[#fff] hover:bg-[#f3f4f6] shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              Create free account
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-3.5 rounded-xl text-sm font-semibold text-white border border-white/40 hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
