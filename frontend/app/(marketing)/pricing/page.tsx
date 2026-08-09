import PricingSection from '@/components/marketing/PricingSection';
import FaqAccordion from '@/components/marketing/FaqAccordion';
import SectionWave from '@/components/marketing/SectionWave';
import Reveal from '@/components/marketing/Reveal';
import { pageMetadata, faqJsonLd } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Pricing — Free & Premium Plans | Influence Connect',
  description:
    'Influence Connect pricing: free forever plans for creators and brands. Creators upgrade from ₹9/month, brands from ₹399/month — plans renew automatically, cancel any time, 20% off yearly.',
  path: '/pricing',
});

const FAQS = [
  {
    q: 'Can I cancel?',
    a: 'Yes, any time, from the Billing page in your account — no fee, no need to contact us, and no reason required. Cancelling stops future charges and you keep full access until the end of the period you have already paid for. You can also choose to end it immediately, but the remaining paid days are then forfeited.',
  },
  {
    q: 'Will I be charged automatically?',
    a: 'Yes — plans are subscriptions, so they renew until you cancel. When you buy, you authorise a mandate with your bank or card through Razorpay, and the same amount is charged at the start of each new period. This is shown before you pay, your bank asks you to approve the mandate, and Razorpay notifies you in advance of every renewal. Your next charge date is always on your billing page.',
  },
  {
    q: 'What happens when my Premium expires?',
    a: 'Your account and data stay intact. Free plan limits simply apply going forward — for example, new campaign applications count against the creator Free-tier limit, and brands are limited to 3 active campaigns.',
  },
  {
    q: 'How is payment handled?',
    a: 'Plans are billed securely through Razorpay in Indian Rupees, covering 30 days (monthly) or 365 days (yearly), and renew automatically until cancelled. If you switch plans mid-cycle, the new plan starts when your current period ends, so you are never charged twice. We never store your card details.',
  },
  {
    q: 'Are there refunds?',
    a: 'Plan fees are generally non-refundable since features are available immediately, but genuine billing errors, verified technical failures, and anything charged after you cancelled are covered — see our Refund Policy for details. Note that choosing to end a renewing plan immediately rather than at the end of the period forfeits the remaining days.',
  },
  {
    q: 'Do prices differ for creators and brands?',
    a: 'Yes. Creators can upgrade from ₹9/month (Silver) through Golden to Platinum; brands from ₹399/month (Silver) to Golden, reflecting the different toolsets. Both get 20% off with yearly billing.',
  },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }}
      />
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#3D0A20,#3A3A45_50%,#1B6E1B)]">
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

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FCE4EC]/50 to-[#EAF7EA]/50 dark:from-[#0E1B2E] dark:via-[#3D0A20]/35 dark:to-[#14531D]/35">
        <div aria-hidden className="anim-blob absolute top-20 -left-24 w-80 h-80 rounded-full bg-[#E0115F]/15 blur-3xl" />
        <div aria-hidden className="anim-blob absolute bottom-0 -right-24 w-80 h-80 rounded-full bg-[#228B22]/15 blur-3xl" style={{ animationDelay: '5s' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-20">
          <PricingSection />
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#EAF7EA] via-amber-50/30 to-[#FCE4EC] border-t border-gray-200 dark:from-[#14531D]/60 dark:via-[rgba(120,80,10,0.10)] dark:to-[#3D0A20]/60">
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
