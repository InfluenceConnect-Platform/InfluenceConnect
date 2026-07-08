import type { Metadata } from 'next';
import PricingSection from '@/components/marketing/PricingSection';
import FaqAccordion from '@/components/marketing/FaqAccordion';

export const metadata: Metadata = {
  title: 'Pricing — Free & Premium Plans | Influence Connect',
  description:
    'Influence Connect pricing: free forever plans for creators and brands. Creator Premium ₹299/month, Brand Premium ₹1,499/month — 20% off yearly. Cancel anytime.',
};

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel your Premium subscription anytime from your billing page. You keep Premium access until the end of the period you have already paid for. No hidden fees, no questions asked.',
  },
  {
    q: 'What happens if I downgrade to the free plan?',
    a: 'Your account and data stay intact. Free plan limits simply apply going forward — for example, new campaign applications count against the creator 5/month limit, and brands are limited to 2 active campaigns.',
  },
  {
    q: 'How is payment handled?',
    a: 'Premium subscriptions are billed securely through Razorpay, in Indian Rupees, in advance on a monthly or yearly basis. We never store your card details.',
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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EEF4F5]/50 via-white to-white dark:from-[#0d2d33]/35 dark:via-[#0E1B2E] dark:to-[#0E1B2E]">
        <div aria-hidden className="anim-blob absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[24rem] rounded-full bg-[#5D8A8F]/15 blur-3xl" />
        <div className="anim-fade-up relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-20 lg:pt-20">
          <div className="text-center mb-12">
            <span className="inline-block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#5D8A8F] mb-4">
              Pricing
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-gray-900 mb-4">
              Simple plans that scale with you
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
              Everything you need to collaborate is free. Premium removes the limits when you&apos;re ready to grow.
            </p>
          </div>

          <PricingSection />
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#F5F3FF]/50 via-white to-[#EEF4F5]/50 border-t border-gray-200 dark:from-[#2c1f4d]/40 dark:via-[#0E1B2E] dark:to-[#0d2d33]/40">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center mb-10">
            Billing questions
          </h2>
          <FaqAccordion items={FAQS} />
        </div>
      </section>
    </>
  );
}
