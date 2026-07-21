'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/useTheme';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { LEGAL_ENTITY, LEGAL_INDEX, type LegalDoc } from '@/lib/legalContent';

function Block({ block, isDark }: { block: LegalDoc['sections'][number]['blocks'][number]; isDark: boolean }) {
  if (block.type === 'sub') {
    return (
      <p className={`mt-4 mb-1 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
        {block.text}
      </p>
    );
  }
  if (block.type === 'list') {
    return (
      <ul className="mt-2 space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
            <span className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isDark ? 'bg-[#7FA8AD]' : 'bg-[#3D5087]'}`} />
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
      {block.text}
    </p>
  );
}

export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  const { isDark } = useTheme();
  const router = useRouter();

  const others = LEGAL_INDEX.filter((d) => d.slug !== doc.slug);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#060D1A] text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
      {/* ── Top bar ── */}
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur-md ${
          isDark ? 'border-slate-800/70 bg-[#060D1A]/80' : 'border-gray-200 bg-white/80'
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0d6672] to-[#3346d9] text-sm font-bold text-white shadow-md">
              IC
            </div>
            <span className={`font-semibold tracking-tight ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
              Influence Connect
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className={`hidden items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all sm:inline-flex cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-700/60'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        {/* ── Breadcrumb ── */}
        <nav className={`mb-6 flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          <Link href="/" className="transition-colors hover:underline">Home</Link>
          <span>/</span>
          <span>Legal</span>
          <span>/</span>
          <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>{doc.title}</span>
        </nav>

        {/* ── Title ── */}
        <div className="mb-8">
          <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            {doc.title}
          </h1>
          <p className={`mt-2 max-w-2xl text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{doc.subtitle}</p>
          <p className={`mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Last updated: {doc.lastUpdated}
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
          {/* ── Table of contents (desktop) ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                On this page
              </p>
              <nav className="space-y-1">
                {doc.sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className={`block rounded-lg px-3 py-1.5 text-xs leading-snug transition-colors ${
                      isDark ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Document body ── */}
          <article className="min-w-0">
            {/* Intro note */}
            <div
              className={`rounded-xl border px-4 py-3.5 text-sm leading-relaxed ${
                isDark ? 'border-slate-700/60 bg-slate-800/40 text-slate-300' : 'border-blue-100 bg-blue-50/70 text-gray-600'
              }`}
            >
              {doc.intro}
            </div>

            <div className="mt-8 space-y-8">
              {doc.sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-24">
                  <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{sec.title}</h2>
                  {sec.blocks.map((block, i) => (
                    <Block key={i} block={block} isDark={isDark} />
                  ))}
                </section>
              ))}
            </div>

            {/* ── Cross-links to other documents ── */}
            <div className={`mt-12 border-t pt-8 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <p className={`mb-3 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>Related documents</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {others.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/legal/${d.slug}`}
                    className={`group flex items-center justify-between rounded-xl border p-4 transition-all ${
                      isDark ? 'border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/40' : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{d.title}</p>
                      <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{d.desc}</p>
                    </div>
                    <svg
                      className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ))}
              </div>

              <div className={`mt-8 flex flex-col gap-1 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                <p>
                  Questions? Email us at{' '}
                  <a href={`mailto:${LEGAL_ENTITY.email}`} className={`font-medium ${isDark ? 'text-[#7FA8AD]' : 'text-[#3D5087]'} hover:underline`}>
                    {LEGAL_ENTITY.email}
                  </a>
                  .
                </p>
                <p className="mt-1">
                  © {new Date().getFullYear()} {LEGAL_ENTITY.brandName} · India · All rights reserved.
                </p>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
