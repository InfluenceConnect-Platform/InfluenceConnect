'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* NOTE: illustrative early-user quotes — replace with real testimonials before launch. */
const TESTIMONIALS = [
  {
    quote:
      'I used to send 30 DMs a week and hear nothing back. Here, I applied to four campaigns in my niche and closed two deals in my first month.',
    name: 'Priya S.',
    role: 'Fashion creator · 48K followers',
    initials: 'PS',
    gradient: 'from-[#7FA8AD] to-[#5D8A8F]',
    wash: 'to-[#5D8A8F]/[0.06]',
    quoteColor: 'text-[#5D8A8F]/30',
  },
  {
    quote:
      'The GST verification changed everything for us. Creators actually respond because they know we\'re a real business — our campaign filled in three days.',
    name: 'Rohan M.',
    role: 'Marketing lead, D2C skincare brand',
    initials: 'RM',
    gradient: 'from-[#8B5CF6] to-[#7C3AED]',
    wash: 'to-[#7C3AED]/[0.06]',
    quoteColor: 'text-[#7C3AED]/25',
  },
  {
    quote:
      'The moderated chat is genius. I negotiate confidently knowing my number stays private until the deal is actually locked in.',
    name: 'Ananya K.',
    role: 'Food & travel creator · 22K followers',
    initials: 'AK',
    gradient: 'from-emerald-400 to-emerald-600',
    wash: 'to-emerald-500/[0.06]',
    quoteColor: 'text-emerald-500/25',
  },
  {
    quote:
      'Finding micro creators by city and budget used to take our agency days of spreadsheet work. Now it\'s a filter and ten minutes.',
    name: 'Vikram T.',
    role: 'Founder, regional fitness brand',
    initials: 'VT',
    gradient: 'from-amber-400 to-orange-500',
    wash: 'to-orange-500/[0.06]',
    quoteColor: 'text-orange-500/25',
  },
];

const AUTOPLAY_MS = 5200;

export default function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((i: number) => {
    setActive((i + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer.current = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), AUTOPLAY_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides track */}
      <div className="overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              aria-hidden={i !== active}
              className="w-full flex-shrink-0 px-1"
            >
              <div className={`bg-gradient-to-br from-white via-white ${t.wash} dark:from-[#0E1B2E] dark:via-[#0E1B2E] border border-gray-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm mx-auto max-w-3xl`}>
                {/* Quote mark */}
                <svg className={`w-9 h-9 mx-auto mb-4 ${t.quoteColor}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"/>
                </svg>
                {/* Star rating */}
                <span className="flex items-center justify-center gap-1 mb-5" aria-label="Rated 5 out of 5">
                  {[0, 1, 2, 3, 4].map(s => (
                    <svg key={s} className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </span>
                <blockquote className="text-lg sm:text-xl font-medium text-gray-800 leading-relaxed mb-8">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center justify-center gap-3.5">
                  <span className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                    {t.initials}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-bold text-gray-900">{t.name}</span>
                    <span className="block text-xs text-gray-500">{t.role}</span>
                  </span>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 mt-7">
        <button
          onClick={() => go(active - 1)}
          aria-label="Previous testimonial"
          className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#5D8A8F] hover:border-[#5D8A8F]/50 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              onClick={() => go(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === active
                  ? 'w-7 bg-gradient-to-r from-[#5D8A8F] to-[#7C3AED]'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go(active + 1)}
          aria-label="Next testimonial"
          className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#5D8A8F] hover:border-[#5D8A8F]/50 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
