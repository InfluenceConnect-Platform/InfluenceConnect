import PricingSection from '@/components/marketing/PricingSection';
import FaqAccordion from '@/components/marketing/FaqAccordion';
import SectionWave from '@/components/marketing/SectionWave';
import Reveal from '@/components/marketing/Reveal';
import { pageMetadata, faqJsonLd } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Pricing — Free & Premium Plans | Influence Connect',
  description:
    'Influence Connect pricing: free forever plans for creators and brands. Creator Premium ₹299, Brand Premium ₹1,499 — one-time payment for 30 days, 20% off for 365 days.',
  path: '/pricing',
});

const FAQS = [
  {
    q: 'Can I cancel my Premium purchase?',
    a: 'Premium is a one-time payment, not a recurring subscription — there\'s nothing to cancel. It simply stays active for the 30 or 365 days you paid for, and your account automatically moves back to the free plan if you don\'t buy again.',
  },
  {
    q: 'What happens when my Premium expires?',
    a: 'Your account and data stay intact. Free plan limits simply apply going forward — for example, new campaign applications count against the creator 5/month limit, and brands are limited to 2 active campaigns.',
  },
  {
    q: 'How is payment handled?',
    a: 'Premium is billed securely through Razorpay, in Indian Rupees, as a single one-time payment for 30 days (monthly) or 365 days (yearly) — there is no auto-renewal. Buying again while a Premium period is still active adds the new days on top of your current expiry date. We never store your card details.',
  },
  {
    q: 'Are there refunds?',
    a: 'Premium fees are generally non-refundable since features are available immediately, but genuine billing errors and verified technical failures are covered — see our Refund Policy for details.',
  },
  {
    q: 'Do prices differ for creators and brands?',
    a: 'Yes. Creator Premium is ₹299/month and Brand Premium is ₹1,499/month, reflecting the different toolsets. Both get 20% off with yearly billing.',
  },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }}
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5D8A8F] via-[#4A5F8F] to-[#7C3AED]">
        <div aria-hidden className="bg-dot-grid-white absolute inset-0" />
        <div aria-hidden className="anim-blob absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[24rem] rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="anim-blob absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[#FB923C]/20 blur-3xl" style={{ animationDelay: '4s' }} />
        <div className="anim-fade-up relative max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-16 lg:pt-20 text-center">
          <span className="inline-block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/80 mb-4">
            Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-white mb-4">
            Simple plans that scale with you
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-xl mx-auto">
            Everything you need to collaborate is free. Premium removes the limits when you&apos;re ready to grow.
          </p>
        </div>
        <SectionWave className="fill-white dark:fill-[#0E1B2E]" />
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#EEF4F5]/50 to-[#F5F3FF]/50 dark:from-[#0E1B2E] dark:via-[#0d2d33]/35 dark:to-[#2c1f4d]/35">
        <div aria-hidden className="anim-blob absolute top-20 -left-24 w-80 h-80 rounded-full bg-[#5D8A8F]/15 blur-3xl" />
        <div aria-hidden className="anim-blob absolute bottom-0 -right-24 w-80 h-80 rounded-full bg-[#7C3AED]/15 blur-3xl" style={{ animationDelay: '5s' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-20">
          <PricingSection />
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#F5F3FF] via-amber-50/30 to-[#EEF4F5] border-t border-gray-200 dark:from-[#2c1f4d]/60 dark:via-[rgba(120,80,10,0.10)] dark:to-[#0d2d33]/60">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center mb-10">
              Billing questions
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <FaqAccordion items={FAQS} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
