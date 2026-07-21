import Link from 'next/link';
import FaqAccordion from '@/components/marketing/FaqAccordion';
import Reveal from '@/components/marketing/Reveal';
import CountUp from '@/components/marketing/CountUp';
import Tilt from '@/components/marketing/Tilt';
import Parallax from '@/components/marketing/Parallax';
import RotatingText from '@/components/marketing/RotatingText';
import TestimonialCarousel from '@/components/marketing/TestimonialCarousel';
import SectionWave from '@/components/marketing/SectionWave';
import { pageMetadata, faqJsonLd } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Influence Connect — Where Indian Creators & Brands Collaborate',
  description:
    'Influence Connect is India\'s trusted influencer marketing platform. Creators find paid campaigns from GST-verified brands; brands discover the right creators. Free to start.',
  path: '/',
});

/* ── Small server-side building blocks ─────────────────────────────── */

function CheckIcon({ className = 'w-4 h-4 text-emerald-500' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function SectionLabel({ children, color = 'teal' }: { children: React.ReactNode; color?: 'teal' | 'indigo' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] mb-3 px-3.5 py-1.5 rounded-full text-white shadow-md ${
      color === 'teal'
        ? 'bg-gradient-to-r from-[#5D8A8F] to-[#7C3AED] shadow-[#5D8A8F]/30'
        : 'bg-gradient-to-r from-[#7C3AED] to-[#EA580C] shadow-[#7C3AED]/30'
    }`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
      {children}
    </span>
  );
}

/* ── Page data ──────────────────────────────────────────────────────── */

const NICHE_DOT_COLORS = [
  'from-[#7FA8AD] to-[#5D8A8F]',
  'from-[#8B5CF6] to-[#7C3AED]',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-600',
];

/* Soft tinted chip styles cycled in step with NICHE_DOT_COLORS. */
const NICHE_CHIP_TINTS = [
  'bg-[#EEF4F5] border-[#C9DCDE] text-[#4A7A7F]',
  'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9]',
  'bg-emerald-50 border-emerald-200 text-emerald-700 dark:text-emerald-300',
  'bg-amber-50 border-amber-200 text-amber-700 dark:text-amber-300',
  'bg-sky-50 border-sky-200 text-sky-700 dark:text-sky-300 dark:border-sky-900',
];

const FEATURES = [
  {
    title: 'Smart creator discovery',
    body: 'Brands filter creators by niche, platform, location, follower range, and budget — no more cold DMs into the void.',
    icon: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    tint: 'bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white shadow-md shadow-[#5D8A8F]/25',
    bar: 'from-[#7FA8AD] to-[#5D8A8F]',
  },
  {
    title: 'Campaign applications',
    body: 'Creators browse live campaigns and apply with their profile and rates. Brands shortlist, accept, or reject in one dashboard.',
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="13" y2="11"/></>,
    tint: 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25',
    bar: 'from-[#8B5CF6] to-[#7C3AED]',
  },
  {
    title: 'Moderated in-platform chat',
    body: 'Negotiate deals in built-in messaging with automatic contact-detail moderation — your privacy stays protected until a deal is agreed.',
    icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    tint: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/25',
    bar: 'from-emerald-400 to-emerald-600',
  },
  {
    title: 'Credibility scores',
    body: 'Every creator builds a credibility score from completed collaborations, so brands know exactly who they\'re working with.',
    icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    tint: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/25',
    bar: 'from-amber-400 to-orange-500',
  },
  {
    title: 'Earnings & analytics',
    body: 'Creators track earnings by month and category. Brands measure campaign performance from a live dashboard.',
    icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    tint: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/25',
    bar: 'from-sky-400 to-blue-600',
  },
  {
    title: 'Secure payments',
    body: 'Premium is billed safely through Razorpay as a one-time payment — no auto-renewal, no cancellation needed.',
    icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    tint: 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-md shadow-indigo-500/25',
    bar: 'from-indigo-400 to-indigo-600',
  },
];

const CREATOR_STEPS = [
  { title: 'Create your profile', body: 'Sign up free, verify your email and mobile, and showcase your niche, platforms, and portfolio.' },
  { title: 'Apply to campaigns', body: 'Browse live campaigns from verified brands and apply with your rates in a couple of clicks.' },
  { title: 'Collaborate & earn', body: 'Negotiate in chat, deliver great content, grow your credibility score, and track your earnings.' },
];

const BRAND_STEPS = [
  { title: 'Verify your brand', body: 'Sign up with your GSTIN — every brand on the platform is GST-verified before going live.' },
  { title: 'Post a campaign', body: 'Describe your goals, budget, and requirements. Discover and invite creators that fit.' },
  { title: 'Manage & measure', body: 'Shortlist applicants, agree on deals in moderated chat, and track performance in your dashboard.' },
];

const FAQS = [
  {
    q: 'Is Influence Connect free to use?',
    a: 'Yes. Both creators and brands start on a free plan — creators can apply to campaigns and brands can run campaigns without paying anything. Premium plans unlock higher limits and advanced analytics.',
  },
  {
    q: 'How are brands verified?',
    a: 'Every brand must provide a valid GSTIN during signup, and accounts are verified via email and mobile OTP. Unverified brands cannot post campaigns.',
  },
  {
    q: 'Is my contact information safe?',
    a: 'Yes. All negotiation happens in our built-in chat with automatic contact-detail moderation. Your phone number and email stay private until a deal is agreed between both sides.',
  },
  {
    q: 'What does Premium cost?',
    a: 'Creator Premium is ₹299 and Brand Premium is ₹1,499 — a one-time payment for 30 days, with 20% off for 365 days. It\'s not a recurring subscription, so there\'s nothing to cancel; it simply expires and you can buy again whenever you like.',
  },
  {
    q: 'Which platforms do creators come from?',
    a: 'Creators on Influence Connect work across Instagram, YouTube, and other major social platforms, spanning niches from fashion and food to tech and finance.',
  },
];

/* ── Page ───────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }}
      />
      {/* ════ HERO ════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5D8A8F] via-emerald-600 to-[#6D28D9]">
        {/* Depth layers: dot texture + soft light glows over the saturated gradient */}
        <div aria-hidden className="bg-dot-grid-white absolute inset-0" />
        <div aria-hidden className="anim-blob absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="anim-blob absolute top-24 -right-40 w-[32rem] h-[32rem] rounded-full bg-white/10 blur-3xl" style={{ animationDelay: '4s' }} />
        <div aria-hidden className="anim-blob absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full bg-[#FB923C]/25 blur-3xl" style={{ animationDelay: '8s' }} />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <div>
            <div className="anim-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 border border-white/25 rounded-full text-xs font-semibold text-white mb-6 shadow-sm backdrop-blur-sm">
              <span className="anim-pulse-dot w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              Built for India&apos;s creator economy
            </div>

            <h1 className="anim-fade-up anim-delay-1 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight text-white mb-5">
              Where creators and brands{' '}
              <RotatingText
                phrases={['make deals that work', 'grow their reach', 'earn on their terms', 'build real trust']}
                className="anim-gradient-text bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-transparent"
              />
            </h1>

            <p className="anim-fade-up anim-delay-2 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mb-8">
              Influence Connect matches Indian creators with GST-verified brands. Discover campaigns,
              negotiate safely in moderated chat, and grow — with zero cost to start.
            </p>

            <div className="anim-fade-up anim-delay-3 flex flex-col sm:flex-row gap-3.5 mb-8">
              <Link
                href="/auth/signup?role=influencer"
                className="btn-shine inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-[#2A3E42] bg-[#fff] hover:bg-[#f3f4f6] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                I&apos;m a Creator
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <Link
                href="/auth/signup?role=brand"
                className="btn-shine inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-white/10 border border-white/40 hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                I&apos;m a Brand
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </div>

            <ul className="anim-fade-up anim-delay-4 flex flex-wrap gap-x-6 gap-y-2.5">
              {['Free to start', 'GST-verified brands', 'OTP-secured accounts'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/90 font-medium">
                  <CheckIcon className="w-4 h-4 text-white" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual — layered product mock cards */}
          <div className="anim-fade-up anim-delay-3 relative hidden lg:block" aria-hidden>
            <Parallax speed={-0.06}>
            {/* Campaign card — tilts in 3D toward the cursor */}
            <Tilt max={7} className="relative ml-auto w-[26rem]">
            <div className="card-glow relative bg-white border border-gray-200 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_16px_56px_rgba(0,0,0,0.14)] transition-shadow duration-300">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center text-white font-bold text-sm shadow-md">
                    AV
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Averra Skincare</p>
                    <p className="flex items-center gap-1 text-[0.7rem] text-emerald-600 font-semibold">
                      <CheckIcon className="w-3 h-3 text-emerald-500" /> GST verified
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  <span className="anim-pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1.5">Summer Glow Launch — Reels Campaign</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Looking for beauty & lifestyle creators to feature our new SPF range in 2 reels + 1 story.
              </p>
              <div className="flex items-center gap-2 mb-5">
                {['Beauty', 'Lifestyle', '10K–100K'].map(tag => (
                  <span key={tag} className="text-[0.68rem] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider font-bold">Budget</p>
                  <p className="text-lg font-bold text-gray-900">₹8,000 – ₹15,000</p>
                </div>
                <span className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#5D8A8F] to-[#7C3AED] shadow-md">
                  Apply now
                </span>
              </div>
            </div>
            </Tilt>

            {/* Floating: application accepted */}
            <div className="anim-float absolute -left-8 -bottom-16 z-10 w-64 bg-white border border-gray-200 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckIcon className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Application accepted!</p>
                  <p className="text-[0.68rem] text-gray-500">Priya · Fashion creator · 48K followers</p>
                </div>
              </div>
            </div>

            {/* Floating: earnings */}
            <div className="anim-float-slow absolute -right-6 -top-16 z-10 w-52 bg-white border border-gray-200 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-4">
              <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider font-bold mb-1">This month</p>
              <p className="text-xl font-bold text-gray-900 mb-2">₹42,500</p>
              <div className="flex items-end gap-1 h-9">
                {[35, 55, 40, 70, 60, 85, 100].map((h, i) => (
                  <div
                    key={i}
                    className="anim-bar flex-1 rounded-sm bg-gradient-to-t from-[#5D8A8F] to-[#7FA8AD]"
                    style={{ height: `${h}%`, animationDelay: `${0.5 + i * 0.09}s` }}
                  />
                ))}
              </div>
            </div>
            </Parallax>
          </div>
        </div>
        <SectionWave className="fill-white dark:fill-[#060D1A]" />
      </section>

      {/* ════ NICHE MARQUEE — two rows, opposite directions, pause on hover ════ */}
      <section className="py-8 overflow-hidden marquee-paused flex flex-col gap-4" aria-label="Creator niches on the platform">
        {[
          { cls: 'anim-marquee', niches: ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Food', 'Travel', 'Fitness', 'Finance', 'Comedy', 'Education', 'Music', 'Lifestyle', 'Parenting', 'Automobiles'] },
          { cls: 'anim-marquee-rev', niches: ['Photography', 'Vlogging', 'Art & DIY', 'Books', 'Skincare', 'Streetwear', 'Home Decor', 'Pets', 'Startups', 'Cricket', 'Regional Cinema', 'Cooking', 'Dance', 'Wellness'] },
        ].map(row => (
          <div key={row.cls} className="marquee-mask">
            <div className={`${row.cls} flex w-max items-center gap-4`}>
              {/* List rendered twice for a seamless loop */}
              {[0, 1].map(copy => (
                <div key={copy} className="flex items-center gap-4" aria-hidden={copy === 1}>
                  {row.niches.map((niche, i) => (
                    <span
                      key={niche}
                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm font-semibold shadow-sm whitespace-nowrap hover:-translate-y-0.5 transition-all duration-200 cursor-default ${NICHE_CHIP_TINTS[i % NICHE_CHIP_TINTS.length]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${NICHE_DOT_COLORS[i % NICHE_DOT_COLORS.length]}`} />
                      {niche}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ════ VALUE STRIP ════ */}
      <section className="bg-gradient-to-r from-[#7C3AED] via-[#4A5F8F] to-emerald-600">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { end: 0, from: 99, prefix: '₹', suffix: '', label: 'to get started — free plans for both sides' },
            { end: 100, from: 0, prefix: '', suffix: '%', label: 'of brands GST-verified before going live' },
            { end: 28, from: 0, prefix: '', suffix: '+', label: 'creator niches, from fashion to fintech' },
            { end: 20, from: 0, prefix: '', suffix: '%', label: 'saved with yearly Premium billing' },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 80}>
              <p className="text-3xl font-bold text-white mb-1.5">
                <CountUp end={item.end} from={item.from} prefix={item.prefix} suffix={item.suffix} />
              </p>
              <p className="text-sm text-white/80 leading-snug">{item.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#EEF4F5]/70 to-[#F5F3FF]/70 dark:from-[#0E1B2E] dark:via-[#0d2d33]/50 dark:to-[#2c1f4d]/50">
      <div aria-hidden className="anim-blob absolute -top-20 right-10 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
      <div aria-hidden className="anim-blob absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-[#7C3AED]/15 blur-3xl" style={{ animationDelay: '5s' }} />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
        <Reveal className="text-center mb-14">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            Two sides.{' '}
            <span className="bg-gradient-to-r from-[#5D8A8F] to-[#7C3AED] bg-clip-text text-transparent">One simple flow.</span>
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Whether you create content or run a brand, you can be up and collaborating the same day.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Creators column */}
          <Reveal className="relative overflow-hidden border border-gray-200 rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-white to-[#EEF4F5]/70 dark:from-[#0E1B2E] dark:to-[#0d2d33]/70 hover:border-[#5D8A8F]/40 hover:shadow-lg transition-all duration-300">
            <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-emerald-500" />
            <div className="flex items-center gap-3 mb-8">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] shadow-md shadow-[#5D8A8F]/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <h3 className="text-lg font-bold text-gray-900">For Creators</h3>
            </div>
            <ol className="flex flex-col gap-7">
              {CREATOR_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7FA8AD] to-[#5D8A8F] text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-md">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{step.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/for-creators" className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold text-[#5D8A8F] hover:text-[#4A7A7F] transition-colors">
              Learn more for creators
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </Reveal>

          {/* Brands column */}
          <Reveal delay={120} className="relative overflow-hidden border border-gray-200 rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-white to-[#F5F3FF]/70 dark:from-[#0E1B2E] dark:to-[#2c1f4d]/70 hover:border-[#7C3AED]/40 hover:shadow-lg transition-all duration-300">
            <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-blue-600" />
            <div className="flex items-center gap-3 mb-8">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] shadow-md shadow-[#7C3AED]/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                </svg>
              </span>
              <h3 className="text-lg font-bold text-gray-900">For Brands</h3>
            </div>
            <ol className="flex flex-col gap-7">
              {BRAND_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-md">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{step.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/for-brands" className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold text-[#7C3AED] hover:text-[#5B21B6] transition-colors">
              Learn more for brands
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </Reveal>
        </div>
      </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section className="bg-gradient-to-b from-[#F5F3FF] via-amber-50/40 to-[#EEF4F5] border-y border-gray-200 dark:from-[#2c1f4d]/70 dark:via-[rgba(120,80,10,0.12)] dark:to-[#0d2d33]/70">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
          <Reveal className="text-center mb-14">
            <SectionLabel>Everything included</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              One platform for the{' '}
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#EA580C] bg-clip-text text-transparent">whole collaboration</span>
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              From first discovery to final payment tracking — no spreadsheets, no DM chaos, no middlemen.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.title}
                delay={(i % 3) * 90}
                className="card-glow group relative bg-gradient-to-br from-white to-[#7FA8AD]/[0.06] dark:from-[#0E1B2E] border border-gray-200 rounded-2xl p-6 pt-7 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              >
                <span aria-hidden className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${f.bar}`} />
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${f.tint}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {f.icon}
                  </svg>
                </span>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════ TRUST & SAFETY ════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#010609] via-[#5b21b6] to-[#9333ea]">
      <div aria-hidden className="bg-dot-grid-white absolute inset-0 opacity-60" />
      <div aria-hidden className="anim-blob absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] mb-3 px-3 py-1 rounded-full border border-white/25 bg-white/10 text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-300 to-amber-300" />
              Trust &amp; safety
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Built so neither side gets burned
            </h2>
            <p className="text-base text-white/80 leading-relaxed mb-8">
              Influencer marketing runs on trust — so we engineered it in. Every account is verified,
              every brand is GST-checked, and every conversation is protected until you&apos;re ready to deal.
            </p>
            <ul className="flex flex-col gap-5">
              {[
                { title: 'GST verification for every brand', body: 'Brands must submit a valid GSTIN before posting campaigns. No shell accounts, no fake offers.' },
                { title: 'Contact details stay private', body: 'Built-in chat automatically moderates phone numbers and emails until both sides agree to a deal.' },
                { title: 'OTP-verified accounts', body: 'Email and mobile verification on signup, account lockout protection, and secure JWT sessions.' },
                { title: 'Credibility you can check', body: 'Creator credibility scores are earned from real completed collaborations — not self-reported.' },
              ].map(item => (
                <li key={item.title} className="flex gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-300" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">{item.title}</p>
                    <p className="text-sm text-white/75 leading-relaxed">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Shield visual */}
          <Reveal delay={150} className="relative flex items-center justify-center" >
            <div aria-hidden className="anim-blob absolute w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div aria-hidden className="relative w-full max-w-sm bg-gradient-to-br from-white to-[#7C3AED]/[0.05] dark:from-[#0E1B2E] border border-gray-200 rounded-3xl shadow-[0_12px_48px_rgba(0,0,0,0.08)] p-8 hover:shadow-[0_20px_64px_rgba(0,0,0,0.12)] transition-shadow duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7FA8AD] to-[#7C3AED] flex items-center justify-center shadow-lg mb-6">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-4">Verification checklist</p>
              <ul className="flex flex-col gap-3">
                {['Email OTP verified', 'Mobile OTP verified', 'GSTIN validated', 'Chat moderation active'].map(item => (
                  <li key={item} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                    <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
      </section>

      {/* ════ TESTIMONIALS ════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF4F5] via-amber-50/60 to-[#F5F3FF] border-y border-gray-200 dark:from-[#0d2d33]/80 dark:via-[rgba(120,80,10,0.18)] dark:to-[#2c1f4d]/60">
        <div aria-hidden className="anim-blob absolute -top-24 right-1/4 w-80 h-80 rounded-full bg-[#7FA8AD]/15 blur-3xl" />
        <div aria-hidden className="anim-blob absolute bottom-0 left-10 w-64 h-64 rounded-full bg-amber-400/15 blur-3xl" style={{ animationDelay: '5s' }} />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
          <Reveal className="text-center mb-12">
            <SectionLabel>Early voices</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              People are already{' '}
              <span className="bg-gradient-to-r from-amber-500 to-[#EA580C] bg-clip-text text-transparent">loving it</span>
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              From nano creators landing their first paid collab to brands filling campaigns in days.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <TestimonialCarousel />
          </Reveal>
        </div>
      </section>

      {/* ════ PRICING TEASER ════ */}
      <section className="bg-gradient-to-b from-white via-[#EEF4F5]/80 to-[#F5F3FF]/80 dark:from-[#0E1B2E] dark:via-[#0d2d33]/60 dark:to-[#2c1f4d]/60">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
          <Reveal className="text-center mb-14">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Start free.{' '}
              <span className="bg-gradient-to-r from-[#5D8A8F] to-[#7C3AED] bg-clip-text text-transparent">Upgrade when you&apos;re growing.</span>
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              Full platform access on day one — Premium simply removes the limits.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Creator card */}
            <Reveal className="bg-white border-2 border-[#5D8A8F]/25 rounded-3xl p-8 flex flex-col hover:border-[#5D8A8F]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5D8A8F] mb-2">Creators</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-bold text-gray-900">₹299</span>
                <span className="text-sm text-gray-500 font-medium">/ month for Premium</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Free plan available · 20% off yearly</p>
              <ul className="flex flex-col gap-2.5 mb-8">
                {['Unlimited campaign applications', 'Full portfolio visible to brands', 'Detailed earnings analytics + CSV export', 'Unlimited daily messages'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#5D8A8F] to-[#4A7A7F] hover:from-[#4A7A7F] hover:to-[#3D6B70] shadow-md active:scale-[0.98] transition-all"
              >
                See creator pricing
              </Link>
            </Reveal>

            {/* Brand card */}
            <Reveal delay={120} className="bg-white border-2 border-[#7C3AED]/25 rounded-3xl p-8 flex flex-col hover:border-[#7C3AED]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7C3AED] mb-2">Brands</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-bold text-gray-900">₹1,499</span>
                <span className="text-sm text-gray-500 font-medium">/ month for Premium</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Free plan available · 20% off yearly</p>
              <ul className="flex flex-col gap-2.5 mb-8">
                {['Unlimited active campaigns', 'Unlimited creator profile views', 'Unlimited daily messages', 'Priority support'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] shadow-md active:scale-[0.98] transition-all"
              >
                See brand pricing
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════ FAQ ════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F3FF]/60 via-white to-white dark:from-[#2c1f4d]/40 dark:via-[#0E1B2E] dark:to-[#0E1B2E]">
      <div aria-hidden className="anim-blob absolute top-10 -right-24 w-72 h-72 rounded-full bg-[#FB923C]/15 blur-3xl" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
        <Reveal className="text-center mb-12">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            Questions,{' '}
            <span className="bg-gradient-to-r from-[#5D8A8F] via-[#7C3AED] to-[#EA580C] bg-clip-text text-transparent">answered</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <FaqAccordion items={FAQS} />
        </Reveal>
      </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 lg:pb-24">
        <Reveal className="anim-gradient-bg relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#083035] via-[#9333ea] to-[#083035] px-8 py-16 sm:px-14 text-center shadow-2xl">
          <div aria-hidden className="bg-dot-grid-white absolute inset-0" />
          <div aria-hidden className="anim-blob absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden className="anim-blob absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: '6s' }} />
          <h2 className="relative text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Your next collaboration starts here
          </h2>
          <p className="relative text-base text-white/85 max-w-xl mx-auto mb-9">
            Join Influence Connect free today — set up takes minutes, and there&apos;s no card required.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/auth/signup"
              className="btn-shine inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-[#2A3E42] bg-[#fff] hover:bg-[#f3f4f6] shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              Create free account
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-3.5 rounded-xl text-sm font-semibold text-white border border-white/40 hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              Compare plans
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
