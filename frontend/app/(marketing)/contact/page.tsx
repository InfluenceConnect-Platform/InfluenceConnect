import Link from 'next/link';
import SectionWave from '@/components/marketing/SectionWave';
import Reveal from '@/components/marketing/Reveal';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Contact Us | Influence Connect',
  description:
    'Get in touch with the Influence Connect team — support for creators and brands, partnership enquiries, and grievance redressal.',
  path: '/contact',
});

const CHANNELS = [
  {
    title: 'General support',
    body: 'Account issues, billing questions, campaign help — for both creators and brands. We usually reply within one business day.',
    email: 'support@influenceconnect.in',
    icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    tint: 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white shadow-md shadow-[#5D8A8F]/25',
    wash: 'to-[#5D8A8F]/[0.07]',
    bar: 'from-[#7FA8AD] to-[#5D8A8F]',
  },
  {
    title: 'Grievance redressal',
    body: 'Formal complaints about content, conduct, or data — handled by our grievance officer as required under Indian law.',
    email: 'grievance@influenceconnect.in',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    tint: 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25',
    wash: 'to-[#7C3AED]/[0.06]',
    bar: 'from-[#8B5CF6] to-[#7C3AED]',
  },
  {
    title: 'Partnerships & press',
    body: 'Agencies, platforms, and media — if you want to work with us or write about us, we\'d love to talk.',
    email: 'support@influenceconnect.in',
    icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    tint: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/25',
    wash: 'to-amber-500/[0.06]',
    bar: 'from-amber-400 to-orange-500',
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#04181a] via-[#4338ca] to-[#9333ea]">
        <div aria-hidden className="bg-dot-grid-white absolute inset-0" />
        <div aria-hidden className="anim-blob absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-[20rem] rounded-full bg-white/10 blur-3xl" />
        <div className="anim-fade-up relative max-w-3xl mx-auto px-5 sm:px-8 pt-16 pb-20 lg:pt-24 text-center">
          <span className="inline-block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/80 mb-4">
            Contact
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-white mb-5">
            We&apos;re easy to reach
          </h1>
          <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mx-auto">
            Whether you&apos;re a creator, a brand, or just curious — pick the right channel below
            and a real human will get back to you.
          </p>
        </div>
        <SectionWave className="fill-white dark:fill-[#0E1B2E]" />
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#EEF4F5]/50 to-[#F5F3FF]/60 dark:from-[#0E1B2E] dark:via-[#0d2d33]/35 dark:to-[#2c1f4d]/40">
      <div aria-hidden className="anim-blob absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-emerald-400/12 blur-3xl" />
      <div aria-hidden className="anim-blob absolute top-10 -right-24 w-72 h-72 rounded-full bg-[#FB923C]/12 blur-3xl" style={{ animationDelay: '4s' }} />
      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-2 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.title} delay={i * 110} className={`card-glow group relative overflow-hidden bg-gradient-to-br from-white ${c.wash} dark:from-[#0E1B2E] border border-gray-200 rounded-2xl p-7 pt-8 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300`}>
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.bar}`} />
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${c.tint}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {c.icon}
                </svg>
              </span>
              <h2 className="text-base font-bold text-gray-900 mb-2">{c.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-5 flex-1">{c.body}</p>
              <a
                href={`mailto:${c.email}`}
                className="text-sm font-semibold text-[#5D8A8F] hover:text-[#4A7A7F] transition-colors break-all"
              >
                {c.email}
              </a>
            </Reveal>
          ))}
        </div>

        {/* Quick pointers */}
        <Reveal delay={120} className="mt-10 bg-gradient-to-br from-[#EEF4F5]/60 via-white to-[#F5F3FF]/50 border border-gray-200 rounded-2xl p-7 sm:p-8 dark:from-[#0d2d33]/50 dark:via-[#0E1B2E] dark:to-[#2c1f4d]/40">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Before you write in</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <li className="text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-800 block mb-0.5">Billing &amp; refunds</span>
              Most answers are in our{' '}
              <Link href="/legal/refund" className="text-[#5D8A8F] font-semibold hover:underline">Refund Policy</Link>.
            </li>
            <li className="text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-800 block mb-0.5">Privacy &amp; data</span>
              See how we handle your data in the{' '}
              <Link href="/legal/privacy" className="text-[#5D8A8F] font-semibold hover:underline">Privacy Policy</Link>.
            </li>
            <li className="text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-800 block mb-0.5">Platform rules</span>
              The full terms are in our{' '}
              <Link href="/legal/terms" className="text-[#5D8A8F] font-semibold hover:underline">Terms of Service</Link>.
            </li>
          </ul>
        </Reveal>
      </div>
      </section>
    </>
  );
}
